const express = require("express");
const router = express.Router();
const User = require("../models/User");

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

module.exports = router;
