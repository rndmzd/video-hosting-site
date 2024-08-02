require('dotenv').config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;
const SECRET_KEY = process.env.JWT_SECRET_KEY || "your_secret_key";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/video_auth_db";
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

if (!SECRET_KEY || !MONGODB_URI || !MONGODB_USER || !MONGODB_PASSWORD) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("./"));

// Updated MongoDB connection with authentication
mongoose
  .connect(MONGODB_URI, {
    user: MONGODB_USER,
    pass: MONGODB_PASSWORD,
    authSource: "admin", // or the database where the user is defined
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { id: user._id, username: user.username },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      res.json({ token });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get("/videos", authenticateToken, (req, res) => {
  res.json({ videos: ["video1.mp4", "video2.mp4"] });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
