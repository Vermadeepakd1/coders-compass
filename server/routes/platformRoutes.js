const express = require("express");
const router = express.Router();
const {
  fetchCFStatus,
  getRecommendations,
  getCachedProblemSet,
  calculateCFStats,
  fetchCFHistory,
} = require("../services/codeforceService");
const {
  fetchLeetCodeCalendar,
  fetchLeetCodeStats,
  fetchLeetCodeFilter,
  fetchLeetCodeRating,
  fetchLeetCodeHistory,
  fetchLeetCodeWeakTopic,
  fetchLeetCodeRecentSubmissions,
  getLeetCodeRecommendations,
} = require("../services/leetcodeService");
const {
  fetchCodeChefStats,
  fetchCodeChefHistory,
} = require("../services/codechefService");
const protect = require("../middleware/authMiddleware");
const DailyStat = require("../models/DailyStat");
const redis = require("../config/redis");

const USER_HISTORY_CACHE_TTL_SECONDS = 5 * 60;
const RATING_HISTORY_CACHE_TTL_SECONDS = 15 * 60;

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
    const forceRefresh = req.query.refresh === "true";
    
    // 1. Fetch Codeforces recommendations (2 problems)
    let cfRecsSliced = [];
    if (handle && handle.trim() !== "" && handle !== "none" && handle !== "null") {
      try {
        const cfRecs = await getRecommendations(handle, forceRefresh);
        if (cfRecs && cfRecs.length > 0) {
          cfRecsSliced = cfRecs.slice(0, 2).map((p) => {
            const plain = p.toObject ? p.toObject() : p;
            return { ...plain, platform: "codeforces" };
          });
        }
      } catch (err) {
        console.error("Error fetching CF recommendations:", err.message);
      }
    }

    // Fallback if CF recommendations failed or weren't fetched
    if (cfRecsSliced.length < 2) {
      try {
        const allProblems = await getCachedProblemSet();
        if (allProblems && allProblems.length > 0) {
          const filtered = allProblems.filter(p => p.rating && p.rating >= 800 && p.rating <= 1500);
          const sourceList = filtered.length > 0 ? filtered : allProblems;
          
          // Shuffle sourceList
          const shuffled = [...sourceList];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          
          while (cfRecsSliced.length < 2 && shuffled.length > 0) {
            const prob = shuffled.pop();
            const plain = prob.toObject ? prob.toObject() : prob;
            // Check if already in cfRecsSliced
            if (!cfRecsSliced.some(r => r.contestId === plain.contestId && r.index === plain.index)) {
              cfRecsSliced.push({
                ...plain,
                platform: "codeforces"
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching CF fallback recommendations:", err.message);
      }
    }

    // Fallback if still empty (hardcoded CF problems)
    if (cfRecsSliced.length < 2) {
      const cfFallbacks = [
        { contestId: 4, index: "A", name: "Watermelon", rating: 800, tags: ["brute force"], platform: "codeforces" },
        { contestId: 71, index: "A", name: "Way Too Long Words", rating: 800, tags: ["strings"], platform: "codeforces" }
      ];
      while (cfRecsSliced.length < 2) {
        cfRecsSliced.push(cfFallbacks[cfRecsSliced.length]);
      }
    }

    // 2. Fetch LeetCode recommendations (2 problems)
    const lcHandle = req.user?.handles?.leetcode;
    let lcRecs = [];
    try {
      lcRecs = await getLeetCodeRecommendations(lcHandle, forceRefresh);
    } catch (err) {
      console.error("Error fetching LeetCode recommendations:", err.message);
    }

    // Combine them (2 Codeforces + 2 LeetCode)
    const recommendations = [...cfRecsSliced.slice(0, 2), ...lcRecs.slice(0, 2)];

    return res.status(200).json({ recommendations });
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
    const [cfData, cfStats] = await Promise.all([
      fetchCFStatus(handle),
      calculateCFStats(handle).catch(() => ({ totalSolved: 0 })),
    ]);
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
            solved: cfStats.totalSolved,
            rank: cfData.rank,
          },
        },
      },
      {
        upsert: true,
        new: true,
      },
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
    const { tag, difficulty, q } = req.query;
    const problems = await fetchLeetCodeFilter(tag, difficulty, q);
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
      { upsert: true, new: true },
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

// Get /api/platforms/codechef/:handle
router.get("/codechef/:handle", protect, async (req, res) => {
  try {
    const { handle } = req.params;

    if (!handle || handle.trim() === "") {
      return res.status(400).json({ message: "Handle is required" });
    }

    const codechefData = await fetchCodeChefStats(handle);
    if (!codechefData) {
      return res.status(404).json({ message: "CodeChef user not found" });
    }

    await DailyStat.findOneAndUpdate(
      {
        user: req.user._id,
        date: getTodayDate(),
      },
      {
        $set: {
          codechef: {
            rating: codechefData.rating,
            stars: codechefData.stars,
            totalSolved: codechefData.totalSolved,
          },
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    return res.json(codechefData);
  } catch (error) {
    console.error("Error CodeChef routes:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// GET /api/platforms/history
router.get("/history", protect, async (req, res) => {
  try {
    const cacheKey = `platform:history:${req.user._id}:30`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheError) {
      console.warn("History cache read failed:", cacheError.message);
    }

    // Get the latest 30 entries
    const data = await DailyStat.find({ user: req.user._id })
      .sort({ date: -1 }) // Newest first
      .limit(30);

    // Sort them back to chronological order for the graph
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));

    const payload = { data: sortedData };

    try {
      await redis.set(
        cacheKey,
        JSON.stringify(payload),
        "EX",
        USER_HISTORY_CACHE_TTL_SECONDS,
      );
    } catch (cacheError) {
      console.warn("History cache write failed:", cacheError.message);
    }

    res.status(200).json(payload);
  } catch (error) {
    console.error("Error fetching history:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

const handleCombinedStats = async (req, res) => {
  try {
    const { cfHandle, lcHandle, ccHandle } = req.params;

    const isCfValid =
      cfHandle && cfHandle !== "null" && cfHandle !== "undefined";
    const isLcValid =
      lcHandle && lcHandle !== "null" && lcHandle !== "undefined";
    const isCcValid =
      ccHandle && ccHandle !== "null" && ccHandle !== "undefined";

    // Parallel Fetching
    const [cfStats, cfStatus, lcRating, lcCalendar, lcSolves, ccStats, lcWeakTopic, lcRecent] =
      await Promise.all([
        isCfValid
          ? calculateCFStats(cfHandle).catch(() => ({
              totalSolved: 0,
              heatmap: {},
            }))
          : Promise.resolve({ totalSolved: 0, heatmap: {} }),
        isCfValid
          ? fetchCFStatus(cfHandle).catch(() => null)
          : Promise.resolve(null),
        isLcValid
          ? fetchLeetCodeRating(lcHandle).catch(() => ({ rating: 0 }))
          : Promise.resolve({ rating: 0 }),
        isLcValid
          ? fetchLeetCodeCalendar(lcHandle).catch(() => ({}))
          : Promise.resolve({}),
        isLcValid
          ? fetchLeetCodeStats(lcHandle)
              .then((res) =>
                res
                  ? res
                  : {
                      totalSolved: 0,
                      easy: 0,
                      medium: 0,
                      hard: 0,
                    },
              )
              .catch(() => ({
                totalSolved: 0,
                easy: 0,
                medium: 0,
                hard: 0,
              }))
          : Promise.resolve({
              totalSolved: 0,
              easy: 0,
              medium: 0,
              hard: 0,
            }),
        isCcValid
          ? fetchCodeChefStats(ccHandle)
              .then((res) =>
                res
                  ? res
                  : {
                      rating: null,
                      stars: null,
                      totalSolved: 0,
                    },
              )
              .catch(() => ({
                rating: null,
                stars: null,
                totalSolved: 0,
              }))
          : Promise.resolve({
              rating: null,
              stars: null,
              totalSolved: 0,
            }),
        isLcValid
          ? fetchLeetCodeWeakTopic(lcHandle).catch(() => null)
          : Promise.resolve(null),
        isLcValid
          ? fetchLeetCodeRecentSubmissions(lcHandle).catch(() => [])
          : Promise.resolve([]),
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

    // Override today's LC count with actual unique solved count from recent submissions
    if (isLcValid && lcRecent && lcRecent.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayAcProblems = new Set();
      lcRecent.forEach((sub) => {
        if (sub.statusDisplay === "Accepted") {
          const subDate = new Date(sub.timestamp * 1000).toISOString().split("T")[0];
          if (subDate === todayStr) {
            todayAcProblems.add(sub.titleSlug || sub.title);
          }
        }
      });

      // Find raw today's count added by lcCalendar
      let rawTodayCount = 0;
      Object.entries(lcCalendar).forEach(([ts, count]) => {
        const date = new Date(parseInt(ts) * 1000).toISOString().split("T")[0];
        if (date === todayStr) {
          rawTodayCount += count;
        }
      });

      // Adjust heatmap
      mergedHeatmap[todayStr] = (mergedHeatmap[todayStr] || 0) - rawTodayCount + todayAcProblems.size;
      if (mergedHeatmap[todayStr] < 0) mergedHeatmap[todayStr] = 0;
    }

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
            solved: cfStats.totalSolved,
            rank: cfStatus ? cfStatus.rank : null,
          },
          leetcode: {
            rating: lcRating?.rating || null,
            totalSolved: lcSolves.totalSolved,
            easy: lcSolves.easy,
            medium: lcSolves.medium,
            hard: lcSolves.hard,
          },
          codechef: {
            rating: ccStats.rating,
            stars: ccStats.stars,
            totalSolved: ccStats.totalSolved,
          },
        },
      },
      { upsert: true, new: true },
    );

    res.json({
      totalSolved:
        (cfStats.totalSolved || 0) +
        (lcSolves.totalSolved || 0) +
        (ccStats.totalSolved || 0),
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
        weakestSkill: lcWeakTopic,
      },
      codechef: {
        solved: ccStats.totalSolved || 0,
        rating: ccStats.rating || "N/A",
        stars: ccStats.stars || "Unrated",
      },
      heatmap: heatmapArray,
    });
  } catch (err) {
    console.error("Error in combined route:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/platforms/combined/:cfHandle/:lcHandle
router.get("/combined/:cfHandle/:lcHandle", protect, (req, res) => {
  req.params.ccHandle = "null";
  return handleCombinedStats(req, res);
});

// GET /api/platforms/combined/:cfHandle/:lcHandle/:ccHandle
router.get(
  "/combined/:cfHandle/:lcHandle/:ccHandle",
  protect,
  handleCombinedStats,
);

const handleRatingHistory = async (req, res) => {
  try {
    const { cfHandle, lcHandle, ccHandle } = req.params;
    const safeCf = cfHandle || "null";
    const safeLc = lcHandle || "null";
    const safeCc = ccHandle || "null";
    const cacheKey = `platform:rating-history:${req.user._id}:${safeCf}:${safeLc}:${safeCc}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheError) {
      console.warn("Rating history cache read failed:", cacheError.message);
    }

    const [cfHistory, lcHistory, ccHistory] = await Promise.all([
      cfHandle !== "null" && cfHandle !== "undefined"
        ? fetchCFHistory(cfHandle).catch((e) => {
            console.error("CF History fetch failed:", e.message);
            return [];
          })
        : Promise.resolve([]),
      lcHandle !== "null" && lcHandle !== "undefined"
        ? fetchLeetCodeHistory(lcHandle).catch((e) => {
            console.error("LC History fetch failed:", e.message);
            return [];
          })
        : Promise.resolve([]),
      ccHandle !== "null" && ccHandle !== "undefined"
        ? fetchCodeChefHistory(ccHandle).catch((e) => {
            console.error("CodeChef History fetch failed:", e.message);
            return [];
          })
        : Promise.resolve([]),
    ]);

    let normalizedCcHistory = ccHistory;

    if (
      ccHandle !== "null" &&
      ccHandle !== "undefined" &&
      (!Array.isArray(ccHistory) || ccHistory.length === 0)
    ) {
      const fallbackStats = await DailyStat.find({
        user: req.user._id,
        "codechef.rating": { $ne: null },
      })
        .sort({ date: 1 })
        .limit(90)
        .lean();

      normalizedCcHistory = fallbackStats.map((item) => ({
        date: item.date,
        rating: item.codechef?.rating,
        contestName: "Snapshot",
      }));
    }

    const payload = {
      codeforces: cfHistory,
      leetcode: lcHistory,
      codechef: normalizedCcHistory,
    };

    try {
      await redis.set(
        cacheKey,
        JSON.stringify(payload),
        "EX",
        RATING_HISTORY_CACHE_TTL_SECONDS,
      );
    } catch (cacheError) {
      console.warn("Rating history cache write failed:", cacheError.message);
    }

    res.json(payload);
  } catch (error) {
    console.error("Error fetching rating history:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /api/platforms/rating-history/:cfHandle/:lcHandle
router.get("/rating-history/:cfHandle/:lcHandle", protect, (req, res) => {
  req.params.ccHandle = "null";
  return handleRatingHistory(req, res);
});

// GET /api/platforms/rating-history/:cfHandle/:lcHandle/:ccHandle
router.get(
  "/rating-history/:cfHandle/:lcHandle/:ccHandle",
  protect,
  handleRatingHistory,
);

module.exports = router;
