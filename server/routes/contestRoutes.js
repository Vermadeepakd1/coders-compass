const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getUpcomingContests } = require("../services/contestService");

// GET /api/contests/upcoming?platforms=codeforces,leetcode,codechef
router.get("/upcoming", protect, async (req, res) => {
  try {
    const platformsParam = req.query.platforms || "";
    const platforms = String(platformsParam)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const result = await getUpcomingContests({ platforms });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching upcoming contests:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
