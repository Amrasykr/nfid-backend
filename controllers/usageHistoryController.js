const initializeFirestore = require("../config/firestore");

const db = initializeFirestore();

// Get usage history by dispenser ID with limit
const getUsageHistory = async (req, res) => {
  try {
    const { dispenserId } = req.params;
    const { limit = 10 } = req.query; // default 10 records

    const snapshot = await db
      .collection("usageHistory")
      .where("dispenserId", "==", dispenserId)
      .orderBy("date", "desc")
      .limit(parseInt(limit))
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No usage history found",
      });
    }

    // Get all user IDs
    const userIds = [...new Set(snapshot.docs.map((doc) => doc.data().userId))];

    // Fetch user data
    const usersPromises = userIds.map((userId) =>
      db.collection("users").doc(userId).get()
    );
    const usersSnapshots = await Promise.all(usersPromises);

    const usersMap = {};
    usersSnapshots.forEach((userDoc) => {
      if (userDoc.exists) {
        usersMap[userDoc.id] = userDoc.data();
      }
    });

    // Map usage history with user data
    const usageHistory = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        user: usersMap[data.userId] || null,
      };
    });

    res.status(200).json({
      success: true,
      count: usageHistory.length,
      data: usageHistory,
    });
  } catch (error) {
    console.error("Error fetching usage history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch usage history",
      error: error.message,
    });
  }
};

// Get weekly usage history (last 7 days from given date)
const getWeeklyUsageHistory = async (req, res) => {
  try {
    const { dispenserId } = req.params;
    const { date } = req.query; // ISO date string or timestamp

    // Parse date or use current date
    const endDate = date ? new Date(date) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    const snapshot = await db
      .collection("usageHistory")
      .where("dispenserId", "==", dispenserId)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No usage history found for the specified week",
      });
    }

    // Get all user IDs
    const userIds = [...new Set(snapshot.docs.map((doc) => doc.data().userId))];

    // Fetch user data
    const usersPromises = userIds.map((userId) =>
      db.collection("users").doc(userId).get()
    );
    const usersSnapshots = await Promise.all(usersPromises);

    const usersMap = {};
    usersSnapshots.forEach((userDoc) => {
      if (userDoc.exists) {
        usersMap[userDoc.id] = userDoc.data();
      }
    });

    // Map usage history with user data
    const usageHistory = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        user: usersMap[data.userId] || null,
      };
    });

    res.status(200).json({
      success: true,
      count: usageHistory.length,
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      data: usageHistory,
    });
  } catch (error) {
    console.error("Error fetching weekly usage history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly usage history",
      error: error.message,
    });
  }
};

// Create new usage history record
const createUsageHistory = async (req, res) => {
  try {
    const { dispenserId, userId, usage } = req.body;

    // Validate required fields
    if (!dispenserId || !userId || usage === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: dispenserId, userId, usage",
      });
    }

    // Validate usage is a positive number
    if (typeof usage !== "number" || usage <= 0) {
      return res.status(400).json({
        success: false,
        message: "Usage must be a positive number",
      });
    }

    // Validate dispenser exists
    const dispenserDoc = await db.collection("dispensers").doc(dispenserId).get();
    if (!dispenserDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `Dispenser with ID '${dispenserId}' not found`,
      });
    }

    // Validate user exists (optional but recommended)
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `User with ID '${userId}' not found`,
      });
    }

    // Create usage history record
    const usageHistoryData = {
      dispenserId,
      userId,
      date: new Date(),
      usage,
    };

    const docRef = await db.collection("usageHistory").add(usageHistoryData);

    // Update dispenser: reduce remaining water and update status
    const dispenserData = dispenserDoc.data();
    const newRemaining = Math.max(0, dispenserData.remaining - usage);
    const capacity = dispenserData.capacity || 1; // Prevent division by zero
    
    // Calculate status based on remaining/capacity percentage
    const percentageRemaining = (newRemaining / capacity) * 100;
    let newStatus;
    if (percentageRemaining > 70) {
      newStatus = "good";
    } else if (percentageRemaining >= 30) {
      newStatus = "medium";
    } else {
      newStatus = "low";
    }

    // Update dispenser document
    await db.collection("dispensers").doc(dispenserId).update({
      remaining: newRemaining,
      status: newStatus,
      lastSync: new Date(),
    });

    // Check if this is a new user for this dispenser (for totalUsers tracking)
    // Query if this user has used this dispenser before
    const existingUsageByUser = await db
      .collection("usageHistory")
      .where("dispenserId", "==", dispenserId)
      .where("userId", "==", userId)
      .limit(2) // We just need to know if there's more than 1 (including the one we just created)
      .get();

    // If this is the first usage by this user for this dispenser, increment totalUsers
    if (existingUsageByUser.size === 1) {
      const currentTotalUsers = dispenserData.totalUsers || 0;
      await db.collection("dispensers").doc(dispenserId).update({
        totalUsers: currentTotalUsers + 1,
      });
    }

    res.status(201).json({
      success: true,
      message: "Usage history created successfully",
      data: {
        id: docRef.id,
        ...usageHistoryData,
      },
      dispenserUpdates: {
        remaining: newRemaining,
        status: newStatus,
        percentageRemaining: Math.round(percentageRemaining),
      },
    });
  } catch (error) {
    console.error("Error creating usage history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create usage history",
      error: error.message,
    });
  }
};

module.exports = {
  getUsageHistory,
  getWeeklyUsageHistory,
  createUsageHistory,
};
