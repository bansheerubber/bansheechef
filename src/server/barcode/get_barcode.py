from ..database import create_connection
from ..validation import validate_string, generate_type_error
from aiohttp import web
import json

async def get_barcode(request):
	values = await request.post()
	barcode = validate_string(values.get("barcode", None))

	if not barcode:
		return web.Response(content_type="text/json", body=generate_type_error())

	connection, cursor = create_connection()

	if barcode:
		result = cursor.execute(
			"""SELECT name, max_amount, source, i.id
				FROM ingredient_types i
				LEFT JOIN images im ON i.image_id = im.id
				WHERE barcode = ?;""",
			[barcode]
		).fetchone()

		if result:
			return web.Response(
				content_type="text/json",
				body=json.dumps({
					"image": result[2],
					"maxAmount": result[1],
					"name": result[0],
					"typeId": result[3],
				}),
			)
	
	return web.Response(
		content_type="text/json",
		body="{}"
	)
