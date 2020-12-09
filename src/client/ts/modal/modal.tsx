import * as React from "react"
import { connect } from "react-redux"
import { State } from "../reducer";
import { popModal, pushModal } from "./modalActions";

interface ModalProps {
	className: string
	onClose: () => void
	onHide?: () => void
	onShown?: () => void
	children: JSX.Element | JSX.Element[]
	style?: React.CSSProperties
}

interface ModalReduxState {
	currentModal: Modal
}

interface ModalDispatchState {
	pushModal: (modal: Modal) => void
	popModal: (modal: Modal) => void
}

type OwnProps = ModalProps & ModalReduxState & ModalDispatchState;

class Modal extends React.Component<OwnProps> {
	private lastShown: boolean = false
	
	componentDidMount() {
		const {
			pushModal
		} = this.props
		pushModal(this)
	}

	componentWillUnmount() {
		const {
			popModal
		} = this.props
		popModal(this)
	}
	
	render(): JSX.Element {
		const {
			className,
			currentModal,
			onClose,
			onHide,
			onShown,
			style,
		} = this.props

		const shown = currentModal === this
		if(shown != this.lastShown) {
			if(shown && onShown) {
				onShown()
			}
			else if(!shown && onHide) {
				onHide()
			}
		}
		this.lastShown = shown
		
		return <div style={{
			display: shown ? "block" : "none", 
		}}>
			<div className="modal">
				<div className="modal-header">
					<button onClick={onClose}>&#10005;</button>
				</div>
				<div className={`modal-body ${className}`.trim()} style={style}>{this.props.children}</div>
			</div>
			<div className="modal-blackout" />
		</div>
	}
}

const mapStateToProps = (state: State) => ({
	currentModal: state.modal.currentModal,
})

const mapDispatchToProps = (dispatch) => ({
	pushModal: (modal) => dispatch(pushModal(modal)),
	popModal: (modal) => dispatch(popModal(modal)),
})

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(Modal)