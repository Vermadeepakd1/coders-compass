const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Generates a hint based on problem context and chat history.
 * @param {string} problemContext - The problem link or description.
 * @param {Array} chatHistory - Array of messages: [{ role: 'user', text: '...' }, { role: 'ai', text: '...' }]
 * @returns {Promise<string>} - The AI generated hint.
 */
const getAiHint = async (problemContext, chatHistory) => {
  // 1. Format the history into a string the AI can read
  const conversationLog = chatHistory
    .map((msg) => `${msg.role === "user" ? "Student" : "Coach"}: ${msg.text}`)
    .join("\n");

  // 2. Construct the System Prompt
  const prompt = `
    ROLE: You are a world-class competitive programming coach.
    TASK: Help a student who is stuck on a problem.
    
    CONTEXT:
    The student is working on: ${problemContext}
    
    RULES:
    1. NO CODE SOLUTIONS. Do not write code blocks.
    2. Guide them with logic, algorithms, or edge cases.
    3. Keep responses conversational and encouraging.
    4. If they ask a new question, refer to previous context if needed.
    5. Use LaTeX for math expressions (e.g., $x$, $\frac{a}{b}$).
    6. Use standard Markdown for bolding and lists.
    
    CONVERSATION HISTORY:
    ${conversationLog}
    
    YOUR RESPONSE (As Coach):
  `;

  try {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    return result.response.text();
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I'm having trouble thinking right now. Please try again.";
  }
};

module.exports = { getAiHint };
