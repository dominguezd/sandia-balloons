/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export default class Coordinate {
	/**
	 * Creates a new coordinate
	 * @param {number} x 
	 * @param {number} y 
	 */
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	/**
	 * Creates a new coordinate along the y-axis at location `x`
	 * @param {number} x 
	 * @returns new Coordinate
	 */
	static withX(x) {
		return new Coordinate(x, 0);
	}

	/**
	 * Creates a new coordinate along the x-axis at location `y`
	 * @param {number} y 
	 * @returns new Coordinate
	 */
	static withY(y) {
		return new Coordinate(0, y);
	}

	/**
	 * Invokes the constructor to create a new coordinate at (x,y)
	 * @param {number} x 
	 * @param {number} y 
	 * @returns new coordinate 
	 */
	static create(x, y) {
		return new Coordinate(x, y);
	}

	/**
	 * Pulls fields x and y from an object and sets it into a new Coordinate
	 * @param {*} obj 
	 * @returns new coordinate
	 */
	static from(obj) {
		return new Coordinate(obj.x, obj.y);
	}

	/**
	 * Pulls the client fields from and event
	 * @param {Event} event 
	 * @returns new coordinate
	 */
	static fromClient(event) {
		return new Coordinate(event.clientX, event.clientY);
	}

	/**
	 * Adds two coordinates together
	 * @param {Coordinate} that 
	 * @returns the sum of the two coordinates
	 */
	add(that) {
		if (!(that instanceof Coordinate)) {
			throw new TypeError("Needs to be a Coordinate");
		}

		return new Coordinate(this.x + that.x, this.y + that.y);
	}

	/**
	 * Subtracts one coordinate from another
	 * @param {Coordinate} that 
	 * @returns the result of the subtraction
	 */
	subtract(that) {
		if (!(that instanceof Coordinate)) {
			throw new TypeError("Needs to be a Coordinate");
		}

		return this.add(that.negate());
	}

	/**
	 * Flips the negation sign
	 * @returns the negative result of the coordinate
	 */
	negate() {
		return new Coordinate(-this.x, -this.y);
	}
	
	/**
	 * Calculates the distance of the coordinate to the origin
	 * @returns the distance
	 */
	distance() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	/**
	 * Multiplies the coordinate by a factor
	 * @param {number} factor 
	 * @returns 
	 */
	multiply(factor) {
		return new Coordinate(this.x * factor, this.y * factor);
	}

	/**
	 * Divides the coordinate by a factor
	 * @param {number} factor 
	 * @returns 
	 */
	divide(factor) {
		return new Coordinate(this.x / factor, this.y / factor);
	}
}

Coordinate.ZERO = new Coordinate(0, 0);












