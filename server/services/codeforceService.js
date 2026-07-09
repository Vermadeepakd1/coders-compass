const axios = require("axios");
const redis = require("../config/redis");

// --- Helper: Fetch with Retry ---
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
      console.warn(
        `Retrying ${url} due to ${error.message}. Attempts left: ${retries}`,
      );
      await new Promise((res) => setTimeout(res, 1000)); // Wait 1s
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

// --- Shared: Fetch User Submissions (Cached) ---
const fetchUserSubmissions = async (handle) => {
  const cacheKey = `cf:submissions:${handle}`;

  // 1. Try Redis
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      // console.log(`fetchUserSubmissions: Cache HIT for ${handle}`);
      return JSON.parse(cached);
    }
  } catch (redisError) {
    console.error("Redis read failed:", redisError.message);
  }

  // 2. Fetch from API
  try {
    const response = await fetchWithRetry(
      `https://codeforces.com/api/user.status?handle=${handle}`,
      { timeout: 10000 }, // Reduced to 10s
    );

    if (response.data.status !== "OK") {
      throw new Error("Codeforces API returned non-OK status");
    }

    const submissions = response.data.result;

    // 3. Save to Redis (1 hour)
    try {
      await redis.set(
        cacheKey,
        JSON.stringify(submissions),
        "EX",
        60 * 60, // 1 hour
      );
    } catch (redisError) {
      console.error("Redis write failed:", redisError.message);
    }

    return submissions;
  } catch (error) {
    console.error(`fetchUserSubmissions failed for ${handle}:`, error.message);
    throw error; // Re-throw to be handled by caller
  }
};

// helper function to fetch and cache problems
const getCachedProblemSet = async () => {
  const cacheKey = "cf:problemset";

  //try redis
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      // console.log("getCachedProblemSet: Cache HIT ⚡");
      return JSON.parse(cached);
    }
  } catch (redisError) {
    console.error(
      "getCachedProblemSet: Redis read failed:",
      redisError.message,
    );
  }

  //fetch from codeforces
  console.log("getCachedProblemSet: Cache MISS 🔴 - Fetching from CF...");
  try {
    const response = await fetchWithRetry(
      "https://codeforces.com/api/problemset.problems",
      { timeout: 15000 }, // Reduced to 15s
    );

    if (response.data.status !== "OK") {
      throw new Error("Codeforces API returned non-OK status");
    }

    const problems = response.data.result.problems;

    //save to redis(for 24 hours)
    try {
      await redis.set(cacheKey, JSON.stringify(problems), "EX", 24 * 60 * 60);
      console.log("getCachedProblemSet: Cached", problems.length, "problems");
    } catch (redisError) {
      console.error(
        "getCachedProblemSet: Redis write failed:",
        redisError.message,
      );
    }

    return problems;
  } catch (error) {
    console.error("getCachedProblemSet: API Error:", error.message);
    return [];
  }
};

//shuffling helper
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getRecommendations = async (handle, forceRefresh = false) => {
  const cacheKey = `cf:recommendations:${handle}`;

  // 1. Try Cache First unless force refresh
  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        // console.log("getRecommendations: Cache HIT ⚡");
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("getRecommendations cache read failed:", e.message);
    }
  }

  try {
    // Parallelize fetching: User Status, Submissions, Problem Set
    const [userData, submissions, allProblems] = await Promise.all([
      fetchCFStatus(handle).catch((e) => {
        console.error("getRecommendations: fetchCFStatus failed", e.message);
        return null;
      }),
      fetchUserSubmissions(handle).catch((e) => {
        console.error(
          "getRecommendations: fetchUserSubmissions failed",
          e.message,
        );
        return [];
      }),
      getCachedProblemSet().catch((e) => {
        console.error(
          "getRecommendations: getCachedProblemSet failed",
          e.message,
        );
        return [];
      }),
    ]);

    if (!userData) {
      console.error("getRecommendations: Could not fetch user data");
      return null;
    }
    const currentRating = userData.rating === "Unrated" ? 800 : userData.rating;

    // Filter accepted submissions
    const acceptedSubmissions = submissions.filter(
      (sub) => sub.verdict === "OK",
    );

    // Create set of solved problem IDs
    const solvedSet = new Set(
      acceptedSubmissions.map(
        (sub) => `${sub.problem.contestId}${sub.problem.index}`,
      ),
    );

    if (!allProblems || allProblems.length === 0) {
      console.error("getRecommendations: No problems in cache");
      return null;
    }

    // --- TELEMETRY: WEAKEST TOPIC CALCULATION ---
    const tagStats = {};
    submissions.forEach((sub) => {
      if (!sub.problem || !sub.problem.tags) return;
      sub.problem.tags.forEach((tag) => {
        if (tag === "*special") return; // Skip special technique tag
        if (!tagStats[tag]) {
          tagStats[tag] = { solved: 0, failed: 0, total: 0 };
        }
        tagStats[tag].total++;
        if (sub.verdict === "OK") {
          tagStats[tag].solved++;
        } else {
          tagStats[tag].failed++;
        }
      });
    });

    // Identify tag with highest failure rate (only considering tags with at least 2 attempts to reduce noise)
    let tagList = Object.entries(tagStats).map(([tag, stats]) => ({
      tag,
      ...stats,
      failureRate: stats.total > 0 ? stats.failed / stats.total : 0,
    }));

    let candidates = tagList.filter((t) => t.total >= 2);
    if (candidates.length === 0) candidates = tagList;

    candidates.sort((a, b) => b.failureRate - a.failureRate || b.total - a.total);
    const weakestTag = candidates[0]?.tag || null;

    // Target rating range
    const minRating = currentRating + 50;
    const maxRating = currentRating + 200;

    // Filter unsolved problems within rating range
    const suitableProblems = allProblems.filter((problem) => {
      const problemId = `${problem.contestId}${problem.index}`;
      const hasRating = problem.rating !== undefined;
      const inRange =
        problem.rating >= minRating && problem.rating <= maxRating;
      const notSolved = !solvedSet.has(problemId);

      return hasRating && inRange && notSolved;
    });

    // --- PROBLEM SELECTION ---
    let selected = [];

    // Prioritize weakest tag if found
    if (weakestTag) {
      const targeted = suitableProblems.filter(
        (p) => p.tags && p.tags.includes(weakestTag),
      );
      if (targeted.length > 0) {
        const shuffledTargeted = shuffleArray(targeted);
        // Select up to 2 targeted problems so we still have variety
        selected = shuffledTargeted.slice(0, 2);
      }
    }

    // Fill the remaining recommendations from other suitable problems
    const remaining = suitableProblems.filter((p) => !selected.includes(p));
    const shuffledRemaining = shuffleArray(remaining);
    const recommendations = [...selected, ...shuffledRemaining].slice(0, 3).map((p) => {
      const plain = p.toObject ? p.toObject() : p;
      return { ...plain, platform: "codeforces" };
    });

    // Save to Redis (24 hours cache)
    try {
      await redis.set(cacheKey, JSON.stringify(recommendations), "EX", 24 * 60 * 60);
    } catch (e) {
      console.error("getRecommendations cache write failed:", e.message);
    }

    return recommendations;
  } catch (error) {
    console.error("getRecommendations Error:", error.message);
    return null;
  }
};

// codeforces stats
const fetchCFStatus = async (handle) => {
  const cfURL = `https://codeforces.com/api/user.info?handles=${handle}`;
  const cacheKey = `cf:status:${handle}`;

  // Try Redis for Status
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  try {
    const response = await fetchWithRetry(cfURL, { timeout: 10000 });
    // console.log(response.data);
    if (response.data.status !== "OK") {
      throw new Error("Codeforces API Error");
    }
    const result = response.data.result;

    if (!result || result.length === 0) {
      console.error("fetchCFStatus: User not found");
      return null;
    }

    const ourdata = result[0];
    const payload = {
      rating: ourdata.rating ?? "Unrated",
      rank: ourdata.rank ?? "Unrated",
      maxRating: ourdata.maxRating ?? "Unrated",
      maxRank: ourdata.maxRank ?? "Unrated",
      titlePhoto: ourdata.titlePhoto,
    };

    // Cache status for 15 mins
    try {
      await redis.set(cacheKey, JSON.stringify(payload), "EX", 900);
    } catch (e) {}

    return payload;
  } catch (error) {
    console.error("Error fetching CF status:", error.message);
    throw new Error(error.message);
  }
};

const calculateCFStats = async (handle) => {
  // Check Redis first (Heavy API call!)
  const cacheKey = `cf:stats:${handle}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      // console.log("calculateCFStats: Cache HIT ⚡");
      return JSON.parse(cached);
    }
  } catch (redisError) {
    console.error("calculateCFStats: Redis read failed:", redisError.message);
  }

  try {
    // Use Shared Cached Function
    const submissions = await fetchUserSubmissions(handle);

    // 1. Unique Solved Count
    const solvedSet = new Set();
    submissions.forEach((sub) => {
      if (sub.verdict === "OK")
        solvedSet.add(sub.problem.contestId + sub.problem.index);
    });

    // 2. Heatmap Data (Date -> Unique Solved Count)
    const heatmap = {};
    const solvedOnDate = {};
    submissions.forEach((sub) => {
      if (sub.verdict !== "OK") return;
      const problemId = `${sub.problem.contestId}${sub.problem.index}`;
      const date = new Date(sub.creationTimeSeconds * 1000)
        .toISOString()
        .split("T")[0];
      if (!solvedOnDate[date]) {
        solvedOnDate[date] = new Set();
      }
      solvedOnDate[date].add(problemId);
    });
    Object.entries(solvedOnDate).forEach(([date, problemSet]) => {
      heatmap[date] = problemSet.size;
    });

    const result = { totalSolved: solvedSet.size, heatmap };

    // Cache for 1 hour
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
    } catch (redisError) {
      console.error(
        "calculateCFStats: Redis write failed:",
        redisError.message,
      );
    }
    return result;
  } catch (error) {
    console.error("calculateCFStats Error:", error.message);
    return { totalSolved: 0, heatmap: {} };
  }
};

const fetchCFHistory = async (handle) => {
  const cacheKey = `cf:history:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (cacheError) {
    console.error("fetchCFHistory cache read failed:", cacheError.message);
  }

  try {
    const response = await fetchWithRetry(
      `https://codeforces.com/api/user.rating?handle=${handle}`,
      { timeout: 15000 },
    );
    if (response.data.status !== "OK") return [];

    const history = response.data.result.map((r) => ({
      date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
      rating: r.newRating,
      contestName: r.contestName,
    }));

    try {
      await redis.set(cacheKey, JSON.stringify(history), "EX", 3600);
    } catch (cacheError) {
      console.error("fetchCFHistory cache write failed:", cacheError.message);
    }

    return history;
  } catch (error) {
    console.error("fetchCFHistory Error:", error.message);
    return [];
  }
};

module.exports = {
  fetchCFStatus,
  getRecommendations,
  getCachedProblemSet,
  calculateCFStats,
  fetchCFHistory,
};
