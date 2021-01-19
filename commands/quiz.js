// The discord library
const Discord = require('discord.js');
// This is from config.json, which has a section that says "picture": "[bot's avatar link]"
const { picture } = require('../config.json');

// Index.js runs all the command files at once, so we need to export it
module.exports = {
    // No explanation needed, aliases or just other names for commands
	name: 'trivia',
    description: 'Sends an MCU trivia question.',
    aliases: ['quiz', 'question'],
	async execute(message) {
        // Get the data
        const quiz = require('../quiz.json');
        // Choose a random question
        const item = quiz[Math.floor(Math.random() * quiz.length)];

        let options = [];
        var place = Math.floor((Math.random() * 4) + 0);
        for (i = 0; i < (item.wrong.length); i++) {
            options.push(item.wrong[i])
        }

        // Randomly add the correct answer to the list
        options.splice(place, 0, item.answer)

        // Embed and details
        const quizEmbed = new Discord.MessageEmbed()
            .setColor('#ffff00')
            .setTitle(item.question)
            .setAuthor('Friday AI', picture)
            .setDescription('Use the number reactions to select your answer.')
            .addFields(
                { name: `(1) ${options[0]}`, value: '⠀', inline: true },
                { name: `(2) ${options[1]}`, value: '⠀', inline: true },
                { name: `(3) ${options[2]}`, value: '⠀', inline: true },
                { name: `(4) ${options[3]}`, value: '⠀', inline: true }
            )
            .setImage(item.image)

            let msg;
            msg = await message.channel.send(quizEmbed);
            
            // Reactions
            msg.react('1️⃣').then(() => msg.react('2️⃣')).then(() => msg.react('3️⃣')).then(() => msg.react('4️⃣'));

                const filter = (reaction, user) => {
                    return ['1️⃣', '2️⃣', '3️⃣', '4️⃣'].includes(reaction.emoji.name) && user.id === message.author.id;
                };

                // Max means only one reaction, time is in milliseconds, so 10 seconds, and errors: ['time'] means that if time runs out, print error message
                msg.awaitReactions(filter, { max: 1, time: 10000, errors: ['time'] })
                    .then(collected => {
                        const reaction = collected.first();

                        if (reaction.emoji.name === '1️⃣') {
                            var entry = 0
                        }if (reaction.emoji.name === '2️⃣') {
                            var entry = 1
                        }if (reaction.emoji.name === '3️⃣') {
                            var entry = 2
                        }if (reaction.emoji.name === '4️⃣') {
                            var entry = 3
                        }

                        if (entry === place) {
                            message.reply("you answered the question correctly!");
                            msg.delete();
                        } if (entry != place) {
                            message.reply("you answered the question incorrectly.");
                            msg.delete();
                        }

                    })
                    .catch(collected => {
                        message.reply('you didn\'t choose in time!');
                        msg.delete();
                    });
	},
};