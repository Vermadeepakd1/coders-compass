import axios from "axios";

const base_url = import.meta.env.VITE_API_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No token found in localStorage");
    return { headers: {} };
  }
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
    { ...getAuthHeaders(), timeout: 20000 }
  );
  return response.data;
};

//get leetcode stats
export const getLeetCodeStats = async (handle) => {
  const response = await axios.get(
    `${base_url}/api/platforms/leetcode/${handle}`,
    { ...getAuthHeaders(), timeout: 20000 }
  );
  return response.data;
};

// Get Rating History
export const getRatingHistory = async (cfHandle, lcHandle) => {
  const cf = cfHandle || "null";
  const lc = lcHandle || "null";
  const response = await axios.get(
    `${base_url}/api/platforms/rating-history/${cf}/${lc}`,
    { ...getAuthHeaders(), timeout: 40000 }
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
        timeout: 45000,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return null;
  }
};

//get lc recommendations
export const getLeetCodeSuggestions = async (tag, difficulty) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${base_url}/api/platforms/leetcode/explore`,
      {
        params: { tag, difficulty },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching LC Suggestions:", error);
    return [];
  }
};

// get combined stats
export const getCombinedStats = async (cfHandle, lcHandle) => {
  try {
    const cf = cfHandle || "null";
    const lc = lcHandle || "null";
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${base_url}/api/platforms/combined/${cf}/${lc}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 45000,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching combined stats:", error);
    return null;
  }
};
