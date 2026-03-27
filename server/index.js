const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dns = require("dns");
const limiter = require("./middleware/rateLimiter");

// dotenv config to use environment variables
require("dotenv").config();

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
const mongoRetryMs = Number(process.env.MONGO_RETRY_MS || 5000);
const useCustomDns =
  String(process.env.ENABLE_CUSTOM_DNS || "false").toLowerCase() === "true";
const dnsServers = (process.env.DNS_SERVERS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
let serverStarted = false;
let mongoConnecting = false;
let mongoRetryTimer = null;
let mongoConnectedOnce = false;
const nodeDnsServers = dns.getServers();
const loopbackOnlyDns =
  nodeDnsServers.length > 0 &&
  nodeDnsServers.every((server) =>
    ["127.0.0.1", "::1", "localhost"].includes(String(server).toLowerCase()),
  );
const shouldApplyCustomDns =
  dnsServers.length > 0 && (useCustomDns || loopbackOnlyDns);

if (shouldApplyCustomDns) {
  try {
    dns.setServers(dnsServers);
    if (!useCustomDns && loopbackOnlyDns) {
      console.warn(
        `Node DNS was loopback-only (${nodeDnsServers.join(", ")}). Applying DNS_SERVERS fallback.`,
      );
    }
    console.log(`DNS servers configured: ${dnsServers.join(", ")}`);
  } catch (error) {
    console.warn(`Failed to set DNS servers: ${error.message}`);
  }
}

const authRoutes = require("./routes/auth");
const platformRoutes = require("./routes/platformRoutes");
const aiRoutes = require("./routes/aiRoutes");
const contestRoutes = require("./routes/contestRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

// cors setup to allow our frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "https://coders-compass.vercel.app"],
  }),
);

// Trust proxy is required when behind a load balancer (e.g. Vercel, Render, Heroku)
// so that req.ip is the user's IP, not the proxy's IP.
app.set("trust proxy", 1);

//rate limiter
app.use(limiter);

// parse json body
app.use(express.json());

const startServer = () => {
  if (serverStarted) return;
  app.listen(port, () => {
    serverStarted = true;
    console.log(`app listening on port ${port}`);
  });
};

const scheduleMongoRetry = () => {
  if (mongoRetryTimer) return;
  mongoRetryTimer = setTimeout(() => {
    mongoRetryTimer = null;
    connectMongoWithRetry();
  }, mongoRetryMs);
};

const connectMongoWithRetry = async () => {
  if (mongoConnecting) return;
  if (!mongoUri) {
    console.warn("MONGODB_URI not set - running without database connection");
    return;
  }

  mongoConnecting = true;
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
    mongoConnectedOnce = true;
  } catch (error) {
    const srvHint =
      error.message.includes("querySrv") || error.message.includes("ENOTFOUND")
        ? " Check DNS/network access for MongoDB SRV host."
        : "";
    console.warn(
      `MongoDB connection failed: ${error.message}.${srvHint} Retrying in ${mongoRetryMs}ms`,
    );
    scheduleMongoRetry();
  } finally {
    mongoConnecting = false;
  }
};

mongoose.connection.on("disconnected", () => {
  if (!mongoConnectedOnce) return;
  console.warn(`MongoDB disconnected. Retrying in ${mongoRetryMs}ms`);
  scheduleMongoRetry();
});

startServer();
connectMongoWithRetry();

// test api
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from Coder's Compass" });
});

app.use("/api/auth", authRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
