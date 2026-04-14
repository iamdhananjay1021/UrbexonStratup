/**
 * firebase.js — Firebase client SDK for delivery panel FCM
 * Handles push notification permission and token registration
 */
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

const isConfigValid = () => {
    return firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId;
};

export const initFirebaseApp = () => {
    if (!isConfigValid()) {
        console.log("[FCM] Firebase not configured — push notifications disabled");
        return null;
    }
    if (app) return app;
    try {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        console.log("[FCM] Firebase initialized");
        return app;
    } catch (err) {
        console.warn("[FCM] Firebase init failed:", err.message);
        return null;
    }
};

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null
 */
export const requestFcmToken = async () => {
    if (!isConfigValid()) return null;
    if (!messaging) initFirebaseApp();
    if (!messaging) return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.log("[FCM] Notification permission denied");
            return null;
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const token = await getToken(messaging, {
            vapidKey: vapidKey || undefined,
        });

        console.log("[FCM] Token obtained:", token?.slice(-12));
        return token;
    } catch (err) {
        console.warn("[FCM] Token request failed:", err.message);
        return null;
    }
};

/**
 * Listen for foreground FCM messages
 * @param {function} callback - Called with message payload
 */
export const onForegroundMessage = (callback) => {
    if (!messaging) return () => { };
    return onMessage(messaging, (payload) => {
        console.log("[FCM] Foreground message:", payload);
        callback(payload);
    });
};
