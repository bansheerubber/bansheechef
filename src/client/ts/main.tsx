import * as React from "react"
import * as ReactDOM from "react-dom"
import "../scss/main.scss"
import IngredientSelection from "./ingredients/ingredientSelection"
import { createStore } from "redux"
import reducer from "./reducer"
import { Provider } from "react-redux"
import IngredientDraggable from "./ingredients/ingredientDraggable"
import IngredientsSettings from "./ingredients/ingredientSettings"
import Header from "./header/header"
import { setIngredients, setSelectedIngredient } from "./ingredients/ingredientActions"
import AddIngredientModal from "./ingredients/addIngredientModal"
import CameraModel from "./camera/cameraModal"
import { convertToReasonableMeasurement } from "./helpers/convertUnits"
import { translateIngredient } from "./ingredients/ingredientData"
import IngredientAPI from "./ingredients/ingredientAPI"

const store = createStore(reducer)
window["store"] = store;

(async function egg() {
	store.dispatch(setIngredients(await IngredientAPI.getIngredients()))
})()

ReactDOM.render(
	<div onMouseDown={event => {
		let found = false
		let parent = event.target as HTMLElement
		while(parent) {
			if(parent.className === "ingredient-container") {
				found = true
				break
			}
			parent = parent.parentElement
		}

		if(found === false) {
			store.dispatch(setSelectedIngredient(null))
		}
	}}>
		<Provider store={store}>
			<Header />

			<AddIngredientModal />

			<CameraModel />

			<IngredientSelection>
				<IngredientDraggable />
			</IngredientSelection>
		</Provider>
	</div>,
	document.getElementById("react")
)