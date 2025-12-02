const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getAiHint } = require("../services/aiService");

// POST /api/ai/ask
router.post("/ask", protect, async (req, res) => {
  const { problemLink, history } = req.body;

  // Validate input
  if (!problemLink || !history || !Array.isArray(history)) {
    return res
      .status(400)
      .json({ message: "problemLink and history array are required" });
  }

  // Rate limit check
  const now = Date.now();
  if (req.user.lastAiRequest && now - req.user.lastAiRequest < 60 * 1000) {
    return res
      .status(429)
      .json({ message: "Please wait 1 minute before asking again." });
  }

  try {
    // Call the service with new parameters
    const hint = await getAiHint(problemLink, history);

    // Update timestamp
    req.user.lastAiRequest = now;
    await req.user.save();

    res.json({ answer: hint });
  } catch (err) {
    console.error("AI Route Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
