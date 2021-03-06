import { resolveUrl } from "../helpers/resolveUrl";

export interface IngredientTypeData {
	id: number
	image: string
	name: string
	maxAmount: number
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
}: {
	image: string,
	maxAmount: number,
	name: string,
	typeId: number,
}): IngredientTypeData => ({
	image: resolveUrl(image),
	maxAmount,
	name,
	id: typeId,
})

export const translateIngredient = ({
	amount,
	id,
	image,
	maxAmount,
	name,
	typeId,
}: {
	amount: number,
	id: number,
	image: string,
	maxAmount: number,
	name: string,
	typeId: number,
}): IngredientData => ({
	amount,
	id,
	type: {
		image: resolveUrl(image),
		maxAmount,
		name,
		id: typeId,
	},
})