from flask import Flask, Response, url_for, redirect, render_template, request, session, flash, jsonify, send_from_directory
import flask
import sqlite3
import os
import logging
import json
import re
from random import choice
from string import ascii_lowercase

HOME = os.getenv("HOME")
LOCAL = f"{HOME}/.config/bansheechef"
LOCAL_STORAGE = f"{LOCAL}/storage"
LOCAL_IMAGES = f"{LOCAL_STORAGE}/images"

app = Flask(__name__)

def create_connection():
	file = f"{LOCAL_STORAGE}/data.db"
	connection = sqlite3.connect(file)
	cursor = connection.cursor()

	results = cursor.execute("""SELECT name FROM sqlite_master WHERE type='table';""").fetchall()
	if len(results) == 0: # init tables
		buffer = ""
		for line in open("./init.sql").readlines():
			buffer = buffer + line.strip()

			if ";" in buffer:
				cursor.execute(buffer)
				buffer = ""

		if ";" in buffer:
			cursor.execute(buffer)
			
		connection.commit()
	
	return (connection, cursor)

def get_random_image_name():
	return "".join(choice(ascii_lowercase) for i in range(8))

"""
	'name' and 'max_amount' required
	'current_amount' defaults to 'max_amount' if omitted
"""
@app.route("/add-ingredient/", methods=["POST"])
def add_ingredient():
	name = request.values.get("name")
	max_amount = request.values.get("maxAmount")
	current_amount = request.values.get("currentAmount")

	if name == None or max_amount == None or not (type(max_amount) == int or float):
		return "{}" # error out if name/max_amount isn't provided, or ifs max_amount is not a valid number
	
	name = name.strip()

	if current_amount == None:
		current_amount = max_amount
	elif not (type(current_amount) == int or float):
		return "{}" # error out if current_amount is not a valid number
	
	connection, cursor = create_connection()

	image_id = -1
	database_name = ""
	if "picture" in request.files:
		picture = request.files["picture"]
		image_name = f"{get_random_image_name()}.png"
		database_name = f"local:{image_name}"
		filename = f"{LOCAL_IMAGES}/{image_name}" # TODO this really needs to be made secure

		cursor.execute("""INSERT INTO images (source) VALUES(?);""", [database_name])
		image_id = cursor.lastrowid
		picture.save(filename)
	
	# check if we already have an ingredient type
	cursor.execute(
		"""SELECT id FROM ingredient_types WHERE name = ? AND max_amount = ?;""",
		[name, max_amount]
	)
	result = cursor.fetchall()

	ingredient_type_id = None
	if len(result) != 0:
		# use the result
		ingredient_type_id = result[0][0]
	else:
		# insert the ingredient type
		cursor.execute(
			"""INSERT INTO ingredient_types (name, max_amount, image_id, unit_count, is_volume) VALUES(?, ?, ?, 0, TRUE);""",
			[name, max_amount, image_id]
		)
		ingredient_type_id = cursor.lastrowid
	
	# add an ingredient
	cursor.execute(
		"""INSERT INTO ingredients (ingredient_type_id, current_amount) VALUES(?, ?);""",
		[ingredient_type_id, current_amount]
	)

	# update 'bottle count'
	cursor.execute(
		"""UPDATE ingredient_types SET unit_count = unit_count + 1 WHERE id = ?""",
		[ingredient_type_id]
	)

	connection.commit()
	connection.close()

	return json.dumps({
		"name": name,
		"maxAmount": max_amount,
		"amount": current_amount,
		"image": database_name,
	})

@app.route("/get-ingredients/")
def get_ingredients():
	connection, cursor = create_connection()
	
	results = cursor.execute(
		"""SELECT name, max_amount, unit_count, source, SUM(current_amount)
			 FROM ingredient_types i
			 LEFT JOIN images im ON i.image_id = im.id
			 JOIN ingredients ing ON i.id = ing.ingredient_type_id
			 GROUP BY i.id;"""
	).fetchall()
	array = []
	for result in results:
		array.append({
			"name": result[0],
			"bottles": result[2],
			"maxAmount": result[1],
			"amount": 0,
			"image": result[3],
		})

	return json.dumps(array)

detection = re.compile(r"^[a-z]+\.png$")
@app.route("/images/<image>")
def images(image):
	if detection.match(image) != None and os.path.isfile(f"{LOCAL_IMAGES}/{image}"):
		return send_from_directory(LOCAL_IMAGES, image)
	else:
		return ""

if __name__ == '__main__':
	if not os.path.isdir(LOCAL):
		os.mkdir(LOCAL)

	if not os.path.isdir(LOCAL_STORAGE):
		os.mkdir(LOCAL_STORAGE)
	
	if not os.path.isdir(LOCAL_IMAGES):
		os.mkdir(LOCAL_IMAGES)

	# create tables if we don't have them
	connection, cursor = create_connection()
	connection.close()
	
	handler = logging.StreamHandler()
	handler.setLevel(logging.INFO)
	app.debug = True
	app.logger.addHandler(handler)
	app.run(host='0.0.0.0', debug=True)