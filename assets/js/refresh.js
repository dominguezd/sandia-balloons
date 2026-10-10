/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Coordinate from "./coordinate.js";
import { fetchHTML, fetchXML } from "./fetch.js";
import { moveTo, setPosition } from "./animate.js";

function wait(milliseconds) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve(milliseconds);
		}, milliseconds);
	});
}

function waitFor(milliseconds) {
	return function () {
		return wait(milliseconds)
	}
}

export async function init() {
	/** @type {HTMLDivElement} */
	const tab = document.querySelector('.refresh');
	/** @type {HTMLDivElement} */
	const icon = tab.querySelector('.refresh__icon');
	/** @type {HTMLDivElement} */
	const mainContent = document.getElementById('main');
	/** @type {number} */
	const height = tab.getBoundingClientRect().height;
	/** @type {Coordinate} */
	let iconPosition = Coordinate.ZERO;
	/** @type {"none"|"pull"|"scroll"} */
	let gesture = "none";
	/** @type {Map<number, Coordinate>} */
	const startPointerPositions = new Map();

	function positionIcon(y) {
		iconPosition = Coordinate.withY(y);
		setPosition(icon, iconPosition);
	}

	async function resetIcon() {
		await moveTo(icon, iconPosition, Coordinate.ZERO, 300);
		hideIcon();
		iconPosition = Coordinate.ZERO;
	}

	async function stablizeIcon() {
		const dest = Coordinate.withY(height);
		await moveTo(icon, iconPosition, dest, 100);
		iconPosition = dest;
	}

	function hideIcon() {
		icon.style.transform = "";
	}

	/**
	 * 
	 * @param {TouchEvent} e 
	 */
	function startTouch(e) {
		if(e.defaultPrevented) {
			return;
		}

		for(let i = 0; i < e.changedTouches.length; ++i) {
			const touch = e.changedTouches[i];

			const newPointer = Coordinate.fromClient(touch);

			startPointerPositions.set(touch.identifier, newPointer);
		}
	}

	/**
	 * 
	 * @param {TouchEvent} e 
	 */
	function moveTouch(e) {
		if(e.defaultPrevented || e.touches.length > 1) {
			return;
		}

		for(let i = 0; i < e.changedTouches.length; ++i) {
			const touch = e.changedTouches[i];

			const pointerStart = startPointerPositions.get(touch.identifier);
			const client = Coordinate.fromClient(touch);
	
			if(gesture == "none") {
				if(window.scrollY == 0 && client.y > pointerStart.y) {
					gesture = "pull";
				} else {
					gesture = "scroll";
				}
			}
	
			if(gesture == "pull") {
				e.preventDefault();

				if(client.y < pointerStart.y) {
					hideIcon();
					icon.classList.remove('refresh__icon--pulled');
				} else if(client.y > pointerStart.y+height) {
					positionIcon(height + ((client.y - pointerStart.y) - height)/4);
					icon.classList.add('refresh__icon--pulled');
				} else {
					positionIcon(client.y - pointerStart.y);
					icon.classList.remove('refresh__icon--pulled');
				}
			}
		}
	}

	/**
	 * 
	 * @param {TouchEvent} e 
	 */
	async function endTouch(e) {
		if(e.defaultPrevented) {
			return;
		}

		for(let i = 0; i < e.changedTouches.length; ++i) {
			const touch = e.changedTouches[i];

			if(gesture == "pull") {
				if(iconPosition.y >= height) {
					let url = window.location.href;
					try {
						const [page] = await Promise.all([fetchHTML(url), stablizeIcon().then(waitFor(1500))])
						removePageContent(mainContent);
						await wait(100);
						tranferPageContent(page, mainContent);
						window.scrollTo({left: 0, top: 0})
						window.dispatchEvent(new UIEvent('resize'));
						await resetIcon();
					} catch (e) {
						console.error(e)
						window.location.reload()
					};
				} else {
					resetIcon();
				}
			}

			startPointerPositions.delete(touch.identifier);
		}
		if(e.touches.length == 0) {
			gesture = "none";
		} else if (e.touches.length == 1) {
			gesture = "touch";
		}
	}

	document.body.addEventListener('touchstart', startTouch);
	document.body.addEventListener('touchmove', moveTouch, {passive: false});
	document.body.addEventListener('touchend', endTouch);
	document.body.addEventListener('touchcancel', endTouch);

	const url = icon.getAttribute('data-icon-href');
	const svg = await fetchXML(url)
	svg.getElementById('balloon').style.fill = '';
	icon.appendChild(svg.documentElement);
}
