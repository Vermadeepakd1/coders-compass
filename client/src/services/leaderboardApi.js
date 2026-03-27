import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getLeaderboard = async (window = "global", limit = 50) => {
  const response = await axios.get(`${baseUrl}/api/leaderboard`, {
    ...getAuthHeaders(),
    params: { window, limit },
    timeout: 20000,
  });

  return response.data;
};
