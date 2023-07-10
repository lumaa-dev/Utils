const {
	ModalBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
	PermissionFlagsBits,
	SelectMenuBuilder,
	EmbedBuilder,
	ComponentType,
} = require("discord.js");
const { awaitInteraction } = require("../functions/js/cmds");
const ModalCreator = require("../functions/modalCreator");
const { translate } = require("../main");
const { modalPrefabs: prefabs } = require("../functions/config.json").utils;

module.exports = {
	data: {
		name: "modal",
		description: "Créez un Modal (pop-up) avec un Modal",
	},
	customData: {
		usage: ["/modal"],
		dev: false,
	},
	async execute(interaction, client = null) {
		if (
			!interaction.member.permissions.has([PermissionFlagsBits.ManageMessages])
		)
			return interaction.reply({
				content: translate("error.permissions", interaction.guild),
				ephemeral: true,
			});

		var translated = [];
		prefabs.forEach((prefab) => {
			prefab.label = translate(prefab.label, interaction.guild);
			translated.push(prefab);
		});

		const selectPreset = new SelectMenuBuilder()
			.setCustomId("modalPreset")
			.setMinValues(1)
			.setMaxValues(1)
			.setPlaceholder(translate("prefab.modal.choose", interaction.guild))
			.setOptions(translated);

		await interaction.deferReply();
		await interaction.deleteReply();
		const msg = await interaction.channel.send({
			embeds: [
				new EmbedBuilder()
					.setDescription(
						"<:plus:975163068411695104> " +
							translate("prefab.modal.question", interaction.guild)
					)
					.setColor("74c861"),
			],
			components: [new ActionRowBuilder().setComponents([selectPreset])],
		});

		await awaitInteraction(
			msg,
			interaction.user,
			ComponentType.SelectMenu,
			async (_interaction) => {
				let { customId: name, message, values } = _interaction;

				if (name === "modalPreset") {
					let value = values[0];

					if (value === "prefabModal_custom") {
						const createModal = new ModalBuilder()
							.setTitle(translate("create.modal.title", interaction.guild))
							.setCustomId(`createModal`);

						const titleInput = new TextInputBuilder()
							.setCustomId("title")
							.setLabel(translate("create.modal.question", interaction.guild))
							.setStyle(TextInputStyle.Short)
							.setMaxLength(45)
							.setPlaceholder(
								translate("create.modal.title", interaction.guild)
							)
							.setRequired(true);

						const actionRow1 = new ActionRowBuilder().addComponents([
							titleInput,
						]);

						createModal.addComponents([actionRow1]);

						await _interaction.showModal(createModal);
					} else if (value === "prefabModal_apply") {
						const modalCreator = new ModalCreator();

						modalCreator.build(
							interaction.member,
							translate("prefab.modal.apply", interaction.guild),
							[
								translate("prefab.apply.question1", _interaction.guild),
								translate("prefab.apply.question2", _interaction.guild),
								translate("prefab.apply.question3", _interaction.guild),
								translate("prefab.apply.question4", _interaction.guild),
							],
							new Array(4).fill(
								translate("placeholder.modal.default", _interaction.guild)
							)
						);

						_interaction.reply(modalCreator.builder);
					} else if (value === "prefabModal_roleplay") {
						const modalCreator = new ModalCreator();

						modalCreator.build(
							interaction.member,
							translate("prefab.modal.roleplay", interaction.guild),
							[
								translate("prefab.roleplay.question1", _interaction.guild),
								translate("prefab.roleplay.question2", _interaction.guild),
								translate("prefab.roleplay.question3", _interaction.guild),
								translate("prefab.roleplay.question4", _interaction.guild),
							],
							new Array(4).fill(
								translate("placeholder.modal.default", _interaction.guild)
							)
						);

						_interaction.reply(modalCreator.builder);
					} else if (value === "prefabModal_report") {
						const modalCreator = new ModalCreator();

						modalCreator.build(
							interaction.member,
							translate("prefab.modal.report", interaction.guild),
							[
								translate("prefab.report.question1", _interaction.guild),
								translate("prefab.report.question2", _interaction.guild),
								translate("prefab.report.question3", _interaction.guild),
							],
							new Array(4).fill(
								translate("placeholder.modal.default", _interaction.guild)
							)
						);

						_interaction.reply(modalCreator.builder);
					}
				}
				await message.edit({
					embeds: [
						new EmbedBuilder()
							.setDescription(
								"<:plus:975163068411695104> ~~" +
									translate("prefab.modal.question", interaction.guild) +
									"~~"
							)
							.setColor("74c861"),
					],
					components: [
						new ActionRowBuilder().setComponents([
							selectPreset.setDisabled(true),
						]),
					],
				});
			}
		);
	},
};
