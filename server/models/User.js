const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    handles: {
      codeforces: { type: String, default: "" },
      codechef: { type: String, default: "" },
      leetcode: { type: String, default: "" },
    },
    lastAiRequest: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// hash password before saving - async functions don't use next()
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// helper to compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
