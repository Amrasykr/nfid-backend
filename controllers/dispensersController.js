const admin = require("firebase-admin");
const initializeFirestore = require("../config/firestore");

const db = initializeFirestore();

// Get all dispensers
const getAllDispensers = async (req, res) => {
  try {
    const snapshot = await db.collection("dispensers").get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No dispensers found",
      });
    }

    const dispensers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({
      success: true,
      count: dispensers.length,
      data: dispensers,
    });
  } catch (error) {
    console.error("Error fetching dispensers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispensers",
      error: error.message,
    });
  }
};

// Get dispenser by ID
const getDispenserById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("dispensers").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Dispenser not found",
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
    console.error("Error fetching dispenser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispenser",
      error: error.message,
    });
  }
};

// Create new dispenser
const createDispenser = async (req, res) => {
  try {
    const dispenserData = req.body;

    const docRef = await db.collection("dispensers").add({
      ...dispenserData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      success: true,
      message: "Dispenser created successfully",
      data: {
        id: docRef.id,
        ...dispenserData,
      },
    });
  } catch (error) {
    console.error("Error creating dispenser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create dispenser",
      error: error.message,
    });
  }
};

// Update dispenser
const updateDispenser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const docRef = db.collection("dispensers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Dispenser not found",
      });
    }

    await docRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      success: true,
      message: "Dispenser updated successfully",
      data: {
        id,
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error updating dispenser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update dispenser",
      error: error.message,
    });
  }
};

// Sync water level from IoT sensor (ultrasonic sensor reading)
const syncWaterLevel = async (req, res) => {
  try {
    const { dispenserId, remaining } = req.body;

    // Validate required fields
    if (!dispenserId || remaining === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: dispenserId, remaining",
      });
    }

    // Validate remaining is a non-negative number
    if (typeof remaining !== "number" || remaining < 0) {
      return res.status(400).json({
        success: false,
        message: "Remaining must be a non-negative number",
      });
    }

    // Get current dispenser data
    const docRef = db.collection("dispensers").doc(dispenserId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Dispenser not found",
      });
    }

    const currentData = doc.data();
    const oldRemaining = currentData.remaining || 0;
    const capacity = currentData.capacity || 1; // Prevent division by zero

    // Detect refill: if new remaining is significantly higher than old
    // Using threshold of 15% capacity increase to detect refill
    const refillThreshold = capacity * 0.15; // 15% of capacity
    const isRefill = remaining > oldRemaining && (remaining - oldRemaining) >= refillThreshold;

    // Calculate water level percentage and status
    const waterLevel = Math.round((remaining / capacity) * 100);
    let status;
    if (waterLevel > 70) {
      status = "good";
    } else if (waterLevel >= 30) {
      status = "medium";
    } else if (waterLevel > 0) {
      status = "low";
    } else {
      status = "offline"; // Empty or no water
    }

    // Prepare update data
    const updateData = {
      remaining,
      waterLevel,
      status,
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // If refill detected, update lastRefill timestamp
    if (isRefill) {
      updateData.lastRefill = admin.firestore.FieldValue.serverTimestamp();
    }

    // Update dispenser
    await docRef.update(updateData);

    res.status(200).json({
      success: true,
      message: isRefill 
        ? "Water level synced successfully - Refill detected!" 
        : "Water level synced successfully",
      data: {
        dispenserId,
        remaining,
        waterLevel,
        status,
        refillDetected: isRefill,
        previousRemaining: oldRemaining,
        change: remaining - oldRemaining,
      },
    });
  } catch (error) {
    console.error("Error syncing water level:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync water level",
      error: error.message,
    });
  }
};

// Delete dispenser
const deleteDispenser = async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = db.collection("dispensers").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Dispenser not found",
      });
    }

    await docRef.delete();

    res.status(200).json({
      success: true,
      message: "Dispenser deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dispenser:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete dispenser",
      error: error.message,
    });
  }
};

module.exports = {
  getAllDispensers,
  getDispenserById,
  createDispenser,
  updateDispenser,
  syncWaterLevel,
  deleteDispenser,
};
