CREATE TABLE images (
	id INTEGER PRIMARY KEY,
	source VARCHAR(256)
);

CREATE TABLE ingredient_types (
	id INTEGER PRIMARY KEY,
	name VARCHAR(50) NOT NULL, /* in all lowercase */
	max_amount FLOAT NOT NULL, /* in cups */
	is_volume BOOLEAN NOT NULL, /* whether or not this can be represented by cups */
	unit_count INTEGER,
	image_id INTEGER unsigned,
	FOREIGN KEY (image_id) REFERENCES images (id),
	UNIQUE(name, max_amount, is_volume)
);

CREATE TABLE ingredients (
	id INTEGER PRIMARY KEY,
	ingredient_type_id INTEGER unsigned NOT NULL,
	current_amount FLOAT, /* in cups */
	FOREIGN KEY (ingredient_type_id) REFERENCES ingredient_types (id)
);
