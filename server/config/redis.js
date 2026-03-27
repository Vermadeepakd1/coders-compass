const { createClient } = require("redis");
require("dotenv").config();

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = Number(process.env.REDIS_PORT || 0);
const redisUsername = process.env.REDIS_USERNAME;
const redisPassword = process.env.REDIS_PASSWORD;
const forceMemoryCache =
  String(process.env.CACHE_DRIVER || "").toLowerCase() === "memory";

const hasCloudConfig = Boolean(redisHost && redisPort);
const hasRemoteConfig = Boolean(redisUrl) || hasCloudConfig;

const memoryStore = new Map();
let remoteHealthy = hasRemoteConfig && !forceMemoryCache;
let fallbackLogged = false;
let restoredLogged = false;

const logFallbackOnce = () => {
  if (fallbackLogged) return;
  fallbackLogged = true;
  console.warn("Redis unavailable - using in-memory cache fallback");
};

const logRestoredOnce = () => {
  if (restoredLogged) return;
  restoredLogged = true;
  console.log("Redis cache restored");
};

const purgeExpired = (entry, key) => {
  if (!entry) return true;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return true;
  }
  return false;
};

const getLocal = async (key) => {
  const entry = memoryStore.get(key);
  if (purgeExpired(entry, key)) return null;
  return entry.value;
};

const parseTTLSeconds = (args) => {
  // Supports both set(key, value, "EX", ttl) and set(key, value, { EX: ttl }).
  if (!args || args.length === 0) return null;

  if (
    typeof args[0] === "string" &&
    args[0].toUpperCase() === "EX" &&
    Number.isFinite(Number(args[1]))
  ) {
    return Number(args[1]);
  }

  if (
    typeof args[0] === "object" &&
    args[0] !== null &&
    Number.isFinite(Number(args[0].EX))
  ) {
    return Number(args[0].EX);
  }

  return null;
};

const setLocal = async (key, value, ...args) => {
  const ttlSeconds = parseTTLSeconds(args);
  memoryStore.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
  return "OK";
};

const normalizeSetArgsForRedis = (args) => {
  if (!args || args.length === 0) return [];

  if (
    typeof args[0] === "string" &&
    args[0].toUpperCase() === "EX" &&
    Number.isFinite(Number(args[1]))
  ) {
    return [{ EX: Number(args[1]) }];
  }

  if (typeof args[0] === "object" && args[0] !== null) {
    return [args[0]];
  }

  return [];
};

let redis = null;
let connectPromise = null;

if (remoteHealthy) {
  const options = hasCloudConfig
    ? {
        username: redisUsername || "default",
        password: redisPassword,
        socket: {
          host: redisHost,
          port: redisPort,
          reconnectStrategy: (retries) => {
            if (retries > 2) return false;
            return Math.min(retries * 100, 1000);
          },
          connectTimeout: 1500,
        },
      }
    : { url: redisUrl };

  redis = createClient(options);

  redis.on("connect", () => {
    fallbackLogged = false;
    restoredLogged = false;
  });

  redis.on("ready", () => {
    remoteHealthy = true;
    logRestoredOnce();
  });

  redis.on("error", () => {
    remoteHealthy = false;
    restoredLogged = false;
    logFallbackOnce();
  });

  redis.on("end", () => {
    remoteHealthy = false;
    restoredLogged = false;
    logFallbackOnce();
  });
} else {
  logFallbackOnce();
}

const isRemoteReady = () => {
  if (!remoteHealthy || !redis) return false;
  return redis.isReady === true;
};

const ensureRemoteConnect = () => {
  if (!remoteHealthy || !redis) return null;
  if (redis.isReady === true) return null;
  if (connectPromise) return connectPromise;

  connectPromise = redis.connect().catch(() => {
    remoteHealthy = false;
    restoredLogged = false;
    connectPromise = null;
    logFallbackOnce();
  });

  return connectPromise;
};

const waitForRemoteReady = async () => {
  if (!remoteHealthy || !redis) return false;
  if (redis.isReady === true) return true;

  ensureRemoteConnect();
  if (!connectPromise) return false;

  try {
    await Promise.race([
      connectPromise,
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  } catch {
    return false;
  }

  return redis.isReady === true;
};

const cache = {
  async get(key) {
    const ready = isRemoteReady() || (await waitForRemoteReady());
    if (!ready) {
      return getLocal(key);
    }

    try {
      return await redis.get(key);
    } catch {
      remoteHealthy = false;
      restoredLogged = false;
      logFallbackOnce();
      return getLocal(key);
    }
  },

  async set(key, value, ...args) {
    const ready = isRemoteReady() || (await waitForRemoteReady());
    if (!ready) {
      return setLocal(key, value, ...args);
    }

    try {
      const normalizedArgs = normalizeSetArgsForRedis(args);
      if (normalizedArgs.length > 0) {
        return await redis.set(key, value, normalizedArgs[0]);
      }
      return await redis.set(key, value);
    } catch {
      remoteHealthy = false;
      restoredLogged = false;
      logFallbackOnce();
      return setLocal(key, value, ...args);
    }
  },
};

module.exports = cache;
