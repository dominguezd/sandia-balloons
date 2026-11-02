export function wait(milliseconds) {
	return new Promise(function (resolve) {
		setTimeout(function () {
			resolve(milliseconds);
		}, milliseconds);
	});
}

export function waitAfter(milliseconds) {
	return function () {
		return wait(milliseconds)
	}
}