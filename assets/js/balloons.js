import Coordinate from "./coordinate.js";
import fetchXML from "./fetchXML.js";

var MAX_BALLOONS = 20;
var MORE_BALLOONS_MONTH = 10;
var MORE_BALLOONS = 1801;
var STANDARD_BALLOONS = 3823;
var BALLOON_MOVEMENT = 4517;
var MIN_BALLOON_WIDTH = 2;
var MAX_BALLOON_WIDTH = 10;
var MIN_HUE = 0;
var MAX_HUE = 360;
var MIN_CHROMA = 0.08;
var MAX_CHROMA = 0.16;
var MIN_LIGHTNESS = 0.65;
var MAX_LIGHTNESS = 0.85;

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Fetches a balloon SVG and uses that to populate the sky with balloons.
 */
export function init() {
	/** @type {HTMLElement} */
	var balloonsCanvas = document.querySelector('.sky .sky__balloons');
	var url = balloonsCanvas.getAttribute('data-balloon');
	setBalloonCanvasHeight(balloonsCanvas);
	var balloonHeightRange = MAX_BALLOON_WIDTH - MIN_BALLOON_WIDTH;

	fetchXML(url).then(function (svg) {
		function createBalloon() {
			if(document.hidden || randomBetween(0, 1) < .5) {
				return;
			}

			if(balloonsCanvas.children.length > MAX_BALLOONS) {
				return;
			}

			var cloth = svg.getElementById('balloon');
			cloth.style.fill = generateColor();

			/** @type {HTMLElement} */
			var root = svg.documentElement.cloneNode(true);
			var frame = document.createElement('div');
			var n = randomBetween(0, 1);
			var size = 1-(n*n);
			var width = (size*balloonHeightRange)+MIN_BALLOON_WIDTH;
			root.style.width = width + 'vw';

			frame.appendChild(root);

			frame.style.top = ((1-size)*100) + "%"

			var added = false;
			for(var i = 0; i < balloonsCanvas.children.length; ++i) {
				var balloon = balloonsCanvas.children.item(i);
				if(width < balloon.dataset.size) {
					balloonsCanvas.insertBefore(frame, balloon);
					added = true;
					break;
				}
			}
			if(!added) {
				balloonsCanvas.appendChild(frame);
			}

			var rect = root.getBoundingClientRect();
			var position = Coordinate.from({
				x: -width - randomBetween(0, width),
				y: 0
			});

			root.dataset.width = width;
			frame.dataset.size = size;

			if(!('ratio' in balloonsCanvas.dataset)) {
				var ratio = (+root.attributes.height.value)/(+root.attributes.width.value);
				balloonsCanvas.dataset.ratio = ratio;
			}

			setPosition(root, position);

			moveRight(root, rect, position, true);
		}

		var balloonRate = (new Date()).getMonth()+1 == MORE_BALLOONS_MONTH ? MORE_BALLOONS : STANDARD_BALLOONS;

		createBalloon();
		setInterval(createBalloon, balloonRate);
	});
}

/**
 * @param {HTMLElement} balloonsCanvas
 * Adds a resize listener to that it can resize appropiately.
 */
function setBalloonCanvasHeight(balloonsCanvas) {
	/** @type {HTMLElement} */
	var mountain = document.querySelector('body .mountain__range');

	function resize() {
		var mountainRect = mountain.getBoundingClientRect();
		var boxHeight = window.innerHeight - (mountainRect.height + (window.innerWidth * (MIN_BALLOON_WIDTH/100)));

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
	var lightness = randomBetween(MIN_LIGHTNESS, MAX_LIGHTNESS);
	var chroma = randomBetween(MIN_CHROMA, MAX_CHROMA);
	var hue = Math.round(randomBetween(MIN_HUE, MAX_HUE));
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
function moveRight(elem, rect, initial, up) {
	var width = +elem.dataset.width;
	if(initial.x > 100) {
		var frame = elem.parentElement;
		frame.parentElement.removeChild(frame);

		return Promise.resolve();
	}

	var end = up
		? initial.add(Coordinate.create(width * 2, -rect.height / 3))
		: initial.add(Coordinate.create(width * 2, rect.height / 3));

	return moveTo(elem, initial, end, BALLOON_MOVEMENT).then(function () {
		return moveRight(elem, rect, end, !up);
	})
}

/**
 * Sets the CSS transform of the element to the specified coordinate
 * @param {HTMLElement} elem 
 * @param {Coordinate} coord
 */
function setPosition(elem, coord) {
	elem.style.transform = 'translate(' + coord.x + 'vw, ' + coord.y + 'px)';
}

/**
 * Animates the element to the specified location within the specified time
 * @param {HTMLElement} elem - Target element
 * @param {Coordinate} from - Current position of the element
 * @param {Coordinate} to - Destination of the element
 * @param {Number} time - Time it should take
 */
function moveTo(elem, from, to, time) {
	var start = performance.now()

	return new Promise(function (resolve) {
		function step() {
			var now = performance.now()
			var taken = (now - start)

			if(taken >= time) {
				setPosition(elem, to.x, to.y);
				resolve(to)
				return;
			}

			var current = to.subtract(from)
				.multiply(taken/time)
				.add(from);

			setPosition(elem, current)

			requestAnimationFrame(step)
		}

		requestAnimationFrame(step)
	})
}