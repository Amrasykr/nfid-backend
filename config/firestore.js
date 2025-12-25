const admin = require("firebase-admin");

let db;

const initializeFirestore = () => {
  if (!db) {
    // Cek apakah sudah diinisialisasi
    if (!admin.apps.length) {
      let serviceAccount;
      
      // Production (Vercel) - pake environment variables
      if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_PROJECT_ID) {
        serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        };
      } else {
        // Development - pake file JSON
        serviceAccount = require("../firebaseAdminConfig.json");
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    db = admin.firestore();
  }
  
  return db;
};

module.exports = initializeFirestore;