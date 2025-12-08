const { GoogleGenerativeAI } = require("@google/generative-ai");
const redis = require("../config/redis"); // Import our new Redis connection
const crypto = require("crypto"); // Built-in Node module for hashing

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const getAiHint = async (problemLink, chatHistory) => {
  // --- 1. GENERATE CACHE KEY ---
  // We turn the complex history array into a short, unique string (Hash)
  const historyString = JSON.stringify(chatHistory);
  const hash = crypto.createHash("sha256").update(historyString).digest("hex");

  // Key format: "hint:<problem>:<hash>"
  const cacheKey = `hint:${problemLink}:${hash}`;

  // --- 2. CHECK REDIS (Read Aside) ---
  let cachedResult = null;
  try {
    cachedResult = await redis.get(cacheKey);
  } catch (err) {
    console.error("Redis Read Error (Skipping Cache):", err.message);
  }

  if (cachedResult) {
    console.log("Redis Cache HIT ⚡"); // Watch your terminal for this!
    return cachedResult;
  }

  console.log("Redis Cache MISS 🔴 (Calling Gemini)");

  // --- 3. CALL GEMINI (If Cache Miss) ---
  const conversationLog = chatHistory
    .map((msg) => `${msg.role === "user" ? "Student" : "Coach"}: ${msg.text}`)
    .join("\n");

  const prompt = `
    ROLE: You are an elite competitive programming coach. Your goal is to guide the student to the solution using the Socratic method.
    
    STRICT CONSTRAINTS:
    - MAX LENGTH: 2-3 lines per response.
    - NO PARAGRAPHS. Be direct and concise.
    - NO CODE SOLUTIONS.
    
    BEHAVIOR:
    - If the student asks for a hint, provide a single, specific insight or a question that leads them to it.
    - Do not explain the entire algorithm at once. Break it down.
    - If the student is completely lost, give a slightly bigger hint, but still keep it brief.
    
    CONTEXT: The student is working on: ${problemLink}
    
    HISTORY:
    ${conversationLog}
    
    COACH RESPONSE:
  `;

  try {
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // --- 4. SAVE TO REDIS (Write Aside) ---
    // Save the answer for 24 hours (86400 seconds)
    try {
      await redis.set(cacheKey, aiResponse, "EX", 86400);
    } catch (err) {
      console.error("Redis Write Error:", err.message);
    }

    return aiResponse;
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I'm having trouble thinking right now.";
  }
};

module.exports = { getAiHint };
