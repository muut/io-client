
client:
	@echo "!function() {" > muutio.js
	@cat lib/* >> muutio.js
	@echo "}()" >> muutio.js