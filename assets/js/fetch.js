/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Fetches a XML document from the specified url.
 * @param {string} url
 * @returns {Promise<XMLDocument>} Promise that is resolved when it fetches an XML document.
 * Promise is rejected with an `Error` if it could not fetch the resource, or the resource is not a XML Document.
 */
export async function fetchXML(url) {
	const response = await fetch(url);

	if(!response.ok) {
		throw new Error(`Could not retrieve page ${url}`);
	}

	const text = await response.text();

	const parser = new DOMParser();

	const page = parser.parseFromString(text, "text/xml");

	return page;
}

/**
 * Fetches a XML document from the specified url.
 * @param {string} url
 * @returns {Promise<Document>} Promise that is resolved when it fetches an XML document.
 * Promise is rejected with an `Error` if it could not fetch the resource, or the resource is not a XML Document.
 */
export async function fetchHTML(url) {
	const response = await fetch(url);

	if(!response.ok) {
		throw new Error(`Could not retrieve page ${url}`);
	}

	const text = await response.text();

	const parser = new DOMParser();

	const page = parser.parseFromString(text, "text/html");

	return page;
}