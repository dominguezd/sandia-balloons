/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

var DAYLIGHT_CHECK = 60000
var DAY_START = 6;
var NIGHT_START = 18;
var MAX_BALLOONS = 20;
var MORE_BALLOONS_MONTH = 10;
var MORE_BALLOONS = 2609;
var STANDARD_BALLOONS = 4987;
var BALLOON_MOVEMENT = 6793;
var MIN_BALLOON_WIDTH = 2;
var MAX_BALLOON_WIDTH = 10;
var MIN_HUE = 0;
var MAX_HUE = 360;
var MIN_SATURATION = 90;
var MAX_SATURATION = 100;
var MIN_LIGHT = 25;
var MAX_LIGHT = 75;

document.addEventListener("DOMContentLoaded", function () {
	if(!('classList' in HTMLElement.prototype)) {
		return;
	}

	initMode();
	
	document.body.classList.add('html--ready');
	document.body.classList.add('page--ready');

	if(checkStickySupport()) {
		document.body.classList.add('html--sticky');
	}

	if('Promise' in window) {
		var pager = new Pager();

		initBalloons();
		initRouter(pager);
		initRefresh(pager);
	}
});

/**
 * Checks if the browser has sticky support
 * @returns {boolean} returns true if browser has sticky support
 */
function checkStickySupport() {
	var el = document.createElement('a');
	var style = el.style;
	style.cssText = "position:sticky;";
	return style.position.indexOf('sticky')!==-1;
}

/**
 * Checks every so often to determine whether to display day mode or night mode
 */
function initMode() {
	determineMode();
	setInterval(determineMode, DAYLIGHT_CHECK);
}

/**
 * Gets the current time and if it is between `DAY_START` and `NIGHT_START`, it is day mode
 * If is before `DAY_START` or after `NIGHT_START`, it is night mode
 */
function determineMode() {
	var hour = (new Date()).getHours();
	var currentlyNight = document.body.classList.contains('night');
	var isDay = hour >= DAY_START && hour < NIGHT_START;

	if(currentlyNight === isDay) {
		if(isDay) {
			document.body.classList.remove('night');
		} else {
			document.body.classList.add('night');
		}

		if('getComputedStyle' in window && 'querySelector' in document) {
			var skyBox = document.querySelector(".sky__box");
			var theme = document.querySelector('meta[name="theme-color"]');
			var style = window.getComputedStyle(skyBox);
			theme.setAttribute("content", style.backgroundColor);
		}
	}
}

/**
 * Overrides all internal links so that all content will be loaded onto the page
 * without forcing a page refresh action.
 */
function initRouter(pager) {
	var mainContent = document.getElementById('main');

	document.addEventListener('click', function (e) {
		if(e.defaultPrevented || e.button !== 0) {
			return;
		}

		var link = findNearestLink(e);

		if(link == null || window.location.hostname !== link.hostname) {
			return;
		}

		e.preventDefault();
		removePageContent(mainContent);

		var url = link.href;
		pager.load(url).then(function (page) {
			if(url !== window.location.href) {
				history.pushState('', page.title, url);
			}

			tranferPageContent(page, mainContent);
			window.scrollTo({left: 0, top: 0})
			window.dispatchEvent(new UIEvent('resize'));
		}).catch(function (e) {
			console.error(e)
			window.location.href = url;
		});
	});

	window.addEventListener('popstate', function () {
		pager.load(window.location.href).then(function (page) {
			removePageContent(mainContent);
			tranferPageContent(page, mainContent);
			window.dispatchEvent(new UIEvent('resize'));
		});
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
	var srcMain = src.getElementById('main');

	for(var child = srcMain.firstChild; child != null; child = srcMain.firstChild) {
		dst.appendChild(child);
	}

	document.title = src.title;
	document.body.classList.add('html--ready');
}

/**
 * Creates a pager object that able to fetch other page content
 * @constructor
 */
function Pager() {
	this.request = new XMLHttpRequest();
}

/**
 * Sends a request to fetch the page from the specified url.
 * If a request was already in-flight, cancels that request and sends another
 * @param {string} url
 * @returns {Promise<HTMLDocument>} Promise that is resolved when it fetches an HTML document.
 * Promise is rejected with an `Error` if it could not fetch the resource, or the resource is not a HTML Document.
 */
Pager.prototype.load = function (url) {
	var $request = this.request;
	return new Promise(function (resolve, reject) {
		$request.abort();

		$request.open("GET", url);
		$request.responseType = "document";
		$request.addEventListener('load', function () {
			if(!(this.responseXML instanceof HTMLDocument)) {
				reject(new Error("Response was not an HTML Document"));
			} else {
				resolve(this.responseXML);
			}
		})
		$request.addEventListener('error', function() {
			reject(new Error('Could not load ' + url));
		})

		$request.send();
	})
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
/**
 * Fetches a balloon SVG and uses that to populate the sky with balloons.
 */
function initBalloons() {
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
		console.log(balloonRate);

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
 * Fetches a XML document from the specified url.
 * @param {string} url
 * @returns {Promise<XMLDocument>} Promise that is resolved when it fetches an XML document.
 * Promise is rejected with an `Error` if it could not fetch the resource, or the resource is not a XML Document.
 */
function fetchXML(url) {
	return new Promise(function (resolve, reject) {
		var request = new XMLHttpRequest();

		request.open("GET", url);
		request.responseType = "document";
		request.addEventListener('load', function () {
			if(!(this.responseXML instanceof XMLDocument)) {
				reject(new Error("Response was not an XML Document"));
			} else {
				resolve(this.responseXML);
			}
		})
		request.addEventListener('error', function() {
			reject(new Error('Could not load ' + url));
		})
	
		request.send();
	})
}

/**
 * Generates a random color that has a good amount of saturation and light
 * @returns {String} random color in the form of HSL
 */
function generateColor() {
	var hue = Math.round(randomBetween(MIN_HUE, MAX_HUE));
	var saturation = Math.round(randomBetween(MIN_SATURATION, MAX_SATURATION));
	var light = randomBetween(MIN_LIGHT, MAX_LIGHT);
	return 'hsl(' + hue + ', ' + saturation + '%, ' + light + '%)';
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

function initRefresh(pager) {
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

function Coordinate(x, y) {
	this.x = x;
	this.y = y;
}

Coordinate.ZERO = new Coordinate(0, 0);

Coordinate.withX = function (x) {
	return new Coordinate(x, 0)
}

Coordinate.withY = function (y) {
	return new Coordinate(0, y);
}

Coordinate.create = function (x, y) {
	return new Coordinate(x, y);
};

Coordinate.from = function (obj) {
	return new Coordinate(obj.x, obj.y)
}

Coordinate.fromClient = function (event) {
	return new Coordinate(event.clientX, event.clientY);
}

Coordinate.prototype.add = function (that) {
	if(!(that instanceof Coordinate)) {
		throw new TypeError("Needs to be a Coordinate");
	}

	return new Coordinate(this.x + that.x, this.y + that.y);
};

Coordinate.prototype.subtract = function (that) {
	if(!(that instanceof Coordinate)) {
		throw new TypeError("Needs to be a Coordinate");
	}

	return this.add(that.negate());
};

Coordinate.prototype.negate = function () {
	return new Coordinate(-this.x, -this.y);
};

Coordinate.prototype.distance = function () {
	return Math.sqrt(this.x*this.x + this.y*this.y);
}

Coordinate.prototype.multiply = function (factor) {
	return new Coordinate(this.x*factor, this.y*factor);
}

Coordinate.prototype.divide = function (factor) {
	return new Coordinate(this.x/factor, this.y/factor);
}
