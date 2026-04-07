// src/controllers/progress.controller.js
const Progress = require("../models/Progress");
const Goal = require("../models/Goal");

// POST /api/progress
const logProgress = async (req, res) => {
  try {
    const { goalId, completedMinutes, notes } = req.body;

    const goal = await Goal.findOne({ _id: goalId, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found" });
    }

    const progress = await Progress.create({
      userId: req.user.id,
      goalId,
      completedMinutes,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Progress logged successfully",
      data: progress,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/progress/weekly
const getWeeklyProgress = async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const progress = await Progress.find({
      userId: req.user.id,
      date: { $gte: startOfWeek, $lte: endOfWeek },
    }).populate("goalId", "subject weeklyTarget");

    // Group by goal
    const grouped = {};
    progress.forEach((entry) => {
      const key = entry.goalId._id.toString();
      if (!grouped[key]) {
        grouped[key] = {
          subject: entry.goalId.subject,
          weeklyTarget: entry.goalId.weeklyTarget,
          totalMinutes: 0,
          entries: [],
        };
      }
      grouped[key].totalMinutes += entry.completedMinutes;
      grouped[key].entries.push(entry);
    });

    return res.status(200).json({
      success: true,
      message: "Weekly progress fetched successfully",
      data: {
        weekRange: { start: startOfWeek, end: endOfWeek },
        goals: Object.values(grouped),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/progress/:goalId
const getProgressByGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.goalId, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: "Goal not found" });
    }

    const progress = await Progress.find({
      userId: req.user.id,
      goalId: req.params.goalId,
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      message: "Progress fetched successfully",
      data: progress,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { logProgress, getWeeklyProgress, getProgressByGoal };