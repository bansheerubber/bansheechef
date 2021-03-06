import * as React from "react"
import { connect } from "react-redux"
import { convertToReasonableMeasurement } from "../helpers/convertUnits"
import { State } from "../reducer"
import { CONSTANTS } from "./constants"
import { addIngredient, removeIngredient, setDraggable, setSelectedIngredient } from "./ingredientActions"
import IngredientAPI from "./ingredientAPI"
import { IngredientData, IngredientTypeData } from "./ingredientData"

export interface IngredientProps {
	data: IngredientData
	/**
	 * defaults to false
	 */
	canDelete?: boolean

	/**
	 * defaults to true
	 */
	canDrag?: boolean

	onDelete?: () => void

	style?: React.CSSProperties
}

interface IngredientReduxState {
	selectedIngredient: IngredientData
}

interface IngredientReduxDispatch {
	addAnother: (ingredient: IngredientTypeData) => void
	removeIngredient: (ingredient: IngredientData) => void
	setSelectedIngredient: (ingredient: IngredientData) => void
	setDraggable: (draggable: {
		x?: number,
		y?: number,
		dataType?: IngredientTypeData,
	}) => void
}

type OwnProps = IngredientProps & IngredientReduxState & IngredientReduxDispatch

interface IngredientState {
	isDragging: boolean
	isSelected: boolean
}

class Ingredient extends React.Component<OwnProps, IngredientState> {
	private lastClickTime: number
	private ingredientContainer: { current: HTMLDivElement }
	
	constructor(props: OwnProps) {
		super(props)
		this.state = {
			isDragging: false,
			isSelected: false,
		}

		this.ingredientContainer = React.createRef()
	}
	
	onClick(event) {
		const {
			data,
			setSelectedIngredient,
			setDraggable,
		} = this.props
		
		if(this.props.canDrag !== undefined && this.props.canDrag === false) {
			return;
		}
		
		if(performance.now() - this.lastClickTime < CONSTANTS.DOUBLE_CLICK_TIME) {			
			
		}
		else {
			setSelectedIngredient(this.props.data)
		}
		this.lastClickTime = performance.now()
	}
	
	render(): JSX.Element {
		const {
			addAnother,
			canDelete,
			onDelete,
			removeIngredient,
			selectedIngredient,
		} = this.props
		
		return <div className="ingredient-container">
			<div
				className={`ingredient ${this.state.isDragging ? "dragging" : ""}`}
				onMouseDown={event => this.onClick(event)}
				style={this.props.style}
				ref={this.ingredientContainer}
			>
				{
					canDelete ? <div
						className="delete-button"
						onClick={onDelete}
					>
						&#10005;
					</div>
					: null
				}
				<div
					className="icon"
					style={{
						backgroundImage: `url(${this.props.data?.type.image ? this.props.data?.type.image : CONSTANTS.NO_IMAGE})`
					}}
				/>
				<div className="info">
					<b>{this.props.data?.type.name}</b>
					<div>{convertToReasonableMeasurement(this.props.data?.amount || 0)} remaining</div>
				</div>
			</div>

			<div className="ingredient edit" style={{
				display: this.props.data && this.props.data === selectedIngredient ? "block" : "none",
				position: "absolute",
				zIndex: 100,
				top: this.ingredientContainer.current
					? (this.ingredientContainer.current?.offsetTop - (380 - this.ingredientContainer.current.clientHeight) / 2)
					: 0,
				left: this.ingredientContainer.current
					? (this.ingredientContainer.current?.offsetLeft - (270 - this.ingredientContainer.current.clientWidth) / 2)
					: 0,
			}}>
				<div className="info">
				<b>{this.props.data?.type.name}</b>
					<div className="settings">
						<div>
							<input type="range" />
							<div className="amount-input">
								<input type="text" />
								<select>
									<option>cups</option>
									<option>tablespoons</option>
									<option>teaspoons</option>
								</select>
							</div>
							<button className="button small blue" onClick={event => addAnother(this.props.data.type)} style={{ width: "100%" }}>Add Another</button>
							<button className="button small green" style={{ width: "100%" }}>Add to Shopping List</button>
						</div>
						<button className="button small red remove" onClick={event => removeIngredient(this.props.data)} style={{ width: "100%" }}>Remove</button>
					</div>
				</div>
			</div>
		</div>
	}
}

const mapStateToProps = (state: State) => ({
	selectedIngredient: state.ingredients.selectedIngredient,
})

const mapDispatchToProps = (dispatch): IngredientReduxDispatch => ({
	async addAnother(ingredient: IngredientTypeData) {
		console.log(ingredient)
		const newIngredient = await IngredientAPI.addIngredient(ingredient)
		console.log(newIngredient)
		dispatch(addIngredient(newIngredient))
	},
	removeIngredient(ingredient: IngredientData) {
		if(IngredientAPI.deleteIngredient(ingredient)) {
			dispatch(removeIngredient(ingredient))
		}
	},
	setSelectedIngredient: (ingredient: IngredientData) => {
		dispatch(setSelectedIngredient(ingredient))
	},
	setDraggable: (draggable: {
		x?: number,
		y?: number,
		data?: IngredientTypeData,
	}) => {
		dispatch(setDraggable(draggable))
	}
})

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(Ingredient)