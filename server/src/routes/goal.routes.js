// src/routes/goal.routes.js
const express = require("express");
const router = express.Router();
const { getGoals, createGoal, updateGoal, markGoalCompleted, deleteGoal } = require("../controllers/goal.controller");
const { createGoalSchema, updateGoalSchema } = require("../schemas/goal.schema");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");

router.get("/", protect, getGoals);
router.post("/", protect, validate(createGoalSchema), createGoal);
router.put("/:id", protect, validate(updateGoalSchema), updateGoal);
router.patch("/:id/complete", protect, markGoalCompleted);
router.delete("/:id", protect, deleteGoal);

module.exports = router;