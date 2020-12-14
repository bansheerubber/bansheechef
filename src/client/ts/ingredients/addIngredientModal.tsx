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
import { IngredientData, IngredientTypeData, translateIngredient, translateIngredientType } from "./ingredientData"
import Ingredient from "./ingredient"

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
	addedIngredients: IngredientData[]
	amount: Cups
	name: string
}

class AddIngredientModal extends React.Component<OwnProps, AddIngredientModalState> {
	constructor(props) {
		super(props)

		this.state = {
			addedIngredients: [],
			amount: 0,
			name: "",
		}
	}

	deleteIngredient(ingredient: IngredientData) {
		requestBackend(
			"/delete-ingredient/",
			"POST",
			{
				id: ingredient.id,
				typeId: ingredient.type.id,
			}
		).then((data: any) => {
			if(data.success) {
				this.state.addedIngredients.splice(this.state.addedIngredients.indexOf(ingredient), 1)
				this.setState({
					addedIngredients: [...this.state.addedIngredients],
				})
			}
		})
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
		).then((data: any) => {
			this.state.addedIngredients.unshift(translateIngredient(data))
			this.setState({
				addedIngredients: [...this.state.addedIngredients],
			})
		})
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
			>
				<div>
					<div>
						<div style={{
							backgroundImage: !picture ? "url(/static/no-image.png)" : `url(${picture})`,
							borderTopRightRadius: 4,
							borderTopLeftRadius: 4,
						}} />
						<button
							className="button gray"
							onClick={showCamera}
							style={{
								width: 250,
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
							width: 250,
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
						<button className="button gray">Scan Barcode</button>
						<button
							className="button blue"
							onClick={() => this.uploadIngredient()}
						>
							Add Ingredient
						</button>
					</div>
				</div>
				{/* list of the ingredients you've added */}
				<div
					className="added-list ingredients"
				>
					{this.state.addedIngredients.map(
						data => <Ingredient
							canDelete={true}
							canDrag={false}
							onDelete={() => this.deleteIngredient(data)}
							data={data}
							dataType={data.type}
						/>
					)}
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