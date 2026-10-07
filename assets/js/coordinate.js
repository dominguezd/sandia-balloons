/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export default class Coordinate {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	static withX(x) {
		return new Coordinate(x, 0);
	}
	static withY(y) {
		return new Coordinate(0, y);
	}
	static create(x, y) {
		return new Coordinate(x, y);
	}
	static from(obj) {
		return new Coordinate(obj.x, obj.y);
	}
	static fromClient(event) {
		return new Coordinate(event.clientX, event.clientY);
	}
	add(that) {
		if (!(that instanceof Coordinate)) {
			throw new TypeError("Needs to be a Coordinate");
		}

		return new Coordinate(this.x + that.x, this.y + that.y);
	}
	subtract(that) {
		if (!(that instanceof Coordinate)) {
			throw new TypeError("Needs to be a Coordinate");
		}

		return this.add(that.negate());
	}
	negate() {
		return new Coordinate(-this.x, -this.y);
	}
	distance() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}
	multiply(factor) {
		return new Coordinate(this.x * factor, this.y * factor);
	}
	divide(factor) {
		return new Coordinate(this.x / factor, this.y / factor);
	}
}

Coordinate.ZERO = new Coordinate(0, 0);












