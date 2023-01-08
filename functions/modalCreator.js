const {
	SelectMenuBuilder,
	ActionRowBuilder,
	TextInputBuilder,
	TextInputStyle,
	ButtonBuilder,
	EmbedBuilder,
	ModalBuilder,
	TextChannel,
	GuildMember,
	ButtonStyle,
	Client,
	Guild,
	Embed,
} = require("discord.js");

class ModalCreator {
	/**
	 * Creates the ModalCreator type
	 * @param {Client} client
	 * @return {ModalCreator}
	 */
	constructor(client) {
		/** @type {Client} */
		this.client = client;

		this.data = {
			title: null,
			questions: [],
			placeholders: [],
			maxChars: [],
			modalEmbed: undefined,
			characterEmbed: undefined,
		};
		this.builder = { embeds: [], components: [] };
		this.channels = { embed: null, output: null };

		return this;
	}

	/**
	 * Creates a new Modal Creator
	 * @param {GuildMember} creator The member that created the Modal Creator
	 * @param {String} title The title of the Modal
	 * @param {Array<String>} questions The questions of the Modal
	 * @param {Array<String>} placeholders The placeholders of the Modal
	 * @param {Array<Number>} maxChars The count of each text input's max characters of the Modal
	 * @returns {ModalCreator.builder}
	 */
	build(creator, title, questions = [], placeholders = [], maxChars = []) {
		if (questions.length !== placeholders.length)
			throw new RangeError(
				"Questions array and Placeholders array are not the same length"
			);
		this.data = { title, questions, placeholders, maxChars };
		var fields = [];

		for (let i = 0; i < questions.length; i++) {
			const question = questions[i];
			const placeholder = placeholders[i];
			fields.push({ name: question, value: `*${placeholder}*` });
		}

		let embed = new EmbedBuilder()
			.setAuthor({
				name: title,
				iconURL: creator.guild.iconURL(),
			})
			.setFields(fields)
			.setColor("#2f3136")
			.setFooter({
				text: translate("discord.tos", creator.guild),
				iconURL: creator.user.displayAvatarURL(),
			});

		this.data.modalEmbed = embed;

		embed = new EmbedBuilder()
			.setTitle(translate("modal.characters.title", creator.guild))
			.setColor("Blurple");

		if (maxChars.every((currentValue) => currentValue === 100)) {
			embed.setDescription(
				`*${translate("modal.characters.same", creator.guild, 100)}*`
			);
		} else if (maxChars.length > 0) {
			var description = embed.data.description;
			var i = 0;
			maxChars.forEach((char) => {
				i = i++;
				description += `\n${i} - ${translate(
					"modal.characters.single",
					creator.guild,
					char
				)}`;
				embed.setDescription(description);
			});
		} else {
			embed.setDescription(translate("nothing", creator.guild));
		}

		this.data.characterEmbed = embed;

		this.builder = {
			embeds: [this.data.modalEmbed, this.data.characterEmbed],
			components: this.modalComponent(questions.length > 0, creator.guild),
		};
		return this.builder;
	}

	/**
	 * It creates a new Modal Creator from a Modal Creator
	 * @param {Client} client
	 * @param {Embed} modalEmbed - The Modal Creator Embed
	 * @param {Embed} charsEmbed - The Modal Creator Embed
	 * @param {Guild} guild - The guild the Modal Creator has been sent in.
	 * @return {ModalCreator.builder}
	 */
	reuse(client, modalEmbed, charsEmbed, guild) {
		//const maxChars = JSON.parse(modalEmbed.footer.text).maxChars ?? [];
		var questions = [];
		var placeholders = [];

		for (let i = 0; i < modalEmbed.fields.length; i++) {
			const field = modalEmbed.fields[i];
			questions.push(field.name.trim());
			placeholders.push(
				field.value.substring(1, field.value.length - 1).trim()
			);
		}

		this.data = {
			title: modalEmbed.author.text,
			questions: questions,
			placeholders: placeholders,
			maxChars: maxChars,
			modalEmbed: modalEmbed,
			characterEmbed: characterEmbed,
		};
		this.client = client;
		this.builder = {
			embeds: [modalEmbed],
			components: this.modalComponent(modalEmbed.data.fields.length > 0, guild),
		};
		return this.builder;
	}

	/**
	 * It creates a select menu with the options being the fields of the embed
	 * @return {SelectMenuBuilder} Select menu with the questions of the embed
	 */
	select() {
		/**@type {EmbedBuilder} */
		const embed = this.builder.embeds[0];

		let selectMenu = new SelectMenuBuilder()
			.setCustomId("edt_qst")
			.setMaxValues(1)
			.setMinValues(1)
			.setDisabled(false);

		var options = [];

		for (let i = 0; i < embed.data.fields.length; i++) {
			const field = embed.data.fields[i];
			options.push({
				value: `qst_${i}`,
				description: field.value.substring(1, field.value.length - 1),
				label: field.name,
			});
		}

		selectMenu.setOptions(options);

		return selectMenu;
	}

	/**
	 * @deprecated Not working yet
	 */
	convert(openModalEmbed) {
		//const object = JSON.parse(openModalEmbed.footer.text);
	}

	/**
	 * Creates buttons for Modal Creator
	 * @param {Boolean} hasQuestion If the Modal Creator has at least one question
	 * @param {Guild} guild
	 * @returns {Array<ActionRowBuilder>}
	 */
	modalComponent(hasQuestion = false, guild) {
		return [
			new ActionRowBuilder().setComponents([
				addBtn()
					.setLabel(translate("button.modal.add", guild))
					.setCustomId("cm_addQst"),
				edtBtn()
					.setLabel(translate("button.modal.edit", guild))
					.setDisabled(!hasQuestion)
					.setCustomId("cm_edtQsts"),
				rmvBtn()
					.setLabel(translate("button.modal.delete", guild))
					.setDisabled(!hasQuestion)
					.setCustomId("cm_rmvQsts"),
			]),
			new ActionRowBuilder().setComponents([
				new ButtonBuilder()
					.setEmoji({
						name: "check",
						id: "973972321436065802",
						animated: false,
					})
					.setLabel(translate("button.modal.finish", guild))
					.setCustomId("cm_done")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(!hasQuestion),
				edtBtn()
					.setLabel(translate("button.modal.try", guild))
					.setCustomId("cm_try")
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(!hasQuestion),
				rmvBtn()
					.setLabel(translate("button.modal.cancel", guild))
					.setCustomId("cm_dlt")
					.setDisabled(false),
			]),
			new ActionRowBuilder().setComponents([
				new SelectMenuBuilder()
					.setPlaceholder(translate("select.modal.change", guild))
					.setCustomId("cm_chng")
					.setDisabled(!hasQuestion)
					.setMaxValues(1)
					.setMinValues(1)
					.setOptions([
						{
							label: translate("select.modal.maxChar", guild),
							description: translate("select.modal.defaultMax", guild),
							value: "cm_maxChar",
							emoji: {
								id: "975168639407910922",
								name: "edit",
								animated: false,
							},
						},
					]),
			]),
		];
	}

	/**
	 * It takes a modal embed and returns a new embed with the same title and questions, but with a
	 * description that explains how to use the modal embed
	 * @param {Guild} guild - The guild object
	 * @param {TextChannel} output - The channel the output will be sent in
	 * @returns {EmbedBuilder} An embed builder object.
	 */
	compactModalEmbed(guild, user, output) {
		const modalEmbed = this.builder.embeds[0];
		const modalTitle = modalEmbed.author.name;
		const qAndAs = modalEmbed.fields;
		var questions = [];
		var placeholders = [];

		qAndAs.forEach((field) => {
			questions.push(field.name);
			placeholders.push(field.value.substring(1, field.value.length - 1));
		});

		const objectString = JSON.stringify({
			modalEmbed: true,
			outputChannel: output,
			title: modalTitle,
			questions,
			placeholders,
		});

		return new EmbedBuilder()
			.setAuthor({
				name: modalTitle,
				iconURL: this.client.user.displayAvatarURL(),
			})
			.setDescription(
				translate("finish.modal.description", guild, this.client.user)
			)
			.setColor("#2f3136")
			.setFooter({ text: objectString });
	}

	/**
	 * It takes an embed and converts it into a modal
	 * @param {Boolean} full - If it uses the whole embed or not
	 * @returns {Discord.ModalBuilder} A modal.
	 */
	embedToModal(full = true) {
		const embed = this.builder.embeds[0];
		const modalTitle = embed.author.name;
		const qAndAs = embed.fields;
		var questions = [];
		var placeholders = [];

		qAndAs.forEach((field) => {
			questions.push(field.name);
			placeholders.push(field.value.substring(1, field.value.length - 1));
		});

		if (full === true) {
			let modal = new ModalBuilder()
				.setTitle(modalTitle)
				.setCustomId(`testModal`);

			var actionrows = [];

			for (let i = 0; i < questions.length; i++) {
				const question = questions[i];
				const placeholder = placeholders[i];

				actionrows.push(
					new ActionRowBuilder().setComponents([
						new TextInputBuilder()
							.setCustomId("no_" + i.toString())
							.setLabel(question)
							.setStyle(TextInputStyle.Short)
							.setMaxLength(100)
							.setPlaceholder(placeholder)
							.setRequired(true),
					])
				);
			}

			modal.setComponents(actionrows);

			return modal;
		} else {
			const object = JSON.parse(embed.footer.text);
			if (object.modalEmbed !== true)
				throw new Error("Open button not on ModalCreator.builder");

			let modal = new ModalBuilder()
				.setTitle(object.title)
				.setCustomId(`customModal`);

			var actionrows = [];

			for (let i = 0; i < questions.length; i++) {
				const question = object.questions[i];
				const placeholder = object.placeholders[i];

				actionrows.push(
					new ActionRowBuilder().setComponents([
						new TextInputBuilder()
							.setCustomId("no_" + i.toString())
							.setLabel(question)
							.setStyle(TextInputStyle.Short)
							.setMaxLength(100)
							.setPlaceholder(placeholder)
							.setRequired(true),
					])
				);
			}

			modal.setComponents(actionrows);

			return modal;
		}
	}

	/**
	 * It sends a message to a channel with a button that opens a modal
	 * @param {TextChannel} embedChannel - The channel where the embed will be sent.
	 * @param {TextChannel} outputChannel - The channel where the modal answers will be sent to.
	 */
	async finish(embedChannel, outputChannel) {
		this.channels = { embed: embedChannel, output: outputChannel };

		/** @type {Embed} */
		const modalEmbed = this.builder.embeds[0];
		const compactedEmbed = this.compactModalEmbed(
			modalEmbed,
			outputChannel.guild,
			this.client.user,
			outputChannel
		);

		const openBtn = new ButtonBuilder()
			.setLabel(translate("button.modal.open", outputChannel.guild))
			.setCustomId("openModal")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji({
				id: "977607026991595641",
				name: "paper",
				animated: false,
			});

		await embedChannel.send({
			embeds: [compactedEmbed],
			components: [new ActionRowBuilder().setComponents([openBtn])],
		});
	}

	changeAnswerChars(identifier, newCount = 100, isIndex = true) {
		if (isIndex === true) {
			this.data.maxChars[identifier] = newCount;
		} else {
			let i = this.data.maxChars.indexOf(identifier);
			this.data.maxChars[i] = newCount;
		}
	}
}

module.exports = ModalCreator;

function addBtn() {
	return new ButtonBuilder().setStyle(ButtonStyle.Success).setEmoji({
		name: "plus",
		id: "975163068411695104",
		animated: false,
	});
}

function rmvBtn() {
	return new ButtonBuilder().setStyle(ButtonStyle.Danger).setEmoji({
		name: "minus",
		id: "975163067757396059",
		animated: false,
	});
}

function edtBtn() {
	return new ButtonBuilder().setStyle(ButtonStyle.Secondary).setEmoji({
		name: "edit",
		id: "975168639407910922",
		animated: false,
	});
}

/**
 * Translate a string to the guild's language (default english)
 * @param {String} translation The translation (from config.json)
 * @param {Guild} guild The guild the translation was sent
 * @param {Any} var1 Variable to call in the translation
 * @returns {String} Translated string
 */
function translate(translation, guild, var1) {
	const config = require("./config.json");
	const { lang } = config.utils;
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
