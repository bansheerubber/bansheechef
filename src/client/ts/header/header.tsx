import * as React from "react"
import { connect } from "react-redux"
import { IngredientData } from "../ingredients/ingredientData"
import { State } from "../reducer"

interface HeaderReduxState {
	draggable: {
		x: number,
		y: number,
		data: IngredientData,
	}
}

type OwnProps = HeaderReduxState

class Header extends React.Component<OwnProps> {
	render(): JSX.Element {
		const {
			draggable
		} = this.props
		
		return <div className="header">
			<img src="./data/bansheechef.png" />
			{draggable.data ? <>
				<div className="dropzone shopping-list">
					Shopping List
				</div>
				<div className="dropzone trash">
					Trash
				</div>
			</> : null}
		</div>
	}
}

const mapStateToProps = (state: State) => ({
	draggable: state.ingredients.draggable,
})

export default connect(
	mapStateToProps,
	null,
)(Header)