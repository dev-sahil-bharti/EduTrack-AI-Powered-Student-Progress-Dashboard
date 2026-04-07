// src/controllers/ai.controller.js
const { generateText } = require("ai");
const { google } = require("@ai-sdk/google");
const Report = require("../models/Report");
const Progress = require("../models/Progress");

// POST /api/ai/weekly-report
const generateWeeklyReport = async (req, res) => {
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

    if (progress.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No progress data found for this week",
      });
    }

    // Format progress data for prompt
    const grouped = {};
    progress.forEach((entry) => {
      const key = entry.goalId.subject;
      if (!grouped[key]) {
        grouped[key] = {
          subject: entry.goalId.subject,
          weeklyTarget: entry.goalId.weeklyTarget,
          totalMinutes: 0,
          notes: [],
        };
      }
      grouped[key].totalMinutes += entry.completedMinutes;
      if (entry.notes) grouped[key].notes.push(entry.notes);
    });

    const progressSummary = Object.values(grouped)
      .map(
        (g) =>
          `Subject: ${g.subject} | Target: ${g.weeklyTarget} mins | Completed: ${g.totalMinutes} mins | Notes: ${g.notes.join(", ") || "none"}`
      )
      .join("\n");

    const prompt = `
You are an AI study coach. Based on the following weekly study progress of a student, generate a detailed report.

Weekly Progress:
${progressSummary}

Your report must include the following sections:
1. Weekly Summary - overview of what the student accomplished
2. Study Recommendations - specific actionable tips for next week
3. Weak Areas - subjects or habits that need improvement based on the data
4. Motivational Message - a short encouraging message to keep the student going

Keep the tone friendly, honest, and constructive.
`;

    const { text } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt,
      maxOutputTokens: 1000,
    });

    const report = await Report.create({
      userId: req.user.id,
      weekRange: { start: startOfWeek, end: endOfWeek },
      aiSummary: text,
    });

    return res.status(201).json({
      success: true,
      message: "Weekly report generated successfully",
      data: report,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/reports
const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Reports fetched successfully",
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateWeeklyReport, getReports };