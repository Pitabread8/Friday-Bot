// Code written by Mala Patke#9819

module.exports = {
	name: 'talk',
    description: 'Talk talk talk.',
    aliases: ['speak'],
	async execute(message, args) {
        await message.delete();
        if(message.author.id !== '693587727098314812') return;
        let channel = message.mentions.channels.first();
        if(!channel) return;
        channel.send(args.slice(1, args.length).join(" "));
	},
};