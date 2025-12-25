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

module.exports = {
  getUsageHistory,
  getWeeklyUsageHistory,
};
