// src/routes/ai.routes.js
const express = require("express");
const router = express.Router();
const { generateWeeklyReport, getReports } = require("../controllers/ai.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/weekly-report", protect, generateWeeklyReport);
router.get("/reports", protect, getReports);

module.exports = router;