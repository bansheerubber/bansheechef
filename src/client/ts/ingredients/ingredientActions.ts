import { IngredientTypeData } from "./ingredientData";

export const setSelectedIngredient = (ingredient: IngredientTypeData) => ({
  type: setSelectedIngredient,
  ingredient,
})

export const setDraggable = (draggable: {
	x?: number,
	y?: number,
	dataType?: IngredientTypeData,
}) => ({
  type: setDraggable,
  draggable,
})

export const setIngredients = (ingredients: IngredientTypeData[]) => ({
  type: setIngredients,
  ingredients,
})

export const setAddIngredientShown = (shown: boolean) => ({
  type: setAddIngredientShown,
  shown,
})