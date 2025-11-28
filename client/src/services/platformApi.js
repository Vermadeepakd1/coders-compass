import axios from "axios";

const base_url = import.meta.env.VITE_API_URL;

// get codeforce stats
export const getCodeforcesStats = async (handle) => {
  const response = await axios.get(
    `${base_url}/api/platforms/codeforces/${handle}`
  );
  return response.data;
};

//get leetcode stats
export const getLeetCodeStats = async (handle) => {
  const response = await axios.get(
    `${base_url}/api/platforms/leetcode/${handle}`
  );
  return response.data;
};
