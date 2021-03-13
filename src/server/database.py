import sqlite3
import os
import re

from .constants import LOCAL_STORAGE

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
	
	return (connection, cursor)

def read_food_database(connection, cursor):
	file = open("data/open-barcodes.csv")
	file.readline() # absorb header
	count = 0
	for line in file:
		split = line.split("\t")
		potential_barcode = split[0]
		name = split[7]

		cursor.execute(
			"""INSERT OR IGNORE INTO barcode_lookup (name, barcode, source)
			VALUES(?, ?, ?);""",
			[name, potential_barcode, 0]
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