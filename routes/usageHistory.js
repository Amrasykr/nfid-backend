const express = require("express");
const router = express.Router();
const {
  getUsageHistory,
  getWeeklyUsageHistory,
  createUsageHistory,
} = require("../controllers/usageHistoryController");

// POST create new usage history record
router.post("/", createUsageHistory);

// GET usage history by dispenser ID
// Query params: ?limit=10 (optional, default 10)
router.get("/:dispenserId", getUsageHistory);

// GET weekly usage history by dispenser ID
// Query params: ?date=2024-12-25 (optional, default today)
router.get("/:dispenserId/weekly", getWeeklyUsageHistory);

module.exports = router;