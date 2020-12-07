CREATE TABLE images (
	id INTEGER NOT NULL,
	source VARCHAR(256),
	PRIMARY KEY (id)
);

CREATE TABLE ingredients (
	id INTEGER NOT NULL,
	name VARCHAR(50),
	max_amount FLOAT,
	current_amount FLOAT,
	image_id INTEGER unsigned,
	PRIMARY KEY (id),
	FOREIGN KEY (image_id) REFERENCES images (id)
);