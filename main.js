const Discord = require("discord.js");
const config = require("./functions/config.json");
const Func = require("./functions/all");
const { setStatus } = require("./functions/js/client");

const reportBtn = new Discord.ActionRowBuilder().setComponents([
	new Discord.ButtonBuilder()
		.setStyle(Discord.ButtonStyle.Danger)
		.setCustomId("report_error")
		.setLabel("error.report.button"),
]);

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
client.once("ready", async () => {
	await connectMongo().then(mangoose => {
		try {
			console.log("MangoDB connected")
		} finally {
			mangoose.connection.close()
		}
	})

	await setStatus(
		client,
		"online",
		"lumination.brebond.com",
		Discord.ActivityType.Watching
	);
	
	console.log(`${client.user.tag} is logged`);
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

			let button = reportBtn.components[0];
			button.setLabel(translate("error.report.button", interaction.guild));
			reportBtn.setComponents([button]);

			if (interaction.replied !== true && interaction.deferred === false) {
				await interaction.reply({
					embeds: [errorCode(e, interaction.guild)],
					components: [reportBtn],
				});
			} else if (
				interaction.deferred === true ||
				interaction.replied === true
			) {
				await interaction.editReply({
					content: "\n",
					attachments: [],
					files: [],
					embeds: [errorCode(e, interaction.guild)],
					components: [reportBtn],
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

			let button = reportBtn.components[0];
			button.setLabel(translate("error.report.button", interaction.guild));
			reportBtn.setComponents([button]);

			if (interaction.replied !== true) {
				await interaction.reply({
					embeds: [errorCode(e, interaction.guild)],
					components: [reportBtn],
				});
			} else if (
				interaction.deferred === true &&
				interaction.replied === false
			) {
				await interaction.editReply({
					embeds: [errorCode(e, interaction.guild)],
					components: [reportBtn],
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
 * @param {String} e - The error message.
 * @param {Discord.Guild} guild - The guild the error occured
 * @returns {Discord.EmbedBuilder} A Discord.EmbedBuilder object.
 */
function errorCode(e = translate("error.unknown", guild), guild) {
	return new Discord.EmbedBuilder()
		.setTitle(translate("error.title", guild))
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
function loading(message) {
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
	var lang = null;
	var str = null;

	connectMongo().then(async mangoose => {
		if (!cache[interaction.guild.id]) {
			try {
				const result = await langSchema.findOne({ _id: guild.id })
				lang = result;
			} finally {
				mangoose.connection.close()
			}
		} else {
			lang = cache[guild.id].lang
		}
	})

	console.log(lang)
	if (lang !== null) {
		lang = require("./functions/config.json").utils.lang;
	}

	try {
		if (lang === "fr") {
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

function sep() {
	if (__dirname.includes("/")) return "/" // linux
	return "\\"
}

module.exports = {
	errorCode,
	error,
	succeed,
	loading,
	translate,
	/**@type {"/"|"\\"} */
	seperator: sep()
};

client.login(config.test ? require("./functions/token.json").testbot_token : require("./functions/token.json").token);
