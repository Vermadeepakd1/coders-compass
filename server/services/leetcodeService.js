const axios = require("axios");

// to get stats for leetcode
const fetchLeetCodeStats = async (handle) => {
  const url = "https://leetcode.com/graphql";

  // query for easy, medium, hard solved problems

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
    //the POST request
    const response = await axios.post(
      url,
      {
        query: query,
        variables: { username: handle },
      },
      {
        //headers(to look like a real browser)
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    //check for errors from leetcode
    if (response.data.errors) {
      return null; // user likely dont exist
    }

    //extract the data
    const data = response.data.data;
    const matchedUser = data?.matchedUser;

    if (!matchedUser) {
      console.error("fetchLeetCodeStats: User not found");
      return null;
    }
    return {
      totalSolved: data.matchedUser.submitStats.acSubmissionNum[0].count,
      easy: data.matchedUser.submitStats.acSubmissionNum[1].count,
      medium: data.matchedUser.submitStats.acSubmissionNum[2].count,
      hard: data.matchedUser.submitStats.acSubmissionNum[3].count,
      ranking: "Hidden", // LeetCode doesn't give ranking easily in this query
    };
  } catch (error) {
    console.error("Leetcode Fetch Error:", error.message);
    return null;
  }
};

// to get leetcode questions of specific topic
const fetchLeetCodeFilter = async (tag, difficulty) => {
  const url = "https://leetcode.com/graphql";

  // 1. Map difficulty to LeetCode's format (UPPERCASE)
  // Input: "medium" -> "MEDIUM"
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

  // 2. The Payload
  const variables = {
    categorySlug: "all-code-essentials", // or "algorithms"
    skip: 0,
    limit: 50, // Fetch 50, we will pick random ones from this list
    filters: {
      // If tag is provided, use it. LeetCode expects an array of tag slugs.
      tags: tag ? [tag.toLowerCase().replace(/\s+/g, "-")] : [],
      difficulty: difficultyUpper,
    },
  };

  try {
    const response = await axios.post(
      url,
      { query, variables },
      {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    // 3. Extract and Shuffle
    const questions = response.data.data?.problemsetQuestionList?.questions;

    if (!questions || questions.length === 0) {
      console.log("fetchLeetCodeFilter: No questions found");
      return [];
    }

    // Helper to shuffle array (Fisher-Yates)
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    // Return top 3 random ones
    return questions.slice(0, 3);
  } catch (error) {
    console.error("LeetCode Filter Error:", error.message);
    return [];
  }
};

//to get leetcode contest rating
const fetchLeetCodeRating = async (handle) => {
  const query = `
      query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
          rating
        }
      }
    `;
  try {
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables: { username: handle } },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data.userContestRanking || { rating: 0 };
  } catch (error) {
    console.error("fetchLeetCodeRating Error:", error.message);
    return { rating: 0 };
  }
};

// Get Submission Calendar (Returns {"1701234": 5, ...})
const fetchLeetCodeCalendar = async (handle) => {
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
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables: { username: handle } },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Content-Type": "application/json",
        },
      }
    );
    const calendarData =
      response.data.data?.matchedUser?.userCalendar?.submissionCalendar;

    if (!calendarData) {
      console.log("fetchLeetCodeCalendar: No calendar data found");
      return {};
    }

    return JSON.parse(calendarData);
  } catch (error) {
    console.error("fetchLeetCodeCalendar Error:", error.message);
    return {};
  }
};

// Get Contest History
const fetchLeetCodeHistory = async (handle) => {
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
    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables: { username: handle } },
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Content-Type": "application/json",
        },
      }
    );

    const history = response.data.data?.userContestRankingHistory;
    if (!history) return [];

    return history
      .filter((h) => h.attended)
      .map((h) => ({
        date: new Date(h.contest.startTime * 1000).toISOString(),
        rating: h.rating,
        contestName: h.contest.title,
      }));
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
