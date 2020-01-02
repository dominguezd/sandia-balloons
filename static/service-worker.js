/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

var CACHE_NAME = 'dominguezd-v1.0'

var URLS = [
	'/sass/main.min.css',
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
]

this.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(CACHE_NAME).then(function (cache) {
			return cache.addAll(URLS);
		})
	);
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
