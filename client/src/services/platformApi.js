import axios from "axios";

export const getCodeforcesStats = async (handle) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/platforms/codeforces/${handle}`
  );
  return response.data;
};
