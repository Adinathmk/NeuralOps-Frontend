importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyC1GiPdpLTO6M9pCpypblEjq6eGIXeZqVA",
  authDomain: "neuralops-b7e84.firebaseapp.com",
  projectId: "neuralops-b7e84",
  storageBucket: "neuralops-b7e84.firebasestorage.app",
  messagingSenderId: "644021141824",
  appId: "1:644021141824:web:96541e8c087b13aeca7aa5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
