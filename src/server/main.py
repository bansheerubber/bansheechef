from flask import Flask, Response, url_for, redirect, render_template, request, session, flash, jsonify, send_from_directory
import asyncio
import flask
import sqlite3
import os
import logging
import json
import re
import cv2
import ssl

from aiortc import VideoStreamTrack, MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder
from random import choice
from string import ascii_lowercase

from aiohttp import web

HOME = os.getenv("HOME")
LOCAL = f"{HOME}/.config/bansheechef"
LOCAL_STORAGE = f"{LOCAL}/storage"
LOCAL_IMAGES = f"{LOCAL_STORAGE}/images"

TEMPLATES = "./templates"
STATIC = "./static"

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
	deletes an individual ingredient with specified ID
"""
async def delete_ingredient(request):
	connection, cursor = create_connection()

	values = await request.post()
	id = values.get("id")
	cursor.execute("""DELETE FROM ingredients WHERE id = ?;""", [id])

	if cursor.rowcount > 0:
		type_id = values.get("typeId")
		cursor.execute(
			"""UPDATE ingredient_types SET unit_count = unit_count - 1 WHERE id = ?;""",
			[type_id]
		)
	
		connection.commit()
		connection.close()
		return web.Response(content_type="text/json", body='{"success": true}')
	else:
		connection.close()
		return web.Response(content_type="text/json", body='{"success": false}')

"""
	'name' and 'max_amount' required
	'current_amount' defaults to 'max_amount' if omitted

	returns a ingredient encoded as json:
	{
		// data from individual ingredient
		amount: number
		
		// data from type
		maxAmount: number
		name: string
		image: string
	}
"""
async def add_ingredient(request):
	values = await request.post()
	
	name = values.get("name")
	max_amount = values.get("maxAmount")
	current_amount = values.get("currentAmount")

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
	if "picture" in values:
		# TODO this whole thing really needs to be made secure
		picture = values["picture"].file
		image_name = f"{get_random_image_name()}.png"
		database_name = f"local:{image_name}"
		filename = f"{LOCAL_IMAGES}/{image_name}"

		cursor.execute("""INSERT INTO images (source) VALUES(?);""", [database_name])
		image_id = cursor.lastrowid

		file = open(filename, "wb")
		file.write(picture.read())
		file.close()
	
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
	ingredient_id = cursor.lastrowid

	# update unit count
	cursor.execute(
		"""UPDATE ingredient_types SET unit_count = unit_count + 1 WHERE id = ?;""",
		[ingredient_type_id]
	)

	result = cursor.execute(
		"""SELECT unit_count FROM ingredient_types WHERE id = ?;""",
		[ingredient_type_id]
	)
	units = result.fetchone()[0]

	connection.commit()
	connection.close()

	return web.Response(
		content_type="text/json",
		body=json.dumps({
			"amount": current_amount,
			"id": ingredient_id,
			"image": database_name,
			"maxAmount": max_amount,
			"name": name,
			"typeId": ingredient_type_id,
			"units": units,
		})
	)

def get_ingredients(request):
	connection, cursor = create_connection()
	
	results = cursor.execute(
		"""SELECT name, max_amount, unit_count, source, SUM(current_amount), i.id
			 FROM ingredient_types i
			 LEFT JOIN images im ON i.image_id = im.id
			 JOIN ingredients ing ON i.id = ing.ingredient_type_id
			 GROUP BY i.id;"""
	).fetchall()
	array = []
	for result in results:
		array.append({
			"image": result[3],
			"maxAmount": result[1],
			"name": result[0],
			"typeId": result[5],
			"units": result[2],
		})
	
	connection.close()

	return web.Response(content_type="text/json", body=json.dumps(array))

detection = re.compile(r"^[a-z]+\.png$")
def images(request):
	image = request.match_info.get("image", "")
	
	if detection.match(image) != None and os.path.isfile(f"{LOCAL_IMAGES}/{image}"):
		content = open(os.path.join(LOCAL_IMAGES, image), "rb").read()
		return web.Response(content_type="image/png", body=content)
	else:
		return web.Response(content_type="text/html", body="")

def index(request):
	content = open(os.path.join(TEMPLATES, "index.html")).read()
	return web.Response(content_type="text/html", text=content)

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

	# create the webapp
	app = web.Application()
	app.add_routes([web.static("/static", STATIC)])
	app.router.add_get("/", index)
	app.router.add_get("/images/{image}", images)
	app.router.add_get("/get-ingredients/", get_ingredients)
	app.router.add_post("/add-ingredient/", add_ingredient)
	app.router.add_post("/delete-ingredient/", delete_ingredient)

	ssl_context = ssl.SSLContext()
	ssl_context.load_cert_chain(f"{LOCAL}/server.cert", f"{LOCAL}/server.key")
	web.run_app(app, access_log=None, host="0.0.0.0", port=5000, ssl_context=ssl_context)