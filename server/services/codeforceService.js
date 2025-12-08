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
        `Retrying ${url} due to ${error.message}. Attempts left: ${retries}`
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
      { timeout: 10000 } // Reduced to 10s
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
        60 * 60 // 1 hour
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
      redisError.message
    );
  }

  //fetch from codeforces
  console.log("getCachedProblemSet: Cache MISS 🔴 - Fetching from CF...");
  try {
    const response = await fetchWithRetry(
      "https://codeforces.com/api/problemset.problems",
      { timeout: 15000 } // Reduced to 15s
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
        redisError.message
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

const getRecommendations = async (handle) => {
  try {
    // Parallelize fetching: User Status, Submissions, Problem Set
    // This significantly reduces total wait time compared to sequential awaiting
    const [userData, submissions, allProblems] = await Promise.all([
      fetchCFStatus(handle).catch((e) => {
        console.error("getRecommendations: fetchCFStatus failed", e.message);
        return null;
      }),
      fetchUserSubmissions(handle).catch((e) => {
        console.error(
          "getRecommendations: fetchUserSubmissions failed",
          e.message
        );
        return [];
      }),
      getCachedProblemSet().catch((e) => {
        console.error(
          "getRecommendations: getCachedProblemSet failed",
          e.message
        );
        return [];
      }),
    ]);

    if (!userData) {
      console.error("getRecommendations: Could not fetch user data");
      return null; // Return null to indicate failure/not found
    }
    const currentRating = userData.rating === "Unrated" ? 800 : userData.rating;

    //filter accepted submission
    const acceptedSubmissions = submissions.filter(
      (sub) => sub.verdict === "OK"
    );

    // create set of solved problem ID (e.g. "4A", "150B")
    const solvedSet = new Set(
      acceptedSubmissions.map(
        (sub) => `${sub.problem.contestId}${sub.problem.index}`
      )
    );

    if (!allProblems || allProblems.length === 0) {
      console.error("getRecommendations: No problems in cache");
      return null;
    }
    // target rating
    const minRating = currentRating + 50;
    const maxRating = currentRating + 200;

    // filter unsolved problem with target rating
    const suitableProblems = allProblems.filter((problem) => {
      const problemId = `${problem.contestId}${problem.index}`;
      const hasRating = problem.rating !== undefined;
      const inRange =
        problem.rating >= minRating && problem.rating <= maxRating;
      const notSolved = !solvedSet.has(problemId);

      return hasRating && inRange && notSolved;
    });

    const shuffled = shuffleArray(suitableProblems);
    const recommendations = shuffled.slice(0, 3);

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

    // 2. Heatmap Data (Date -> Count)
    const heatmap = {};
    submissions.forEach((sub) => {
      // Convert UNIX timestamp to YYYY-MM-DD
      const date = new Date(sub.creationTimeSeconds * 1000)
        .toISOString()
        .split("T")[0];
      heatmap[date] = (heatmap[date] || 0) + 1;
    });

    const result = { totalSolved: solvedSet.size, heatmap };

    // Cache for 1 hour
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
    } catch (redisError) {
      console.error(
        "calculateCFStats: Redis write failed:",
        redisError.message
      );
    }
    return result;
  } catch (error) {
    console.error("calculateCFStats Error:", error.message);
    return { totalSolved: 0, heatmap: {} };
  }
};

const fetchCFHistory = async (handle) => {
  try {
    const response = await fetchWithRetry(
      `https://codeforces.com/api/user.rating?handle=${handle}`,
      { timeout: 15000 }
    );
    if (response.data.status !== "OK") return [];

    return response.data.result.map((r) => ({
      date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
      rating: r.newRating,
      contestName: r.contestName,
    }));
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
