import apiClient from "./apiClient";

export const getLeaderboard = async (window = "global", limit = 50) => {
  const response = await apiClient.get("/api/leaderboard", {
    params: { window, limit },
  });

  return response.data;
};
