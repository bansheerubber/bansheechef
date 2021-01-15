import requestBackend from "../helpers/requestBackend"

// singleton
export class Camera {
	private static connection: RTCPeerConnection = null
	private static _stream: MediaStream = null
	private static isStarted: boolean = false
	private static _dataChannel: RTCDataChannel = null

	static async startCamera(): Promise<MediaStream> {
		return new Promise((resolve, reject) => {
			if(!this.stream?.active) {
				navigator.mediaDevices.getUserMedia({
					video: {
						width: {
							ideal: 1280,
						},
						height: {
							ideal: 720,
						},
					} 
				}).then((stream) => {
					this._stream = stream
					resolve(stream)
				})
				this.isStarted = true
			}
			else {
				resolve(this.stream)
			}
		})
	}

	static get stream(): MediaStream {
		return this._stream
	}

	static async startRTC(destination: string) {
		// only start a connection if we already have one
		if(this.connection) {
			return
		}
		
		// create the connection
		this.connection = new RTCPeerConnection({
			sdpSemantics: "unified-plan",
		} as RTCConfiguration)

		// add camera tracks from our stream
		for(const track of this.stream.getVideoTracks()) {
			this.connection.addTrack(track, this.stream)
		}

		// create the data channel
		this._dataChannel = this.connection.createDataChannel("data")
	
		// create our offer that we will later send
		const offer = await this.connection.createOffer()
		await this.connection.setLocalDescription(offer)

		// wait for ice gathering to be completed
		// TODO is this necesary?
		await new Promise<void>((resolve) => {
			if(this.connection.iceGatheringState === "complete") {
				resolve()
			}
			else {
				const checkState = () => {
					if(this.connection.iceGatheringState === "complete") {
						this.connection.removeEventListener("icegatheringstatechange", checkState)
						resolve()
					}
				}
				this.connection.addEventListener("icegatheringstatechange", checkState)
			}
		})

		this.connection.addEventListener("track", (event) => {
			this._stream = event.streams[0]
		})
	
		// send our offer to the server
		const remoteOffer = await requestBackend(destination, "POST", {
			sdp: this.connection.localDescription.sdp,
			type: this.connection.localDescription.type,
		})
		
		// set our description based on the server's response
		await this.connection.setRemoteDescription(remoteOffer)
	}

	static stopRTC() {
		if(this.connection) {
			// close senders
			this.connection.getSenders().forEach((sender) => {
				sender.track.stop()
			})

			this._dataChannel.close()

			this.connection.close()

			// reset the connection
			this.connection = null
			this._dataChannel = null
		}
	}

	static get dataChannel(): RTCDataChannel {
		return this._dataChannel
	}
}