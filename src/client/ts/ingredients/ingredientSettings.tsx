import * as React from "react"
import { connect } from "react-redux"
import { pluralize } from "../helpers/pluralize"
import { State } from "../reducer"
import { CONSTANTS } from "./constants"
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
				<h1>{selectedIngredient.type.name}</h1>
				<img src={selectedIngredient.type.image ? selectedIngredient.type.image : CONSTANTS.NO_IMAGE} />
				<h3>temp</h3>
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