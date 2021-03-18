CREATE TABLE images (
	id INTEGER PRIMARY KEY,
	source VARCHAR(256)
);

CREATE TABLE ingredient_types (
	id INTEGER PRIMARY KEY,
	name VARCHAR(50) NOT NULL, /* in all lowercase */
	barcode VARCHAR(50), /* this can be null since some things may not have barcodes */
	max_amount FLOAT NOT NULL, /* in cups */
	is_volume BOOLEAN NOT NULL, /* whether or not this can be represented by cups */
	unit_count INTEGER,
	image_id INTEGER unsigned,
	FOREIGN KEY (image_id) REFERENCES images (id),
	UNIQUE(name, max_amount, is_volume, barcode)
);

CREATE TABLE ingredients (
	id INTEGER PRIMARY KEY,
	ingredient_type_id INTEGER unsigned NOT NULL,
	current_amount FLOAT, /* in cups */
	FOREIGN KEY (ingredient_type_id) REFERENCES ingredient_types (id)
);

CREATE TABLE barcode_lookup (
	id INTEGER PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	barcode VARCHAR(50) NOT NULL,
	source INTEGER NOT NULL, /* the database we pulled from */
	image_id INTEGER unsigned,
	FOREIGN KEY (image_id) REFERENCES images (id),
	UNIQUE(barcode)
);

/* speed up barcode operations */
CREATE UNIQUE INDEX barcode_lookup_index ON barcode_lookup (barcode);

CREATE TABLE fdc_food (
	id INTEGER PRIMARY KEY,
	fdc_id INTEGER NOT NULL, /* food's fdc id */
	name VARCHAR(50)
);

CREATE TABLE density (
	id INTEGER PRIMARY KEY,
	fdc_id INTEGER NOT NULL,
	density FLOAT, /* g/cm^3 */
	FOREIGN KEY (fdc_id) REFERENCES fdc_food (fdc_id)
);
