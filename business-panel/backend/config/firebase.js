/**
 * firebase.js — Firebase Admin SDK initialization for FCM
 * Uses service account from FIREBASE_SERVICE_ACCOUNT env var (JSON string)
 * or GOOGLE_APPLICATION_CREDENTIALS env var (file path)
 */
import admin from "firebase-admin";

let firebaseApp = null;
let fcmAvailable = false;

export const initFirebase = () => {
    if (firebaseApp) return firebaseApp;

    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        if (serviceAccount) {
            const parsed = JSON.parse(serviceAccount);
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(parsed),
            });
            fcmAvailable = true;
            console.log("✅ Firebase Admin initialized (service account JSON)");
        } else if (credPath) {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
            fcmAvailable = true;
            console.log("✅ Firebase Admin initialized (application default)");
        } else {
            console.log("ℹ️  Firebase not configured — FCM push notifications disabled");
            console.log("   Set FIREBASE_SERVICE_ACCOUNT (JSON) or GOOGLE_APPLICATION_CREDENTIALS (path)");
            return null;
        }
    } catch (err) {
        console.error("❌ Firebase init failed:", err.message);
        fcmAvailable = false;
        return null;
    }

    return firebaseApp;
};

export const isFcmAvailable = () => fcmAvailable;
export const getFirebaseAdmin = () => admin;
