import * as React from "react"
import { connect } from "react-redux"
import { pluralize } from "../helpers/pluralize"
import { State } from "../reducer"
import { CONSTANTS } from "./constants"
import { IngredientTypeData } from "./ingredientData"

interface IngredientsSettingsReduxState {
	selectedIngredient: IngredientTypeData
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
				<img src={selectedIngredient.image ? selectedIngredient.image : CONSTANTS.NO_IMAGE} />
				<h3>{selectedIngredient.units} {pluralize(selectedIngredient.units, "item")}</h3>
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