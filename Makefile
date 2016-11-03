
client:
	@echo "!function() {" > muutio.js
	@cat lib/* >> muutio.js
	@echo "}()" >> muutio.js

min: client
	uglifyjs muutio.js --mangle > muutio.min.js