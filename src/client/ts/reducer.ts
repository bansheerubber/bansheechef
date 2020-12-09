import { combineReducers } from "redux"
import camera, { CameraState } from "./camera/cameraReducer"
import ingredients, { IngredientState } from "./ingredients/ingredientReducer"
import modal, { ModalState } from "./modal/modalReducer"

export interface State {
	camera: CameraState
	ingredients: IngredientState
	modal: ModalState
}

export default combineReducers({
	camera,
	ingredients,
	modal,
})