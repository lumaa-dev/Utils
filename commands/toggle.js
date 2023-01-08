const {
	ActionRowBuilder,
	ButtonBuilder,
	PermissionFlagsBits,
	ButtonStyle,
} = require("discord.js");
const { awaitMessage } = require("../functions/js/cmds");

module.exports = {
	data: {
		name: "toggle",
		description: "Ajoutez un bouton de rôle Toggle",
		options: [
			{
				name: "setup",
				description: "Ajouter votre premier bouton de rôle Toggle",
				type: 1,
			},
		],
	},
	customData: {
		usage: ["/toggle setup"],
		dev: false,
	},
	async execute(interaction) {
		let subName = interaction.options.getSubcommand();

		if (!interaction.member.permissions.has([PermissionFlagsBits.ManageRoles]))
			return interaction.reply({
				content:
					"Oups ! Tu ne peux pas faire cette commande, tu ne possède pas les bonnes permissions.",
				ephemeral: true,
			});

		if (subName === "setup") {
			var toggleData = {
				guild: interaction.guild,
				mainChannel: interaction.channel,
				steps: null,
				roleToggleMsg: null,
				roleChannel: null,
				sent: null,
			};

			await interaction.reply({
				content:
					"Bienvenue dans la procédure de setup des Toggles (Activer / Désactiver)\nVeuillez ping le channel dans lequel le bouton va être",
				ephemeral: false,
			});

			toggleData.steps = 1;
			await awaitMessage(
				toggleData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.match(/<#\d+>/g)) {
						toggleData.roleChannel = await toggleData.guild.channels.cache.get(
							String(message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
						);
						await message.delete();
					} else {
						await message.delete();
						return toggleData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				}
			);

			if (toggleData.roleChannel === null) return;
			toggleData.steps += 1;

			interaction.editReply({
				content: "Ok ! Veuillez ping le rôle de Toggle",
				ephemeral: false,
			});

			await awaitMessage(
				toggleData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (!message.content.match(/<@&\d+>/g)) return;
					const string = message.content.match(/<@&\d+>/g)[0];
					const role = toggleData.guild.roles.cache.get(
						string.match(/\d+/g)[0]
					);

					var label = `Obtenez "${role.name}"`;
					if (label.length > 80) {
						label = label.slice(0, -4) + '..."';
					}

					message.delete();
					toggleData.roleToggleMsg = await toggleData.roleChannel.send({
						components: [
							new ActionRowBuilder().addComponents([
								new ButtonBuilder()
									.setCustomId("toggleRole_" + role.id)
									.setDisabled(false)
									.setLabel(label)
									.setStyle(ButtonStyle.Secondary),
							]),
						],
					});
					toggleData.sent = true;
				}
			);

			if (toggleData.sent === null) return;
			toggleData.steps += 1;

			interaction.editReply({
				content: ":clap: **Super !**\nTout c'est bien passé, tout fonctionne !",
			});
		}
	},
};
