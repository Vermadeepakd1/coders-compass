const express = require("express");
const router = express.Router();
const {
  fetchCFStatus,
  getRecommendations,
} = require("../services/codeforceService");
const {
  fetchLeetCodeStats,
  fetchLeetCodeFilter,
} = require("../services/leetcodeService");
const protect = require("../middleware/authMiddleware");
const DailyStat = require("../models/DailyStat");

// get today's date at midnight
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// GET /api/platforms/codeforces/recommend/:handle
// ⚠️ IMPORTANT: This MUST be before /codeforces/:handle to avoid route conflicts
router.get("/codeforces/recommend/:handle", protect, async (req, res) => {
  try {
    const { handle } = req.params;
    if (!handle || handle.trim() === "") {
      return res.status(400).json({ message: "Handle is required" });
    }
    const rec = await getRecommendations(handle);
    return res.status(200).json({ recommendations: rec });
  } catch (error) {
    console.error("Error getting recommendations:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Get /api/platforms/codeforces/:handle
router.get("/codeforces/:handle", protect, async (req, res) => {
  try {
    const { handle } = req.params;

    if (!handle || handle.trim() === "") {
      return res.status(400).json({ message: "Handle is required" });
    }

    // fetch data from cf
    const cfData = await fetchCFStatus(handle);
    if (!cfData) {
      return res.status(404).json({ message: "Handle not found" });
    }

    // save or update today's stats
    await DailyStat.findOneAndUpdate(
      {
        user: req.user._id,
        date: getTodayDate(),
      },
      {
        $set: {
          codeforces: {
            rating: cfData.rating,
            rank: cfData.rank,
          },
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    // respond with fetched data
    res.json(cfData);
  } catch (error) {
    console.error("Error  CF routes :", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// GET /api/platforms/leetcode/explore?tag=dp&difficulty=medium
router.get("/leetcode/explore", protect, async (req, res) => {
  try {
    const { tag, difficulty } = req.query;
    const problems = await fetchLeetCodeFilter(tag, difficulty);
    res.json(problems);
  } catch (error) {
    console.error("Error fetching LC explore:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get /api/platforms/leetcode/:handle
router.get("/leetcode/:handle", protect, async (req, res) => {
  try {
    const { handle } = req.params;
    if (!handle || handle.trim() === "") {
      return res.status(400).json({ message: "Handle is required" });
    }

    //fetch data
    const lcData = await fetchLeetCodeStats(handle);

    if (!lcData) {
      return res.status(404).json({ message: "Leetcode user not found" });
    }

    // save or update today's stats
    await DailyStat.findOneAndUpdate(
      {
        user: req.user._id,
        date: getTodayDate(),
      },
      {
        $set: {
          leetcode: {
            totalSolved: lcData.totalSolved,
            easy: lcData.easy,
            medium: lcData.medium,
            hard: lcData.hard,
          },
        },
      },
      { upsert: true, new: true }
    );
    res.json(lcData);
  } catch (error) {
    console.error("Error LC routes:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/platforms/history
router.get("/history", protect, async (req, res) => {
  try {
    const data = await DailyStat.find({ user: req.user._id })
      .sort({ date: 1 })
      .limit(30);
    res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error fetching history:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
