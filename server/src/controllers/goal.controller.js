// src/controllers/goal.controller.js
const Goal = require("../models/Goal");

// GET /api/goals
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id, isActive: true });

    return res.status(200).json({
      success: true,
      message: "Goals fetched successfully",
      data: goals,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/goals
const createGoal = async (req, res) => {
  try {
    const { subject, weeklyTarget, deadline } = req.body;

    const goal = await Goal.create({
      userId: req.user.id,
      subject,
      weeklyTarget,
      deadline,
    });

    return res.status(201).json({
      success: true,
      message: "Goal created successfully",
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/goals/:id
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found" });
    }

    const { subject, weeklyTarget, deadline } = req.body;

    if (subject) goal.subject = subject;
    if (weeklyTarget) goal.weeklyTarget = weeklyTarget;
    if (deadline) goal.deadline = deadline;

    await goal.save();

    return res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/goals/:id/complete
const markGoalCompleted = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found" });
    }

    if (goal.isCompleted) {
      return res.status(400).json({ success: false, message: "Goal already completed" });
    }

    goal.isCompleted = true;
    goal.completedAt = new Date();
    await goal.save();

    return res.status(200).json({
      success: true,
      message: "Goal marked as completed",
      data: goal,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/goals/:id
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found" });
    }

    goal.isActive = false;
    await goal.save();

    return res.status(200).json({
      success: true,
      message: "Goal deleted successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGoals, createGoal, updateGoal, markGoalCompleted, deleteGoal };