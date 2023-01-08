const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");

module.exports = {
	data: {
		description: "Faites une demande pour changer de surnom",
		name: "nick",
		options: [
			{
				description: "Le surnom de que vous voulez",
				name: "surnom",
				required: "true",
				type: 3,
			},
			{
				description: "Enlevez automatiquement votre surnom, sans demandes",
				name: "reset",
				required: "false",
				type: 5,
			},
		],
	},
	customData: {
		usage: ["/nick [surnom]", "/nick reset"],
		dev: true,
	},
	async execute(interaction, client = null) {
		if (
			interaction.member.manageable === false ||
			interaction.member.permissions.has(["CHANGE_NICKNAME"])
		)
			return interaction.reply({
				content: "Vous ne pouvez pas faire ça.",
				ephemeral: true,
			});

		let reset = interaction.options?.getBoolean("reset") ?? false;
		if (reset === false) {
			let nick = interaction.options?.getString("surnom");
			let embed = new EmbedBuilder()
				.setTitle("Demande de surnom")
				.setDescription(
					`Le/La membre <@${interaction.user.id}> voudrait changer de surnom sur votre serveur et mettre **"${nick}"**\nSi cela vous plaît, appuyez sur le bouton "Accepter", sinon appuyez sur le bouton "Refuser".`
				)
				.setColor("NOT_QUITE_BLACK")
				.setFooter({
					text: `{ "id": "${interaction.user.id}", "nick": "${nick}" }`,
				})
				.setTimestamp();

			let actionrow = new ActionRowBuilder().setComponents(
				new ButtonBuilder()
					.setCustomId("acceptNick")
					.setDisabled(false)
					.setLabel("Accepter")
					.setStyle(Discord.ButtonStyle.Success),
				//.setEmoji("✅")
				new Discord.ButtonBuilder()
					.setCustomId("denyNick")
					.setDisabled(false)
					.setLabel("Refuser")
					.setStyle(Discord.ButtonStyle.Danger)
				//.setEmoji("❌")
			);

			const output = await interaction.reply({
				embeds: [embed],
				components: [actionrow],
				ephemeral: false,
			});

			if (output.pinned === false) output.pin();
		} else {
			if (interaction.member.nickname === null)
				interaction.reply({
					content: "Vous ne possédez pas de surnom",
					ephemeral: true,
				});
			if (interaction.member.nickname !== null) {
				await interaction.member.setNickname(null);
				interaction.reply({
					content: "Vous ne possédez plus de surnom.",
					ephemeral: true,
				});
			}
		}
	},
};
