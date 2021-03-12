import * as React from "react"
import { connect } from "react-redux"
import {
	convertToReasonableMeasurement,
	lowestUnitValues,
	ReasonableFormat,
	ReasonableFormatObject,
	ValidUnits
} from "../helpers/convertUnits"
import { debounce } from "../helpers/debounce"
import { State } from "../reducer"
import AmountInput from "./amountInput"
import { CONSTANTS } from "./constants"
import {
	addIngredient,
	removeIngredient,
	setDraggable,
	setSelectedIngredient,
	updateIngredient
} from "./ingredientActions"
import IngredientAPI from "./ingredientAPI"
import {
	IngredientData,
	IngredientTypeData
} from "./ingredientData"

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
	updateIngredient: (ingredeint: IngredientData) => void
}

type OwnProps = IngredientProps & IngredientReduxState & IngredientReduxDispatch

interface IngredientState {
	isDragging: boolean
	isSelected: boolean
}

class Ingredient extends React.Component<OwnProps, IngredientState> {
	private lastClickTime: number
	private ingredientContainer: { current: HTMLDivElement }
	private updateAmountBind
	
	constructor(props: OwnProps) {
		super(props)
		this.state = {
			isDragging: false,
			isSelected: false,
		}

		this.ingredientContainer = React.createRef()

		this.updateAmountBind = this.updateAmount.bind(this)
	}
	
	onClick(event) {
		const {
			data,
			setSelectedIngredient,
		} = this.props
		
		if(this.props.canDrag !== undefined && this.props.canDrag === false) {
			return;
		}
		
		if(performance.now() - this.lastClickTime < CONSTANTS.DOUBLE_CLICK_TIME) {			
			
		}
		else {
			setSelectedIngredient(data)
		}
		this.lastClickTime = performance.now()
	}

	/**
	 * send api call to update ingredient amount
	 * @param value 
	 */
	private async updateAmount(value: number) {
		this.props.updateIngredient(
			await IngredientAPI.updateIngredient(this.props.data.id, value)
		)
	}
	
	render(): JSX.Element {
		const {
			addAnother,
			canDelete,
			data,
			onDelete,
			removeIngredient,
			selectedIngredient,
		} = this.props
		
		if(!data) {
			return null
		}

		const reasonable = convertToReasonableMeasurement(
			data.amount,
			ReasonableFormat.OBJECT_FORMAT
		) as ReasonableFormatObject

		return <div className="ingredient-container">
			<div
				className={`ingredient ${this.state.isDragging ? "dragging" : ""}`}
				onMouseDown={event => this.onClick(event)}
				style={this.props.style}
				ref={this.ingredientContainer}
			>
				{
					canDelete
						? <div
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
						backgroundImage: `url(${data.type.image ? data.type.image : CONSTANTS.NO_IMAGE})`
					}}
				/>
				<div className="info">
					<b>{data.type.name}</b>
					<div>{reasonable.whole} remaining</div>
				</div>
			</div>

			<div className="ingredient edit" style={{
				display: data.id === selectedIngredient?.id ? "block" : "none",
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
				<b>{data.type.name}</b>
					<div className="settings">
						<div>
							<AmountInput
								defaultInput={reasonable.value}
								defaultUnits={reasonable.units}
								onChange={amount => debounce(this.updateAmountBind, 0.5, amount)}
								max={data.type.maxAmount}
								useRange={true}
							/>
							<button className="button small blue" onClick={event => addAnother(data.type)} style={{ width: "100%" }}>Add Another</button>
							<button className="button small green" style={{ width: "100%" }}>Add to Shopping List</button>
						</div>
						<button className="button small red remove" onClick={event => removeIngredient(data)} style={{ width: "100%" }}>Remove</button>
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
		const newIngredient = await IngredientAPI.addIngredient(ingredient)
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
	},
	updateIngredient: (ingredient: IngredientData) => {
		dispatch(updateIngredient(ingredient))
	},
})

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(Ingredient)