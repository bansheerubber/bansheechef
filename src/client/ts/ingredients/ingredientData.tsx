import { resolveUrl } from "../helpers/resolveUrl";

export interface IngredientTypeData {
	barcode: string
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
	barcode,
	image,
	maxAmount,
	name,
	typeId,
}: {
	barcode: string,
	image: string,
	maxAmount: number,
	name: string,
	typeId: number,
}): IngredientTypeData => ({
	barcode,
	image: resolveUrl(image),
	maxAmount,
	name,
	id: typeId,
})

export const translateIngredient = ({
	amount,
	barcode,
	id,
	image,
	maxAmount,
	name,
	typeId,
}: {
	amount: number,
	barcode: string,
	id: number,
	image: string,
	maxAmount: number,
	name: string,
	typeId: number,
}): IngredientData => ({
	amount,
	id,
	type: {
		barcode,
		image: resolveUrl(image),
		maxAmount,
		name,
		id: typeId,
	},
})