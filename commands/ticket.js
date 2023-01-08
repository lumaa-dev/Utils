const { awaitMessage } = require("../functions/js/cmds");
const Discord = require("discord.js");
const wait = require("util").promisify(setTimeout);

module.exports = {
	data: {
		name: "ticket",
		description: "Créez un système de création de tickets",
	},
	customData: {
		usage: ["/ticket"],
		dev: false,
	},
	async execute(interaction, client = null) {
		var ticketChannel =
			interaction.guild.channels.cache.find((c) => c.name === "ticket") ??
			interaction.guild.channels.cache.find((c) => c.name === "tickets");

		await interaction.deferReply();

		if (
			!ticketChannel ||
			ticketChannel?.type !== Discord.ChannelType.GuildText
		) {
			ticketChannel = await interaction.guild.channels.create("tickets", {
				type: Discord.ChannelType.GuildText,
				topic:
					"**REGARDEZ LES MESSAGES ÉPINGLÉS**\n\nCréez des tickets, demandez de l'aide, faites une demande de ban, etc...",
				nsfw: false,
				permissionOverwrites: [
					{
						id: interaction.guild.roles.everyone,
						deny: [
							Discord.PermissionFlagsBits.AddReactions,
							Discord.PermissionFlagsBits.SendMessages,
							Discord.PermissionFlagsBits.SendMessagesInThreads,
							Discord.PermissionFlagsBits.CreatePublicThreads,
							Discord.PermissionFlagsBits.CreatePrivateThreads,
						],
					},
				],
			});

			await interaction.editReply({
				content: `Je n'ai pas détecté de salon textuel avec le nom Ticket, mais j'en ai créer un pour vous :\n<#${ticketChannel.id}>`,
			});
		} else {
			await interaction.editReply({
				content:
					"Nous avons trouvé votre salon textuel de Tickets (<#" +
					ticketChannel.id +
					">), nous l'utiliserons pour cette procédure.",
			});
		}
		await wait(5 * 1000);

		await interaction.editReply({
			content:
				"Maintenant, vous allez paramétrer vos options :\n- Votre message doit avoir **au minimum 1 choix**\n- Pour mettre une description, faites vos choix comme ceci : `nom -- description`\n- Pour avoir plusieurs choix, **mettez les différents choix sur de nouvelles lignes** *(voir exemple)*\n- L'option \"Autre\" n'est pas supprimable  \n\nExemple: ```Besoin d'aide\nDemande de ban```\n(voir image pour le résultat)",
			files: [{ attachment: `${__dirname}/ticket_options.png` }],
		});

		var menuOptions = [];

		await awaitMessage(interaction.channel, interaction.user, (collected) => {
			const message = collected.first();
			const options = message.content.split("\n").slice(0, 24);

			for (let i = 0; i < options.length; i++) {
				const optionLength = options[i].split(" -- ").length;

				const name = options[i].split(" -- ")[0].trim() ?? "Ticket simple";
				var description = undefined;
				if (optionLength > 1) {
					description = options[i].split(" -- ")[1].trim() ?? undefined;
				}

				menuOptions.push({
					label: name,
					description: description,
					value: `createTicket_${i}`,
					default: false,
				});
			}

			menuOptions.push({
				label: "Autre",
				description: "Écrivez le titre de votre ticket",
				value: `createTicket_other`,
				emoji: { name: "❓" },
				default: false,
			});
		});

		const ticketMessage = await ticketChannel.send({
			content: "Créez un ticket en utilisant le menu ci-dessous.",
			embeds: [
				new Discord.EmbedBuilder()
					.setTitle("Créez un ticket")
					.setDescription(
						"Créez un ticket avec le menu ci-dessous, séléctionnez votre nécessité et un fil (thread) ce créera pour vous.\nSi des règles de tickets existent, respectez les."
					)
					.setColor("#2f3136"),
			],
			components: [
				new Discord.ActionRowBuilder().addComponents([
					new Discord.SelectMenuBuilder()
						.setCustomId("ticketOptions")
						.setMinValues(1)
						.setMaxValues(1)
						.setPlaceholder("Créez un ticket")
						.setOptions(menuOptions),
				]),
			],
		});

		await ticketMessage
			.pin()
			.then(async () => await ticketChannel.lastMessage.delete());

		await interaction.deleteReply();
		await interaction.channel.send({
			content: "**Cool !** Votre créateur de ticket à été créé",
		});
	},
};
