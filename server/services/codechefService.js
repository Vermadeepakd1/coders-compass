const axios = require("axios");
const redis = require("../config/redis");

const CODECHEF_BASE_URL = "https://www.codechef.com/users";

const fetchWithRetry = async (url, options = {}, retries = 1) => {
  try {
    return await axios.get(url, options);
  } catch (error) {
    if (
      retries > 0 &&
      (error.code === "ECONNABORTED" ||
        (error.response && error.response.status >= 500) ||
        (error.response && error.response.status === 429))
    ) {
      await new Promise((res) => setTimeout(res, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractFirstMatch = (html, patterns) => {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] !== undefined) {
      return match[1];
    }
  }
  return null;
};

const getCodeChefStarsFromRating = (rating) => {
  if (!Number.isFinite(rating)) return null;
  if (rating <= 1399) return "1 Star";
  if (rating <= 1599) return "2 Stars";
  if (rating <= 1799) return "3 Stars";
  if (rating <= 1999) return "4 Stars";
  if (rating <= 2199) return "5 Stars";
  if (rating <= 2499) return "6 Stars";
  return "7 Stars";
};

const fetchCodeChefProfileHtml = async (handle) => {
  const cacheKey = `cc:profile-html:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return cached;
  } catch (error) {
    console.error("CodeChef profile cache read failed:", error.message);
  }

  const response = await fetchWithRetry(`${CODECHEF_BASE_URL}/${handle}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    timeout: 12000,
  });

  const html = response.data || "";

  try {
    await redis.set(cacheKey, html, "EX", 900);
  } catch (error) {
    console.error("CodeChef profile cache write failed:", error.message);
  }

  return html;
};

const parseCodeChefProfile = (html) => {
  const ratingRaw = extractFirstMatch(html, [
    /class=["'][^"']*rating-number[^"']*["'][^>]*>\s*([\d,]+)\s*</i,
    /"rating"\s*:\s*"?(\d+)"?/i,
  ]);

  const starsRaw = extractFirstMatch(html, [
    /class=["'][^"']*rating-star[^"']*["'][^>]*>\s*([★☆\d\s]+)\s*</i,
    /"stars"\s*:\s*"([^\"]+)"/i,
  ]);

  const solvedRaw = extractFirstMatch(html, [
    /Fully\s*Solved\s*\(\s*([\d,]+)\s*\)/i,
    /"fully_solved"\s*:\s*\{[^}]*"count"\s*:\s*"?(\d+)"?/i,
    /"problemsSolved"\s*:\s*"?(\d+)"?/i,
  ]);

  return {
    rating: toNumberOrNull(ratingRaw),
    stars: starsRaw ? starsRaw.replace(/\s+/g, " ").trim() : null,
    totalSolved: toNumberOrNull(solvedRaw),
  };
};

const parseCodeChefHistory = (html) => {
  const match = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/i);
  if (!match || !match[1]) return [];

  try {
    const rawList = JSON.parse(match[1]);
    if (!Array.isArray(rawList)) return [];

    return rawList
      .map((item) => {
        const rating = toNumberOrNull(item.rating);
        if (rating === null) return null;

        const dateRaw = item.end_date || item.getdate || null;
        if (!dateRaw) return null;

        const normalizedDate =
          typeof dateRaw === "string"
            ? dateRaw.includes("T")
              ? dateRaw
              : `${dateRaw.replace(" ", "T")}Z`
            : null;

        const parsedDate = normalizedDate ? new Date(normalizedDate) : null;
        if (!parsedDate || Number.isNaN(parsedDate.getTime())) return null;

        return {
          date: parsedDate.toISOString(),
          rating,
          contestName: item.name || item.code || "CodeChef Contest",
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Failed parsing CodeChef all_rating payload:", error.message);
    return [];
  }
};

const fetchCodeChefStats = async (handle) => {
  const cacheKey = `cc:stats:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error("CodeChef cache read failed:", error.message);
  }

  try {
    const html = await fetchCodeChefProfileHtml(handle);
    const profile = parseCodeChefProfile(html);
    const mappedStars = getCodeChefStarsFromRating(profile.rating);

    const payload = {
      rating: profile.rating,
      stars: mappedStars || profile.stars,
      totalSolved: profile.totalSolved,
    };

    const noUsefulData =
      payload.rating === null &&
      payload.stars === null &&
      payload.totalSolved === null;

    if (noUsefulData) {
      return null;
    }

    try {
      await redis.set(cacheKey, JSON.stringify(payload), "EX", 3600);
    } catch (error) {
      console.error("CodeChef cache write failed:", error.message);
    }

    return payload;
  } catch (error) {
    console.error(`fetchCodeChefStats failed for ${handle}:`, error.message);
    return null;
  }
};

const fetchCodeChefHistory = async (handle) => {
  const cacheKey = `cc:history:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error("CodeChef history cache read failed:", error.message);
  }

  try {
    const html = await fetchCodeChefProfileHtml(handle);
    const history = parseCodeChefHistory(html);

    try {
      await redis.set(cacheKey, JSON.stringify(history), "EX", 3600);
    } catch (error) {
      console.error("CodeChef history cache write failed:", error.message);
    }

    return history;
  } catch (error) {
    console.error(`fetchCodeChefHistory failed for ${handle}:`, error.message);
    return [];
  }
};

module.exports = {
  fetchCodeChefStats,
  fetchCodeChefHistory,
};
