import { setDraggable, setSelectedIngredient } from "./ingredientActions"
import { IngredientData } from "./ingredientData"

export interface IngredientState {
	selectedIngredient: IngredientData
	draggable: {
		x: number,
		y: number,
		data: IngredientData
	}
}

const createDefaultState = () => ({
	selectedIngredient: null,
	draggable: {
		x: 0,
		y: 0,
		data: null,
	},
})

const ingredients = (state: IngredientState = createDefaultState(), action): IngredientState => {
	switch(action.type) {
		case setSelectedIngredient: {
			return {
				...state,
				selectedIngredient: action.ingredient,
			}
		}

		case setDraggable: {
			return {
				...state,
				draggable: {
					...state.draggable,
					...action.draggable,
				}
			}
		}

		default: {
			return state
		}
	}
}

export default ingredients