const mongoose = require("mongoose");

const dailyStatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    codeforces: {
      rating: {
        type: Number,
        default: null,
      },
      rank: {
        type: String,
        default: null,
      },
    },
    leetcode: {
      rating: {
        type: Number,
        default: null,
      },
      totalSolved: {
        type: Number,
        default: null,
      },
      easy: {
        type: Number,
        default: null,
      },
      medium: {
        type: Number,
        default: null,
      },
      hard: {
        type: Number,
        default: null,
      },
    },
    codechef: {
      rating: {
        type: Number,
        default: null,
      },
      stars: {
        type: String,
        default: null,
      },
    },
  },
  { timestamps: true }
);
dailyStatSchema.index({ user: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("DailyStat", dailyStatSchema);
