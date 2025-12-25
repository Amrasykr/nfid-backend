const admin = require("firebase-admin");

let db;

const initializeFirestore = () => {
  if (!db) {
    // Cek apakah sudah diinisialisasi
    if (!admin.apps.length) {
      const serviceAccount = require("../firebaseAdminConfig.json");

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    db = admin.firestore();
  }

  return db;
};

module.exports = initializeFirestore;
