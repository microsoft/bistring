all:
	npm run build

deps:
	npm install --ignore-scripts

check: all
	npm test

clean:
	$(RM) -r dist

.PHONY: all deps check clean
