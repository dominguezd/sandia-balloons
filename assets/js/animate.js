

/**
 * Animates the element to the specified location within the specified time
 * @param {HTMLElement} elem - Target element
 * @param {Coordinate} from - Current position of the element
 * @param {Coordinate} to - Destination of the element
 * @param {Number} time - Time it should take
 */
export function moveTo(elem, from, to, time) {
	const start = performance.now()

	return new Promise(function (resolve) {
		function step() {
			const now = performance.now()
			const taken = (now - start)

			if(taken >= time) {
				setPosition(elem, to.x, to.y);
				resolve(to)
				return;
			}

			const current = to.subtract(from)
				.multiply(taken/time)
				.add(from);

			setPosition(elem, current)

			requestAnimationFrame(step)
		}

		requestAnimationFrame(step)
	})
}

/**
 * Sets the CSS transform of the element to the specified coordinate
 * @param {HTMLElement} elem 
 * @param {Coordinate} coord
 */
export function setPosition(elem, coord) {
	elem.style.transform = 'translate(' + coord.x + 'vw, ' + coord.y + 'px)';
}