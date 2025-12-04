const axios = require("axios");
const redis = require("../config/redis");

// helper function to fetch and cache problems
const getCachedProblemSet = async () => {
  const cacheKey = "cf:problemset";

  //try redis
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  //fetch from codeforces
  console.log("Fetching global problem set from CF...");
  const response = await axios.get(
    "https://codeforces.com/api/problemset.problems"
  );
  const problems = response.data.result.problems;

  //save to redis(for 24 hours)
  await redis.set(cacheKey, JSON.stringify(problems), "EX", 24 * 60 * 60);

  return problems;
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
  //get user rating
  const userData = await fetchCFStatus(handle);
  const currentRating = userData.rating === "Unrated" ? 800 : userData.rating;

  //get all solved
  const solvedResponse = await axios.get(
    `https://codeforces.com/api/user.status?handle=${handle}`
  );
  const submissions = solvedResponse.data.result;

  //filter accepted submission
  const acceptedSubmissions = submissions.filter((sub) => sub.verdict === "OK");

  // create set of solved problem ID (e.g. "4A", "150B")
  const solvedSet = new Set(
    acceptedSubmissions.map(
      (sub) => `${sub.problem.contestId}${sub.problem.index}`
    )
  );

  // get all problem from cache
  const allProblems = await getCachedProblemSet();

  // target rating
  const minRating = currentRating + 50;
  const maxRating = currentRating + 200;

  // filter unsolved problem with target rating
  const suitableProblems = allProblems.filter((problem) => {
    const problemId = `${problem.contestId}${problem.index}`;
    const hasRating = problem.rating !== undefined;
    const inRange = problem.rating >= minRating && problem.rating <= maxRating;
    const notSolved = !solvedSet.has(problemId);

    return hasRating && inRange && notSolved;
  });

  const shuffled = shuffleArray(suitableProblems);
  const recommendations = shuffled.slice(0, 3);

  return recommendations;
};

// codeforces stats
const fetchCFStatus = async (handle) => {
  const cfURL = `https://codeforces.com/api/user.info?handles=${handle}`;

  try {
    const response = await axios.get(cfURL, { timeout: 5000 });
    // console.log(response.data);
    if (response.data.status !== "OK") {
      throw new Error("Codeforces API Error");
    }
    const ourdata = response.data.result[0];
    const payload = {
      rating: ourdata.rating ?? "Unrated",
      rank: ourdata.rank ?? "Unrated",
      maxRating: ourdata.maxRating ?? "Unrated",
      maxRank: ourdata.maxRank ?? "Unrated",
      titlePhoto: ourdata.titlePhoto,
    };
    return payload;
  } catch (error) {
    console.error("Error fetching CF status:", error.message);
    throw new Error(error.message);
  }
};

module.exports = { fetchCFStatus, getRecommendations, getCachedProblemSet };
