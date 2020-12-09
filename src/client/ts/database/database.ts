import requestBackend from "../helpers/requestBackend";
import { IngredientTypeData } from "../ingredients/ingredientData";

// middle end for the database, whatever kind i end up using
export default class Database {
	static getIngredients(): Promise<IngredientTypeData[]> {
		return new Promise(async (resolve, reject) => {
			const ingredients = await requestBackend("/get-ingredients/")
			resolve(ingredients as IngredientTypeData[])
		})
	}
}