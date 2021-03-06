import * as React from "react"
import { connect } from "react-redux"
import { State } from "../reducer"
import Ingredient, { IngredientProps } from "./ingredient"
import { IngredientData } from "./ingredientData"

interface IngredientDraggableReduxState {
	x: number
	y: number
	data: IngredientData
}

type OwnProps = IngredientDraggableReduxState

class IngredientDraggable extends React.Component<OwnProps> {
	constructor(props: OwnProps) {
		super(props)
	}
	
	render(): JSX.Element {
		const {
			data,
			x,
			y,
		} = this.props
		
		return <Ingredient
			data={data}
			canDrag={false}
			style={{
				display: data ? "block" : "none",
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
	data: state.ingredients.draggable.data,
})

export default connect(
	mapStateToProps,
	null,
)(IngredientDraggable)