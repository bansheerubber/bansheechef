from enum import Enum

class Units(Enum):
	GALLON = 1
	QUART = 2
	PINT = 3
	CUPS = 4
	TABLESPOONS = 5
	TEASPOONS = 6
	LITER = 7
	MILLILITER = 8
	CUBIC_INCH = 9
	CUBIC_CENTIMETER = 10
	FLUID_OUNCE = 11

cups_conversion_table = {
	Units.GALLON: 16,
	Units.QUART: 4,
	Units.PINT: 2,
	Units.CUPS: 1,
	Units.TABLESPOONS: 1 / 16,
	Units.TEASPOONS: 1 / 48,
	Units.LITER: 4.22675,
	Units.MILLILITER: 0.00422675,
	Units.CUBIC_INCH: 1 / 14.4375,
	Units.CUBIC_CENTIMETER: 1 / 236.588,
	Units.FLUID_OUNCE: 1 / 8,
}

cubic_centimeters_conversion_table = {
	Units.GALLON: 3785.41,
	Units.QUART: 946.353,
	Units.PINT: 473.176,
	Units.CUPS: 236.588,
	Units.TABLESPOONS: 14.7868,
	Units.TEASPOONS: 4.92892,
	Units.LITER: 1000,
	Units.MILLILITER: 1,
	Units.CUBIC_INCH: 16.3871,
	Units.CUBIC_CENTIMETER: 1,
	Units.FLUID_OUNCE: 29.5735,
}

"""
takes a value in the specified units and converts it to cups
"""
def convert_to_cup(value, units):
	return cups_conversion_table[units] * value

"""
takes a value in the specified units and converts it to cubic centimeters
"""
def convert_to_cubic_centimeters(value, units):
	return cubic_centimeters_conversion_table[units] * value