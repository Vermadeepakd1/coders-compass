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

const FALLBACK_LEETCODE_QUESTIONS = [
  { frontendQuestionId: "1", title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy", acRate: 53.2, topicTags: [{ name: "Array", slug: "array" }, { name: "Hash Table", slug: "hash-table" }] },
  { frontendQuestionId: "20", title: "Valid Parentheses", titleSlug: "valid-parentheses", difficulty: "Easy", acRate: 40.5, topicTags: [{ name: "String", slug: "string" }, { name: "Stack", slug: "stack" }] },
  { frontendQuestionId: "21", title: "Merge Two Sorted Lists", titleSlug: "merge-two-sorted-lists", difficulty: "Easy", acRate: 63.5, topicTags: [{ name: "Linked List", slug: "linked-list" }, { name: "Recursion", slug: "recursion" }] },
  { frontendQuestionId: "121", title: "Best Time to Buy and Sell Stock", titleSlug: "best-time-to-buy-and-sell-stock", difficulty: "Easy", acRate: 54.2, topicTags: [{ name: "Array", slug: "array" }, { name: "Dynamic Programming", slug: "dynamic-programming" }] },
  { frontendQuestionId: "70", title: "Climbing Stairs", titleSlug: "climbing-stairs", difficulty: "Easy", acRate: 52.8, topicTags: [{ name: "Math", slug: "math" }, { name: "Dynamic Programming", slug: "dynamic-programming" }] },
  
  { frontendQuestionId: "2", title: "Add Two Numbers", titleSlug: "add-two-numbers", difficulty: "Medium", acRate: 41.2, topicTags: [{ name: "Linked List", slug: "linked-list" }, { name: "Math", slug: "math" }] },
  { frontendQuestionId: "3", title: "Longest Substring Without Repeating Characters", titleSlug: "longest-substring-without-repeating-characters", difficulty: "Medium", acRate: 34.8, topicTags: [{ name: "Hash Table", slug: "hash-table" }, { name: "String", slug: "string" }, { name: "Sliding Window", slug: "sliding-window" }] },
  { frontendQuestionId: "15", title: "3Sum", titleSlug: "3sum", difficulty: "Medium", acRate: 33.2, topicTags: [{ name: "Array", slug: "array" }, { name: "Two Pointers", slug: "two-pointers" }] },
  { frontendQuestionId: "11", title: "Container With Most Water", titleSlug: "container-with-most-water", difficulty: "Medium", acRate: 54.8, topicTags: [{ name: "Array", slug: "array" }, { name: "Two Pointers", slug: "two-pointers" }] },
  { frontendQuestionId: "19", title: "Remove Nth Node From End of List", titleSlug: "remove-nth-node-from-end-of-list", difficulty: "Medium", acRate: 42.5, topicTags: [{ name: "Linked List", slug: "linked-list" }, { name: "Two Pointers", slug: "two-pointers" }] },
  
  { frontendQuestionId: "4", title: "Median of Two Sorted Arrays", titleSlug: "median-of-two-sorted-arrays", difficulty: "Hard", acRate: 38.5, topicTags: [{ name: "Array", slug: "array" }, { name: "Binary Search", slug: "binary-search" }] },
  { frontendQuestionId: "10", title: "Regular Expression Matching", titleSlug: "regular-expression-matching", difficulty: "Hard", acRate: 28.2, topicTags: [{ name: "String", slug: "string" }, { name: "Dynamic Programming", slug: "dynamic-programming" }, { name: "Backtracking", slug: "backtracking" }] },
  { frontendQuestionId: "23", title: "Merge k Sorted Lists", titleSlug: "merge-k-sorted-lists", difficulty: "Hard", acRate: 50.2, topicTags: [{ name: "Linked List", slug: "linked-list" }, { name: "Divide and Conquer", slug: "divide-and-conquer" }, { name: "Heap (Priority Queue)", slug: "heap-priority-queue" }] },
  { frontendQuestionId: "72", title: "Edit Distance", titleSlug: "edit-distance", difficulty: "Hard", acRate: 54.5, topicTags: [{ name: "String", slug: "string" }, { name: "Dynamic Programming", slug: "dynamic-programming" }] }
];

// to get leetcode questions of specific topic
const fetchLeetCodeFilter = async (tag, difficulty, searchKey = "") => {
  const isTagRandom = !tag || tag.toLowerCase() === "random";
  const isDifficultyRandom = !difficulty || difficulty.toUpperCase() === "RANDOM" || difficulty.toUpperCase() === "ALL";

  // Cache key based on tag, difficulty, and searchKey
  const cacheKey = `lc:filter:${isTagRandom ? "random" : tag}:${isDifficultyRandom ? "random" : difficulty}:${searchKey || "none"}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const cachedQuestions = JSON.parse(cached);
      if (cachedQuestions && cachedQuestions.length > 0) {
        // Helper to shuffle array (Fisher-Yates)
        for (let i = cachedQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cachedQuestions[i], cachedQuestions[j]] = [cachedQuestions[j], cachedQuestions[i]];
        }
        return cachedQuestions.slice(0, 3);
      }
    }
  } catch (e) {}

  const filters = {};
  if (!isTagRandom) {
    filters.tags = [tag.toLowerCase().replace(/\s+/g, "-")];
  }
  if (!isDifficultyRandom) {
    filters.difficulty = difficulty.toUpperCase();
  }
  if (searchKey) {
    filters.searchKeywords = searchKey;
  }

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
    categorySlug: "",
    skip: 0,
    limit: 50,
    filters,
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

    let questions = [];
    if (response.data.errors) {
      console.error("LeetCode Filter API Error:", response.data.errors);
    } else {
      questions = response.data.data?.problemsetQuestionList?.questions || [];
    }

    if (questions.length === 0) {
      console.warn("fetchLeetCodeFilter: API returned empty list. Using fallback questions.");
      // Filter fallbacks by tag and difficulty
      const searchTag = isTagRandom ? "" : tag.toLowerCase().replace(/\s+/g, "-");
      questions = FALLBACK_LEETCODE_QUESTIONS.filter((q) => {
        const matchesTag = isTagRandom || q.topicTags.some((t) => t.slug === searchTag);
        const matchesDiff = isDifficultyRandom || q.difficulty.toUpperCase() === difficulty.toUpperCase();
        return matchesTag && matchesDiff;
      });
      // If filtering was too strict and returned empty, use all fallbacks matching difficulty
      if (questions.length === 0) {
        questions = FALLBACK_LEETCODE_QUESTIONS.filter((q) => isDifficultyRandom || q.difficulty.toUpperCase() === difficulty.toUpperCase());
      }
    } else {
      // Cache the successful API response for 24 hours
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
    
    // Use fallback on catch
    let fallbackQuestions = FALLBACK_LEETCODE_QUESTIONS.filter((q) => {
      const matchesDiff = isDifficultyRandom || q.difficulty.toUpperCase() === difficulty.toUpperCase();
      return matchesDiff;
    });
    // Shuffle fallback
    for (let i = fallbackQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fallbackQuestions[i], fallbackQuestions[j]] = [fallbackQuestions[j], fallbackQuestions[i]];
    }
    return fallbackQuestions.slice(0, 3);
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

const fetchLeetCodeWeakTopic = async (handle) => {
  const cacheKey = `lc:weaktopic:${handle}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.tag !== "Heap (Priority Queue)") {
        return parsed;
      }
    }
  } catch (e) {}

  const query = `
    query userSkillStats($username: String!) {
      matchedUser(username: $username) {
        tagProblemCounts {
          advanced {
            tagName
            tagSlug
            problemsSolved
          }
          intermediate {
            tagName
            tagSlug
            problemsSolved
          }
          fundamental {
            tagName
            tagSlug
            problemsSolved
          }
        }
      }
    }
  `;

  const CORE_TAGS = [
    { slug: "dynamic-programming", name: "Dynamic Programming" },
    { slug: "greedy", name: "Greedy" },
    { slug: "depth-first-search", name: "Depth-First Search" },
    { slug: "binary-search", name: "Binary Search" },
    { slug: "breadth-first-search", name: "Breadth-First Search" },
    { slug: "sliding-window", name: "Sliding Window" },
    { slug: "two-pointers", name: "Two Pointers" },
    { slug: "backtracking", name: "Backtracking" },
    { slug: "trie", name: "Trie" },
    { slug: "graph", name: "Graph" },
    { slug: "union-find", name: "Union Find" },
    { slug: "segment-tree", name: "Segment Tree" }
  ];

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

    const tagData = response.data?.data?.matchedUser?.tagProblemCounts;
    if (!tagData) {
      return { tag: "Dynamic Programming", slug: "dynamic-programming", accuracy: 55, delta: -15, count: 0, totalSolved: 0 };
    }

    // Map tag slug -> problemsSolved
    const solvedMap = {};
    let totalSolved = 0;
    const processGroup = (group) => {
      if (!group) return;
      group.forEach((item) => {
        solvedMap[item.tagSlug] = item.problemsSolved;
        totalSolved += item.problemsSolved;
      });
    };

    processGroup(tagData.fundamental);
    processGroup(tagData.intermediate);
    processGroup(tagData.advanced);

    // Score core tags
    const scored = CORE_TAGS.map((core) => {
      const count = solvedMap[core.slug] || 0;
      return { ...core, count };
    });

    // Sort by count ascending (lowest solved count = weakest skill)
    scored.sort((a, b) => a.count - b.count);

    const weakest = scored[0];
    // Dynamic accuracy calculation
    const accuracy = Math.max(48, Math.min(84, 52 + weakest.count * 4));
    const delta = accuracy - 70; // 70% = stable avg baseline

    const result = {
      tag: weakest.name,
      slug: weakest.slug,
      accuracy,
      delta,
      count: weakest.count,
      totalSolved
    };

    // Cache for 2 hours
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 7200);
    } catch (e) {}

    return result;
  } catch (error) {
    console.error("fetchLeetCodeWeakTopic Error:", error.message);
    return { tag: "Dynamic Programming", slug: "dynamic-programming", accuracy: 55, delta: -15, count: 0, totalSolved: 0 };
  }
};

const fetchLeetCodeRecentSubmissions = async (handle) => {
  const cacheKey = `lc:recent:${handle}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const query = `
    query recentSubmissions($username: String!, $limit: Int) {
      recentSubmissionList(username: $username, limit: $limit) {
        title
        titleSlug
        timestamp
        statusDisplay
      }
    }
  `;

  try {
    const response = await fetchWithRetry(
      LEETCODE_API_URL,
      { query, variables: { username: handle, limit: 30 } },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const submissions = response.data?.data?.recentSubmissionList || [];
    // Cache for 5 mins
    try {
      await redis.set(cacheKey, JSON.stringify(submissions), "EX", 300);
    } catch (e) {}

    return submissions;
  } catch (error) {
    console.error("fetchLeetCodeRecentSubmissions Error:", error.message);
    return [];
  }
};

const getLeetCodeRecommendations = async (handle, forceRefresh = false) => {
  const cacheKey = `lc:recommendations:${handle || "none"}`;

  if (!forceRefresh) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
  }

  try {
    let tag = "random";
    if (handle && handle.trim() !== "" && handle !== "none") {
      const weakTopic = await fetchLeetCodeWeakTopic(handle);
      if (weakTopic && weakTopic.slug) {
        tag = weakTopic.slug;
      }
    }

    if (tag === "random") {
      const CORE_TAGS = [
        "dynamic-programming", "greedy", "depth-first-search", "binary-search",
        "breadth-first-search", "sliding-window", "two-pointers", "backtracking",
        "trie", "graph", "union-find", "segment-tree"
      ];
      tag = CORE_TAGS[Math.floor(Math.random() * CORE_TAGS.length)];
    }

    // fetchLeetCodeFilter returns up to 3 problems. We will use them.
    const problems = await fetchLeetCodeFilter(tag, "RANDOM");

    const mapped = (problems || []).slice(0, 2).map((p) => {
      let rating = 1200;
      if (p.difficulty === "Easy") rating = 1000;
      if (p.difficulty === "Medium") rating = 1400;
      if (p.difficulty === "Hard") rating = 1800;

      return {
        contestId: "leetcode",
        index: p.frontendQuestionId || "LC",
        name: p.title,
        titleSlug: p.titleSlug,
        rating,
        acRate: p.acRate || 50.0,
        difficulty: p.difficulty,
        tags: p.topicTags ? p.topicTags.map(t => t.name) : [tag],
        platform: "leetcode"
      };
    });

    if (mapped.length < 2) {
      const fallbacks = [
        {
          contestId: "leetcode",
          index: "1",
          name: "Two Sum",
          titleSlug: "two-sum",
          rating: 1000,
          acRate: 53.2,
          difficulty: "Easy",
          tags: ["Array", "Hash Table"],
          platform: "leetcode"
        },
        {
          contestId: "leetcode",
          index: "3",
          name: "Longest Substring Without Repeating Characters",
          titleSlug: "longest-substring-without-repeating-characters",
          rating: 1400,
          acRate: 34.8,
          difficulty: "Medium",
          tags: ["Hash Table", "String", "Sliding Window"],
          platform: "leetcode"
        }
      ];
      while (mapped.length < 2) {
        mapped.push(fallbacks[mapped.length]);
      }
    }

    try {
      await redis.set(cacheKey, JSON.stringify(mapped), "EX", 86400);
    } catch (e) {}

    return mapped;
  } catch (error) {
    console.error("getLeetCodeRecommendations Error:", error.message);
    return [
      {
        contestId: "leetcode",
        index: "1",
        name: "Two Sum",
        titleSlug: "two-sum",
        rating: 1000,
        acRate: 53.2,
        difficulty: "Easy",
        tags: ["Array", "Hash Table"],
        platform: "leetcode"
      },
      {
        contestId: "leetcode",
        index: "3",
        name: "Longest Substring Without Repeating Characters",
        titleSlug: "longest-substring-without-repeating-characters",
        rating: 1400,
        acRate: 34.8,
        difficulty: "Medium",
        tags: ["Hash Table", "String", "Sliding Window"],
        platform: "leetcode"
      }
    ];
  }
};

module.exports = {
  fetchLeetCodeStats,
  fetchLeetCodeFilter,
  fetchLeetCodeRating,
  fetchLeetCodeCalendar,
  fetchLeetCodeHistory,
  fetchLeetCodeWeakTopic,
  fetchLeetCodeRecentSubmissions,
  getLeetCodeRecommendations,
};
