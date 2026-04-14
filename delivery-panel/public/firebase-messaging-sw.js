/* eslint-disable no-undef */
/**
 * Firebase Messaging Service Worker — Delivery Panel
 * Handles background push notifications for new delivery requests
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: self.__FIREBASE_CONFIG__?.apiKey || "",
    authDomain: self.__FIREBASE_CONFIG__?.authDomain || "",
    projectId: self.__FIREBASE_CONFIG__?.projectId || "",
    storageBucket: self.__FIREBASE_CONFIG__?.storageBucket || "",
    messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || "",
    appId: self.__FIREBASE_CONFIG__?.appId || "",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log("[SW] Background message:", payload);

    const { title, body } = payload.notification || {};
    const data = payload.data || {};

    const options = {
        body: body || "New delivery request available",
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: data.orderId || "delivery-notification",
        requireInteraction: true,
        data: data,
        actions: [
            { action: "accept", title: "✅ Accept" },
            { action: "reject", title: "❌ Reject" },
        ],
    };

    self.registration.showNotification(title || "🛵 New Delivery Request", options);
});

// Handle notification click actions
self.addEventListener("notificationclick", (event) => {
    const { action } = event;
    const data = event.notification.data || {};

    event.notification.close();

    if (action === "accept" || action === "reject") {
        // Post message to client to handle accept/reject
        event.waitUntil(
            self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
                for (const client of clients) {
                    client.postMessage({
                        type: action === "accept" ? "FCM_ACCEPT_ORDER" : "FCM_REJECT_ORDER",
                        orderId: data.orderId,
                    });
                }
                // If no client open, open the app
                if (clients.length === 0) {
                    self.clients.openWindow("/orders");
                }
            })
        );
    } else {
        // Default click — open the app
        event.waitUntil(
            self.clients.matchAll({ type: "window" }).then((clients) => {
                if (clients.length > 0) {
                    clients[0].focus();
                } else {
                    self.clients.openWindow("/orders");
                }
            })
        );
    }
});
