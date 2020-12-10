import * as React from "react"
import { connect } from "react-redux"
import { convertToReasonableMeasurement } from "../helpers/convertUnits"
import { pluralize } from "../helpers/pluralize"
import { CONSTANTS } from "./constants"
import { setDraggable, setSelectedIngredient } from "./ingredientActions"
import { IngredientData, IngredientTypeData } from "./ingredientData"

export interface IngredientProps {
	dataType?: IngredientTypeData
	data?: IngredientData
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

interface IngredientReduxDispatch {
	setSelectedIngredient: (ingredient: Ingredient) => void
	setDraggable: (draggable: {
		x?: number,
		y?: number,
		dataType?: IngredientTypeData,
	}) => void
}

type OwnProps = IngredientProps & IngredientReduxDispatch

interface IngredientState {
	isDragging: boolean
}

class Ingredient extends React.Component<OwnProps, IngredientState> {
	private lastClickTime: number
	
	constructor(props: OwnProps) {
		super(props)
		this.state = {
			isDragging: false,
		}
	}
	
	onClick(event) {
		const {
			data,
			dataType,
			setSelectedIngredient,
			setDraggable,
		} = this.props
		
		if(this.props.canDrag !== undefined && this.props.canDrag === false) {
			return;
		}
		
		if(performance.now() - this.lastClickTime < CONSTANTS.DOUBLE_CLICK_TIME) {			
			setDraggable({
				dataType,
				x: event.pageX,
				y: event.pageY,
			})
			
			const mouseMove = event => {
				setDraggable({
					x: event.pageX,
					y: event.pageY,
				})
			}
			const mouseUp = event => {
				document.removeEventListener("mousemove", mouseMove)
				document.removeEventListener("mouseup", mouseUp)

				setDraggable({
					dataType: null,
				})
	
				this.setState({
					isDragging: false,
				})
			}
	
			document.addEventListener("mousemove", mouseMove)
			document.addEventListener("mouseup", mouseUp)
	
			this.setState({
				isDragging: true,
			})
		}
		else {
			setSelectedIngredient(this)
		}
		this.lastClickTime = performance.now()
	}
	
	render(): JSX.Element {
		const {
			canDelete,
			onDelete,
		} = this.props
		
		return <div
			className={`ingredient ${this.state.isDragging ? "dragging" : ""}`}
			onMouseDown={event => this.onClick(event)}
			style={this.props.style}
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
					backgroundImage: `url(${this.props.dataType?.image ? this.props.dataType?.image : CONSTANTS.NO_IMAGE})`
				}}
			/>
			<div className="info">
				<b>{this.props.dataType?.name}</b>
				<div>{this.props.dataType?.units} {pluralize(this.props.dataType?.units, "item")}, {convertToReasonableMeasurement(this.props.dataType?.maxAmount || 0)} remaining</div>
			</div>
		</div>
	}
}

const mapDispatchToProps = (dispatch): IngredientReduxDispatch => ({
	setSelectedIngredient: (ingredient: Ingredient) => {
		dispatch(setSelectedIngredient(ingredient.props.dataType))
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
	null,
	mapDispatchToProps,
)(Ingredient)