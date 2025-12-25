const express = require("express");
const router = express.Router();
const {
  getAllDispensers,
  getDispenserById,
  createDispenser,
  updateDispenser,
  deleteDispenser,
} = require("../controllers/dispensersController");

// GET all dispensers
router.get("/", getAllDispensers);

// GET dispenser by ID
router.get("/:id", getDispenserById);

// POST create new dispenser
router.post("/", createDispenser);

// PUT update dispenser
router.put("/:id", updateDispenser);

// DELETE dispenser
router.delete("/:id", deleteDispenser);

module.exports = router;
