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

export const getUpcomingContests = async (platforms = []) => {
  const params = {};
  if (platforms.length > 0) {
    params.platforms = platforms.join(",");
  }

  const response = await axios.get(`${baseUrl}/api/contests/upcoming`, {
    ...getAuthHeaders(),
    params,
    timeout: 20000,
  });

  return response.data;
};
