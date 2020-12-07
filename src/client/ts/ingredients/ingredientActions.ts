import { IngredientData } from "./ingredientData";
import IngredientDraggable from "./ingredientDraggable"

export const setSelectedIngredient = (ingredient: IngredientData) => ({
  type: setSelectedIngredient,
  ingredient,
})

export const setDraggable = (draggable: {
	x?: number,
	y?: number,
	data?: IngredientData,
}) => ({
  type: setDraggable,
  draggable,
})