import {
	addIngredient,
	removeIngredient,
	setAddIngredientShown,
	setDraggable,
	setIngredients,
	setSelectedIngredient,
	updateIngredient
} from "./ingredientActions"
import { IngredientData } from "./ingredientData"

export interface IngredientState {
	addIngredientShown: boolean
	draggable: {
		x: number,
		y: number,
		data: IngredientData
	}
	ingredients: IngredientData[]
	selectedIngredient: IngredientData
}

const createDefaultState = () => ({
	addIngredientShown: false,
	draggable: {
		x: 0,
		y: 0,
		data: null,
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

		case addIngredient: {
			return {
				...state,
				ingredients: [...state.ingredients, action.ingredient],
			}
		}

		case updateIngredient: {
			for(let i = 0; i < state.ingredients.length; i++) {
				if(state.ingredients[i].id === action.ingredient.id) {
					state.ingredients[i] = action.ingredient
				}
			}
			return {
				...state,
				ingredients: [...state.ingredients]
			}
		}

		case removeIngredient: {
			state.ingredients.splice(state.ingredients.indexOf(action.ingredient), 1)
			return {
				...state,
				ingredients: [...state.ingredients],
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