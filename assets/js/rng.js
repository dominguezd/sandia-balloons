/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Generates a random Number between two Numbers
 * @param {Number} min - The minimum a Number could be
 * @param {Number} max - The maximum but not including the Number
 * @returns {Number}
 */
export function randomBetween(min, max) {
	return Math.random() * (max-min) + min
}

export class RandomEventSignaler {
	/**
	 * 
	 * @param {HTMLElement} canvas 
	 * @param {string} eventName 
	 * @param {number} balloonEveryMS 
	 */
	constructor(target, eventName, approximateInterval) {
		this.__ApproximateInterval = approximateInterval;
		this.__eventName = eventName;
		this.__target = target;
	}

	init() {
		requestAnimationFrame(time => this.rollForEvent(time));
	}

	rollForEvent(prior) {
		requestAnimationFrame(current => {
			this.rollForEvent(current);

			const diff = current - prior;

			const chosen = Math.random() * this.__ApproximateInterval;

			if(chosen < diff) {
				const spawnBalloon = new CustomEvent(this.__eventName);
				this.__target.dispatchEvent(spawnBalloon);
			}
		});
	}
}