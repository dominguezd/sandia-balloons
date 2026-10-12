/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import Coordinate from "./coordinate.js";
import { fetchXML } from "./fetch.js";
import { moveTo, setPosition } from "./animate.js";
import { randomBetween, RandomEventSignaler } from './rng.js'
import Oklch from './oklch.js'

const MAX_BALLOONS = 20;
const BALLOON_MOVEMENT = 15000;
const BALLOON_INTERVAL = 9000;
const MIN_BALLOON_WIDTH = 2;
const MAX_BALLOON_WIDTH = 10;
const BALLOON_HEIGHT_RANGE = MAX_BALLOON_WIDTH - MIN_BALLOON_WIDTH;
const BALLOON_SPAWN_EVENT = "balloon:spawn";

/**
 * This class is the entry point for starting the hot air balloons soaring over the sky.
 * Follows the module format with an init function as to when to start.
 */
export class SkyBalloonsModule {
	/**
	 * Quickly sets up the object with no changes to the DOM or outside environment.
	 * Determines if we are in the month of October for extra balloons.
	 */
	constructor() {
		const isBalloonFiestaMonth = this.currentMonth = (new Date()).getMonth() + 1;

		this.balloonInterval = isBalloonFiestaMonth
			? BALLOON_INTERVAL / 3
			: BALLOON_INTERVAL * 2;

		this.balloonSpeed = isBalloonFiestaMonth
			? BALLOON_MOVEMENT / 3
			: BALLOON_MOVEMENT;
	}

	/**
	 * Hooks onto the DOM and begins the process to generate balloons onto the sky and animate them moving across.
	 */
	init() {
		/** @type {HTMLElement} */
		const balloonsCanvas = document.querySelector('.sky .sky__balloons');
		setBalloonCanvasHeight(balloonsCanvas);

		const signaler = new RandomEventSignaler(balloonsCanvas, BALLOON_SPAWN_EVENT, this.balloonInterval);
		signaler.init();

		const balloonGenerator = new HotAirBalloonGenerator(
			balloonsCanvas.getAttribute('data-balloons').split(',')
		);

		balloonsCanvas.addEventListener(BALLOON_SPAWN_EVENT, async () => {
			if(balloonsCanvas.children.length > MAX_BALLOONS) {
				return;
			}

			const root = await balloonGenerator.generate();

			const n = randomBetween(0, 1);
			const size = 1-(n*n);
			const width = (size*BALLOON_HEIGHT_RANGE)+MIN_BALLOON_WIDTH;

			root.style.width = width + 'vw';
			root.dataset.width = width;

			const frame = document.createElement('div');
			frame.style.top = ((1-size)*100) + "%";
			frame.dataset.size = size;
			frame.appendChild(root);

			addToCanvas(balloonsCanvas, frame);

			const rect = root.getBoundingClientRect();
			const position = Coordinate.withX(-width);

			setPosition(root, position);
			moveRight(root, rect, position, this.balloonSpeed, true);
		});
	}
}

class HotAirBalloonGenerator {
	/**
	 * 
	 * @param {string[]} urls 
	 */
	constructor(urls) {
		/**
		 * @private
		 * @type {Promise<XMLDocument>[]}
		 */
		this.__cache = [];

		/**
		 * @private
		 * @type {Promise<void>}
		 */
		this.__fetchedOne = Promise.any(urls.map(url =>
			fetchXML(url)
				.then(xml => {
					this.__cache.push(xml)
				})
		));
	}

	/**
	 * Generates a balloon based on a random template and applies a random color to it.
	 * @returns {Promise<SVGSVGElement>}
	 */
	async generate() {
		const template = await this.__chooseTemplate();

		/** @type {SVGSVGElement} */
		const svg = template.documentElement.cloneNode(true);

		const lightness = generateFromRange(svg.dataset.lightnessRange);
		const chroma = generateFromRange(svg.dataset.chromaRange);
		const hue = randomBetween(0, 360);

		const color = new Oklch(lightness, chroma, hue);

		const sectionsToColor = svg.querySelectorAll('.color');
		for(let section of sectionsToColor ) {
			const lightness = readAdjust(section.dataset.lightnessAdjust);
			const chroma = readAdjust(section.dataset.chromaAdjust);
			const hue = readAdjust(section.dataset.hueAdjust);
			section.style.fill = color.adjust(lightness, chroma, hue).toCSS();
		}

		return svg;
	}

	/**
	 * Randomly picks a template from available cache
	 * @private
	 * @returns {Promise<XMLDocument>}
	 */
	async __chooseTemplate() {
		await this.__fetchedOne;
		if(this.__cache.length == 0) {
			throw new Error("No templates to generate from");
		} else if(this.__cache.length == 1) {
			return await this.__cache[0];
		} else {
			return await this.__cache[Math.floor(Math.random() * this.__cache.length)];
		}
	}
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
 * Adds a balloon to the canvas. Finds the correct position in the DOM by ordering the balloons by size.
 * This ordering handles the z-layers.
 * @param {HTMLElement} canvas 
 * @param {HTMLElement} frame 
 */
function addToCanvas(canvas, frame) {
	let added = false;
	const size = frame.dataset.size;
	for(let i = 0; i < canvas.children.length; ++i) {
		const balloon = canvas.children.item(i);
		if(size < balloon.dataset.size) {
			canvas.insertBefore(frame, balloon);
			added = true;
			break;
		}
	}
	if(!added) {
		canvas.appendChild(frame);
	}
}

/**
 * Sets up a element so that it will drift to the right until it reaches the end of the screen,
 * at which point, it will be removed from the DOM.
 * Called recursively for each step, up or down.
 * @param {HTMLElement} elem - Target element to be moved
 * @param {DOMRect} rect - Bounding rectangle of the element
 * @param {Coordinate} initial - Current location of the Target element
 * @param {number} speed - How long to travel this animation step (ms)
 * @param {boolean} up - Determines whether to drift up or down
 */
async function moveRight(elem, rect, initial, speed, up) {
	const width = +elem.dataset.width;

	if(initial.x > 100) {
		const frame = elem.parentElement;
		frame.parentElement.removeChild(frame);
		return;
	}

	const end = up
		? initial.add(Coordinate.create(width * 2, -rect.height / 3))
		: initial.add(Coordinate.create(width * 2, rect.height / 3));

	await moveTo(elem, initial, end, speed);
	await moveRight(elem, rect, end, speed, !up);
	return;
}

function readAdjust(number) {
	if(typeof number === "undefined") {
		return 0
	}
	const convert = Number.parseFloat(number);
	return Number.isNaN(convert)
		? 0
		: convert;
}

/**
 * 
 * @param {string} range 
 * @returns 
 */
function generateFromRange(range) {
	if(!range.includes(',')) {
		return readAdjust(range);
	}

	const pair = range.split(',');
	if(pair.length != 2) {
		throw new Error("Badly formatted range.");
	}
	return randomBetween(readAdjust(pair[0]), readAdjust(pair[1]));
}
