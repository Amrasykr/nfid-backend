const express = require("express");
const router = express.Router();
const { getAllUsers, getMyProfile } = require("../controllers/usersController");

// GET all users
router.get("/", getAllUsers);

// GET my profile
// Temporary: query params ?userId=user_001 (until auth is implemented)
router.get("/me", getMyProfile);

module.exports = router;

