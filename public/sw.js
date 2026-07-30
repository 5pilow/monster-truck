// Service worker maison. Le jeu télécharge plusieurs Mo de bibliothèques et de
// modèles à chaque visite ; une fois en cache, il se relance instantanément et
// même hors ligne.
//
//  - les pages passent par le réseau d'abord, la copie en cache servant de
//    filet : une mise en ligne doit se voir tout de suite ;
//  - les fichiers au nom versionné (/assets/) et les ressources lourdes du jeu
//    (modèles, ciel, images) sortent du cache d'abord.
// Les scripts tiers (publicité, mesure d'audience) ne sont jamais interceptés.

const CACHE = 'monster-truck-v1'

self.addEventListener('install', event => {
	event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/'])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys()
			.then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
			.then(() => self.clients.claim()),
	)
})

function cacheable(url) {
	return url.pathname.startsWith('/assets/')
		|| url.pathname.startsWith('/model/')
		|| /\.(png|jpe?g|webp|svg|glb|gltf|bin|wasm|woff2?|css|js)$/i.test(url.pathname)
}

self.addEventListener('fetch', event => {
	const request = event.request
	if (request.method !== 'GET') return

	const url = new URL(request.url)
	if (url.origin !== self.location.origin) return

	if (cacheable(url)) {
		event.respondWith(
			caches.match(request).then(hit => hit ?? fetch(request).then((response) => {
				if (response.ok) {
					const copy = response.clone()
					caches.open(CACHE).then(cache => cache.put(request, copy))
				}
				return response
			})),
		)
		return
	}

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).then((response) => {
				if (response.ok) {
					const copy = response.clone()
					caches.open(CACHE).then(cache => cache.put(request, copy))
				}
				return response
			}).catch(() => caches.match(request).then(hit => hit ?? caches.match('/'))),
		)
	}
})
