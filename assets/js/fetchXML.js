


/**
 * Fetches a XML document from the specified url.
 * @param {string} url
 * @returns {Promise<XMLDocument>} Promise that is resolved when it fetches an XML document.
 * Promise is rejected with an `Error` if it could not fetch the resource, or the resource is not a XML Document.
 */
export default function fetchXML(url) {
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