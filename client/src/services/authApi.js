import apiClient from "./apiClient";

export const updateProfile = async (handles) => {
  try {
    const response = await apiClient.put("/api/auth/profile", { handles });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Failed to update profile";
    throw new Error(msg);
  }
};
