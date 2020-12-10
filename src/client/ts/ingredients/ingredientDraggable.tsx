import * as React from "react"
import { connect } from "react-redux"
import { State } from "../reducer"
import Ingredient, { IngredientProps } from "./ingredient"
import { IngredientTypeData } from "./ingredientData"

interface IngredientDraggableReduxState {
	x: number
	y: number
	dataType: IngredientTypeData
}

type OwnProps = IngredientDraggableReduxState

class IngredientDraggable extends React.Component<OwnProps> {
	constructor(props: OwnProps) {
		super(props)
	}
	
	render(): JSX.Element {
		const {
			dataType,
			x,
			y,
		} = this.props
		
		return <Ingredient
			dataType={dataType}
			canDrag={false}
			style={{
				display: dataType ? "block" : "none",
				cursor: "grabbing",
				position: "absolute",
				left: x,
				top: y,
				transform: "translate(-50%, -50%)",
				zIndex: 100,
				boxShadow: "0px 0px 5px 5px rgba(0, 0, 0, 0.3)",
			}}
		/>
	}
}

const mapStateToProps = (state: State): IngredientDraggableReduxState => ({
	x: state.ingredients.draggable.x,
	y: state.ingredients.draggable.y,
	dataType: state.ingredients.draggable.dataType,
})

export default connect(
	mapStateToProps,
	null,
)(IngredientDraggable)