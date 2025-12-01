const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const DailyStat = require("./models/DailyStat");

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");

    // 1.  Use User.findOne and await
    const user = await User.findOne({ username: "vermadeepakd1" });

    if (!user) {
      console.log("User not found!");
      process.exit(1);
    }

    console.log(`Seeding data for: ${user.username}`);

    // Clear old stats for this user to avoid duplicates
    await DailyStat.deleteMany({ user: user._id });

    const stats = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0); // Normalize time

      const randomFluctuation = Math.floor(Math.random() * 21) - 10; // -10 to 10
      const cr = 1200 + (30 - i) * 5 + randomFluctuation; // Increasing trend

      stats.push({
        user: user._id,
        date: d,
        codeforces: {
          rating: cr,
          rank: "Newbie",
        },
        leetcode: {
          totalSolved: 100 + (30 - i) * 2,
          easy: 50,
          medium: 30,
          hard: 20,
        },
      });
    }

    // Insert all at once
    await DailyStat.insertMany(stats);

    console.log("Seeding done !!");
    process.exit();
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seedData();
