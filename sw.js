self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('qr-app-v1').then((cache) => {
            return cache.addAll([
                '/index.html',
                '/icono.png',
                'https://cdn.tailwindcss.com',
                'https://unpkg.com/html5-qrcode',
                'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
            ]);
        })
    );
    console.log('Service Worker instalado');
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// --- MANEJO DE NOTIFICACIONES PUSH ---
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : { title: 'Notificación', body: 'Nueva actualización disponible' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icono.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/index.html' // URL opcional para abrir al hacer clic
            }
        })
    );
});

// --- MANEJO DE CLIC EN NOTIFICACIÓN ---
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
