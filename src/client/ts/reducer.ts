import { combineReducers } from "redux"
import ingredients, { IngredientState } from "./ingredients/ingredientReducer"

export interface State {
	ingredients: IngredientState
}

export default combineReducers({
	ingredients,
})