import * as React from "react"
import { connect } from "react-redux"
import type Ingredient from "./ingredient"
import { IngredientData } from "./ingredientData"
import IngredientsSettings from "./ingredientSettings"

interface IngredientSelectionProps {
	children: React.ReactElement<typeof Ingredient> | React.ReactElement<typeof Ingredient>[]
}

interface IngredientSelectionReduxState {
	selectedIngredient: IngredientData
}

type OwnProps = IngredientSelectionProps & IngredientSelectionReduxState

class IngredientSelection extends React.Component<OwnProps> {
	constructor(props) {
		super(props)

		this.state = {
			selectedIngredient: null,
		}
	}

	render(): JSX.Element {
		const {
			selectedIngredient
		} = this.props
		
		return <div
			className="ingredients-container"
			style={{
				margin: selectedIngredient ? 0 : undefined,
			}}
		>
			<h1>Your Stock:</h1>
			<div id="ingredients" className="ingredients">{this.props.children}</div>
		</div>
	}
}

const mapStateToProps = (state) => ({
	selectedIngredient: state.ingredients.selectedIngredient,
})

export default connect(
	mapStateToProps,
	null,
)(IngredientSelection)