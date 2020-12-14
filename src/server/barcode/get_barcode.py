from ..database import create_connection
from aiohttp import web
import json

async def get_barcode(request):
	values = await request.post()
	barcode = values.get("barcode", None)

	connection, cursor = create_connection()

	if barcode:
		result = cursor.execute(
			"""SELECT name, max_amount, unit_count, source, i.id
				FROM ingredient_types i
				LEFT JOIN images im ON i.image_id = im.id
				WHERE barcode = ?;""",
			[barcode]
		).fetchone()

		if result:
			return web.Response(
				content_type="application/json",
				text=json.dumps({
					"image": result[3],
					"maxAmount": result[1],
					"name": result[0],
					"typeId": result[4],
					"units": result[2],
				}),
			)
	
	return web.Response(
		content_type="application/json",
		text="{}"
	)
