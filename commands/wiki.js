module.exports = {
	name: 'wiki',
	description: 'Sends a link to the wiki page of a MCU character or artifact.',
	aliases: ['char','character', 'fandom', 'object', 'artifact'],
	execute(message, args) {
        String.prototype.toProperCase = function () {
            return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        };

        let names = [];

        for (i = 0; i < args.length; i++) { 
            names.push(args[i].toProperCase());
        }

        char = names.join("_");
        
        message.channel.send(`https://marvelcinematicdatabase.fandom.com/wiki/${char}`);
	},
};