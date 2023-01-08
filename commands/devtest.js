module.exports = {
	data: {
		name: "devtest",
		description: "Dev",
	},
	customData: {
		usage: ["/devtest"],
		dev: true,
	},
	execute(interaction, client = null) {
		// const key = interaction.user.username;
		// const str = "`Hey ${key}!`";

		// const result = eval(str);
		// interaction.reply(result);

		const sep = "\\";
		const splitted = __dirname.split(sep);

		if (splitted[0] === "") splitted.shift();

		const directoryIndex = splitted.indexOf("v2");
		if (directoryIndex === -1)
			throw new RangeError(`No directory found with index -1`);

		for (let i = 0; i < Number(splitted.length - directoryIndex); i++) {
			splitted.pop();
		}

		splitted.join(sep);

		interaction.reply(splitted.toString());
	},
};
