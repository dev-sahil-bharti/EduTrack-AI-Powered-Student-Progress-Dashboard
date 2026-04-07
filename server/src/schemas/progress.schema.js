// src/schemas/progress.schema.js
const { z } = require("zod");

const logProgressSchema = z.object({
  goalId: z.string().min(1, "Goal ID is required"),
  completedMinutes: z
    .number({ invalid_type_error: "Completed minutes must be a number" })
    .min(1, "Completed minutes must be at least 1"),
  notes: z.string().trim().optional(),
});

module.exports = { logProgressSchema };