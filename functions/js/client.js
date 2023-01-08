const Discord = require("discord.js");

module.exports = {
	createClient(intents, phone = false) {
		const client = new Discord.Client({
			intents: intents,
			ws: {
				properties: {
					$browser: phone ? "Discord iOS" : "discord.js",
				},
			},
		});
		if (!client || typeof client == "undefined")
			return console.error("Discord changed the way to get new clients");
		return client;
	},

	/**
	 * It sets the bot's status to the given status, name, and type
	 * @param {Discord.Client} client - The client object.
	 * @param {Discord.PresenceStatusData}[status=dnd] - The status of the bot.
	 * @param {String} name - The name of the activity.
	 * @param {Discord.ActivityType} type - The type of activity. Can be one of: PLAYING, STREAMING, LISTENING, WATCHING
	 */
	async setStatus(
		client,
		status = "dnd",
		name,
		type = Discord.ActivityType.Playing
	) {
		await client.user.setPresence({
			activities: [{ name: name, type: type }],
			status: status,
		});
	},
};
