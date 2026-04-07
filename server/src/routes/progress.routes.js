// src/routes/progress.routes.js
const express = require("express");
const router = express.Router();
const { logProgress, getWeeklyProgress, getProgressByGoal } = require("../controllers/progress.controller");
const { logProgressSchema } = require("../schemas/progress.schema");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

router.post("/", protect, validate(logProgressSchema), logProgress);
router.get("/weekly", protect, getWeeklyProgress);
router.get("/:goalId", protect, getProgressByGoal);

module.exports = router;