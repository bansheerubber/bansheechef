import { IngredientData, IngredientTypeData } from "./ingredientData";

export const setSelectedIngredient = (ingredient: IngredientData) => ({
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

export const setIngredients = (ingredients: IngredientData[]) => ({
  type: setIngredients,
  ingredients,
})

export const addIngredient = (ingredient: IngredientData) => ({
  type: addIngredient,
  ingredient,
})

export const setAddIngredientShown = (shown: boolean) => ({
  type: setAddIngredientShown,
  shown,
})