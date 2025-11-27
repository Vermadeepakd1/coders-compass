const express = require("express");
const router = express.Router();
const fetchCFStatus = require("../services/codeforceService");

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

module.exports = router;
