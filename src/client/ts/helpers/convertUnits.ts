import { pluralize } from "./pluralize"

export type Cups = number
export type ValidUnits = "gallon" | "quart" | "cup" | "tablespoon" | "teaspoon"

export const calculateFraction = (input: string): number => {
	const fractionMatch = input.match(/([0-9]+)\s*\/\s*([0-9+]+)/)
	let value = 0
	// match fraction
	if(fractionMatch) {
		const integer1 = parseInt(fractionMatch[1]) // only allow integer ratio
		const integer2 = parseInt(fractionMatch[2])
		value += integer1 / integer2
		input = input.replace(fractionMatch[0], "").trim()
	}
	
	// match leading integer at the end and add it to value
	if(!input.match(/[^0-9\.\s\/]/g) && !isNaN(parseFloat(input))) {
		value += parseFloat(input)
	}
	else if(!isNaN(parseFloat(input)) && input !== "") { // if we got an invalid number, then quit
		return NaN
	}

	return value
}

/**
 * converts the input unit to cups
 * @param value 
 * @param units 
 */
export const convertToCups = (value: number, units: ValidUnits): Cups => {
	switch(units) {
		case "gallon": {
			return value * 16
		}

		case "quart": {
			return value * 4
		}
		
		case "cup": {
			return value
		}

		case "tablespoon": {
			return value / 16
		}

		case "teaspoon": {
			return value / 48
		}
	}
}

/**
 * lowest values used in reasonable measurement converter in cups
 */
export const lowestUnitValues: { [index: string]: number } = {
	"gallon": 8, // in cups
	"quart": 4, // in cups
	"cup": 1 / 4, // in cups
	"tablespoon": 1 / 32, // in cups, 1/2 tablespoon
	"teaspoon": 1 / 192, // in cups, 1/4 teaspoon
}

export enum ReasonableFormat {
	DEFAULT,
	NO_FORMAT,
	OBJECT_FORMAT,
}

export interface ReasonableFormatObject {
	approximation: boolean
	uiValue: string
	units: ValidUnits
	value: number
	whole: string
}

/*
	take a value in cups and convert it to the most reasonable display measurement.
	if we have 0.513857 cups of material, say ~1/2 cups.
	if we have 0.17284 cups of material, say ~2 3/4 tablespoons.
	if we have 0.25 cups, say 1/4 cups. if we have 0.23 cups, say ~3 1/2 tablespoons.
	basically, if we are close to a clean measurement like 1/4 cups, but below it, we want to
	default to something that will make more sense. people won't really care if we have a little
	bit extra of a material and just round that off to a value below, but people will care if we
	have a bit less of a material b/c recipes are in exact amounts and we always want to have
	that amount.
*/
/**
 * converts a value to a human-readable format
 * @param value value to convert
 * @param noFormat whether or not to add units and approximation symbol
 */
export const convertToReasonableMeasurement = (
	value: Cups,
	format: ReasonableFormat = ReasonableFormat.DEFAULT,
	forcedUnits: ValidUnits = null
): string | ReasonableFormatObject => {
	const cutoffs = [
		{
			lowest: lowestUnitValues["gallon"], // in cups
			leeway: 1 / 8, // 1/8 of a cup
			multiplier: 1 / 16,
			name: "gallon",
			roundables: [[8, "1/2"], [0, "0"]]
		},
		{
			lowest: lowestUnitValues["quart"], // in cups
			leeway: 1 / 8, // 1/8 of a cup
			multiplier: 1 / 4,
			name: "quart",
			roundables: [[2, "1/2"], [0, "0"]]
		},
		{
			lowest: lowestUnitValues["cup"], // in cups
			leeway: 1 / 96, // 1/2 teaspoon
			multiplier: 1,
			name: "cup",
			roundables: [[3 / 4, "3/4"], [2 / 3, "2/3"], [1 / 2, "1/2"], [1 / 3, "1/3"], [1 / 4, "1/4"], [0, "0"]],
		},
		{
			lowest: lowestUnitValues["tablespoon"], // in cups, 1/2 tablespoon
			leeway: 1 / 384, // 1/8 teaspoon
			multiplier: 16,
			name: "tablespoon",
			roundables: [[1 / 32, "1/2"], [0, "0"]],
		},
		{
			lowest: lowestUnitValues["teaspoon"], // in cups, 1/4 teaspoon
			leeway: 0.0004, // lol
			multiplier: 48,
			name: "teaspoon",
			roundables: [[3 / 192, "3/4"], [1 / 96, "1/2"], [1 / 192, "1/4"], [0, "0"]],
		},
	]

	let chosenCutoff
	if(!forcedUnits) {
		for(const cutoff of cutoffs) {
			if(value > cutoff.lowest - cutoff.leeway) {
				chosenCutoff = cutoff
				break
			}
		}
	}
	else {
		for(const cutoff of cutoffs) {
			if(cutoff.name === forcedUnits) {
				chosenCutoff = cutoff
				break
			}
		}
	}

	// TODO what if chosen cutoff is null?
	if(!chosenCutoff) {
		return "0 cups"
	}

	const decimal = value % (1 / chosenCutoff.multiplier) // figure out how much we are over 1 unit of measurement (gallon, quart, cup, etc)
	let lowestDelta = Number.MAX_SAFE_INTEGER
	let roundedDecimalUI: string
	let roundedDecimal: number
	// loop through each roundable and figure out how much we got
	for(const roundable of chosenCutoff.roundables) {
		const test = decimal - (roundable[0] - chosenCutoff.leeway)
		if(test < lowestDelta && test >= 0) { // only choose a roundable we're above or equal to
			lowestDelta = test
			roundedDecimalUI = roundable[1]
			roundedDecimal = roundable[0]
		}
	}

	// TODO add indication of approximation via `~`
	const integer = Math.floor(value * chosenCutoff.multiplier)

	if(integer && roundedDecimalUI === "0") {
		roundedDecimalUI = ""
	}

	const pluralizeTest = !roundedDecimalUI ? integer : integer + roundedDecimal
	switch(format) {
		case ReasonableFormat.NO_FORMAT: {
			return roundedDecimalUI
		}

		case ReasonableFormat.OBJECT_FORMAT: {
			return {
				"approximation": false,
				"uiValue": `${integer ? integer : ""} ${roundedDecimalUI}`.trim(),
				"units": chosenCutoff.name,
				"value": integer / chosenCutoff.multiplier + roundedDecimal,
				"whole": `${integer ? integer : ""} ${roundedDecimalUI}`.trim() + ` ${pluralize(pluralizeTest, chosenCutoff.name)}`,
			}
		}

		default: {
			return `${integer ? integer : ""} ${roundedDecimalUI}`.trim() + ` ${pluralize(pluralizeTest, chosenCutoff.name)}`
		}

	}
}