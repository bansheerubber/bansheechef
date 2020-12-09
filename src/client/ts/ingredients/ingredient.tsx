import * as React from "react"
import { connect } from "react-redux"
import { convertToReasonableMeasurement } from "../helpers/convertUnits"
import { pluralize } from "../helpers/pluralize"
import { CONSTANTS } from "./constants"
import { setDraggable, setSelectedIngredient } from "./ingredientActions"
import { IngredientTypeData } from "./ingredientData"

export interface IngredientProps {
	data?: IngredientTypeData
	canDrag?: boolean
	style?: React.CSSProperties
}

interface IngredientReduxDispatch {
	setSelectedIngredient: (ingredient: Ingredient) => void
	setDraggable: (draggable: {
		x?: number,
		y?: number,
		data?: IngredientTypeData,
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
			setSelectedIngredient,
			setDraggable,
		} = this.props
		
		if(this.props.canDrag !== undefined && this.props.canDrag === false) {
			return;
		}
		
		if(performance.now() - this.lastClickTime < CONSTANTS.DOUBLE_CLICK_TIME) {			
			setDraggable({
				data,
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
					data: null,
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
		return <div
			className={this.state.isDragging ? "dragging" : ""}
			onMouseDown={event => this.onClick(event)}
			style={this.props.style}
		>
			<div style={{
				backgroundImage: `url(${this.props.data?.image ? this.props.data?.image : CONSTANTS.NO_IMAGE})`
			}}></div>
			<div>
				<b>{this.props.data?.name}</b>
				<div>{this.props.data?.bottles} {pluralize(this.props.data?.bottles, "item")}, {convertToReasonableMeasurement(this.props.data?.maxAmount || 0)} remaining</div>
			</div>
		</div>
	}
}

const mapDispatchToProps = (dispatch): IngredientReduxDispatch => ({
	setSelectedIngredient: (ingredient: Ingredient) => {
		dispatch(setSelectedIngredient(ingredient.props.data))
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