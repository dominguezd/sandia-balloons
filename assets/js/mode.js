/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

const DAYLIGHT_CHECK = 60000
const DAY_START = 6;
const NIGHT_START = 18;

/**
 * Checks every so often to determine whether to display day mode or night mode
 */
export function init() {
	determine();
	setInterval(determine, DAYLIGHT_CHECK);
}

/**
 * Gets the current time and if it is between `DAY_START` and `NIGHT_START`, it is day mode
 * If is before `DAY_START` or after `NIGHT_START`, it is night mode
 */
function determine() {
	const hour = (new Date()).getHours();
	const currentlyNight = document.body.classList.contains('night');
	const isDay = hour >= DAY_START && hour < NIGHT_START;

	if(currentlyNight === isDay) {
		if(isDay) {
			document.body.classList.remove('night');
		} else {
			document.body.classList.add('night');
		}

        const skyBox = document.querySelector(".sky__box");
        const theme = document.querySelector('meta[name="theme-color"]');
        const style = window.getComputedStyle(skyBox);
        theme.setAttribute("content", style.backgroundColor);
	}
}