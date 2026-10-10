/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Coordinate from "./coordinate.js";
import { fetchXML } from "./fetch.js";
import { moveTo, setPosition } from "./animate.js";

const MAX_BALLOONS = 20;
const MORE_BALLOONS_MONTH = 10;
const MORE_BALLOONS = 1801;
const STANDARD_BALLOONS = 3823;
const BALLOON_MOVEMENT = 4517;
const MIN_BALLOON_WIDTH = 2;
const MAX_BALLOON_WIDTH = 10;
const MIN_HUE = 0;
const MAX_HUE = 360;
const MIN_CHROMA = 0.08;
const MAX_CHROMA = 0.16;
const MIN_LIGHTNESS = 0.65;
const MAX_LIGHTNESS = 0.85;

/**
 * Fetches a balloon SVG and uses that to populate the sky with balloons.
 */
export async function init() {
	/** @type {HTMLElement} */
	const balloonsCanvas = document.querySelector('.sky .sky__balloons');
	const url = balloonsCanvas.getAttribute('data-balloon');
	setBalloonCanvasHeight(balloonsCanvas);
	const balloonHeightRange = MAX_BALLOON_WIDTH - MIN_BALLOON_WIDTH;

	const svg = await fetchXML(url);

	function createBalloon() {
		if(document.hidden || randomBetween(0, 1) < .5) {
			return;
		}

		if(balloonsCanvas.children.length > MAX_BALLOONS) {
			return;
		}

		const cloth = svg.getElementById('balloon');
		cloth.style.fill = generateColor();

		/** @type {HTMLElement} */
		const root = svg.documentElement.cloneNode(true);
		const frame = document.createElement('div');
		const n = randomBetween(0, 1);
		const size = 1-(n*n);
		const width = (size*balloonHeightRange)+MIN_BALLOON_WIDTH;
		root.style.width = width + 'vw';

		frame.appendChild(root);

		frame.style.top = ((1-size)*100) + "%"

		let added = false;
		for(let i = 0; i < balloonsCanvas.children.length; ++i) {
			const balloon = balloonsCanvas.children.item(i);
			if(width < balloon.dataset.size) {
				balloonsCanvas.insertBefore(frame, balloon);
				added = true;
				break;
			}
		}
		if(!added) {
			balloonsCanvas.appendChild(frame);
		}

		const rect = root.getBoundingClientRect();
		const position = Coordinate.from({
			x: -width - randomBetween(0, width),
			y: 0
		});

		root.dataset.width = width;
		frame.dataset.size = size;

		if(!('ratio' in balloonsCanvas.dataset)) {
			const ratio = (+root.attributes.height.value)/(+root.attributes.width.value);
			balloonsCanvas.dataset.ratio = ratio;
		}

		setPosition(root, position);

		moveRight(root, rect, position, true);
	}

	const balloonRate = (new Date()).getMonth()+1 == MORE_BALLOONS_MONTH ? MORE_BALLOONS : STANDARD_BALLOONS;

	createBalloon();
	setInterval(createBalloon, balloonRate);
}

/**
 * @param {HTMLElement} balloonsCanvas
 * Adds a resize listener to that it can resize appropiately.
 */
function setBalloonCanvasHeight(balloonsCanvas) {
	/** @type {HTMLElement} */
	const mountain = document.querySelector('body .mountain__range');

	function resize() {
		const mountainRect = mountain.getBoundingClientRect();
		const boxHeight = window.innerHeight - (mountainRect.height + (window.innerWidth * (MIN_BALLOON_WIDTH/100)));

		balloonsCanvas.dataset.height = boxHeight;
		balloonsCanvas.style.height = boxHeight + "px";
	}

	resize();
	window.addEventListener('resize', resize);
}

/**
 * Generates a random color that has a good amount of saturation and light
 * @returns {String} random color in the form of HSL
 */
function generateColor() {
	const lightness = randomBetween(MIN_LIGHTNESS, MAX_LIGHTNESS);
	const chroma = randomBetween(MIN_CHROMA, MAX_CHROMA);
	const hue = Math.round(randomBetween(MIN_HUE, MAX_HUE));
	return 'oklch(' + lightness + ' ' + chroma + ' ' + hue + ')';
}

/**
 * Generates a random Number between two Numbers
 * @param {Number} min - The minimum a Number could be
 * @param {Number} max - The maximum but not including the Number
 * @returns {Number}
 */
function randomBetween(min, max) {
	return Math.random() * (max-min) + min
}

/**
 * Sets up a element so that it will drift to the right until it reaches the end of the screen,
 * at which point, it will be removed from the DOM
 * @param {HTMLElement} elem - Target element to be moved
 * @param {DOMRect} rect - Bounding rectangle of the element
 * @param {Coordinate} initial - Current location of the Target element
 * @param {boolean} up - Determines whether to drift up or down
 */
async function moveRight(elem, rect, initial, up) {
	const width = +elem.dataset.width;
	if(initial.x > 100) {
		const frame = elem.parentElement;
		frame.parentElement.removeChild(frame);
		return;
	}

	const end = up
		? initial.add(Coordinate.create(width * 2, -rect.height / 3))
		: initial.add(Coordinate.create(width * 2, rect.height / 3));

	await moveTo(elem, initial, end, BALLOON_MOVEMENT);
	await moveRight(elem, rect, end, !up);
	return;
}
