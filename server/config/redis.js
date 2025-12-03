const Redis = require("ioredis");
require("dotenv").config();

// Connect to the URL in your .env file
const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("Redis Connected 🐘");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

module.exports = redis;
