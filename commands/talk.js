// Code written by Mala Patke#9819

module.exports = {
	name: 'talk',
    description: 'Talk talk talk.',
    aliases: ['speak'],
	async execute(message, args) {
        await message.delete();
        if(message.author.id !== '[Your Discord ID]') return;
        let channel = message.mentions.channels.first();
        if(!channel) return;
        channel.send(args.slice(1, args.length).join(" "));
	},
};