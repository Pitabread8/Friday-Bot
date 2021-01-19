const Discord = require('discord.js');
const { prefix } = require('../config.json');
const { picture } = require('../config.json');

let colors = [
    "#E23838",
    "#F78200",
    "#FFB900",
    "#5EBD3E",
    "#009CDF",
    "#973999"
];
  

module.exports = {
	name: 'help',
	description: 'Lists all possible commands or info about a specific command.',
	aliases: ['commands'],
	execute(message, args) {
        const data = [];
        const { commands } = message.client;
        names = commands.map(command => command.name)
        actions = commands.map(command => command.description)

        if (!args.length) {
            var color = Math.floor( Math.random() * (colors.length + 1) );
            const helpEmbed = new Discord.MessageEmbed()
                .setColor(colors[color])
                .setTitle('Friday\'s Commands')
                .setDescription(`\nYou can send \`${prefix}help <command name>\` to get info on a specific command.`)
                .setThumbnail(picture)
                .setFooter('Friday AI')
                for (i = 1; i < (names.length + 1); i++) {
                    helpEmbed.addField(`\`${prefix}${names[i - 1]}\``, `${actions[i - 1]}`, true)
                }
            return message.channel.send(helpEmbed);
        }

        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

        if (!command) {
            return message.reply('That\'s not a valid command!');
        }
        
        var color = Math.floor( Math.random() * (colors.length + 1) );
        const assistEmbed = new Discord.MessageEmbed()
            .setColor(colors[color])
            .setTitle('Friday\'s Commands')
            .setThumbnail(picture)
            .setFooter('Friday AI')
            assistEmbed.addField(`**Command**`, `\`${command.name}\``)
            if (command.aliases) {
                assistEmbed.addField(`**Aliases**`, `\`${command.aliases.join(', ')}\``)
            }
            if (command.description) {
                assistEmbed.addField(`**Description**`, `${command.description}`)
            }
            if (command.usage) {
                assistEmbed.addField(`**Usage**`, `${command.usage}`)
            }
        message.channel.send(assistEmbed);
	},
};