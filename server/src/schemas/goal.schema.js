// src/schemas/goal.schema.js
const { z } = require("zod");

const createGoalSchema = z.object({
  subject: z.string().min(2, "Subject must be at least 2 characters").trim(),
  weeklyTarget: z
    .number({ invalid_type_error: "Weekly target must be a number" })
    .min(1, "Weekly target must be at least 1 minute"),
  deadline: z.string().datetime("Invalid date format").optional(),
});

const updateGoalSchema = z.object({
  subject: z.string().min(2, "Subject must be at least 2 characters").trim().optional(),
  weeklyTarget: z
    .number({ invalid_type_error: "Weekly target must be a number" })
    .min(1, "Weekly target must be at least 1 minute")
    .optional(),
  deadline: z.string().datetime("Invalid date format").optional(),
});

module.exports = { createGoalSchema, updateGoalSchema };