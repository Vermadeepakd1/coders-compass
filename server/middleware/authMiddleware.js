const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  // support "Bearer <token>" and plain token
  const parts = authHeader.split(" ");
  const token =
    parts.length === 2 && parts[0].toLowerCase() === "bearer"
      ? parts[1]
      : parts[0];

  if (!token) {
    return res.status(401).json({ error: "No valid token found" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "JWT secret not configured" });
  }

  jwt.verify(token.trim(), process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid Token" });
    req.user = decoded;
    next();
  });
}

module.exports = { protect };
