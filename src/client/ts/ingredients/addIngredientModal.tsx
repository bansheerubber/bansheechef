import * as React from "react"
import { connect } from "react-redux"
import Camera from "../camera/camera"
import { setCameraModalShown } from "../camera/cameraActions"
import { Cups } from "../helpers/convertUnits"
import requestBackend from "../helpers/requestBackend"
import Modal from "../modal/modal"
import { State } from "../reducer"
import AmountInput from "./amountInput"
import { setAddIngredientShown } from "./ingredientActions"

interface AddIngredientReduxState {
	addIngredientShown: boolean
	picture: string
	pictureBlob: Blob
}

interface AddIngredientReduxDispatch {
	close: () => void
	showCamera: () => void
}

type OwnProps = AddIngredientReduxState & AddIngredientReduxDispatch

interface AddIngredientModalState {
	amount: Cups
	name: string
}

class AddIngredientModal extends React.Component<OwnProps, AddIngredientModalState> {
	constructor(props) {
		super(props)

		this.state = {
			amount: 0,
			name: "",
		}
	}
	
	uploadIngredient() {
		const {
			pictureBlob,
		} = this.props

		const {
			amount,
			name,
		} = this.state
		
		requestBackend(
			"/add-ingredient/",
			"POST",
			{
				name,
				maxAmount: amount,
				picture: pictureBlob,
			},
		)
	}
	
	render(): JSX.Element {
		const {
			addIngredientShown,
			close,
			picture,
			showCamera,
		} = this.props

		return (
			addIngredientShown ? <Modal
				className="add-ingredient"
				onClose={close}
				style={{
					display: "flex",
				}}
			>
				<div>
					<div style={{
						backgroundImage: !picture ? "url(./data/no-image.png)" : `url(${picture})`,
						borderTopRightRadius: 4,
						borderTopLeftRadius: 4,
					}} />
					<button
						className="button gray"
						onClick={showCamera}
						style={{
							width: 300,
							borderRadius: 0,
							borderBottomRightRadius: 4,
							borderBottomLeftRadius: 4,
						}}
					>
						Upload Image
					</button>
				</div>
				<div
					className="inputs"
					style={{
						width: 300,
					}}
				>
					<input
						className="text-input"
						onChange={(event) => this.setState({
							name: event.currentTarget.value,
						})}
						placeholder="Name"
						value={this.state.name}
					/>
					<AmountInput
						onChange={(amount) => this.setState({
							amount,
						})}
					/>
					<button
						className="button blue"
						onClick={() => this.uploadIngredient()}
					>
						Add Ingredient
					</button>
				</div>
				{/* list of the ingredients you've added */}
				<div className="added-list">

				</div>
			</Modal>
			: null
		)
	}
}

const mapStateToProps = (state: State) => ({
	addIngredientShown: state.ingredients.addIngredientShown,
	picture: state.camera.picture,
	pictureBlob: state.camera.pictureBlob,
})

const mapDispatchToProps = (dispatch) => ({
	close: () => dispatch(setAddIngredientShown(false)),
	showCamera: () => dispatch(setCameraModalShown(true)),
})

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(AddIngredientModal)