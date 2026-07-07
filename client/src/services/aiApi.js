import apiClient from "./apiClient";

export const askAiHint = async (problemLink, history) => {
  try {
    const response = await apiClient.post("/api/ai/ask", {
      problemLink,
      history,
    });

    return response.data.answer;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error(
        "⏳ The Coach is busy. Please wait 1 minute before asking again."
      );
    }

    console.error("AI API Error:", error);
    throw new Error("Failed to reach the coach. Please try again.");
  }
};
