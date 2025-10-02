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
