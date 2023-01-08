const { EmbedBuilder } = require("discord.js");
const { awaitMessage } = require("../functions/js/cmds");

module.exports = {
	data: {
		name: "vote",
		description: "Commandes sur les votes",
		options: [
			{
				name: "creer",
				description: "Créez un vote",
				type: 1,
				options: [
					{
						name: "question",
						description: "La question que vous posez",
						type: 3,
						required: "true",
					},
					{
						name: "choix1",
						description: "Le premier choix",
						type: 3,
						required: "false",
					},
					{
						name: "choix2",
						description: "Le second choix",
						type: 3,
						required: "false",
					},
				],
			},
			{
				name: "stop",
				description: "Arrête un vote et donne les résultat",
				type: 1,
			},
		],
	},
	customData: {
		usage: ["/vote creer [question] [choix1]* [choix2]*", "/vote stop"],
		dev: true,
	},
	async execute(interaction, client = null) {
		let subName = interaction.options.getSubcommand();

		if (subName === "creer") {
			const question = interaction.options.getString("question");
			const choice1 = interaction.options?.getString("choix1") ?? "Oui";
			const choice2 = interaction.options?.getString("choix2") ?? "Non";

			if (choice1 == choice2)
				return interaction.reply({
					content: ":x: Vous ne pouvez pas avoir 2 fois le même choix.",
					ephemeral: true,
				});

			let embed = new EmbedBuilder()
				.setTitle(question.trim())
				.setColor("Blurple")
				.setDescription(`:one: - **${choice1}**\n\n:two: - **${choice2}**`)
				.setFooter({
					text: JSON.stringify({
						embedQuestion: true,
						begin: correctEpoch(new Date().getTime()),
						choices: [choice1, choice2],
					}),
				});

			await interaction.deferReply();
			await interaction.channel
				.send({ content: "Chargement..." })
				.then(async (_message) => {
					await _message.react(numberEmojis(1));
					await _message.react(numberEmojis(2));

					await _message.edit({
						content: `Vote de <@${interaction.user.id}> :`,
						embeds: [embed],
					});

					await interaction.deleteReply();
				});
		} else if (subName === "stop") {
			// message.reactions.cache[...].count

			return interaction.reply({
				content: "ça marche pas encore mdr.",
				ephemeral: true,
			});

			var stopData = {
				guild: interaction.guild,
				mainChannel: null,
				pollChannel: null,
				confirmed: false,
				steps: null,
				pollMessage: null,
				messageJson: null,
			};

			stopData.mainChannel = interaction.channel;
			stopData.steps = 1;

			interaction.reply({
				content: "Veuillez ping le channel dans lequel est le vote.",
			});

			stopData.steps = 1;
			await awaitMessage(
				stopData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.match(/<#\d+>/g)) {
						stopData.pollChannel = await stopData.guild.channels.cache.get(
							String(message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
						);
						await message.delete();
					} else {
						await message.delete();
						return stopData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				},
				(e) => {
					return console.log(e);
				}
			);

			if (stopData.pollChannel === null) return;

			interaction.editReply({
				content: `Désormais, allez dans le channel <#${stopData.pollChannel.id}> et **répondez** au message avec le vote (vous pouvez dire n'importe quoi).`,
			});

			await awaitMessage(
				stopData.pollChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();

					if (message.reference !== null) {
						stopData.pollMessage = await stopData.pollChannel.messages.fetch(
							message.reference.messageId
						);

						await message.delete();
					} else {
						await message.delete();
						return stopData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				}
			);

			if (stopData.pollMessage === null) return;
			stopData.steps += 1;

			try {
				stopData.messageJson = JSON.parse(
					stopData.pollChannel.embeds[0].footer.text
				);

				// stopData.messageJson.
			} catch (e) {
				interaction.editReply({
					content: "Le message séléctionné n'est pas un vote",
				});
			}
		}
	},
};

/**
 * Given a number, return the corresponding emoji
 * @param {Number|String} [number=1] - The number to convert to emoji.
 * @returns {String} A string of emojis.
 */
function numberEmojis(number = 1) {
	if (isNaN(Number(number)) || (number > 9 && number < 0)) return null;
	if (number === 0) return "0️⃣";
	if (number === 1) return "1️⃣";
	if (number === 2) return "2️⃣";
	if (number === 3) return "3️⃣";
	if (number === 4) return "4️⃣";
	if (number === 5) return "5️⃣";
	if (number === 6) return "6️⃣";
	if (number === 7) return "7️⃣";
	if (number === 8) return "8️⃣";
	if (number === 9) return "9️⃣";
}
