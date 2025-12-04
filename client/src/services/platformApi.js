import axios from "axios";

const base_url = import.meta.env.VITE_API_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  console.log("Token being sent:", token);
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// get codeforce stats
export const getCodeforcesStats = async (handle) => {
  const response = await axios.get(
    `${base_url}/api/platforms/codeforces/${handle}`,
    getAuthHeaders()
  );
  return response.data;
};

//get leetcode stats
export const getLeetCodeStats = async (handle) => {
  const response = await axios.get(
    `${base_url}/api/platforms/leetcode/${handle}`,
    getAuthHeaders()
  );
  return response.data;
};

//get cf recommendations
export const getRecommendations = async (handle) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${base_url}/api/platforms/codeforces/recommend/${handle}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};
