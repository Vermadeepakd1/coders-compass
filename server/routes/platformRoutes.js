const express = require("express");
const router = express.Router();
const fetchCFStatus = require("../services/codeforceService");
const fetchLeetCodeStats = require("../services/leetcodeService");

// Get /api/platforms/codeforces/:handle
router.get("/codeforces/:handle", async (req, res) => {
  try {
    const { handle } = req.params;

    if (!handle || handle.trim() === "") {
      return res.status(400).json({ message: "Handle is required" });
    }

    const response = await fetchCFStatus(handle);

    if (response) res.json(response);
    else res.status(404).json({ message: "Handle not found" });
  } catch (error) {
    console.error("Error  CF routes :", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

// Get /api/platforms/leetcode/:handle
router.get("/leetcode/:handle", async (req, res) => {
  try {
    const { handle } = req.params;
    const data = await fetchLeetCodeStats(handle);

    if (!data) {
      return res.status(404).json({ message: "Leetcode user not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
