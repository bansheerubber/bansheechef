import { resolveUrl } from "../helpers/resolveUrl";

export interface IngredientTypeData {
	id: number
	image: string
	name: string
	maxAmount: number
	units: number
}

export interface IngredientData {
	amount: number
	id: number
	type: IngredientTypeData
}

export const translateIngredientType = ({
	image,
	maxAmount,
	name,
	typeId,
	units,
}: {
	image: string,
	maxAmount: number,
	name: string,
	typeId: number,
	units: number,
}): IngredientTypeData => ({
	image: resolveUrl(image),
	maxAmount,
	name,
	id: typeId,
	units,
})

export const translateIngredient = ({
	amount,
	id,
	image,
	maxAmount,
	name,
	typeId,
	units,
}: {
	amount: number,
	id: number,
	image: string,
	maxAmount: number,
	name: string,
	typeId: number,
	units: number,
}): IngredientData => ({
	amount,
	id,
	type: {
		image: resolveUrl(image),
		maxAmount,
		name,
		id: typeId,
		units,
	},
})