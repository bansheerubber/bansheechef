import adapter from "webrtc-adapter"

export default class Camera {
	constructor() {
		console.log(adapter.browserDetails.browser, adapter.browserDetails.version)
	}	
}