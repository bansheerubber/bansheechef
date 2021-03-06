from flask import Flask, Response, url_for, redirect, render_template, request, session, flash, jsonify, send_from_directory
import asyncio
import flask
import os
import logging
import json
import re
import cv2
import ssl
import requests

from aiortc import VideoStreamTrack, MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder
from random import choice
from string import ascii_lowercase

from aiohttp import web

from .barcode.get_barcode import get_barcode, barcode_name_lookup
from .barcode.barcode import barcode_offer
from .constants import LOCAL, LOCAL_STORAGE, LOCAL_IMAGES, TEMPLATES, STATIC
from .database import create_connection
from .validation import validate_float, validate_int, validate_string, generate_type_error

app = Flask(__name__)

def get_random_image_name():
	return "".join(choice(ascii_lowercase) for i in range(8))

"""
	deletes an individual ingredient with specified ID
"""
async def delete_ingredient(request):
	connection, cursor = create_connection()

	values = await request.post()
	id = validate_int(values.get("id"))
	
	if not id: # type check
		return web.Response(content_type="text/json", body=generate_type_error())
	
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

async def update_ingredient(request):
	values = await request.post()

	ingredient_id = validate_int(values.get("id"))
	amount = validate_float(values.get("amount"))
	
	if not amount or not ingredient_id: # type check
		return web.Response(context_type="text/json", body=generate_type_error())
	
	connection, cursor = create_connection()
	
	cursor.execute(
		"""UPDATE ingredients SET current_amount = ? WHERE id = ?;""",
		[amount, ingredient_id]
	)

	result = cursor.execute(
		"""SELECT name, max_amount, source, current_amount, i.id, ing.id, barcode
		FROM ingredient_types i
		LEFT JOIN images im ON i.image_id = im.id
		JOIN ingredients ing ON i.id = ing.ingredient_type_id
		WHERE ing.id = ?;""",
		[ingredient_id]
	).fetchone()

	connection.commit()
	connection.close()

	return web.Response(
		content_type="text/json",
		body=json.dumps({ # IngredientData object
			"amount": result[3],
			"barcode": result[6],
			"id": result[5],
			"image": result[2],
			"maxAmount": result[1],
			"name": result[0],
			"typeId": result[4],
		})
	)

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
	
	name = validate_string(values.get("name"))
	max_amount = validate_float(values.get("maxAmount"))
	current_amount = validate_float(values.get("currentAmount"))
	barcode = validate_string(values.get("barcode"))

	if not name or not max_amount: # type check
		return web.Response(content_type="text/json", body=generate_type_error()) # error out if name/max_amount isn't provided, or if max_amount is not a valid number

	if current_amount == None:
		current_amount = max_amount
	
	connection, cursor = create_connection()
	
	# check if we already have an ingredient type
	cursor.execute(
		"""SELECT i.id, im.id, im.source
		FROM ingredient_types i
		LEFT JOIN images im ON im.id = i.image_id
		WHERE name = ? AND max_amount = ?;""",
		[name, max_amount]
	)
	result = cursor.fetchall()

	image_id = -1
	image = ""
	ingredient_type_id = None
	if len(result) != 0:
		# use the result
		ingredient_type_id = result[0][0]
		image_id = result[0][1]
		image = result[0][2]
	else:
		if "pictureBlob" in values:
			# TODO this whole thing really needs to be made secure
			picture = values["pictureBlob"].file
			image_name = f"{get_random_image_name()}.png"
			image = f"local:{image_name}"
			filename = f"{LOCAL_IMAGES}/{image_name}"

			cursor.execute("""INSERT INTO images (source) VALUES(?);""", [image])
			image_id = cursor.lastrowid

			# TODO check magic number n stuff
			file = open(filename, "wb")
			file.write(picture.read())
			file.close()
		elif "picture" in values: # url link that we should download and store locally
			picture = validate_string(values.get("picture"))
			# no type error for this, just silently don't upload picture if we didn't get
			# valid input (maybe client didn't want to upload a picture in the first place)
			if picture:
				image_name = f"{get_random_image_name()}.png"
				image = f"local:{image_name}"
				filename = f"{LOCAL_IMAGES}/{image_name}"

				request = requests.get(picture)
				if request.status_code == 200: # TODO add better error checking, size limit, etc
					cursor.execute("""INSERT INTO images (source) VALUES(?);""", [image])
					image_id = cursor.lastrowid

					# TODO prevent url attacks and check magic number n stuff
					file = open(filename, "wb")
					file.write(request.content)
					file.close()
		
		# insert the ingredient type
		cursor.execute(
			"""INSERT INTO ingredient_types (name, max_amount, image_id, unit_count, is_volume, barcode)
			VALUES(?, ?, ?, 0, TRUE, ?);""",
			[name, max_amount, image_id, barcode]
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

	connection.commit()
	connection.close()

	return web.Response(
		content_type="text/json",
		body=json.dumps({ # IngredientData object
			"amount": current_amount,
			"barcode": barcode,
			"id": ingredient_id,
			"image": image,
			"maxAmount": max_amount,
			"name": name,
			"typeId": ingredient_type_id,
		})
	)

def get_ingredients(request):
	connection, cursor = create_connection()
	
	results = cursor.execute(
		"""SELECT name, max_amount, source, current_amount, i.id, ing.id, barcode
		FROM ingredient_types i
		LEFT JOIN images im ON i.image_id = im.id
		JOIN ingredients ing ON i.id = ing.ingredient_type_id;"""
	).fetchall()
	array = []
	for result in results:
		array.append({ # IngredientData object
			"amount": result[3],
			"barcode": result[6],
			"id": result[5],
			"image": result[2],
			"maxAmount": result[1],
			"name": result[0],
			"typeId": result[4],
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
	return web.Response(content_type="text/html", body=content)

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
	app.router.add_post("/update-ingredient/", update_ingredient)
	app.router.add_post("/barcode-offer/", barcode_offer)
	app.router.add_post("/get-barcode/", get_barcode)
	app.router.add_post("/name-lookup/", barcode_name_lookup)

	ssl_context = ssl.SSLContext()
	ssl_context.load_cert_chain(f"{LOCAL}/server.cert", f"{LOCAL}/server.key")
	web.run_app(app, access_log=None, host="0.0.0.0", port=5000, ssl_context=ssl_context)