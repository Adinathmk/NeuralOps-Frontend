// Fires when FCM delivers a web push
self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {}
    event.waitUntil(
        self.registration.showNotification(data.title ?? 'NeuralOps Alert', {
            body:               data.body,
            data:               data.data ?? {},
            requireInteraction: true,   // stays visible until the user taps
        })
    )
})

// Fires when the user taps the notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const deepLink = event.notification.data?.deep_link ?? '/'
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            // If the app is already open in a tab, focus it and navigate
            for (const client of list) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus()
                    client.postMessage({ type: 'NAVIGATE', url: deepLink })
                    return
                }
            }
            // Otherwise open a new tab
            clients.openWindow(deepLink)
        })
    )
})
