import * as React from "react"
import { connect } from "react-redux"
import Database from "../database/database"
import { State } from "../reducer"
import Ingredient from "./ingredient"
import { IngredientTypeData } from "./ingredientData"
import IngredientsSettings from "./ingredientSettings"

interface IngredientSelectionProps {
	children: React.ReactElement<typeof Ingredient> | React.ReactElement<typeof Ingredient>[]
}

interface IngredientSelectionReduxState {
	ingredients: IngredientTypeData[]
	selectedIngredient: IngredientTypeData
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
			selectedIngredient
		} = this.props
		
		return <div
			className="ingredients-container"
			style={{
				margin: selectedIngredient ? 0 : undefined,
			}}
		>
			<h1>Your Stock:</h1>
			<div id="ingredients" className="ingredients">{children}{ingredients.map(data => <Ingredient data={data} />)}</div>
		</div>
	}
}

const mapStateToProps = (state: State) => ({
	ingredients: state.ingredients.ingredients,
	selectedIngredient: state.ingredients.selectedIngredient,
})

export default connect(
	mapStateToProps,
	null,
)(IngredientSelection)