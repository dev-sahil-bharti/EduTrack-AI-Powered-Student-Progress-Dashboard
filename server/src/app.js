// src/app.js
const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const goalRoutes = require("./routes/goal.routes");
const progressRoutes = require("./routes/progress.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/ai", aiRoutes);

// Global error handler
app.use(errorHandler);

module.exports = app;