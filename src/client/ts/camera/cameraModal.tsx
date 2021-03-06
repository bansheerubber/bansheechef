import * as React from "react"
import { connect } from "react-redux"
import Modal from "../modal/modal"
import { State } from "../reducer"
import CameraView from "./cameraView"
import { setCameraModalShown } from "./cameraActions"

interface CameraModalReduxState {
	modalShown: boolean
}

interface CameraModalDispatchState {
	setCameraModalShown: (value: boolean) => void
}

type OwnProps = CameraModalReduxState & CameraModalDispatchState

class CameraModel extends React.Component<OwnProps> {
	render(): JSX.Element {
		const {
			modalShown,
			setCameraModalShown,
		} = this.props

		return (
			modalShown ? <Modal
				onClose={() => setCameraModalShown(false)}
			>
				<CameraView
					onAccept={() => setCameraModalShown(false)}
					screenshottable={true}
					streamVideo="/barcode-offer/"
				/>
			</Modal>
			: null
		)
	}
}

const mapStateToProps = (state: State) => ({
	modalShown: state.camera.modalShown,
})

const mapDispatchToProps = (dispatch) => ({
	setCameraModalShown: (value: boolean) => dispatch(setCameraModalShown(value)),
})

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(CameraModel)