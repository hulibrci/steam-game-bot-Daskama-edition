const files = require('./utils/files');
const steam = require('./utils/steam');

const time = Date.now();
var ready = false;
const {Log} = require('azul-tools');


files.setup(() => {
	steam.setup((error) => {
		if(error)
			return console.log("Error while initializing bot: " + error);
		Log("Game Bot is now ONLINE " + (Date.now() - time) + "ms)");
		ready = true;
		Log("waiting for customer =>");
	});
});

exports = module.exports = ready;