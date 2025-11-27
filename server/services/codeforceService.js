const axios = require("axios");

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

module.exports = fetchCFStatus;
