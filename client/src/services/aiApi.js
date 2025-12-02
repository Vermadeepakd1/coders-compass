import axios from "axios";

// Ensure this matches your actual backend URL (or use import.meta.env.VITE_API_URL if you set that up)
const BASE_URL = "http://localhost:5000/api";

export const askAiHint = async (problemLink, history) => {
  try {
    // 1. Get the token from localStorage so the backend knows who we are
    const token = localStorage.getItem("token");

    // 2. Make the POST request
    const response = await axios.post(
      `${BASE_URL}/ai/ask`,
      {
        problemLink,
        history,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Crucial for authMiddleware
          "Content-Type": "application/json",
        },
      }
    );

    // 3. Return the text answer from Gemini
    return response.data.answer;
  } catch (error) {
    // 4. Handle Rate Limiting (The 429 Error)
    if (error.response && error.response.status === 429) {
      throw new Error(
        "⏳ The Coach is busy. Please wait 1 minute before asking again."
      );
    }

    console.error("AI API Error:", error);
    throw new Error("Failed to reach the coach. Please try again.");
  }
};
