from flask import Flask, Response, url_for, redirect, render_template, request, session, flash, jsonify
import flask
import sqlite3
import os
import logging
import json

HOME = os.getenv("HOME")
LOCAL = f"{HOME}/.config/bansheechef"
LOCAL_STORAGE = f"{LOCAL}/storage"

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

"""
	'name' and 'max_amount' required
	'current_amount' defaults to 'max_amount' if omitted
"""
@app.route("/add-ingredient/")
def add_ingredient():
	name = request.args.get("name")
	max_amount = request.args.get("max_amount")
	current_amount = request.args.get("current_amount")

	if name == None or max_amount == None:
		return "{}"

	if current_amount == None:
		current_amount = max_amount
	
	connection, cursor = create_connection()

	image_source = request.args.get("image_source")
	image_id = -1
	if image_source:
		cursor.execute("""INSERT INTO images (source) VALUES(?) RETURNING id;""", [image_source])
		image_id = cursor.fetchone()[0]
	
	cursor.execute(
		"""INSERT INTO ingredients (name, max_amount, current_amount, image_id) VALUES(?, ?, ?, ?);""",
		[name, max_amount, current_amount, image_id]
	)

	connection.commit()
	connection.close()

	return json.dumps({
		"name": name,
		"maxAmount": max_amount,
		"amount": current_amount,
		"image": image_source,
	})

@app.route("/get-ingredients/")
def get_ingredients():
	connection, cursor = create_connection()
	
	results = cursor.execute("""SELECT i.name, i.max_amount, i.current_amount, im.source FROM ingredients i LEFT JOIN images im ON i.image_id = im.id;""").fetchall()
	array = []
	for result in results:
		array.append({
			"name": result[0],
			"maxAmount": result[1],
			"amount": result[2],
			"image": result[3],
		})

	return json.dumps(array)

if __name__ == '__main__':
	if not os.path.isdir(LOCAL):
		os.mkdir(LOCAL)

	if not os.path.isdir(LOCAL_STORAGE):
		os.mkdir(LOCAL_STORAGE)

	# create tables if we don't have them
	connection, cursor = create_connection()
	connection.close()
	
	handler = logging.StreamHandler()
	handler.setLevel(logging.INFO)
	app.debug = True
	app.logger.addHandler(handler)
	app.run(host='0.0.0.0', debug=True)