import * as React from "react"
import { connect } from "react-redux"
import { State } from "../reducer"
import { IngredientData } from "./ingredientData"

interface IngredientsSettingsReduxState {
	selectedIngredient: IngredientData
}

type OwnProps = IngredientsSettingsReduxState

class IngredientsSettings extends React.Component<OwnProps> {
	constructor(props: OwnProps) {
		super(props)
	}

	render(): JSX.Element {
		const {
			selectedIngredient
		} = this.props
		
		return selectedIngredient ? <div
			className="ingredient-settings"
		>
			<div className="preview">
				<h1>{selectedIngredient.name}</h1>
				<img src={selectedIngredient.image} />
				<h3>{selectedIngredient.amount}, {selectedIngredient.percentLeft}</h3>
			</div>
			<div>
				{/* options */}
			</div>
		</div> : null
	}
}

const mapStateToProps = (state: State) => ({
	selectedIngredient: state.ingredients.selectedIngredient,
})

export default connect(
	mapStateToProps,
	null
)(IngredientsSettings)