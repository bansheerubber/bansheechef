import requestBackend from "../helpers/requestBackend"
import { translateIngredient } from "./ingredientData"

export default class IngredientAPI {
	static getIngredients(): Promise<any[]> {
		return new Promise(async (resolve, reject) => {
			const ingredients = await requestBackend("/get-ingredients/") as any[]
			resolve(ingredients.map(translateIngredient))
		})
	}
}