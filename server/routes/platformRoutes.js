const express = require("express");
const router = express.Router();
const {
  fetchCFStatus,
  getRecommendations,
  calculateCFStats,
  fetchCFHistory,
} = require("../services/codeforceService");
const {
  fetchLeetCodeCalendar,
  fetchLeetCodeStats,
  fetchLeetCodeFilter,
  fetchLeetCodeRating,
  fetchLeetCodeHistory,
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
    const [lcData, lcRating] = await Promise.all([
      fetchLeetCodeStats(handle),
      fetchLeetCodeRating(handle),
    ]);

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
            rating: lcRating?.rating || null,
            totalSolved: lcData.totalSolved,
            easy: lcData.easy,
            medium: lcData.medium,
            hard: lcData.hard,
          },
        },
      },
      { upsert: true, new: true }
    );
    res.json({
      ...lcData,
      rating: lcRating?.rating ? Math.round(lcRating.rating) : null,
    });
  } catch (error) {
    console.error("Error LC routes:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/platforms/history
router.get("/history", protect, async (req, res) => {
  try {
    // Get the latest 30 entries
    const data = await DailyStat.find({ user: req.user._id })
      .sort({ date: -1 }) // Newest first
      .limit(30);

    // Sort them back to chronological order for the graph
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({ data: sortedData });
  } catch (error) {
    console.error("Error fetching history:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /api/platforms/combined/:cfHandle/:lcHandle
router.get("/combined/:cfHandle/:lcHandle", protect, async (req, res) => {
  try {
    const { cfHandle, lcHandle } = req.params;

    // Parallel Fetching
    const [cfStats, cfStatus, lcRating, lcCalendar, lcSolves] =
      await Promise.all([
        calculateCFStats(cfHandle),
        fetchCFStatus(cfHandle),
        fetchLeetCodeRating(lcHandle),
        fetchLeetCodeCalendar(lcHandle),
        fetchLeetCodeStats(lcHandle),
      ]);

    // --- MERGE LOGIC ---
    const mergedHeatmap = {};

    // Add CF Data
    Object.entries(cfStats.heatmap).forEach(([date, count]) => {
      mergedHeatmap[date] = count;
    });

    // Add LC Data (Convert timestamp to Date string first)
    Object.entries(lcCalendar).forEach(([ts, count]) => {
      const date = new Date(parseInt(ts) * 1000).toISOString().split("T")[0];
      mergedHeatmap[date] = (mergedHeatmap[date] || 0) + count;
    });

    // Format for Frontend
    const heatmapArray = Object.keys(mergedHeatmap).map((date) => ({
      date,
      count: mergedHeatmap[date],
    }));

    // Save to DailyStat
    await DailyStat.findOneAndUpdate(
      {
        user: req.user._id,
        date: getTodayDate(),
      },
      {
        $set: {
          codeforces: {
            rating: cfStatus ? cfStatus.rating : null,
            rank: cfStatus ? cfStatus.rank : null,
          },
          leetcode: {
            rating: lcRating?.rating || null,
            totalSolved: lcSolves.totalSolved,
            easy: lcSolves.easy,
            medium: lcSolves.medium,
            hard: lcSolves.hard,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      totalSolved: cfStats.totalSolved + lcSolves.totalSolved,
      codeforces: {
        solved: cfStats.totalSolved,
        rating: cfStatus ? cfStatus.rating : "N/A",
        rank: cfStatus ? cfStatus.rank : "N/A",
        titlePhoto: cfStatus ? cfStatus.titlePhoto : "",
      },
      leetcode: {
        solved: lcSolves.totalSolved,
        rating: lcRating.rating ? Math.round(lcRating.rating) : "N/A",
        easy: lcSolves.easy,
        medium: lcSolves.medium,
        hard: lcSolves.hard,
      },
      heatmap: heatmapArray,
    });
  } catch (err) {
    console.error("Error in combined route:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/platforms/rating-history/:cfHandle/:lcHandle
router.get("/rating-history/:cfHandle/:lcHandle", protect, async (req, res) => {
  try {
    const { cfHandle, lcHandle } = req.params;

    const [cfHistory, lcHistory] = await Promise.all([
      cfHandle !== "null" && cfHandle !== "undefined"
        ? fetchCFHistory(cfHandle)
        : Promise.resolve([]),
      lcHandle !== "null" && lcHandle !== "undefined"
        ? fetchLeetCodeHistory(lcHandle)
        : Promise.resolve([]),
    ]);

    res.json({
      codeforces: cfHistory,
      leetcode: lcHistory,
    });
  } catch (error) {
    console.error("Error fetching rating history:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
