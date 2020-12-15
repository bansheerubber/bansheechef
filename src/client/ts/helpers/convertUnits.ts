import { pluralize } from "./pluralize"

export type Cups = number
export type ValidUnits = "gallons" | "quarts" | "cups" | "tablespoons" | "teaspoons"

export const convertToCups = (value: number, units: ValidUnits) => {
	switch(units) {
		case "gallons": {
			return value * 16
		}

		case "quarts": {
			return value * 4
		}
		
		case "cups": {
			return value
		}

		case "tablespoons": {
			return value / 16
		}

		case "teaspoons": {
			return value / 48
		}
	}
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
export const convertToReasonableMeasurement = (value: number) => {
	const cutoffs = [
		{
			lowest: 8, // in cups
			leeway: 1 / 8, // 1/8 of a cup
			multiplier: 1 / 16,
			name: "gallon",
			roundables: [[16, ""], [8, "1/2"], [0, ""]]
		},
		{
			lowest: 4, // in cups
			leeway: 1 / 8, // 1/8 of a cup
			multiplier: 1 / 4,
			name: "quart",
			roundables: [[4, ""], [2, "1/2"], [0, ""]]
		},
		{
			lowest: 1 / 4, // in cups
			leeway: 1 / 96, // 1/2 teaspoon
			multiplier: 1,
			name: "cup",
			roundables: [[1, ""], [3 / 4, "3/4"], [2 / 3, "2/3"], [1 / 2, "1/2"], [1 / 3, "1/3"], [1 / 4, "1/4"], [0, ""]],
		},
		{
			lowest: 1 / 32, // in cups, 1/2 tablespoon
			leeway: 1 / 384, // 1/8 teaspoon
			multiplier: 16,
			name: "tablespoon",
			roundables: [[1 / 16, ""], [1 / 32, "1/2"], [0, ""]],
		},
		{
			lowest: 1 / 192, // in cups, 1/4 teaspoon
			leeway: 0.0005, // lol
			multiplier: 48,
			name: "teaspoon",
			roundables: [[1 / 48, ""], [3 / 192, "3/4"], [1 / 96, "1/2"], [1 / 192, "1/4"], [0, ""]],
		},
	]

	let chosenCutoff
	for(const cutoff of cutoffs) {
		if(value > cutoff.lowest - cutoff.leeway) {
			chosenCutoff = cutoff
			break
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
	const pluralizeTest = !roundedDecimalUI ? integer : integer + roundedDecimal
	return `${integer ? integer : ""} ${roundedDecimalUI}`.trim() + ` ${pluralize(pluralizeTest, chosenCutoff.name)}`
}