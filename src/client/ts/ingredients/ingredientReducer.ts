import {
	setAddIngredientShown,
	setDraggable,
	setIngredients,
	setSelectedIngredient
} from "./ingredientActions"
import { IngredientTypeData } from "./ingredientData"

export interface IngredientState {
	addIngredientShown: boolean
	draggable: {
		x: number,
		y: number,
		dataType: IngredientTypeData
	}
	ingredients: IngredientTypeData[]
	selectedIngredient: IngredientTypeData
}

const createDefaultState = () => ({
	addIngredientShown: false,
	draggable: {
		x: 0,
		y: 0,
		dataType: null,
	},
	ingredients: [],
	selectedIngredient: null,
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
				},
			}
		}

		case setIngredients: {
			return {
				...state,
				ingredients: action.ingredients,
			}
		}

		case setAddIngredientShown: {
			return {
				...state,
				addIngredientShown: action.shown,
			}
		}

		default: {
			return state
		}
	}
}

export default ingredients