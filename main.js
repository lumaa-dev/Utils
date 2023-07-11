const Discord = require("discord.js");
const config = require("./functions/config.json");
const Func = require("./functions/all");
const { setStatus } = require("./functions/js/client");
const ModalCreator = require("./functions/modalCreator");

const client = new Discord.Client({
	intents: [
		Discord.IntentsBitField.Flags.Guilds,
		Discord.IntentsBitField.Flags.GuildBans,
		Discord.IntentsBitField.Flags.GuildMembers,
		Discord.IntentsBitField.Flags.GuildMessages,
		Discord.IntentsBitField.Flags.MessageContent,
		Discord.IntentsBitField.Flags.GuildIntegrations,
	],
});

client.once("ready", () => {
	console.log(`${client.user.tag} is logged`);
	setStatus(client, "online", "la version 2", Discord.ActivityType.Watching);
});

client.on("messageCreate", async (message) => {
	Func.Commands.initiate(client, message);
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isCommand()) {
		let { commandName: name } = interaction;

		try {
			console.log(`/${name} > ${interaction.user.tag}`);
			await require("./commands/" + name).execute(interaction, client);
		} catch (e) {
			console.error(e);
			if (interaction.replied !== true) {
				await interaction.reply({
					embeds: [errorCode(e)],
				});
			} else if (
				interaction.deferred === true &&
				interaction.replied === false
			) {
				await interaction.editReply({
					embeds: [errorCode(e)],
				});
			}
		}
	} else if (interaction.isAutocomplete()) {
		let { commandName: name } = interaction;

		try {
			await require("./commands/" + name).completeAuto(interaction);
		} catch (e) {
			console.error(e);
		}
	} else {
		try {
			await require("./events/interactionCreate").execute(interaction, client);
		} catch (e) {
			console.error(e);
			if (interaction.replied !== true) {
				await interaction.reply({
					embeds: [errorCode(e)],
				});
			} else if (
				interaction.deferred === true &&
				interaction.replied === false
			) {
				await interaction.editReply({
					embeds: [errorCode(e)],
				});
			}
		}
	}
});

client.on("rateLimit", (detail) => {
	console.log(detail);
});

/**
 * It returns a Discord.EmbedBuilder object with a title and description
 * @param {String} e [e=Inconnue] - The error message.
 * @returns {Discord.EmbedBuilder} A Discord.EmbedBuilder object.
 */
function errorCode(e = "Inconnue") {
	return new Discord.EmbedBuilder()
		.setTitle("Erreur à signaler :")
		.setDescription(`\`\`\`js\n${e}\`\`\``)
		.setColor("Red");
}

/**
 * It returns an embed with a cross emoji and a red color.
 * @param {String} message - The message to send.
 * @returns {Discord.EmbedBuilder} A Discord.EmbedBuilder object.
 */
function error(message) {
	return new Discord.EmbedBuilder()
		.setDescription(`<:cross:973972321280860210> ${message}`)
		.setColor("Red");
}

/**
 * It returns an embed with a checkmark emoji and a blue color.
 * @param {String} message The message to send.
 * @returns {Discord.EmbedBuilder} A Discord.EmbedBuilder object.
 */
function succeed(message) {
	return new Discord.EmbedBuilder()
		.setDescription(`<:check:973972321436065802> ${message}`)
		.setColor("#1e6de1");
}

/**
 * It returns an embed with a loading emoji and the blurple color.
 * @param {String} message The message to send.
 * @returns {Discord.EmbedBuilder} A Discord.EmbedBuilder object.
 */
function loading(message = translate("loading")) {
	return new Discord.EmbedBuilder()
		.setDescription(`<a:loading:902218385369223178> ${message}`)
		.setColor("Blurple");
}

/**
 * Translate a string to the guild's language (default english)
 * @param {String} translation The translation (from config.json)
 * @param {Discord.Guild} guild The guild the translation was sent
 * @param {Any} var1 Variable to call in the translation
 * @returns {String} Translated string
 */
function translate(translation, guild, var1) {
	const { lang } = require("./functions/config.json").utils;
	var str = null;

	try {
		if (guild.preferredLocale === "fr") {
			str = eval(`lang.fr['${translation}']`);
			if (config.log === true)
				console.log(`lang.fr['${translation}'] > ${str}`);
		} else {
			str = eval(`lang.en['${translation}']`);
			if (config.log === true)
				console.log(`lang.en['${translation}'] > ${str}`);
		}

		return eval(`\`${str}\``);
	} catch (e) {
		console.error(e);
		return translation;
	}
}

module.exports = { errorCode, error, succeed, loading, translate };

client.login(config.test ? config.testbot_token : config.token);
