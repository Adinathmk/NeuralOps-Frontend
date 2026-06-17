import { getFirebaseToken } from './firebase'

function getStableDeviceId(): string {
    let id = localStorage.getItem('neuralops_device_id')
    if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('neuralops_device_id', id)
    }
    return id
}

export async function setupWebPush(apiClient: any): Promise<void> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    // VAPID key used by Firebase for web push authentication
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    const token = await getFirebaseToken(vapidKey);
    
    if (!token) return;

    // POST the simple string token to backend instead of subscription JSON
    await apiClient.post('/push/register', {
        platform:     'web',
        device_token: token,
        device_id:    getStableDeviceId(),
    })
}
