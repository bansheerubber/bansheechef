import * as React from "react"
import { connect } from "react-redux"
import adapter from "webrtc-adapter"
import requestBackend from "../helpers/requestBackend"
import { State } from "../reducer"
import { Camera } from "./camera"
import { setCameraPicture } from "./cameraActions"

interface CameraProps {
	/**
	 * when we accept the screenshot
	 */
	onAccept?: () => void
	/**
	 * whether or not we can take screenshots
	 */
	screenshottable?: boolean
	/**
	 * whether or not we stream video to the specified URL path using rtc
	 */
	streamVideo?: string

	style?: React.CSSProperties
}

interface CameraReduxState {
	picture: string
}

interface CameraReduxDispatch {
	screenshot: (picture: string, pictureBlob: Blob) => void
}

interface CameraState {
	cover: boolean
	isRecording: boolean
	videoWidth: number
	videoHeight: number
}

type OwnProps = CameraProps & CameraReduxState & CameraReduxDispatch

class CameraView extends React.Component<OwnProps, CameraState> {
	private canvas: React.RefObject<HTMLCanvasElement>
	private video: React.RefObject<HTMLVideoElement>
	private videoCover: React.RefObject<HTMLDivElement>
	private connection: RTCPeerConnection
	
	constructor(props) {
		super(props)

		this.canvas = React.createRef()
		this.video = React.createRef()
		this.videoCover = React.createRef()

		this.state = {
			cover: false,
			isRecording: false,
			videoWidth: 0,
			videoHeight: 0,
		}
	}

	/**
	 * shows the crop boundary for taking screenshots
	 */
	showCropBoundary() {
		this.setState({
			cover: false,
		})
		
		this.canvas.current.width = this.video.current.videoWidth
		this.canvas.current.height = this.video.current.videoHeight
		this.canvas.current.style.width = null
		this.canvas.current.style.height = null
		
		// draw cropping area
		const smallestDimension = Math.min(this.canvas.current.width, this.canvas.current.height)
		const croppingWidth = smallestDimension - 25
		const centerX = this.canvas.current.width / 2
		const centerY = this.canvas.current.height / 2

		const boundaries = []
		boundaries.push([Math.floor(centerX - croppingWidth / 2), Math.floor(centerY - croppingWidth / 2)])
		boundaries.push([Math.floor(centerX + croppingWidth / 2), Math.floor(centerY - croppingWidth / 2)])
		boundaries.push([Math.floor(centerX + croppingWidth / 2), Math.floor(centerY + croppingWidth / 2)])
		boundaries.push([Math.floor(centerX - croppingWidth / 2), Math.floor(centerY + croppingWidth / 2)])

		const context = this.canvas.current.getContext("2d")
		context.clearRect(0, 0, this.canvas.current.width, this.canvas.current.height)
		context.lineWidth = 4
		context.strokeStyle = "#FF0000"

		context.beginPath()
		for(let i = 0; i < 4; i++) {
			const x = boundaries[i][0]
			const y = boundaries[i][1]
			let nextX = boundaries[(i + 1) % 4][0]
			let nextY = boundaries[(i + 1) % 4][1]

			if(x == nextX) {
				nextX += (y - nextY > 0 ? 1 : -1) * 2
			}

			if(y == nextY) {
				nextY += (x - nextX > 0 ? -1 : 1) * 2
			}

			context.moveTo(x, y)
			context.lineTo(nextX, nextY)
		}
		context.stroke()
	}
	
	componentDidMount() {
		const {
			screenshottable,
			streamVideo,
		} = this.props

		if(screenshottable) {
			this.props.screenshot(null, null) // reset the screenshot field
		}
				
		this.video.current.addEventListener("play", (event) => {
			this.canvas.current.width = this.video.current.videoWidth
			this.canvas.current.height = this.video.current.videoHeight

			this.setState({
				isRecording: true,
			})

			this.setState({
				videoWidth: this.video.current.clientWidth,
				videoHeight: this.video.current.clientHeight,
			})

			if(screenshottable) {
				this.showCropBoundary()
			}
		})
		
		Camera.startCamera().then((stream) => {
			this.video.current.srcObject = stream
		})
	}

	componentWillUnmount() {
	}

	screenshot() {
		const {
			screenshot,
		} = this.props
		
		const context = this.canvas.current.getContext("2d")
		const smallestDimension = Math.min(this.canvas.current.width, this.canvas.current.height)
		const croppingWidth = Math.floor(smallestDimension - 25)
		this.canvas.current.width = croppingWidth
		this.canvas.current.height = croppingWidth
		context.clearRect(0, 0, this.canvas.current.width, this.canvas.current.height)

		const centerX = this.video.current.videoWidth / 2
		const centerY = this.video.current.videoHeight / 2
		context.drawImage(
			this.video.current,
			Math.floor(centerX - croppingWidth / 2),
			Math.floor(centerY - croppingWidth / 2),
			croppingWidth,
			croppingWidth,
			0,
			0,
			croppingWidth,
			croppingWidth,
		)

		this.canvas.current.style.width = `${this.video.current.clientHeight}px`
		this.canvas.current.style.height = `${this.video.current.clientHeight}px`

		this.setState({
			cover: true,
		})

		this.canvas.current.toBlob(blob => {
			screenshot(this.canvas.current.toDataURL("image/png"), blob)
		})
	}

	/**
	 * retake the screenshot
	 */
	retake() {
		const {
			screenshot,
		} = this.props
		screenshot(null, null)
		this.showCropBoundary()
	}

	render(): JSX.Element {
		const {
			onAccept,
			picture,
			screenshottable,
			style,
		} = this.props

		return <div className="camera" style={style}>
			<canvas ref={this.canvas} />
			<div
				className="temp-video"
				style={{
					display: this.state.isRecording ? "none" : "block",
				}}
			/>
			<div
				className="video-cover"
				ref={this.videoCover}
				style={{
					display: screenshottable && this.state.cover ? "block" : "none", 
					width: this.state.videoWidth,
					height: this.state.videoHeight,
				}}
			/>
			<video
				autoPlay
				ref={this.video}
				style={{
					display: this.state.isRecording ? "block" : "none",
				}}
			/>
			{
				screenshottable ? <div className="buttons">
					{
						screenshottable && !this.state.cover ? <button className="button blue" onClick={() => this.screenshot()}>
							Take Picture
						</button> : null
					}
					{
						screenshottable && this.state.cover ? <button className="button blue" onClick={() => onAccept()}>
							Submit Picture
						</button> : null
					}
					{
						screenshottable && this.state.cover ? <button className="button blue" onClick={() => this.retake()}>
							Re-Take Picture
						</button> : null
					}
				</div>
				: null
			}
		</div>
	}
}

const mapStateToProps = (state: State) => ({
	picture: state.camera.picture,
})

const mapDispatchToProps = (dispatch) => ({
	screenshot: (picture, pictureBlob) => dispatch(setCameraPicture(picture, pictureBlob)),
})

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(CameraView)