// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { register, login, googleLogin } = require("../controllers/auth.controller");
const { registerSchema, loginSchema } = require("../schemas/auth.schema");
const { validate } = require("../middleware/validate.middleware");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/google", googleLogin);

module.exports = router;