const initializeFirestore = require("../config/firestore");

const db = initializeFirestore();

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Get my profile (temporarily using userId from query/params until auth is implemented)
const getMyProfile = async (req, res) => {
  try {
    // Temporary: get userId from query parameter
    // TODO: Replace with authenticated user ID from JWT/session
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required (temporary, until auth is implemented)",
      });
    }

    const doc = await db.collection("users").doc(userId).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getMyProfile,
};
