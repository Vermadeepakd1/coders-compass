import apiClient from "./apiClient";

export const getUpcomingContests = async (platforms = []) => {
  const params = {};
  if (platforms.length > 0) {
    params.platforms = platforms.join(",");
  }

  const response = await apiClient.get("/api/contests/upcoming", {
    params,
  });

  return response.data;
};
