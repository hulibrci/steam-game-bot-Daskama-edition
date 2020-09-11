const games = require('./games');
const offers = require('./offers');
const steam = require('./steam');
const files = require('./files');
const users = require('./users');
//2fa
const SteamTOTP = require('steam-totp');
// 
const {EOL} = require('os');
//user
const SteamUser = require('steam-user');

const {isURL , isSteamID64 , GetSteamID64FromURL , Log } = require('azul-tools');


let tasks = [];
let current = [];

exports.setWorking = (user) => {current.push(user)};
exports.setNotWorking = (user) => {current.splice(current.indexOf(user), 1)}

exports.execute = (sender, command, args) => {
	if(current.indexOf(sender.getSteamID64()) > -1)
		return steam.message(sender, "Please wait for your current action to be completed. Thanks");

	let cmdObj = commands[command.toLowerCase()];

	if(cmdObj == null)
		return steam.message(sender, command + " is not a valid command. (Case Sensitive) ");

	if(cmdObj.admin && files.getConfig().admins.indexOf(sender.toString()) < 0)
		return steam.message(sender, command + " is not a valid command.");
	
	if(!cmdObj.args && !cmdObj.optional)
		return cmdObj.exec(sender);

	if(cmdObj.args && cmdObj.args.length > args.length) {
		if(command.toLowerCase().startsWith("buy"))
			return steam.message(sender, "You must enter a valid amount.");

		return steam.message(sender, "Invalid arguments.");
	}

	cmdObj.exec(sender, args);
}

const updateapps = (sender) => {
	files.updateApps((error, updated) => {
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, additional information in console.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "Apps were updated, " + (updated < 0 ? " removed " + updated * - 1 : " added " + updated) + ".");
	});
}

const load = (sender, args) => {
	let file = args[0];

	games.loadFromFile('data/load/' + file, error => {
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, additional information in console - any scans preceding the error has succeeded.");
			}

			return steam.message(sender, error + " - any scans preceding the error has succeeded.");
		}

		steam.message(sender, "Succesfully loaded all games from " + file + ".");
	});
}

const setprice = (sender, args) => {
	let price = args[0];
	let currency = args[1];
	let type = args[2].toLowerCase();

	if(type == "random") {
		games.setRandomPrice(price, currency, error => {
			if(error) {
				if(typeof error != 'string') {
					console.error(error);
					return steam.message(sender, "An error occurred, additional information in console.");
				}

				return steam.message(sender, error);
			}

			steam.message(sender, "Set price of random games to " + price + " " + currency + ".");
		});
		return;
	}

	if(type == "unique") {
		games.setPrice(price, currency, error => {
			if(error) {
				if(typeof error != 'string') {
					console.error(error);
					return steam.message(sender, "An error occurred, additional information in console.");
				}

				return steam.message(error);
			}

			steam.message(sender, "Set price of unqiue games to " + price + " " + currency + ".");
		});
		return;
	}

	steam.message(sender, "Invalid type, must be either random or unique");
}

const broadcast = (sender, args) => {
	let message = args.join(" ");
	
	steam.broadcast(message);
}

const withdraw = (sender) => {
	let index = current.push(sender.getSteamID64()) - 1;
	offers.withdraw(sender, (error, offer) => {
		current.splice(index, 1);
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, additional information in console.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "Offer sent: " + offer);
	});
}

//owner coamnds
const sandowner = (sender) => {

	let Response = "/pre If you're experiencing issues please contact me : " + EOL + "HelpDesk : https://www.hulibrci.wtf/ticket/public/en/ " + EOL +  "Discord : https://discord.gg/85VTpmY "+  EOL + "Steam : https://steamcommunity.com/id/19992110";
	
	steam.message(sender, Response);

}
//NO EDIT. only if you support me . Thanks
const developer = (sender) => {

	let Response = "/pre  Developer: Daskama";
	Response += EOL + "Steam : https://steamcommunity.com/id/19992110 ";
	Response += EOL + "discord : Daskama#2967";
	Response += EOL + "groups: https://steamcommunity.com/groups/steamkeystore";
	Response += EOL + "website: https://www.hulibrci.wtf/";
	Response += EOL;
	steam.message(sender, Response);

}


//new help system 
const help = (sender) => {

	let Response = "/pre  Commands:";
    const Prefix = "•";
	Response += EOL + Prefix + "!help - Displays a list of available commands.";
	Response += EOL + Prefix + "!owner - show my owners steam profile, if you have any major issues you can contact my owner!";
	Response += EOL;
	Response += EOL + Prefix + "!price - Displays my prices.";
	Response += EOL + Prefix + "!check - Tells you how many games you can buy from me, and for what price.";
	Response += EOL;
	Response += EOL + Prefix + "!retrieve - Sends you the key for the last games you paid for.";
	Response += EOL + Prefix + "!cancel - Cancels your current offer";
	Response += EOL;
	Response += EOL + "CSGO Section.";
    Response += EOL + Prefix + "!buy <amount> - Sends you an offer with the CSGO price of the unique games.";
	Response += EOL + Prefix + "!buyrandom <amount> - Sends you an offer with the CSGO price of the unique games.";
	Response += EOL;
	Response += EOL + "TF2 Section.";
	Response += EOL + Prefix + "!buytf <amount> - Sends you an offer with the TF2 price of the unique games.";
	Response += EOL + Prefix + "!buyrandomtf <amount> - Sends you an offer with the TF2 price of the unique games.";
    Response += EOL;
	Response += EOL + "Gem Section.";
	Response += EOL + Prefix + "!buygems <amount> - Sends you an offer with the gem price of the unique games.";
	Response += EOL + Prefix + "!buyrandomgems <amount> - Sends you an offer with the gem price of the unique games.";
	Response += EOL;
	steam.message(sender, Response);

}

//admin coamnd
const helpadmin = (sender) => {
	
	let Response = "/pre Admin Commands:";
    const Prefix = "•";
	
    Response += EOL + Prefix + "!updateapps - Updates the apps.json file, containing information about steam games (necessary for unique games).";
    Response += EOL + Prefix + "!load <file> - Loads in games from the load folder, file specified is the file name, not full path.";
	Response += EOL + Prefix + "!broadcast <message> - Sends a message to all of the bots friends.";
    Response += EOL + Prefix + "!withdraw - Sends you an offer with all of my items.";
    Response += EOL + Prefix + "!setprice <price> <payment> <random/unique> - Sets the price of either random or unique games. Format for price is price:games (i.e. 1:20 means 20 games will cost 1 key).";
	Response += EOL + Prefix + "!updatestatus - update steam status CSGO , GEMS ";
    Response += EOL + Prefix + "!tvofa - 2FA code ";
	steam.message(sender, Response );
	
	
}

//update status
const updateStatus = (sender) => {
	
	users.updatePersona();
	
	steam.message(sender, "/pre Successfuly update status! " );
}

//2fa code
const twoFA = (sender) => {
		config = files.getConfig();
        let code = SteamTOTP.generateAuthCode(config.shared);
        steam.message(sender, "/me 2FA =>" + code );
}

const check = (sender, args) => {
	users.performBuyCheck(sender, (error, random, unique) => {
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "I have " + unique[0] + " games that you don't own, " + unique[1]);

		if(random.length > 0)
			steam.message(sender, random);
	});
}

const price = (sender) => {
	games.getPrice((error, random, unique) => {
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "/pre An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

        let Price = "/pre Currently, prices are: "  + EOL ;
	
		if(unique.length > 0)
			Price +=  EOL + "Unique games  " + EOL;
		    Price += unique;
		if(random.length > 0)
		    Price +=  EOL +  "Random games" + EOL ;	
		    Price += random ;
		
		steam.message(sender,Price);
	});
}

const buy = (sender, args) => {
	let amount = 1;

	if(args.length >= 1 && isNaN(args[0]))
		return steam.message(sender, "Invalid amount");

	if(args.length >= 1)
		amount = parseInt(args[0]);

	let index = current.push(sender.getSteamID64()) - 1;

	users.buyGame(sender.toString(), amount, "csgo", (error, offer) => {
		current.splice(index, 1);
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "(REMEMBER TO READ OFFER MESSAGE !!!)\n Offer sent: " + offer);
	});
}

const buytf = (sender, args) => {
	let amount = 1;

	if(args.length >= 1 && isNaN(args[0]))
		return steam.message(sender, "Invalid amount");

	if(args.length >= 1)
		amount = parseInt(args[0]);

	let index = current.push(sender.getSteamID64()) - 1;

	users.buyGame(sender.toString(), amount, "tf", (error, offer) => {
		current.splice(index, 1);
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "(REMEMBER TO READ OFFER MESSAGE !!!)\n Offer sent: " + offer);
	});
}

const buygems = (sender, args) => {
	let amount = 1;

	if(args.length >= 1 && isNaN(args[0]))
		return steam.message(sender, "Invalid amount");

	if(args.length >= 1)
		amount = parseInt(args[0]);

	let index = current.push(sender.getSteamID64()) - 1;

	users.buyGame(sender.toString(), amount, "gems", (error, offer) => {
		current.splice(index, 1);
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "(REMEMBER TO READ OFFER MESSAGE !!!)\n Offer sent: " + offer);
	});
}

const buyrandom = (sender, args) => {
	let amount = 1;
	if(args.length >= 1 && isNaN(args[0]))
		return steam.message(sender, "Invalid amount");

	if(args.length >= 1)
		amount = parseInt(args[0]);

	let index = current.push(sender.getSteamID64()) - 1;

	users.buyRandom(sender.toString(), amount, "csgo", (error, offer) => {
		current.splice(index, 1);
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "(REMEMBER TO READ OFFER MESSAGE !!!)\n Offer sent: " + offer);
	});
}

const buyrandomtf = (sender, args) => {
	let amount = 1;
	if(args.length >= 1 && isNaN(args[0]))
		return steam.message(sender, "Invalid amount");

	if(args.length >= 1)
		amount = parseInt(args[0]);

	let index = current.push(sender.getSteamID64()) - 1;

	users.buyRandom(sender.toString(), amount, "tf", (error, offer) => {
		current.splice(index, 1);
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "(REMEMBER TO READ OFFER MESSAGE !!!)\n Offer sent: " + offer);
	});
}

const buyrandomgems = (sender, args) => {
	let amount = 1;
	if(args.length >= 1 && isNaN(args[0]))
		return steam.message(sender, "Invalid amount");

	if(args.length >= 1)
		amount = parseInt(args[0]);

	let index = current.push(sender.getSteamID64()) - 1;

	users.buyRandom(sender.toString(), amount, "gems", (error, offer) => {
		current.splice(index, 1);
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}

		steam.message(sender, "(REMEMBER TO READ OFFER MESSAGE !!!)\n Offer sent: " + offer);
	});
}

const retrieve = (sender) => {
	users.handle(sender, (error) => {
		if(error) {
			if(typeof error != 'string') {
				console.error(error);
				return steam.message(sender, "An error occurred, please try again later.");
			}

			return steam.message(sender, error);
		}
	});
}

const cancel = (sender) => {
	offers.cancel(sender, () => {
	
	 let Response = "/pre Your offer has been cancelled "; 
	     Response += EOL ;
	     Response += EOL + "If you have a problem, please contact support."; 
		 Response += EOL + "discord : discord.gg/ZjxtdHM"; 
		 Response += EOL +  "HelpDesk: https://www.hulibrci.wtf/ticket/public/en/"; 
		 Response += EOL ;

		steam.message(sender, Response);
	    Log.Trade(" offer has been cancelled by user " + sender.toString());
	});
}

const commands = {
	updateapps: {
		description: 'Updates the apps.json file, containing information about steam games (necessary for unique games).',
		admin: true,
		exec: updateapps
	},
	load: {
		args: ['file'],
		description: 'Loads in games from the load folder, file specified is the file name, not full path.',
		admin: true,
		exec: load
	},
	broadcast: {
		args: ['message'],
		description: 'Sends a message to all of the bots friends.',
		admin: true,
		exec: broadcast
	},
	setprice: {
		args: ['price', 'payment', 'random/unique'],
		description: 'Sets the price of either random or unique games. Format for price is price:games (i.e. 1:20 means 20 games will cost 1 key).',
		admin: true,
		exec: setprice
	},
	withdraw: {
		description: 'Sends you an offer with all of my items.',
		admin: true,
		exec: withdraw
	},
	help: {
		description: 'Displays a list of available commands.',
		admin: false,
		exec: help
	},
	admin: {
		description: 'Displays a list of available commands.',
		admin: true,
		exec: helpadmin
	},
	price: {
		description: 'Displays my prices.',
		admin: false,
		exec: price
	},
	dev: {
		description: 'Developer.',
		admin: false,
		exec: developer
	},
	check: {
		description: "Tells you how many games you can buy from me, and for what price.",
		admin: false,
		exec: check
	},
	buy: {
		args: ['amount'],
		description: "Sends you an offer with the CSGO price of the unique games.",
		admin: false,
		exec: buy
	},
	buytf: {
		args: ['amount'],
		description: "Sends you an offer with the TF2 price of the unique games.",
		admin: false,
		exec: buytf
	},
	buygems: {
		args: ['amount'],
		description: "Sends you an offer with the gem price of the unique games.",
		admin: false,
		exec: buygems
	},
	buyrandom: {
		args: ['amount'],
		description: "Sends you an offer with the CSGO price of the unique games.",
		admin: false,
		exec: buyrandom
	},
	buyrandomtf: {
		args: ['amount'],
		description: "Sends you an offer with the TF2 price of the unique games.",
		admin: false,
		exec: buyrandomtf
	},
	buyrandomgems: {
		args: ['amount'],
		description: "Sends you an offer with the gem price of the unique games.",
		admin: false,
		exec: buyrandomgems
	},
	retrieve: {
		description: "Sends you the key for the last games you paid for.",
		admin: false,
		exec: retrieve
	},
	cancel: {
		description: "Cancels your current offer",
		admin: false,
		exec: cancel
	},
	tvofa: {
		description: "2 fa code ",
		admin: true,
		exec: twoFA
	},
	owner: {
		description: "block a user ",
		admin: false,
		exec: sandowner
	},
   updatestatus: {
        description: "Test",
        admin: true,
        exec:updateStatus
  }
}
