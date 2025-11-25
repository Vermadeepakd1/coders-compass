const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { protect } = require("../middleware/authMiddleware");

// POST /register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, handles } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email and password are required " });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = new User({ username, email, password, handles });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        handles: user.handles,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ error: "Duplicate field value" });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid Credentials" });
    }

    const matchedPassword = await bcrypt.compare(password, user.password);

    if (!matchedPassword) {
      return res.status(400).json({ error: "Password Incorrect" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret not configured" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(200).json({
      message: "login Successful!",
      user: {
        username: user.username,
        handles: user.handles,
      },
      token: token,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// GET /test
// to test protect middleware
router.get("/test", protect, (req, res) => {
  res.json({ message: "You are authorized!!", user: req.user });
});

module.exports = router;
