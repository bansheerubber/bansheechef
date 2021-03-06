import * as React from "react"
import { connect } from "react-redux"
import Database from "../database/database"
import { State } from "../reducer"
import ingredient from "./ingredient"
import Ingredient from "./ingredient"
import { removeIngredient } from "./ingredientActions"
import IngredientAPI from "./ingredientAPI"
import { IngredientData } from "./ingredientData"
import IngredientsSettings from "./ingredientSettings"

interface IngredientSelectionProps {
	children: React.ReactElement<typeof Ingredient> | React.ReactElement<typeof Ingredient>[]
}

interface IngredientSelectionReduxState {
	ingredients: IngredientData[]
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
			children,
			ingredients,
		} = this.props
		
		return <div className="ingredients-container">
			<h1>Your Stock:</h1>
			<div id="ingredients" className="ingredients">{children}{ingredients.map(data => <Ingredient data={data} />)}</div>
		</div>
	}
}

const mapStateToProps = (state: State) => ({
	ingredients: state.ingredients.ingredients,
})

export default connect(
	mapStateToProps,
	null,
)(IngredientSelection)