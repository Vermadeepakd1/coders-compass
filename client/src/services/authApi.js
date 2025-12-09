const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export const updateProfile = async (handles) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ handles }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile");
  }

  return data;
};
