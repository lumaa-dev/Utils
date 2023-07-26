const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ComponentType,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	SelectMenuBuilder,
	Collection,
	GuildMember,
	Embed,
	TextChannel,
	Message,
	Guild,
	Interaction,
	Client,
	ClientUser,
	BaseGuildTextChannel,
	ModalSubmitInteraction,
} = require("discord.js");
const {
	awaitMessage,
	awaitInteraction,
	awaitModal,
} = require("../functions/js/cmds");
const { correctEpoch } = require("../functions/js/other");
const { succeed, error, loading, translate } = require("../main");

module.exports = {
	/**
	 * @param {Interaction} interaction
	 * @param {Client} client
	 * @returns {Any}
	 */
	async execute(interaction, client = null) {
		if (interaction.isStringSelectMenu()) {
			let { customId: name, values, message } = interaction;

			if (name.startsWith("setRoles")) {
				const menuIndex = Number(name.split("_")[1]) ?? 0;

				const options = message.components[menuIndex].components[0].options;
				var actualRoles = [];
				var menuRoles = [];

				await interaction.deferReply({ ephemeral: true });

				options.forEach(async (option) => {
					menuRoles.push(option.value);
					if (!actualRoles.includes(option.value)) {
						actualRoles.push(option.value);
					}
				});

				for (let index = 0; index < actualRoles.length; index++) {
					const roleId = actualRoles[index];
					const role = interaction.guild.roles.cache.get(roleId);
					const botRole = interaction.guild.members.cache.get(client.user.id)
						.roles.botRole;

					if (
						(!values.includes(roleId) && menuRoles.includes(roleId)) ||
						(interaction.member.roles.cache.has(roleId) &&
							role.position < botRole.position &&
							!values.includes(roleId))
					) {
						actualRoles.splice(index, 1);
						index -= 1;
					}
				}

				await interaction.member.roles.remove(menuRoles);
				await interaction.member.roles.add(actualRoles);

				await interaction.editReply({
					content: `Vous possédez désormais les rôles : ${idsToMention(values)
						.toString()
						.replace(/(,)+/g, ", ")}`,
				});
			} else if (name.startsWith("addRoles")) {
				const menuIndex = Number(interaction.customId.split("_")[1]) ?? 0;
				const options = message.components[menuIndex].components[0].options;

				var ids = [];
				options.forEach((option) => ids.push(option.value));

				await interaction.deferReply({ ephemeral: true });

				await interaction.member.roles.remove(ids);
				await interaction.member.roles.add(values);

				await interaction.editReply({
					content: `Vous possédez désormais les rôles : ${idsToMention(values)
						.toString()
						.replace(/(,)+/g, ", ")}`,
				});
			} else if (name === "ticketOptions") {
				const value = values[0];

				const ticketIndex = Number(value.split("_")[1]);
				const ticket =
					message.components[0].components[0].data.options[ticketIndex];
				const threads = message.channel.threads;
				const components = new ActionRowBuilder().setComponents(
					new ButtonBuilder()
						.setCustomId("cutTicket")
						.setStyle(ButtonStyle.Danger)
						.setEmoji({ name: "✂️" })
						.setLabel("Couper le ticket")
						.setDisabled(false)
				);

				await interaction.reply({
					content: `Regardez les fils de ce salon, l'un d'eux devrait vous avoir mentionné.`,
					ephemeral: true
				});

				if (value.split("_")[1] == "other") {
					const threadStart = interaction.channel.lastMessage;
					const thread = await threads.create({
						name: `Autre - ${interaction.user.id}`,
						reason: `Ticket Autre`,
						startMessage: threadStart,
						type: ChannelType.PrivateThread,
					});

					var mainMessage = await thread.send({
						content: `<@${interaction.user.id}>, Veuillez donner un titre à ce ticket.`,
					});

					await awaitMessage(thread, interaction.user, async (collected) => {
						const message = collected.first();
						const content = message.content.slice(0, 50);

						message.delete();
						await thread.edit({ name: `${content} - ${Math.floor(Math.random() * 10**10)}` });
						// await interaction.editReply({
						// 	content: `${interaction.user.tag} a ouvert un ticket pour \`${content}\`.`,
						// });
					});

					await mainMessage.edit({
						content:
							"Veuillez plus détailler la raison de ce ticket ci-dessous.\nLorsque ce ticket n'est plus actif, appuyez sur le bouton `Couper le ticket`.",
						components: [components],
					});
				} else {
					// await interaction.reply({
					// 	content: `${interaction.user.tag} a ouvert un ticket pour \`${ticket.label}\`.`,
					// });
					const threadStart = interaction.channel.lastMessage;
					const thread = await threads.create({
						name: `${ticket.label} - ${Math.floor(Math.random() * 10**10)}`,
						reason: `Ticket ${ticket.label}`,
						startMessage: threadStart,
						type: ChannelType.PrivateThread,
					});

					await thread.send({
						content: `<@${interaction.user.id}>, Veuillez détailler la raison de ce ticket ci-dessous et pingez les personnes si nécessaires.\nLorsque ce ticket n'est plus actif, appuyez sur le bouton \`Couper le ticket\`.`,
						components: [components],
					});
				}
			}
		} else if (interaction.isButton()) {
			let { customId: name, message } = interaction;

			if (name === "acceptNick" || name === "denyNick") {
				if (
					!interaction.member.permissions.has([
						"MANAGE_NICKNAMES",
						"CHANGE_NICKNAME",
					])
				) {
					const messageEmbed = message.embeds[0];

					const info = JSON.parse(messageEmbed.footer.text);
					const member = await interaction.guild.members.cache.get(info.id);

					var embed = null;

					if (name === "acceptNick") {
						await member.setNickname(info.nick);

						embed = messageEmbed;
						embed
							.setColor("GREEN")
							.setDescription(
								`Le nouveau surnom de **${member.user.tag}** est **${info.nick}** !`
							)
							.setTitle("Demande de surnom acceptée")
							.setFooter({ text: "" });
					} else if (name === "denyNick") {
						embed = messageEmbed;
						embed
							.setColor("RED")
							.setDescription(
								`Le surnom demandé par **${member.user.tag}** qui est **${info.nick}** à été refusé !`
							)
							.setTitle("Demande de surnom refusée")
							.setFooter({ text: "" });
					}

					message.edit({
						components: [
							new ActionRowBuilder().setComponents(
								new ButtonBuilder()
									.setCustomId("acceptNick")
									.setDisabled(true)
									.setLabel("Accepter")
									.setStyle(ButtonStyle.Success),
								//.setEmoji("✅")
								new ButtonBuilder()
									.setCustomId("denyNick")
									.setDisabled(true)
									.setLabel("Refuser")
									.setStyle(ButtonStyle.Danger)
								//.setEmoji("❌")
							),
						],
						embeds: [embed],
					});
					if (message.pinned === true) output.unpin();

					interaction.reply({
						content: `<@${info.id}>`,
						ephemeral: false,
					});
				}
			} else if (name === "removeRoles") {
				const components = message.components;
				var menuRoles = [];

				for (let i = 0; i < components.length - 1; i++) {
					const component = components[i];
					const options = component.components[0].options;

					options.forEach(async (option) => {
						menuRoles.push(option.value);
					});
				}

				await interaction.deferReply({ ephemeral: true });

				for (let i = 0; i < menuRoles.length; i++) {
					const roleId = menuRoles[i];
					const role = interaction.guild.roles.cache.get(roleId);
					// const botRole = interaction.guild.members.cache.get(client.user.id)
					// 	.roles.botRole;

					await interaction.member.roles.remove(role);

					await interaction.editReply({
						content: "Vous ne possédez plus aucun rôles affiché ci-dessus.",
					});
				}
			} else if (name.startsWith("toggleRole")) {
				const roleId = name.split("_")[1];
				const role = interaction.guild.roles.cache.get(roleId);

				if (typeof role === "undefined" || role === null) {
					interaction.reply({ content: "Le rôle n'existe plus." });
					return await message.delete();
				}

				await interaction.deferReply({ ephemeral: true });
				const added = toggleRole(interaction.member, role);

				if (added === true) {
					await interaction.editReply({
						content: `Vous avez obtenu le rôle ${idsToMention([roleId])}.`,
					});
				} else if (added === false) {
					await interaction.editReply({
						content: `Vous avez perdu le rôle ${idsToMention([roleId])}.`,
					});
				}
			} else if (name === "cutTicket") {
				if (interaction.channel.type === ChannelType.PrivateThread) {
					await interaction.deferReply({ ephemeral: true });

					await interaction.channel.send({
						content: `Ticket coupé par **${
							interaction.user.tag
						}** <t:${correctEpoch(new Date().getTime())}:R>`,
					});
					if (interaction.channel.archived === false)
						await interaction.channel.edit({ archived: true });

					await interaction.editReply({
						content:
							"Le ticket a bien été coupé !\n*Vous pouvez, à tout moment, le réouvrir en envoyant un message.",
						ephemeral: true,
					});
				} else {
					await interaction.reply({
						content: "Ceci n'est pas un ticket.",
						ephemeral: true,
					});
				}
			} else if (name.startsWith("cm")) {
				// create modal = cm

				const action = name.split("_")[1];
				const oldEmbed = message.embeds[0];
				if (oldEmbed.footer.iconURL !== interaction.user.displayAvatarURL())
					return interaction.reply({
						embeds: [error(translate("error.ownModal", interaction.guild))],
						ephemeral: true,
					});

				if (action === "addQst") {
					if (oldEmbed.fields !== null && oldEmbed.fields.length >= 4)
						return interaction.reply({
							embeds: [
								error(translate("add.modal.tooMany", interaction.guild)),
							],
							ephemeral: true,
						});

					const newQstModal = new ModalBuilder()
						.setTitle(translate("add.modal.title", interaction.guild))
						.setCustomId(`cm_qst`);

					const qstInput = new TextInputBuilder()
						.setCustomId("qst")
						.setLabel(translate("add.modal.question", interaction.guild))
						.setStyle(TextInputStyle.Short)
						.setMaxLength(45)
						.setRequired(true);

					const phInput = new TextInputBuilder()
						.setCustomId("ph")
						.setLabel(translate("add.modal.placeholder", interaction.guild))
						.setStyle(TextInputStyle.Short)
						.setMaxLength(100)
						// .setPlaceholder(`Comme celui que vous lisez actuellement`)
						.setRequired(true);

					const newQstAr = new ActionRowBuilder().addComponents([qstInput]);
					const phAr = new ActionRowBuilder().addComponents([phInput]);

					newQstModal.addComponents([newQstAr, phAr]);

					await interaction.showModal(newQstModal);
				} else if (action === "dlt") {
					await message.delete();
					await interaction.channel.send({
						embeds: [
							succeed(
								translate(
									"cancel.modal.succeed",
									interaction.guild,
									interaction.user
								)
							),
						],
					});
				} else if (action === "try") {
					const userModal = embedToModal(message.embeds[0]);

					await interaction.showModal(userModal);
				} else if (action === "edtQsts") {
					// edt = edit

					let selectMenu = new SelectMenuBuilder()
						.setCustomId("edt_qst")
						.setMaxValues(1)
						.setMinValues(1)
						.setDisabled(false);

					var options = [];

					await interaction.deferReply();

					for (let i = 0; i < oldEmbed.fields.length; i++) {
						const field = oldEmbed.fields[i];
						options.push({
							value: `qst_${i}`,
							description: field.value.substring(1, field.value.length - 1),
							label: field.name,
						});
					}

					selectMenu.setOptions(options);

					await interaction.deleteReply();
					let msgMenu = await message.reply({
						embeds: [
							succeed(translate("edit.modal.question", interaction.guild)),
						],
						components: [new ActionRowBuilder().setComponents([selectMenu])],
					});

					await awaitInteraction(
						msgMenu,
						interaction.user,
						ComponentType.SelectMenu,
						async (collected) => {
							let { customId: name, values, message: _message } = collected;

							if (name === "edt_qst") {
								const value = values[0];
								const qstIndex = value.split("_")[1];

								message.modalEdit = new Collection();
								message.modalEdit = qstIndex;

								const edtModal = new ModalBuilder()
									.setTitle(
										translate("edit.modal.title", interaction.guild, qstIndex)
									)
									.setComponents(
										fieldToRows(message.embeds[0].fields[qstIndex])
									)
									.setCustomId("cm_edt");

								await collected.showModal(edtModal);
								// _message.delete();
							}
						}
					);

					function fieldToRows(field) {
						const qstInput = new TextInputBuilder()
							.setCustomId("qst")
							.setLabel(translate("add.modal.question", interaction.guild))
							.setStyle(TextInputStyle.Short)
							.setMaxLength(45)
							.setRequired(true)
							.setValue(field.name);

						const phInput = new TextInputBuilder()
							.setCustomId("ph")
							.setLabel(translate("add.modal.placeholder", interaction.guild))
							.setStyle(TextInputStyle.Short)
							.setMaxLength(100)
							// .setPlaceholder(`Comme celui que vous lisez actuellement`)
							.setRequired(true)
							.setValue(field.value.substring(1, field.value.length - 1));

						const newQstAr = new ActionRowBuilder().addComponents([qstInput]);
						const phAr = new ActionRowBuilder().addComponents([phInput]);

						return [newQstAr, phAr];
					}
				} else if (action === "rmvQsts") {
					// remove questions

					let selectMenu = new SelectMenuBuilder()
						.setCustomId("del_qst")
						.setMaxValues(oldEmbed.fields.length)
						.setMinValues(1)
						.setDisabled(false);

					var options = [];

					await interaction.deferReply();

					for (let i = 0; i < oldEmbed.fields.length; i++) {
						const field = oldEmbed.fields[i];
						options.push({
							value: `qst_${i}`,
							description: field.value.substring(1, field.value.length - 1),
							label: field.name,
						});
					}

					selectMenu.setOptions(options);

					await interaction.deleteReply();

					const msgMenu = await interaction.channel.send({
						embeds: [
							loading(translate("delete.modal.questions", interaction.guild)),
						],
						components: [new ActionRowBuilder().setComponents([selectMenu])],
						ephemeral: false,
					});

					//console.log(msgMenu.interaction.message);

					await awaitInteraction(
						msgMenu,
						interaction.user,
						ComponentType.SelectMenu,
						async (collected) => {
							let { customId: name, values, message: _message } = collected;

							if (name === "del_qst") {
								var hasQuestions = true;
								var i = 0;

								values.sort(function (a, b) {
									return (
										Number(new String(a).split("_")[1]) -
										Number(new String(b).split("_")[1])
									);
								});
								values.forEach((value) => {
									const index = value.split("_")[1];
									oldEmbed.fields.splice(Number(index - i), 1);
									i = i + 1;
								});

								//oldEmbed.fields = qstsKeep;
								console.log(oldEmbed.fields);
								if (oldEmbed.fields === null || oldEmbed.fields.length < 1)
									hasQuestions = false;

								await _message.delete();
								await message.edit({
									content: message.content,
									embeds: [oldEmbed],
									components: modalComponent(hasQuestions, interaction),
								});

								collected.reply({
									embeds: [
										succeed(
											translate("delete.modal.succeed", interaction.guild)
										),
									],
									ephemeral: true,
								});
							}
						}
					);
				} else if (action === "done") {
					const mainChannel = interaction.channel;
					/**
					 * @type {BaseGuildTextChannel} the channel that the modal will be sent in
					 */

					var modalChannel, outputChannel;

					await interaction.reply({
						embeds: [
							loading(translate("finish.modal.channel", interaction.guild)),
						],
						ephemeral: false,
					});

					await awaitMessage(
						interaction.channel,
						interaction.user,
						/**
						 * @param {Collection} collected
						 */
						async (collected) => {
							/**
							 * @type {Message}
							 */
							const _message = collected.first();

							if (_message.content.match(/<#\d+>/g)) {
								/**
								 * @type {TextChannel}
								 */
								modalChannel = await _message.guild.channels.cache.get(
									String(_message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
								);

								if (!modalChannel.isTextBased())
									throw new Error("error.insertVoice");

								await modalChannel.sendTyping();

								await _message.delete();
							} else {
								await _message.delete();
								throw new Error("error.noInsertChannel");
							}
						},
						(e) => {
							console.error(e)
							// return mainChannel.send({
							// 	embeds: [error(translate(e, collected.first().guild))],
							// });
						}
					);

					if (!modalChannel) return;

					await awaitMessage(
						interaction.channel,
						interaction.user,
						/**
						 * @param {Collection} collected
						 */
						async (collected) => {
							/**
							 * @type {Message}
							 */
							const _message = collected.first();

							if (_message.content.match(/<#\d+>/g)) {
								/**
								 * @type {TextChannel}
								 */
								outputChannel = await _message.guild.channels.cache.get(
									String(_message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
								);

								if (!outputChannel.isTextBased())
									throw new Error("error.insertVoice");

								await _message.delete();
							} else {
								await _message.delete();
								throw new Error("error.noInsertChannel");
							}
						},
						(e) => {
							return mainChannel.send({
								embeds: [error(e)],
							});
						}
					);

					if (modalChannel.isTextBased()) {
						await modalChannel.send({
							embeds: [
								compactModalEmbed(
									oldEmbed,
									interaction.guild,
									client.user,
									outputChannel.id
								),
							],
							components: [
								new ActionRowBuilder().setComponents([
									new ButtonBuilder()
										.setLabel(
											translate("button.modal.open", outputChannel.guild)
										)
										.setCustomId("openModal")
										.setStyle(ButtonStyle.Secondary),
								]),
							],
						});
						await interaction.editReply({
							embeds: [
								succeed(
									translate(
										"finish.modal.sent",
										interaction.guild,
										modalChannel
									)
								),
							],
						});
					}
				}
			} else if (name === "openModal") {
				const customModal = embedToModal(message.embeds[0].data, false);

				await interaction.showModal(customModal);
				await awaitModal(
					interaction,
					interaction.user,
					async (/** @type {ModalSubmitInteraction} */ _interaction) => {
						let {
							// customId: name,
							fields: components,
							components: actionRows,
							message,
						} = _interaction;
						let { questions, outputChannel } = JSON.parse(
							message.embeds[0].footer.text
						);

						var embedFields = [];

						await _interaction.deferReply({ ephemeral: true });
						for (let i = 0; i < actionRows.length; i++) {
							const question = questions[i];
							const userAnswer = components.getTextInputValue(`no_${i}`);

							embedFields.push({ name: question, value: `*${userAnswer}*` });
						}

						const answerEmbed = new EmbedBuilder()
							.setAuthor(message.embeds[0].author)
							.setColor("Blurple")
							.setFields(embedFields)
							.setFooter({
								text: translate(
									"answer.modal.footer",
									_interaction.guild,
									_interaction.user
								),
							})
							.setThumbnail(
								_interaction.user.displayAvatarURL({
									forceStatic: false,
									size: 512,
								})
							);

						await _interaction.guild.channels.cache
							.get(outputChannel)
							.send({ embeds: [answerEmbed] })
							.then(async (msg) => {
								await _interaction.editReply({
									embeds: [succeed(translate("answer.modal.sent", msg.guild))],
								});
							});
					}
				);
			} else {
				interaction.reply({
					embeds: [error(translate("error.unknown", interaction.guild))],
					ephemeral: true,
				});
			}
		} else if (interaction.isModalSubmit()) {
			const { customId: name, fields: components, message } = interaction;

			if (name === "createModal") {
				await interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setAuthor({
								name: components.getTextInputValue("title"),
								iconURL: client.user.displayAvatarURL(),
							})
							// .setFields([
							// 	{
							// 		name: "(Titre d'une question)",
							// 		value: "*(Ceci est le placeholder)*",
							// 	},
							// ])
							.setColor("#2f3136")
							.setFooter({
								text: translate("discord.tos", interaction.guild),
								iconURL: interaction.user.displayAvatarURL(),
							}),
					],
					components: modalComponent(false, interaction),
				});
			} else if (name.startsWith("cm")) {
				const action = name.split("_")[1];

				if (action === "qst") {
					const oldEmbed = message.embeds[0];
					var fields = [];

					if (oldEmbed.fields !== null) {
						fields = oldEmbed.fields;
					}

					fields.push({
						name: components.getTextInputValue("qst"),
						value: `*${components.getTextInputValue("ph")}*`,
						inline: false,
					});

					const modalEmbed = new EmbedBuilder()
						.setAuthor(oldEmbed.author)
						.setFields(fields)
						.setFooter(oldEmbed.footer)
						.setColor(oldEmbed.color);

					await message.edit({
						content: message.content,
						embeds: [modalEmbed],
						components: modalComponent(true, interaction),
					});
					await interaction.deferReply();
					await interaction.deleteReply();
				} else if (action === "edt") {
					// edit

					const modalMsg = await interaction.channel.messages.fetch(
						message.reference.messageId
					);

					if (modalMsg.embeds[0]) {
						await interaction.deferReply();

						modalMsg.embeds[0].fields[modalMsg.modalEdit] = {
							name: components.getTextInputValue("qst"),
							value: `*${components.getTextInputValue("ph")}*`,
							inline: false,
						};

						const modalEmbed = new EmbedBuilder();
						modalEmbed.data = modalMsg.embeds[0].data;

						modalEmbed.setFields(modalMsg.embeds[0].fields);
						await modalMsg.edit({
							embeds: [modalEmbed],
							content: modalMsg.content,
						});
						await message.delete();

						await interaction.deleteReply();
					} else {
						throw new TypeError(
							"Reply isn't Discord.MessageType.ChatInputCommand"
						);
					}
				}
			}
		}
	},
};

/**
 * Creates buttons for Modal Creator
 * @param {Boolean} hasQuestion If the Modal Creator has at least one question
 * @returns {Array<ActionRowBuilder>}
 */
function modalComponent(hasQuestion = false, interaction) {
	return [
		new ActionRowBuilder().setComponents([
			addBtn()
				.setLabel(translate("button.modal.add", interaction.guild))
				.setCustomId("cm_addQst"),
			edtBtn()
				.setLabel(translate("button.modal.edit", interaction.guild))
				.setDisabled(!hasQuestion)
				.setCustomId("cm_edtQsts"),
			rmvBtn()
				.setLabel(translate("button.modal.delete", interaction.guild))
				.setDisabled(!hasQuestion)
				.setCustomId("cm_rmvQsts"),
		]),
		new ActionRowBuilder().setComponents([
			new ButtonBuilder()
				.setLabel(translate("button.modal.finish", interaction.guild))
				.setCustomId("cm_done")
				.setStyle(ButtonStyle.Primary)
				.setDisabled(!hasQuestion),
			edtBtn()
				.setLabel(translate("button.modal.try", interaction.guild))
				.setCustomId("cm_try")
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(!hasQuestion),
			rmvBtn()
				.setLabel(translate("button.modal.cancel", interaction.guild))
				.setCustomId("cm_dlt")
				.setDisabled(false),
		]),
	];
}

/**
 * It takes a modal embed and returns a new embed with the same title and questions, but with a
 * description that explains how to use the modal embed
 * @param {Embed} modalEmbed - The embed that you want to convert
 * @param {Guild} guild - The guild object
 * @param {ClientUser} user - The bot client to use for the author of the embed and description.
 * @param {TextChannel} output - The channel the output will be sent in
 * @returns {EmbedBuilder} An embed builder object.
 */
function compactModalEmbed(modalEmbed, guild, user, output) {
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
		.setAuthor({ name: modalTitle, iconURL: user.displayAvatarURL() })
		.setDescription(translate("finish.modal.description", guild, user))
		.setColor("#2f3136")
		.setFooter({ text: objectString });
}

/**
 * It takes an embed and converts it into a modal
 * @param {Embed} embed - The embed object that you want to convert to a modal.
 * @param {Boolean} full - If it uses the whole embed or not
 * @returns {Discord.ModalBuilder} A modal.
 */
function embedToModal(embed, full = true) {
	const modalTitle = embed.author.name;

	if (full === true) {
		const qAndAs = embed.fields;
		var questions = [];
		var placeholders = [];

		qAndAs.forEach((field) => {
			questions.push(field.name);
			placeholders.push(field.value.substring(1, field.value.length - 1));
		});

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
		if (object.modalEmbed !== true) return;

		var questions,
			placeholders = [];

		let modal = new ModalBuilder()
			.setTitle(object.title)
			.setCustomId(`customModal`);

		var actionrows = [];

		for (let i = 0; i < object.questions.length; i++) {
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
 * Given an array of role IDs, return an array of role mentions
 * @param {Array<String|Number>} elements - An array of elements IDs to mention.
 * @param {String} mention - The type of mention (&, !, #)
 * @returns An array of strings.
 */
function idsToMention(elements, mention = "&") {
	var available = ["&", "!", "#"];
	if (!available.includes(mention) && mention.length > 1)
		throw new TypeError(`Mention "${mention}" isn't available`);
	var output = [];
	elements.forEach((element) => {
		output.push(`<@${mention}${element}>`);
	});

	return output;
}

/**
 * It adds or removes a role from a member.
 * @param {GuildMember} member - The member to toggle the roles for.
 * @param {Role} role - The role you want to add or remove.
 * @return {Boolean} true = added role | false = removed role
 */
function toggleRole(member, role) {
	/**
	 * @param {GuildMember} hasRole d
	 * */
	const hasRole = member.roles.cache.has(role.id);

	if (!hasRole) {
		member.roles.add(role);
		return true;
	} else {
		member.roles.remove(role);
		return false;
	}
}

function addBtn() {
	return new ButtonBuilder().setStyle(ButtonStyle.Success)
}

function rmvBtn() {
	return new ButtonBuilder().setStyle(ButtonStyle.Danger)
}

function edtBtn() {
	return new ButtonBuilder().setStyle(ButtonStyle.Secondary)
}

// function modalToEmbed(modalInteraction) {
// 	const mi = modalInteraction;
// 	for (let i = 0; i < mi.components.length; i++) {
// 		for (let x = 0; x < mi.components[i].components.length; x++) {
// 			const component = mi.components[i].components[x];
// 			if (component.type === ComponentType.TextInput) {
// 				console.log(component);
// 			} else {
// 				console.log("Component is not a text inpit");
// 			}
// 		}
// 	}
// }
