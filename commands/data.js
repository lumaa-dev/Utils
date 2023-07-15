const { CommandInteraction, Client } = require("discord.js");
const { correctEpoch } = require("../functions/js/other");
const { version } = require("../functions/config.json");

module.exports = {
	data: {
		name: "data",
		description: "Dev",
	},
	customData: {
		usage: ["/data"],
		dev: true,
	},
	/**
	 * The execute function
	 * @param {CommandInteraction} interaction - The interaction object.
	 * @param {Client} [client=null] - The client that the command was sent from.
	 */
	execute(interaction, client = null) {
		return interaction.reply({
			content: `Version: ${version}\nUptime: <t:${correctEpoch(
				new Date().getTime() - Math.floor(process.uptime())
			)}:F>\nServer Count (cache): ${client.guilds.cache.size}`,
			ephemeral: true,
		});
	},
};
