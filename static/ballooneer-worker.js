/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const URLS = [
	'/css/screen.css',
	'/css/print.css',
	'/js/script.js',
	'/images/mountain.svg',
	'/images/balloon.svg',
	'/?standalone=true',
	'/android-chrome-192x192.png',
	'/android-chrome-512x512.png',
	'/apple-touch-icon.png',
	'/favicon.ico',
	'/favicon-16x16.png',
	'/favicon-32x32.png',
	'/favicon.svg',
	'/manifest.json',
	'/mstile-150x150.png',
	'/safari-pinned-tab.svg'
];

const build = "20251101195406592"
const namespace = "ballooneer-v"
const CACHE_NAME = 'ballooneer-v' + build;

async function exec(func) {
	let events = [];
	func(events);
	await Promise.all(events);
}


async function install(events) {
	const cache = await caches.open(CACHE_NAME);
	for(let url of URLS) {
		events.push(cache.add(url));
	}

	const keys = await caches.keys();
	for(let key of keys) {
		if(key.startsWith(namespace) && key != CACHE_NAME) {
			events.push(caches.delete(key));
		}
	}
}

this.addEventListener('install', function (event) {
	event.waitUntil(exec(install));
});

this.addEventListener('fetch', function (event) {
	event.respondWith(
		caches.match(event.request).then(function (response) {
			if (response) {
				return response;
			}

			return fetch(event.request);
		})
	);
});
