const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

// dotenv config to use environment variables
require("dotenv").config();

const port = process.env.PORT || 5000;

// cors setup to allow our frontend
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(console.log("MongoDB connected"))
  .catch((e) => console.log(e.message));

// test api
app.get("/api/test", (req, res) => {
  res.json({ message: "Hello from Coder's Compass" });
});

// to start listening at port
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
