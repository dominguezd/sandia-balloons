/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as Mode from "./mode.js"
import Pager from "./pager.js"
import * as Router from "./router.js"
import * as Balloons from "./balloons.js"
import * as Refresh from "./refresh.js"

document.addEventListener("DOMContentLoaded", function () {
	Mode.init();
	
	document.body.classList.add('html--ready');
	document.body.classList.add('page--ready');

	if('Promise' in window) {
		var pager = new Pager();

		Balloons.init();
		Router.init(pager);
		Refresh.init(pager);
	}
});