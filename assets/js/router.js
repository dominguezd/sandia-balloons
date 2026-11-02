/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { fetchHTML } from "./fetch.js";
import { wait } from "./wait.js";

/**
 * Overrides all internal links so that all content will be loaded onto the page
 * without forcing a page refresh action.
 */
export function init() {
	const mainContent = document.getElementById('page-container');
	const cloudContainer = document.getElementById('cloud-container');

	document.addEventListener('click', async function (e) {
		if(e.defaultPrevented || e.button !== 0) {
			return;
		}

		const link = findNearestLink(e);

		if(link == null || window.location.hostname !== link.hostname) {
			return;
		}

		e.preventDefault();

		const url = link.href;
		try {
			cloudContainer.classList.remove("joined");
			const [page] = await Promise.all([fetchHTML(url), wait(300)]);
			
			if(url !== window.location.href) {
				history.pushState('', page.title, url);
			}
			removePageContent(mainContent);
			tranferPageContent(page, mainContent);
			cloudContainer.classList.add("joined");
			window.scrollTo({left: 0, top: 0})
			window.dispatchEvent(new UIEvent('resize'));
		} catch(e) {
			console.error(e)
			window.location.href = url;
		};
	});

	window.addEventListener('popstate', async function () {
		const page = await fetchHTML(window.location.href);
		removePageContent(mainContent);
		tranferPageContent(page, mainContent);
		window.dispatchEvent(new UIEvent('resize'));
	});
}

/**
 * Cleans up the page
 * @param {HTMLElement} elem - the main section to be cleaned up
 */
function removePageContent(elem) {
	for(var child = elem.firstChild; child != null; child = elem.firstChild) {
		elem.removeChild(child);
	}
	document.body.classList.remove('page--ready');
}

/**
 * Transfers the new page content onto the current page
 * @param {Document} src Current page
 * @param {Document} dst New Page
 */
function tranferPageContent(src, dst) {
	var srcMain = src.getElementById('page-container');

	for(var child = srcMain.firstChild; child != null; child = srcMain.firstChild) {
		dst.appendChild(child);
	}

	document.title = src.title;
	document.body.classList.add('page--ready');
}

/**
 * Goes up the DOM to determine if the element clicked was or contained by an anchor element.
 * @param {MouseEvent} e Click Event that initiated this
 * @returns {HTMLAnchorElement} The nearest anchor element or null if none.
 */
function findNearestLink(e) {
	for(var elem = e.target; elem instanceof HTMLElement; elem = elem.parentElement) {
		if(elem instanceof HTMLAnchorElement) {
			return elem;
		}
	}
	return null;
}
