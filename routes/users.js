const express = require("express");
const router = express.Router();
const { getMyProfile } = require("../controllers/usersController");

// GET my profile
// Temporary: query params ?userId=user_001 (until auth is implemented)
router.get("/me", getMyProfile);

module.exports = router;
