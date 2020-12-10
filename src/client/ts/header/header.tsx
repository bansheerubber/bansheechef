import * as React from "react"
import { connect } from "react-redux"
import { setAddIngredientShown } from "../ingredients/ingredientActions"
import { IngredientTypeData } from "../ingredients/ingredientData"
import { State } from "../reducer"

interface HeaderReduxState {
	addIngredientShown: boolean
	draggable: {
		x: number,
		y: number,
		dataType: IngredientTypeData,
	}
}

interface HeaderReduxDispatch {
	setAddIngredients: (value: boolean) => void
}

type OwnProps = HeaderReduxState & HeaderReduxDispatch

class Header extends React.Component<OwnProps> {
	render(): JSX.Element {
		const {
			addIngredientShown,
			draggable,
			setAddIngredients,
		} = this.props
		
		return <div className="header">
			<img src="./data/bansheechef.png" />
			{
				draggable.dataType ? <>
					<button className="button dropzone shopping-list">Shopping List</button>
					<button className="button dropzone trash">Trash</button>
				</>
				: <button className="button blue" onClick={event => setAddIngredients(!addIngredientShown)}>Add Ingredient</button>
			}
		</div>
	}
}

const mapStateToProps = (state: State) => ({
	addIngredientShown: state.ingredients.addIngredientShown,
	draggable: state.ingredients.draggable,
})

const mapDispatchToProps = (dispatch) => ({
	setAddIngredients: (value: boolean) => {
		dispatch(setAddIngredientShown(value))
	}
})

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(Header)