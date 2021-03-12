import requestBackend from "../helpers/requestBackend"
import { IngredientData, IngredientTypeData, translateIngredient } from "./ingredientData"

export default class IngredientAPI {
	static getIngredients(): Promise<any[]> {
		return new Promise(async (resolve, reject) => {
			const ingredients = await requestBackend("/get-ingredients/") as any[]
			resolve(ingredients.map(translateIngredient))
		})
	}

	static async addIngredient(ingredientType: IngredientTypeData): Promise<IngredientData> {
		return translateIngredient(
			await requestBackend(
				"/add-ingredient/",
				"POST",
				{
					name: ingredientType.name,
					maxAmount: ingredientType.maxAmount,
				},
			) as any
		)
	}

	static async deleteIngredient(ingredient: IngredientData): Promise<boolean> {
		const data = await requestBackend(
			"/delete-ingredient/",
			"POST",
			{
				id: ingredient.id,
				typeId: ingredient.type.id,
			}
		) as { success: boolean }

		return data.success
	}

	static async updateIngredient(
		ingredientId: number,
		amount: number
	): Promise<IngredientData> {
		return translateIngredient(
			await requestBackend(
				"/update-ingredient/",
				"POST",
				{
					id: ingredientId,
					amount,
				},
			) as any
		)
	}
}