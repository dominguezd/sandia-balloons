import Coordinate from "./coordinate.js";
import fetchXML from "./fetchXML.js";

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

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

export function init(pager) {
	/** @type {HTMLDivElement} */
	var tab = document.querySelector('.refresh');
	/** @type {HTMLDivElement} */
	var icon = tab.querySelector('.refresh__icon');
	/** @type {HTMLDivElement} */
	var mainContent = document.getElementById('main');
	/** @type {number} */
	var height = tab.getBoundingClientRect().height;
	/** @type {Coordinate} */
	var iconPosition = Coordinate.ZERO;
	/** @type {"none"|"pull"|"scroll"} */
	var gesture = "none";
	/** @type {Map<number, Coordinate>} */
	var startPointerPositions = new Map();

	function positionIcon(y) {
		iconPosition = Coordinate.withY(y);
		setPosition(icon, iconPosition);
	}

	function resetIcon() {
		var promise = moveTo(icon, iconPosition, Coordinate.ZERO, 300)
			.then(hideIcon);
			iconPosition = Coordinate.ZERO;
		return promise;
	}

	function stablizeIcon() {
		var dest = Coordinate.withY(height);
		var promise = moveTo(icon, iconPosition, dest, 100);
		iconPosition = dest;
		return promise;
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

		for(var i = 0; i < e.changedTouches.length; ++i) {
			var touch = e.changedTouches[i];

			var newPointer = Coordinate.fromClient(touch);

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

		for(var i = 0; i < e.changedTouches.length; ++i) {
			var touch = e.changedTouches[i];

			var pointerStart = startPointerPositions.get(touch.identifier);
			var client = Coordinate.fromClient(touch);
	
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
	function endTouch(e) {
		if(e.defaultPrevented) {
			return;
		}

		for(var i = 0; i < e.changedTouches.length; ++i) {
			var touch = e.changedTouches[i];

			if(gesture == "pull") {
				if(iconPosition.y >= height) {
					let url = window.location.href;
					Promise.all([pager.load(url), stablizeIcon().then(waitFor(1500))]).then(function (args) {
						var page = args[0];
						removePageContent(mainContent);
						return wait(100).then(function () {
							tranferPageContent(page, mainContent);
							window.scrollTo({left: 0, top: 0})
							window.dispatchEvent(new UIEvent('resize'));
						}).then(resetIcon);
					}).catch(function (e) {
						console.error(e)
						window.location.reload()
					});
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

	var url = icon.getAttribute('data-icon-href');
	fetchXML(url).then(function (svg) {
		svg.getElementById('balloon').style.fill = '';
		icon.appendChild(svg.documentElement);
	});
}
