# wrangle a string into a float if its a valid float, otherwise none
def validate_float(input):
	if input == None: # pass through none
		return None
	
	try:
		return float(input)
	except: # return none if we couldn't convert
		return None

# wrangle a string into a int if its a valid int, otherwise none
def validate_int(input):
	if input == None: # pass through none
		return None
	
	try:
		return int(input)
	except: # return none if we couldn't convert
		return None

# if we get a none type or the empty string (after strip), return none
def validate_string(input):
	if input == None: # pass through none
		return None
	
	if input.strip() == "": # empty string is none
		return None
	
	return input.strip()

def generate_type_error():
	return json.dumps({
		"error": "Received parameter of unexpected type or none at all"
	})