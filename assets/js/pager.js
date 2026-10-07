/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export default class Pager {
	/**
     * Creates a pager object that able to fetch other page content
	 * @constructor
	 */
	constructor() {
		this.request = new XMLHttpRequest();
	}

	/**
	 * Sends a request to fetch the page from the specified url.
	 * If a request was already in-flight, cancels that request and sends another
	 * @param {string} url
	 * @returns {Promise<HTMLDocument>} Promise that is resolved when it fetches an HTML document.
	 * Promise is rejected with an `Error` if it could not fetch the resource, or the resource is not a HTML Document.
	 */
	load(url) {
		var $request = this.request;
		return new Promise(function (resolve, reject) {
			$request.abort();

			$request.open("GET", url);
			$request.responseType = "document";
			$request.addEventListener('load', function () {
				if (!(this.responseXML instanceof HTMLDocument)) {
					reject(new Error("Response was not an HTML Document"));
				} else {
					resolve(this.responseXML);
				}
			});
			$request.addEventListener('error', function () {
				reject(new Error('Could not load ' + url));
			});

			$request.send();
		});
	}
}

