const { 
	CommandInteraction, 
	Client, 
	ActionRowBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	EmbedBuilder, 
	ComponentType,
	Message,
	User,
} = require("discord.js");
const { correctEpoch } = require("../functions/js/other");
const { version } = require("../functions/config.json");
const { connectMongo } = require("../db/mongo");
const modalSchema = require("../db/modal-schema");
const langSchema = require("../db/lang-schema");

module.exports = {
	data: {
		name: "data",
		description: "Accédez à certaines données",
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
		/*
		const filter = (i) => i.user.id == user.id;
		return await message
			.awaitMessageComponent({
				componentType: componentType,
				filter,
				max: 1,
			})
			.then(succeed)
			.catch(error);
	*/

		function dataPage(index) {
			const embed1 = new EmbedBuilder()
				.setTitle("Données publiques")
				.setDescription(`**Version** : ${version}\n**Activé** le <t:${correctEpoch(new Date().getTime())- Math.floor(process.uptime())}:F>\n**Nombre de serveurs** : ${client.guilds.cache.size} serveurs`)
				.setColor("Green")
			
			const embed2 = new EmbedBuilder()
				.setTitle("Données privées")
				.setColor("Blue")

			if (index == 2) {
				var serverData = {
					modal: null,
					language: null,
				};
				await connectMongo().then(async (mangoose) => {
					try {
						serverData.modal = await modalSchema.findOne({ _id: interaction.guild.id })
						serverData.language = await langSchema.findOne({ _id: interaction.guild.id })
					} finally {
						mangoose.connection.close()
					}
				})

				embed2.setDescription(``)
			}

			paginate(index, [embed1, embed2])
		}
	},
};

/**
 * It makes paginated embeds using buttons on a message
 * @param {Number} index - The current page number
 * @param {Array<EmbedBuilder>} embeds - An array of embeds to paginate through
 * @param {Boolean} [keepFooter=false] - Whether or not to keep the footer of the embed.
 * @returns An object with two properties: embeds and components.
 */
function paginate(index, embeds, keepFooter = false) {
	const actionrow = new ActionRowBuilder()
		.setComponents([
			new ButtonBuilder()
				.setEmoji({name: "⬅️"})
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(index == 1)
				.setCustomId("back"),
			new ButtonBuilder()
				.setEmoji({name: "➡️"})
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(index == embeds.length)
				.setCustomId("next")
		])
	let embed = embeds[i - 1]

	if (!keepFooter) embed.setFooter(`${index}/${embeds.length}`)
	
	return {
		embeds: [embed],
		components: [actionrow]
	}
}

/**
 * 
 * @param {Message} message 
 * @param {User} user 
 * @returns 
 */
function waitButton(message, user, succeed = console.log) {
	const filter = (i) => i.user.id == user.id;
	return await message
		.awaitMessageComponent({
			componentType: ComponentType.Button,
			filter,
			max: 1,
			time: hour()
		})
		.then(succeed)
		.catch(console.error);
}

function hour(time = 1) {
	return time * (60 * 60)
}