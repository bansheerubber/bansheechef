import sqlite3
import os
import re
from csv import reader

from .constants import LOCAL_STORAGE
from .units import convert_to_cubic_centimeters, Units

def create_connection():
	file = f"{LOCAL_STORAGE}/data.db"
	connection = sqlite3.connect(file)
	cursor = connection.cursor()

	results = cursor.execute("""SELECT name FROM sqlite_master WHERE type='table';""").fetchall()
	if len(results) == 0: # init tables
		buffer = ""
		sql = os.path.join(os.path.dirname(__file__), "init.sql")
		for line in open(sql).readlines():
			buffer = buffer + line.strip()

			if ";" in buffer:
				cursor.execute(buffer)
				buffer = ""

		if ";" in buffer:
			cursor.execute(buffer)
			
		connection.commit()

		read_food_database(connection, cursor)
		read_open_product_data(connection, cursor)
		read_fdc_densities(connection, cursor)

	return (connection, cursor)

def read_food_database(connection, cursor):
	file = open("data/open-barcodes.csv")
	file.readline() # absorb header
	count = 0
	for line in file:
		split = line.split("\t")
		potential_barcode = split[0]
		name = split[7]
		image = split[67].split(" ")[0]

		image_id = None
		if image:
			cursor.execute(
				"""INSERT INTO images (source)
				VALUES(?);""",
				[image]
			)
			image_id = cursor.lastrowid

		cursor.execute(
			"""INSERT OR IGNORE INTO barcode_lookup (name, barcode, source, image_id)
			VALUES(?, ?, ?, ?);""",
			[name, potential_barcode, 0, image_id]
		)
		count = count + 1
	
	connection.commit()
	
	file.close()

	print(f"Finished inserting 'Open Food Facts' ({count})")

def read_open_product_data(connection, cursor):
	file = open("data/open-product-data.sql")

	insert_match = re.compile("^INSERT INTO `gtin`")
	found = False
	count = 0
	for line in file:
		line = line.strip()

		if found:
			# don't ask me how long this takes to compute
			processed = [re.sub("^'|'$", "", element.strip()) for element in line[1:-2].split(",")]
			barcode = processed[0]
			name = processed[8]

			if barcode and name and barcode != "NULL" and name != "NULL" and len(barcode) == 13:
				cursor.execute(
					"""INSERT OR IGNORE INTO barcode_lookup (name, barcode, source)
					VALUES(?, ?, ?);""",
					[name, barcode, 1]
				)
				count = count + 1
			
			if line[-1] == ";":
				found = False

		if insert_match.match(line):
			found = True
	
	connection.commit()

	file.close()

	print(f"Finished inserting 'Open Product Data' ({count})")

def read_fdc_densities(connection, cursor):
	file = open("data/food_portion.csv")
	file.readline() # absorb header

	fdc_id_to_density = {}

	valid_units = [
		1000, # cup
		1001, # tablespoon
		1002, # teaspoon
		1003, # liter
		1004, # milliliter
		1005, # cubic inch
		1006, # cubic centimeter
		1007, # gallon
		1008, # pint
		1009, # fl oz
		1118, # Tablespoons (???)
	]

	unit_to_enum = {
		1000: Units.CUPS,
		1001: Units.TABLESPOONS,
		1002: Units.TEASPOONS,
		1003: Units.LITER,
		1004: Units.MILLILITER,
		1005: Units.CUBIC_INCH,
		1006: Units.CUBIC_CENTIMETER,
		1007: Units.GALLON,
		1008: Units.PINT,
		1009: Units.FLUID_OUNCE,
		1118: Units.TABLESPOONS,
	}

	# some stupid intern decided it would be nice to have no units, but
	# instead use the modifier field for units
	valid_modifiers = [
		"tsp",
		"tbsp",
		"cup",
	]

	modifier_to_enum = {
		"tsp": Units.TEASPOONS,
		"tbsp": Units.TABLESPOONS,
		"cup": Units.CUPS,
	}

	count = 0
	for line in reader(file):
		if line[1]: # if we have a fdc id
			fdc_id = int(line[1])
			if line[3] and fdc_id not in fdc_id_to_density: # if we have a valid amount, and we haven't looked at this fdc id yet
				amount = float(line[3])
				unit = int(line[4])
				modifier = line[6]
				weight = float(line[7]) # in grams

				if amount: # some entries are 0
					if unit in valid_units:
						amount = convert_to_cubic_centimeters(amount, unit_to_enum[unit])
						fdc_id_to_density[fdc_id] = weight / amount # g/cm^3
					elif unit == 9999 and modifier in valid_modifiers: # intern check
						amount = convert_to_cubic_centimeters(amount, modifier_to_enum[modifier])
						fdc_id_to_density[fdc_id] = weight / amount # g/cm^3

	file.close()

	file = open("data/description_to_name.txt")
	description_to_name = {}

	for line in file:
		split = [element.strip() for element in line.split(":")]
		description = split[0]
		rest = split[1:]

		for name in rest:
			if name[0] != "x" and name[0] != "?":
				if description not in description_to_name:
					description_to_name[description] = []
				description_to_name[description].append(name)

	file.close()
	
	file = open("data/food.csv")
	file.readline() # absorb header

	added_descriptions = {}
	count = 0
	for line in reader(file):
		if line[0]:
			fdc_id = int(line[0])
			description = line[2]

			if (
				fdc_id in fdc_id_to_density
				and description not in added_descriptions 
				and description in description_to_name
			):
				added_descriptions[description] = True

				for name in description_to_name[description]:
					cursor.execute(
						"""INSERT INTO fdc_food (fdc_id, name)
						VALUES (?, ?);""",
						[fdc_id, name]
					)

				cursor.execute(
					"""INSERT INTO density (fdc_id, density)
					VALUES (?, ?);""",
					[fdc_id, fdc_id_to_density[fdc_id]]
				)

				count = count + 1
	
	print(f"Added {count} densities from the FDC")
	
	connection.commit()

	file.close()