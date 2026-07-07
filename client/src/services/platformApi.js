import apiClient from "./apiClient";

// get codeforces stats
export const getCodeforcesStats = async (handle) => {
  const response = await apiClient.get(`/api/platforms/codeforces/${handle}`);
  return response.data;
};

// get leetcode stats
export const getLeetCodeStats = async (handle) => {
  const response = await apiClient.get(`/api/platforms/leetcode/${handle}`);
  return response.data;
};

// get codechef stats
export const getCodeChefStats = async (handle) => {
  const response = await apiClient.get(`/api/platforms/codechef/${handle}`);
  return response.data;
};

// Get Rating History
export const getRatingHistory = async (cfHandle, lcHandle, ccHandle) => {
  const cf = cfHandle || "null";
  const lc = lcHandle || "null";
  const cc = ccHandle || "null";
  const response = await apiClient.get(
    `/api/platforms/rating-history/${cf}/${lc}/${cc}`
  );
  return response.data;
};

// get cf recommendations
export const getRecommendations = async (handle, refresh = false) => {
  try {
    const response = await apiClient.get(
      `/api/platforms/codeforces/recommend/${handle}`,
      {
        params: refresh ? { refresh: true } : {},
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return null;
  }
};

// get lc suggestions
export const getLeetCodeSuggestions = async (tag, difficulty) => {
  try {
    const response = await apiClient.get(`/api/platforms/leetcode/explore`, {
      params: { tag, difficulty },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching LC Suggestions:", error);
    return [];
  }
};

// get combined stats
export const getCombinedStats = async (cfHandle, lcHandle, ccHandle) => {
  try {
    const cf = cfHandle || "null";
    const lc = lcHandle || "null";
    const cc = ccHandle || "null";
    const response = await apiClient.get(
      `/api/platforms/combined/${cf}/${lc}/${cc}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching combined stats:", error);
    return null;
  }
};
