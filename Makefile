default: copy
all: default

copy:
	# ignore errors if the directory already exists
	mkdir ./dist/server/ || true
	cp -r ./src/server/. ./dist/server/

clean:
	rm -Rf ./dist/server