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
  deleteDispenser,
};
