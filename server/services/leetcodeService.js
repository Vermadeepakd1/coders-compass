const axios = require("axios");

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

module.exports = fetchLeetCodeStats;
