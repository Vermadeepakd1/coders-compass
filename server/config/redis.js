const Redis = require("ioredis");
require("dotenv").config();

// Connect to the URL in your .env file
// Added fail-fast options to prevent hanging if Redis is down
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false, // Fail immediately if not connected
  commandTimeout: 2000, // Timeout commands after 2 seconds
  retryStrategy: (times) => {
    // Retry connection up to 3 times, then stop trying for a while
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  },
});

redis.on("connect", () => {
  console.log("Redis Connected 🐘");
});

redis.on("error", (err) => {
  // Suppress connection refused errors to keep console clean
  if (err.code === "ECONNREFUSED") {
    console.warn("Redis connection failed - Caching disabled");
  } else {
    console.error("Redis Error:", err.message);
  }
});

module.exports = redis;
