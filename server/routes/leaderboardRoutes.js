const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const DailyStat = require("../models/DailyStat");
const redis = require("../config/redis");

const LEADERBOARD_CACHE_TTL_SECONDS = 2 * 60;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getWindowConfig = (windowKey) => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  if (windowKey === "weekly") {
    start.setDate(start.getDate() - 7);
    return { start, end, days: 7 };
  }

  if (windowKey === "monthly") {
    start.setMonth(start.getMonth() - 1);
    return { start, end, days: 30 };
  }

  start.setMonth(start.getMonth() - 3);
  return { start, end, days: 90 };
};

const calculateGlobalScore = (latest, consistencyDays) => {
  const cfRating = toNumber(latest?.codeforces?.rating);
  const lcRating = toNumber(latest?.leetcode?.rating);
  const ccRating = toNumber(latest?.codechef?.rating);

  const totalSolved =
    toNumber(latest?.codeforces?.solved) +
    toNumber(latest?.leetcode?.totalSolved) +
    toNumber(latest?.codechef?.totalSolved);

  const normalizedRating =
    (cfRating / 4000) * 100 + (lcRating / 3000) * 100 + (ccRating / 4000) * 100;
  const solvedComponent = clamp(totalSolved / 25, 0, 120);
  const consistencyComponent = clamp((consistencyDays / 30) * 80, 0, 80);

  return {
    ccScore: Math.round(
      normalizedRating + solvedComponent + consistencyComponent,
    ),
    totalSolved,
    cfRating,
    lcRating,
    ccRating,
  };
};

const calculateWindowScore = (first, latest, activeDays, days) => {
  const cfRatingDelta =
    toNumber(latest?.codeforces?.rating) - toNumber(first?.codeforces?.rating);
  const lcRatingDelta =
    toNumber(latest?.leetcode?.rating) - toNumber(first?.leetcode?.rating);
  const ccRatingDelta =
    toNumber(latest?.codechef?.rating) - toNumber(first?.codechef?.rating);

  const solvedDelta =
    Math.max(
      0,
      toNumber(latest?.codeforces?.solved) -
        toNumber(first?.codeforces?.solved),
    ) +
    Math.max(
      0,
      toNumber(latest?.leetcode?.totalSolved) -
        toNumber(first?.leetcode?.totalSolved),
    ) +
    Math.max(
      0,
      toNumber(latest?.codechef?.totalSolved) -
        toNumber(first?.codechef?.totalSolved),
    );

  const consistencyComponent = clamp((activeDays / days) * 120, 0, 120);
  const ratingGrowthComponent = clamp(
    (Math.max(0, cfRatingDelta) +
      Math.max(0, lcRatingDelta) +
      Math.max(0, ccRatingDelta)) /
      8,
    0,
    120,
  );
  const solvedComponent = clamp(solvedDelta * 4, 0, 120);

  const totalSolved =
    toNumber(latest?.codeforces?.solved) +
    toNumber(latest?.leetcode?.totalSolved) +
    toNumber(latest?.codechef?.totalSolved);

  return {
    ccScore: Math.round(
      consistencyComponent + ratingGrowthComponent + solvedComponent,
    ),
    totalSolved,
    cfRating: toNumber(latest?.codeforces?.rating),
    lcRating: toNumber(latest?.leetcode?.rating),
    ccRating: toNumber(latest?.codechef?.rating),
  };
};

// GET /api/leaderboard?window=global|monthly|weekly&limit=50
router.get("/", protect, async (req, res) => {
  try {
    const windowKey = String(req.query.window || "global").toLowerCase();
    const limit = clamp(Number(req.query.limit || 50), 1, 100);
    const cacheKey = `leaderboard:${windowKey}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheError) {
      console.warn("Leaderboard cache read failed:", cacheError.message);
    }

    const { start, end, days } = getWindowConfig(windowKey);

    const users = await User.find({}, { username: 1 }).lean();
    const userIds = users.map((user) => user._id);

    const stats = await DailyStat.find({
      user: { $in: userIds },
      date: { $gte: start, $lte: end },
    })
      .sort({ user: 1, date: 1 })
      .lean();

    const statsByUser = new Map();
    for (const stat of stats) {
      const key = String(stat.user);
      if (!statsByUser.has(key)) {
        statsByUser.set(key, []);
      }
      statsByUser.get(key).push(stat);
    }

    const rows = users
      .map((user) => {
        const entries = statsByUser.get(String(user._id)) || [];
        if (entries.length === 0) {
          return null;
        }

        const first = entries[0];
        const latest = entries[entries.length - 1];

        const scoreData =
          windowKey === "global"
            ? calculateGlobalScore(latest, entries.length)
            : calculateWindowScore(first, latest, entries.length, days);

        return {
          userId: user._id,
          username: user.username,
          ...scoreData,
          activityDays: entries.length,
          updatedAt: latest.date,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ccScore - a.ccScore || b.totalSolved - a.totalSolved);

    const ranked = rows.slice(0, limit).map((row, index) => ({
      rank: index + 1,
      ...row,
    }));

    const payload = {
      window: windowKey,
      generatedAt: new Date().toISOString(),
      leaderboard: ranked,
    };

    try {
      await redis.set(
        cacheKey,
        JSON.stringify(payload),
        "EX",
        LEADERBOARD_CACHE_TTL_SECONDS,
      );
    } catch (cacheError) {
      console.warn("Leaderboard cache write failed:", cacheError.message);
    }

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Error building leaderboard:", error.message);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
