import sqlite3
import os

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
	
	return (connection, cursor)