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
import Database from "./database/database"
import { setIngredients } from "./ingredients/ingredientActions"
import AddIngredientModal from "./ingredients/addIngredientModal"
import CameraModel from "./camera/cameraModal"
import { convertToReasonableMeasurement } from "./helpers/convertUnits"
import { translateIngredientType } from "./ingredients/ingredientData"

const store = createStore(reducer)
window["store"] = store;

(async function egg() {
	const ingredients = (await Database.getIngredients()).map(translateIngredientType)
	store.dispatch(setIngredients(ingredients))
})()

console.log(convertToReasonableMeasurement(1 / 16))

ReactDOM.render(
	<Provider store={store}>
		<IngredientsSettings />

		<Header />

		<AddIngredientModal />

		<CameraModel />

		<IngredientSelection>
			<IngredientDraggable />
		</IngredientSelection>
	</Provider>,
	document.getElementById("react")
)