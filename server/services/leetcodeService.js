const axios = require("axios");
const redis = require("../config/redis");

const LEETCODE_API_URL = "https://leetcode.com/graphql";

// --- Helper: Fetch with Retry ---
const fetchWithRetry = async (url, data, options = {}, retries = 1) => {
  try {
    return await axios.post(url, data, options);
  } catch (error) {
    if (
      retries > 0 &&
      (error.code === "ECONNABORTED" ||
        (error.response && error.response.status >= 500))
    ) {
      console.warn(`Retrying LeetCode request... Attempts left: ${retries}`);
      await new Promise((res) => setTimeout(res, 1000));
      return fetchWithRetry(url, data, options, retries - 1);
    }
    throw error;
  }
};

// to get stats for leetcode
const fetchLeetCodeStats = async (handle) => {
  const cacheKey = `lc:stats:${handle}`;

  // 1. Try Redis
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      // console.log(`fetchLeetCodeStats: Cache HIT for ${handle}`);
      return JSON.parse(cached);
    }
  } catch (e) {
    // console.error("Redis read failed:", e.message);
  }

  const query = `
      query userProblemsSolved($username: String!) {
        allQuestionsCount {
          difficulty
          count
        }
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `;

  try {
    const response = await fetchWithRetry(
      LEETCODE_API_URL,
      {
        query: query,
        variables: { username: handle },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      }
    );

    if (response.data.errors) {
      return null; // user likely dont exist
    }

    const data = response.data.data;
    const matchedUser = data?.matchedUser;

    if (!matchedUser) {
      console.error("fetchLeetCodeStats: User not found");
      return null;
    }

    const result = {
      totalSolved: data.matchedUser.submitStats.acSubmissionNum[0].count,
      easy: data.matchedUser.submitStats.acSubmissionNum[1].count,
      medium: data.matchedUser.submitStats.acSubmissionNum[2].count,
      hard: data.matchedUser.submitStats.acSubmissionNum[3].count,
      ranking: "Hidden",
    };

    // 2. Save to Redis (30 mins)
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 1800);
    } catch (e) {
      console.error("Redis write failed:", e.message);
    }

    return result;
  } catch (error) {
    console.error("Leetcode Fetch Error:", error.message);
    return null;
  }
};

// to get leetcode questions of specific topic
const fetchLeetCodeFilter = async (tag, difficulty) => {
  // Cache key based on tag and difficulty
  const cacheKey = `lc:filter:${tag}:${difficulty || "all"}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  // 1. Map difficulty to LeetCode's format (UPPERCASE)
  const difficultyUpper = difficulty ? difficulty.toUpperCase() : "MEDIUM";

  const query = `
      query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: $categorySlug
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          total: totalNum
          questions: data {
            acRate
            difficulty
            frontendQuestionId: questionFrontendId
            title
            titleSlug
            topicTags {
              name
              slug
            }
          }
        }
      }
    `;

  const variables = {
    categorySlug: "", // or "algorithms"
    skip: 0,
    limit: 50, // Fetch 50, we will pick random ones from this list
    filters: {
      // If tag is provided, use it. LeetCode expects an array of tag slugs.
      tags: tag ? [tag.toLowerCase().replace(/\s+/g, "-")] : [],
      difficulty: difficultyUpper,
    },
  };

  try {
    const response = await fetchWithRetry(
      LEETCODE_API_URL,
      {
        query,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: 10000,
      }
    );

    if (response.data.errors) {
      console.error("LeetCode Filter API Error:", response.data.errors);
      return [];
    }

    const questions =
      response.data.data?.problemsetQuestionList?.questions || [];

    if (questions.length > 0) {
      // Cache for 24 hours (problem lists don't change often)
      try {
        await redis.set(cacheKey, JSON.stringify(questions), "EX", 86400);
      } catch (e) {}
    }

    // Helper to shuffle array (Fisher-Yates)
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Return top 3 random ones
    return questions.slice(0, 3);
  } catch (error) {
    console.error("fetchLeetCodeFilter Error:", error.message);
    return [];
  }
};

//to get leetcode contest rating
const fetchLeetCodeRating = async (handle) => {
  const cacheKey = `lc:rating:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const query = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          rating
        }
      }
    `;
  try {
    const response = await fetchWithRetry(
      LEETCODE_API_URL,
      { query, variables: { username: handle } },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const result = response.data.data.userContestRanking || { rating: 0 };

    // Cache for 1 hour
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
    } catch (e) {}

    return result;
  } catch (error) {
    console.error("fetchLeetCodeRating Error:", error.message);
    return { rating: 0 };
  }
};

// Get Submission Calendar (Returns {"1701234": 5, ...})
const fetchLeetCodeCalendar = async (handle) => {
  const cacheKey = `lc:calendar:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const query = `
      query userProfileCalendar($username: String!) {
        matchedUser(username: $username) {
          userCalendar {
            submissionCalendar
          }
        }
      }
    `;
  try {
    const response = await fetchWithRetry(
      LEETCODE_API_URL,
      { query, variables: { username: handle } },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    const calendarData =
      response.data.data?.matchedUser?.userCalendar?.submissionCalendar;

    if (!calendarData) {
      console.log("fetchLeetCodeCalendar: No calendar data found");
      return {};
    }

    const result = JSON.parse(calendarData);

    // Cache for 1 hour
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
    } catch (e) {}

    return result;
  } catch (error) {
    console.error("fetchLeetCodeCalendar Error:", error.message);
    return {};
  }
};

// Get Contest History
const fetchLeetCodeHistory = async (handle) => {
  const cacheKey = `lc:history:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const query = `
      query userContestRankingInfo($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          contest {
            startTime
            title
          }
        }
      }
    `;
  try {
    const response = await fetchWithRetry(
      LEETCODE_API_URL,
      { query, variables: { username: handle } },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const history = response.data.data?.userContestRankingHistory;
    if (!history) return [];

    const result = history
      .filter((h) => h.attended)
      .map((h) => ({
        date: new Date(h.contest.startTime * 1000).toISOString(),
        rating: h.rating,
        contestName: h.contest.title,
      }));

    // Cache for 1 hour
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 3600);
    } catch (e) {}

    return result;
  } catch (error) {
    console.error("fetchLeetCodeHistory Error:", error.message);
    return [];
  }
};

module.exports = {
  fetchLeetCodeStats,
  fetchLeetCodeFilter,
  fetchLeetCodeRating,
  fetchLeetCodeCalendar,
  fetchLeetCodeHistory,
};
