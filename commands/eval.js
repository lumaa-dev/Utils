const { smartEval } = require("../functions/js/other");

module.exports = {
	data: {
		name: "eval",
		description: "Dev",
		options: [
			{
				name: "code",
				description: "du JavaScript pure",
				type: 3,
				required: "true",
			},
		],
	},
	customData: {
		usage: ["/eval [code]"],
		dev: true,
	},
	async execute(interaction, client = null) {
		const code = interaction.options.getString("code");

		const promise = await smartEval(interaction, code, true, client);
		// if (!promise && interaction)
		// 	return interaction.reply({
		// 		content: "Erreur 404 fréro",
		// 		ephemeral: true,
		// 	});

		// interaction.reply({ content: promise, ephemeral: true });
	},
};
