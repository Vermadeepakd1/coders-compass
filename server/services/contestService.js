const axios = require("axios");
const redis = require("../config/redis");

const CACHE_TTL_SECONDS = 15 * 60;

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

const postWithRetry = async (url, data, options = {}, retries = 1) => {
  try {
    return await axios.post(url, data, options);
  } catch (error) {
    if (
      retries > 0 &&
      (error.code === "ECONNABORTED" ||
        (error.response && error.response.status >= 500) ||
        (error.response && error.response.status === 429))
    ) {
      await new Promise((res) => setTimeout(res, 1000));
      return postWithRetry(url, data, options, retries - 1);
    }
    throw error;
  }
};

const normalizeContest = ({
  id,
  platform,
  title,
  startTime,
  durationSeconds,
  url,
}) => {
  const start = new Date(startTime);
  const end = new Date(
    start.getTime() + Math.max(0, durationSeconds || 0) * 1000,
  );

  return {
    id: `${platform}-${id}`,
    platform,
    title,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationSeconds: Math.max(0, durationSeconds || 0),
    url,
  };
};

const fetchCodeforcesUpcomingContests = async () => {
  const response = await fetchWithRetry(
    "https://codeforces.com/api/contest.list",
    {
      timeout: 15000,
    },
  );

  if (response.data.status !== "OK") return [];

  return response.data.result
    .filter((contest) => contest.phase === "BEFORE")
    .map((contest) =>
      normalizeContest({
        id: contest.id,
        platform: "Codeforces",
        title: contest.name,
        startTime: contest.startTimeSeconds * 1000,
        durationSeconds: contest.durationSeconds,
        url: `https://codeforces.com/contests/${contest.id}`,
      }),
    );
};

const fetchLeetCodeUpcomingContests = async () => {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Referer: "https://leetcode.com/contest/",
  };

  const normalizeLeetCodeItems = (items = []) =>
    (items || [])
      .filter(
        (contest) =>
          Number(contest.startTime || contest.start_time || 0) * 1000 >
          Date.now(),
      )
      .map((contest) => {
        const start = Number(contest.startTime || contest.start_time || 0);
        return normalizeContest({
          id:
            contest.titleSlug ||
            contest.title_slug ||
            contest.cardImg ||
            contest.card_img ||
            contest.title,
          platform: "LeetCode",
          title: contest.title,
          startTime: start * 1000,
          durationSeconds: Number(
            contest.duration || contest.duration_seconds || 0,
          ),
          url: `https://leetcode.com/contest/${contest.titleSlug || contest.title_slug || ""}`,
        });
      })
      .filter((contest) => contest.title);

  try {
    const upcomingResponse = await postWithRetry(
      "https://leetcode.com/graphql",
      {
        query:
          "query upcomingContests { upcomingContests { title titleSlug startTime duration } }",
      },
      { headers, timeout: 15000 },
    );

    const upcoming = upcomingResponse.data?.data?.upcomingContests;
    if (Array.isArray(upcoming) && upcoming.length > 0) {
      return normalizeLeetCodeItems(upcoming);
    }
  } catch (error) {
    // Continue to fallback.
  }

  try {
    const topTwoResponse = await postWithRetry(
      "https://leetcode.com/graphql",
      {
        query:
          "query topTwoContests { topTwoContests { title titleSlug startTime duration cardImg } }",
      },
      { headers, timeout: 15000 },
    );

    const topTwo = topTwoResponse.data?.data?.topTwoContests;
    if (Array.isArray(topTwo) && topTwo.length > 0) {
      return normalizeLeetCodeItems(topTwo);
    }
  } catch (error) {
    // Continue to REST fallback.
  }

  const response = await fetchWithRetry(
    "https://leetcode.com/contest/api/list/",
    {
      timeout: 15000,
      headers,
    },
  );

  const list = response.data?.top_two_contest || response.data?.contests || [];
  if (!Array.isArray(list)) return [];

  return normalizeLeetCodeItems(list);
};

const fetchCodeChefUpcomingContests = async () => {
  const endpoints = [
    "https://www.codechef.com/api/list/contests/all",
    "https://www.codechef.com/api/list/contests/all?sort_by=START",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithRetry(endpoint, {
        timeout: 15000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
      });

      const future =
        response.data?.future_contests || response.data?.contests || [];
      if (!Array.isArray(future)) continue;

      const normalized = future
        .map((contest) => {
          const startTimeValue =
            contest.contest_start_date_iso ||
            contest.contest_start_date ||
            contest.contest_start_date_unix;

          const parsedStart = Number.isFinite(Number(startTimeValue))
            ? Number(startTimeValue) * 1000
            : Date.parse(startTimeValue);

          if (
            !parsedStart ||
            Number.isNaN(parsedStart) ||
            parsedStart <= Date.now()
          ) {
            return null;
          }

          const durationSeconds =
            Number(contest.contest_duration) ||
            Number(contest.contest_duration_seconds) ||
            0;

          const code =
            contest.contest_code || contest.contestId || contest.contest_name;
          return normalizeContest({
            id: code,
            platform: "CodeChef",
            title: contest.contest_name || code,
            startTime: parsedStart,
            durationSeconds,
            url: code
              ? `https://www.codechef.com/${code}`
              : "https://www.codechef.com/contests",
          });
        })
        .filter(Boolean);

      if (normalized.length > 0) return normalized;
    } catch (error) {
      // Try the next endpoint before giving up.
    }
  }

  return [];
};

const getUpcomingContests = async ({ platforms = [] } = {}) => {
  const selected = new Set(
    (platforms || []).map((name) =>
      String(name || "")
        .trim()
        .toLowerCase(),
    ),
  );

  const includeAll = selected.size === 0;
  const includeCF = includeAll || selected.has("codeforces");
  const includeLC = includeAll || selected.has("leetcode");
  const includeCC = includeAll || selected.has("codechef");

  const cacheKey = `contests:upcoming:${includeCF}:${includeLC}:${includeCC}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.error("Contest cache read failed:", error.message);
  }

  const [codeforces, leetcode, codechef] = await Promise.all([
    includeCF
      ? fetchCodeforcesUpcomingContests().catch(() => [])
      : Promise.resolve([]),
    includeLC
      ? fetchLeetCodeUpcomingContests().catch(() => [])
      : Promise.resolve([]),
    includeCC
      ? fetchCodeChefUpcomingContests().catch(() => [])
      : Promise.resolve([]),
  ]);

  const contests = [...codeforces, ...leetcode, ...codechef].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime),
  );

  const payload = {
    contests,
    sourceStatus: {
      codeforces: includeCF ? codeforces.length > 0 : null,
      leetcode: includeLC ? leetcode.length > 0 : null,
      codechef: includeCC ? codechef.length > 0 : null,
    },
    generatedAt: new Date().toISOString(),
  };

  try {
    await redis.set(cacheKey, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);
  } catch (error) {
    console.error("Contest cache write failed:", error.message);
  }

  return payload;
};

module.exports = {
  getUpcomingContests,
};
