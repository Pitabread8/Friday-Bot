const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');
const client = new Discord.Client();
const { prefix } = config;
const { token } = config;
const SQLite = require("better-sqlite3");
const sql = new SQLite('./scores.sqlite');
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

client.once('ready', () => {
  console.log('Friday is here at your service.');
  client.user.setActivity('fri!help', { type: 'WATCHING' });
   // Check if the table "points" exists.
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
  if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  // And then we have two prepared statements to get and set the score data.
  client.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
  client.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points) VALUES (@id, @user, @guild, @points);");

  // client.channels.cache.get('732406019535143003').send('Personally, I don\'t think there should be a *Star Wars* bot. There\'s only enough space for one fictional sci-fi universe!')
  // client.channels.cache.get('732406019535143003').send('Shut up *Premium*!')
  // client.channels.cache.get('732406019535143003').send('Shut up with your Kentucky Fried Foghorn Leghorn Drawl!')
  // client.channels.cache.get('732406019535143003').send('I mean "y\'all" is Southern...')
});

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  if (!command) return;

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }
});

client.on("message", message => {
  if (message.author.bot) return;
  let score;
  if (message.guild) {
    score = client.getScore.get(message.author.id, message.guild.id);
    if (!score) {
      score = { id: `${message.guild.id}-${message.author.id}`, user: message.author.id, guild: message.guild.id, points: 0 }
    }
    score.points++;
    // const curLevel = Math.floor(0.1 * Math.sqrt(score.points));
    // if(score.level < curLevel) {
    //   score.level++;
    //   message.reply(`You've leveled up to level **${curLevel}**! Ain't that dandy?`);
    // }
    client.setScore.run(score);
  }
  if (message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // Command-specific code here!
  if(command === "units") {
    return message.reply(`You currently have ${score.points} units.`);
  }

  if(command === "give") {
    // Limited to guild owner - adjust to your own preference!
    // if(!message.author.id === message.guild.owner) return message.reply("You're not the boss of me, you can't do that!");
  
    const user = message.mentions.users.first() || client.users.cache.get(args[0]);
    if(!user) return message.reply("You must mention someone or give their ID!");
  
    const pointsToAdd = parseInt(args[1], 10);
    if(!pointsToAdd) return message.reply("You didn't tell me how many units to give.")
  
    // Get their current points.
    let userscore = client.getScore.get(user.id, message.guild.id);
    let authorscore = client.getScore.get(message.author.id, message.guild.id);
    // It's possible to give points to a user we haven't seen, so we need to initiate defaults here too!
    if (!userscore) {
      userscore = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, points: 0 }
    }
    userscore.points += pointsToAdd;
    authorscore.points -= pointsToAdd;
  
    // We also want to update their level (but we won't notify them if it changes)
    // let userLevel = Math.floor(0.1 * Math.sqrt(score.points));
    // userscore.level = userLevel;
  
    // And we save it!
    client.setScore.run(userscore);
    client.setScore.run(authorscore);
  
    message.channel.send(`${user.tag} has received ${pointsToAdd} units and now stands at ${userscore.points} units.`);
    message.channel.send(`${message.author.tag} now has ${authorscore.points} units.`);
  }
  
  if(command === "leaderboard") {
    const top10 = sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(message.guild.id);
  
      // Now shake it and show it! (as a nice embed, too!)
    const embed = new Discord.MessageEmbed()
      .setTitle("Leaderboard")
      .setAuthor(client.user.username, client.user.avatarURL())
      .setDescription(`Richest Users in **${message.guild}**`)
      .setColor(0x00AE86);
  
    for(const data of top10) {
      embed.addFields({ name: client.users.cache.get(data.user).tag, value: `${data.points} units.` });
    }
    return message.channel.send({embed});
  }

  if (command === "chance") {

    const pointsToChange = parseInt(args[0]);
    if(!pointsToChange) return message.reply("You didn't tell me how many units to gamble.")

    var chance = Math.floor(Math.random() * 2) + 1; 
    const user = message.author
    let userscore = client.getScore.get(user.id, message.guild.id);

    if (chance === 1) {
      userscore.points -= pointsToChange;
      client.setScore.run(userscore);
      message.reply(`you have lost ${pointsToChange} units and are now back at ${userscore.points} units.`);
    }

    if (chance === 2) {
      userscore.points += pointsToChange;
      client.setScore.run(userscore);
      message.reply(`you have received ${pointsToChange} units and now stand at ${userscore.points} units.`);
    }
  }

  if (command === "daily") {
    const commandName = 'daily'
    let authorscore = client.getScore.get(message.author.id, message.guild.id);
  
    const command = client.commands.get(commandName)
      || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;
    
    if (!cooldowns.has(commandName)) {
      cooldowns.set(commandName, new Discord.Collection());
      message.reply('hi');
      authorscore.points += 200;
      message.reply(`you claimed your daily 200, and now have ${authorscore.points} units.`);
      client.setScore.run(authorscore);
    }

    const now = Date.now();
    const timestamps = cooldowns.get(commandName);
    const cooldownAmount = (command.cooldown || 3) * 86400000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        message.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${commandName}\` command.`);
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  // const dailySet = new Set();

  //   if (!dailySet.has(message.author.id)) {
  //     message.channel.send(`Hello!`)
  //     dailySet.add(message.author.id)
  //     setTimeout(() => {
  //       dailySet.delete(message.author.id)
  //     }, 10000)
  //   }

  //   if (dailySet.has(message.author.id)) {
  //     // const expirationTime = dailySet.get(message.author.id) + 10000; // 10000 is cooldown
  //     const expirationTime = 10000; // 10000 is cooldown
  //     message.reply(`Please wait ${timeLeft.toFixed(1)} seconds before using this command again`);
  //     if (now < expirationTime) {
  //       const timeLeft = (expirationTime - now) / 1000;
  //       message.reply(`Please wait ${timeLeft.toFixed(1)} seconds before using this command again`);
  //     }

  //     if (now === expirationTime) {
  //       dailySet.delete(message.author.id)
  //     }

  //   }
  //   // else {
  //   //   message.channel.send(`Hello!`)
  //   //   dailySet.add(message.author.id)
  //   //   setTimeout(() => {
  //   //     dailySet.delete(message.author.id)
  //   //   }, 10000)
  //   // }
  }
});


// client.on('message', msg => {
//   let args = msg.content.substring(prefix.length).split(" ");
//   if(args[0] === 'hello'){
//     if (helloSet.has(msg.author.id)) {
//       const expirationTime = helloSet.get(msg.author.id) + 10000; // 10000 is cooldown
  
//       if (now < expirationTime) {
//           const timeLeft = (expirationTime - now) / 1000;
//           return msg.reply(`Please wait ${timeLeft.toFixed(1)} seconds before using this command again`);
//       }
//     } else {
//       msg.channel.send(`Hello!`)
//       helloSet.add(msg.author.id)
//       setTimeout(() => {
//         helloSet.delete(msg.author.id)
//       }, 10000)
//     }
//   }
// })

// const helloSet = new Set();

// client.on('message', msg => {
//   let args = msg.content.substring(prefix.length).split(" ");
//   if(args[0] === 'daily'){
//     var callTime = 0;
//     if(helloSet.has(msg.author.id)){
//       msg.channel.send(`new Date()).getTime(): ${new Date().getTime()}`);
//       msg.channel.send(`Please wait ${10-((new Date()).getTime() - callTime )} seconds before using this command again.`)
//       setTimeout(() => {
//         callTime = (new Date()).getTime()
//         helloSet.delete(msg.author.id)s
//       }, 10000)
//     } else {
//       msg.channel.send(`Hello!`)
//       helloSet.add(msg.author.id)
//     }
//   }
// })

client.login(token);