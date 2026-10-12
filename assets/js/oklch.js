/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

export default class Oklch {
    constructor(lightness, chroma, hue) {
        this.lightness = Math.max(Math.min(lightness, 100), 0);
        this.chroma = chroma;
        this.hue = hue % 360;
    }

    adjust(lightness, chroma, hue) {
        return new Oklch(this.lightness + lightness, this.chroma + chroma, this.hue + hue);
    }

    toCSS() {
        return `oklch(${this.lightness}% ${this.chroma} ${this.hue}deg)`
    }
}