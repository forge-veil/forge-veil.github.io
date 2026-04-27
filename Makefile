.PHONY: test build all

test:
	npm test -- --reporter=junit --outputFile=test-results.xml

build: test
	npm run build

all: build
