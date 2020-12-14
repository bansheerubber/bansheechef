import * as React from "react"
import { connect } from "react-redux"
import CameraView from "../camera/cameraView"
import { setCameraModalShown } from "../camera/cameraActions"
import { Cups } from "../helpers/convertUnits"
import requestBackend from "../helpers/requestBackend"
import Modal from "../modal/modal"
import { State } from "../reducer"
import AmountInput from "./amountInput"
import { setAddIngredientShown } from "./ingredientActions"
import { IngredientData, IngredientTypeData, translateIngredient, translateIngredientType } from "./ingredientData"
import Ingredient from "./ingredient"
import { Camera } from "../camera/camera"
import { resolveUrl } from "../helpers/resolveUrl"

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
	barcode: string
	barcodeMode: boolean
	name: string
	picture: string
}

class AddIngredientModal extends React.Component<OwnProps, AddIngredientModalState> {
	private lastAddIngredientShown: boolean = false
	
	constructor(props) {
		super(props)

		this.state = {
			addedIngredients: [],
			amount: 0,
			barcode: "",
			barcodeMode: false,
			name: "",
			picture: "",
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
			barcode,
			barcodeMode,
			name,
		} = this.state

		if(barcodeMode) {
			Camera.dataChannel.send("start") // start up barcode recognition again
		}
		
		requestBackend(
			"/add-ingredient/",
			"POST",
			{
				barcode,
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

	onShowModal() {
		Camera.startCamera().then(() => {
			Camera.startRTC("/barcode-offer/").then(() => {
				// setup the data channel
				Camera.dataChannel.onmessage = (event) => {
					const message = JSON.parse(event.data)
					const barcode = message.found[0]

					this.setState({
						barcode,
					})

					// if we're in barcode mode, query website for ingreident and add it
					if(this.state.barcodeMode) {
						requestBackend("/get-barcode/", "POST", {
							barcode,
						}).then((result: IngredientTypeData) => {
							if(result.name) {
								Camera.dataChannel.send("stop") // stop barcode recognition for saving resources
								
								this.setState({
									amount: result.maxAmount,
									barcode,
									name: result.name,
									picture: resolveUrl(result.image),
								})
							}
						})
					}
				}
			})
		})
	}

	onHideModal() {
		Camera.stopRTC()
	}

	componentDidUpdate() {
		const {
			addIngredientShown,
		} = this.props

		if(addIngredientShown != this.lastAddIngredientShown) {
			if(addIngredientShown) {
				this.onShowModal()
			}
			else {
				this.onHideModal()
			}
			
			this.lastAddIngredientShown = addIngredientShown
		}
	}
	
	render(): JSX.Element {
		const {
			addIngredientShown,
			close,
			picture,
			showCamera,
		} = this.props

		const ingredient = (<>
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
				<input
					className="text-input"
					placeholder="Barcode"
					value={this.state.barcode}
				/>
			</div>
		</>)

		const barcodeIngredient = (<>
			<div>
				<div style={{
					backgroundImage: !this.state.picture ? "url(/static/no-image.png)" : `url(${this.state.picture})`,
					borderRadius: 4,
				}} />
			</div>
			<div
				className="inputs"
				style={{
					width: 250,
				}}
			>
				<input
					className="text-input"
					placeholder="Name"
					value={this.state.name}
				/>
				<button
					className="button blue"
					onClick={() => {
						this.uploadIngredient()
						this.setState({
							name: "",
						})
					}}
				>
					Add Ingredient
				</button>
			</div>
		</>)

		const barcodeWaiting = (<div>
			<h1 style={{
				textAlign: "center",
			}}>
				Waiting for Barcode...
			</h1>
			<CameraView style={{
				height: "auto",
			}} />
		</div>)

		const addByBarcodeIngredient = this.state.name ? barcodeIngredient : barcodeWaiting

		const addIngredientDialog = (
			<div className="dialog">
				<button
					className="button blue"
					onClick={() => this.uploadIngredient()}
				>
					Add Ingredient
				</button>
				<h2 style={{
					textAlign: "center",
				}}>
					or
				</h2>
				<button
					className="button gray"
					onClick={() => {
						this.setState({
							amount: undefined,
							barcodeMode: true,
							name: "",
							picture: "",
						})
					}}
				>
					Add By Barcode
				</button>
			</div>
		)

		const switchToManualDialog = (
			<div className="dialog">
				<button
					className="button gray"
					onClick={() => {
						this.setState({
							amount: undefined,
							barcodeMode: false,
							name: "",
							picture: "",
						})
					}}
				>
					Add Ingredients Manually
				</button>
			</div>
		)

		return (
			addIngredientShown ? <Modal
				className="add-ingredient"
				onClose={close}
			>
				<div>
					{this.state.barcodeMode ? addByBarcodeIngredient : ingredient}
					{this.state.barcodeMode ? switchToManualDialog : addIngredientDialog}
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