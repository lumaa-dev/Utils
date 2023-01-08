const {
	PermissionFlagsBits,
	ChannelType,
	SelectMenuBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
} = require("discord.js");
const { awaitMessage } = require("../functions/js/cmds");

module.exports = {
	data: {
		description:
			"Changez des informations sur les menus des séléctions de rôles",
		name: "menus",
		type: 1,
		options: [
			{
				description: "Ajoutez votre premier menu de séléction de rôles",
				name: "setup",
				type: 1,
				options: [
					{
						description:
							"Définissez si le menu de séléction de rôles agit par lui-même",
						name: "solitaire",
						required: "true",
						type: 5,
					},
				],
			},
			{
				description: "Ajoutez un menu de séléction de rôles",
				name: "add",
				type: 1,
				options: [
					{
						description:
							"Définissez si le menu de séléction de rôles agit par lui-même",
						name: "solitaire",
						required: "true",
						type: 5,
					},
				],
			},
			{
				description: "Enlever un menu de séléction de rôles",
				name: "remove",
				type: 1,
			},
			{
				description: "Ajoute un bouton de suppression",
				name: "button",
				type: 1,
			},
		],
	},
	customData: {
		usage: [
			"/menus setup [solitaire]",
			"/menus add [solitaire]",
			"/menus remove",
			"/menus button",
		],
		dev: false,
	},
	async execute(interaction, client = null) {
		let subName = interaction.options.getSubcommand();

		if (!interaction.member.permissions.has([PermissionFlagsBits.ManageRoles]))
			return interaction.reply({
				content:
					"Oups ! Tu ne peux pas faire cette commande, tu ne possède pas les bonnes permissions.",
				ephemeral: true,
			});

		if (subName === "setup") {
			var setupData = {
				guild: interaction.guild,
				steps: null,
				roleChannel: null,
				mainChannel: null,
				maxSelect: null,
				roleMenuMsg: null,
				roleCount: null,
				actualMenu: null,
				placeholderText: null,
				solo: interaction.options.getBoolean("solitaire") ?? true,
			};

			await interaction.reply({
				content:
					"Bienvenue dans la procédure de setup, toutes les actions seront principalements éxecuté dans ce channel.\n\nPossédez-vous un channel de séléction de rôles ? Si oui, pingez le channel. Sinon mettez autre chose",
				ephemeral: false,
			});
			setupData.steps = 1;
			setupData.mainChannel = interaction.channel;
			await awaitMessage(
				setupData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.match(/<#\d+>/g)) {
						setupData.roleChannel = await setupData.guild.channels.cache.get(
							String(message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
						);
						await message.delete();
					} else {
						setupData.roleChannel = await setupData.guild.channels.create(
							"rôles",
							{
								type: ChannelType.GuildText,
								topic: "Séléctionnez vos rôles",
								nsfw: false,
								permissionOverwrites: [
									{
										id: setupData.guild.roles.everyone,
										deny: [
											PermissionFlagsBits.AddReactions,
											PermissionFlagsBits.SendMessages,
											PermissionFlagsBits.SendMessagesInThreads,
											PermissionFlagsBits.CreatePublicThreads,
											PermissionFlagsBits.CreatePrivateThreads,
										],
									},
								],
							}
						);
						await message.delete();
					}
				},
				(e) => {
					return console.log(e);
				}
			);

			if (setupData.roleChannel === null) return;
			setupData.steps += 1;

			interaction.editReply({
				content: `Bien ! Votre channel de séléction de rôle est donc <#${setupData.roleChannel.id}>.\n\nMaintenant vous allez définir le nombre maximum de rôles que l'on peux séléctionner`,
			});

			await awaitMessage(
				setupData.mainChannel,
				interaction.user,
				(collected) => {
					message = collected.first();

					if (!Number.isNaN(Number(message.content))) {
						if (Number(message.content) > 25 || Number(message.content) < 1)
							return interaction.editReply({
								content: "Le nombre inséré n'est pas entre 1 et 25.",
							});
						setupData.maxSelect = Number(message.content);
						message.delete();
					} else {
						message.delete();
						return interaction.editReply({
							content: "Oups ! On dirait que tu n'as pas mis un nombre.",
						});
					}
				},
				(e) => {
					return console.error(e);
				}
			);

			if (setupData.maxSelect === null) return;
			setupData.steps += 1;

			interaction.editReply({
				content: `Bien ! Votre sélécteur de rôle accepte ${setupData.maxSelect} rôles à la fois.\n\nMaintenant vous allez nommer la catégorie de rôles que vous souhaitez attribuer. (Qui, par la suite, peut être changé)`,
			});

			await awaitMessage(
				setupData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.length >= 100) {
						message.delete();
						return interaction.editReply({
							content: "Oups ! Vous ne pouvez pas avoir plus de 100 caractères",
						});
					} else {
						await message.delete();
						setupData.placeholderText = message.content;
						setupData.roleMenuMsg = await setupData.roleChannel.send({
							content: "Chargement...",
						});
					}
				},
				(e) => {
					return console.error(e);
				}
			);

			if (setupData.placeholderText === null) return;
			setupData.steps += 1;

			interaction.editReply({
				content: `Nice ! Tout ce passe comme sur des roulettes.\n\nVeuillez ping les rôles que vous souhaiteriez avoir dans le menu de séléction de rôles.`,
			});

			await awaitMessage(
				setupData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					// var menu = setupData.roleMenuMsg.components[0].components[0];
					var array = [];
					if (!message.content.match(/<@&\d+>/g)) return;
					message.content.match(/<@&\d+>/g).forEach((string) => {
						let role = setupData.guild.roles.cache.get(string.match(/\d+/g)[0]);

						array.push({
							label: role.name,
							value: role.id,
							//emoji: role.unicodeEmoji ?? null,
							//default: false,
						});
					});

					if (setupData.maxSelect > array.length)
						setupData.maxSelect = array.length;

					// setupData.actualMenu = menu;
					message.delete();
					await setupData.roleMenuMsg.edit({
						// content: `Séléctionnez des rôles ci-dessous :`,
						components: [
							new ActionRowBuilder().addComponents([
								new SelectMenuBuilder()
									.setMinValues(1)
									.setMaxValues(setupData.maxSelect)
									.setCustomId(setupData.solo ? "setRoles_0" : "addRoles_0")
									.setPlaceholder(setupData.placeholderText)
									.setDisabled(false)
									.setOptions(array),
							]),
						],
					});
				},
				(e) => {
					return console.error(e);
				}
			);

			// if (setupData.actualMenu === null) return;

			interaction.editReply({
				content:
					"👏 **Bravo !** Vous avez terminé la procédure de setup !\nVous pouvez désormais utiliser le menu de séléction de rôles sans problèmes",
			});
		} else if (subName === "add") {
			var addData = {
				guild: interaction.guild,
				mainChannel: null,
				steps: null,
				confirmed: false,
				roleChannel: null,
				roleMenuMsg: null,
				maxSelect: null,
				menuPlaceholder: null,
				removeButton: false,
				solo: interaction.options.getBoolean("solitaire") ?? true,
			};

			addData.mainChannel = interaction.channel;

			interaction.reply({
				content:
					"Veuillez ping le channel dans lequel est le menu de séléction des rôles.",
			});

			addData.steps = 1;
			await awaitMessage(
				addData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.match(/<#\d+>/g)) {
						addData.roleChannel = await addData.guild.channels.cache.get(
							String(message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
						);
						await message.delete();
					} else {
						await message.delete();
						return addData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				},
				(e) => {
					return console.log(e);
				}
			);

			if (addData.roleChannel === null) return;
			addData.steps += 1;

			interaction.editReply({
				content: `Désormais, allez dans le channel <#${addData.roleChannel.id}> et **répondez** au message avec le menu de séléction des rôles (vous pouvez dire n'importe quoi).`,
			});

			await awaitMessage(
				addData.roleChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();

					if (message.reference !== null) {
						addData.roleMenuMsg = await addData.roleChannel.messages.fetch(
							message.reference.messageId
						);

						await message.delete();
					} else {
						await message.delete();
						return addData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				}
			);

			if (addData.roleMenuMsg === null) return;
			addData.removeButton = hasRemoveButton(addData.roleMenuMsg);
			addData.steps += 1;

			interaction.editReply(
				`Dites \`Ok\` pour continuer. <@${interaction.user.id}>`
			);

			await awaitMessage(
				addData.mainChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();
					message.delete();

					if (message.content.toLowerCase() === "ok") {
						addData.confirmed = true;
						addData.steps += 1;
					} else {
						await addData.mainChannel
							.send(`<@${interaction.user.id}>`)
							.then(async (message) => await message.delete());
						return interaction.editReply({
							content: "Oups ! Tu n'as pas dit `Ok` comme je te l'ai demandé.",
						});
					}
				}
			);

			if (addData.confirmed === false) return;

			interaction.editReply({
				content: `Bien ! Votre channel de séléction de rôle est donc <#${addData.roleChannel.id}>.\n\nMaintenant vous allez définir le nombre maximum de rôles que l'on peux séléctionner`,
			});

			await awaitMessage(
				addData.mainChannel,
				interaction.user,
				(collected) => {
					message = collected.first();

					if (!Number.isNaN(Number(message.content))) {
						addData.maxSelect = Number(message.content);
						message.delete();
					} else {
						message.delete();
						return interaction.editReply({
							content: "Oups ! On dirait que tu n'as pas mis un nombre.",
						});
					}
				},
				(e) => {
					return console.error(e);
				}
			);

			if (addData.maxSelect === null) return;

			interaction.editReply({
				content: `Bien ! Votre sélécteur de rôle accepte ${addData.maxSelect} rôles à la fois.\n\nMaintenant vous allez nommer la catégorie de rôles que vous souhaitez attribuer. (Qui, par la suite, peut être changé)`,
			});

			await awaitMessage(
				addData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.length >= 100) {
						message.delete();
						return interaction.editReply({
							content: "Oups ! Vous ne pouvez pas avoir plus de 100 caractères",
						});
					} else {
						await message.delete();
						addData.menuPlaceholder = message.content;
					}
				},
				(e) => {
					return console.error(e);
				}
			);

			if (addData.menuPlaceholder === null) return;
			addData.steps += 1;

			interaction.editReply({
				content: `Nice ! Tout ce passe comme sur des roulettes.\n\nVeuillez ping les rôles que vous souhaiteriez avoir dans le menu de séléction de rôles.`,
			});

			await awaitMessage(
				addData.mainChannel,
				interaction.user,
				async (collected) => {
					userMessage = collected.first();

					//await interaction.deferReply();
					var error = false;

					if (addData.removeButton === false) {
						await addMenuRow(
							addData.roleMenuMsg,
							addData.menuPlaceholder,
							userMessage.content,
							addData.maxSelect,
							addData.solo
						).catch(async (e) => {
							console.error(e);
							error = true;
							return await interaction.editReply({
								content: `Erreur:\n\`\`\`${e}\`\`\``,
							});
						});
					} else {
						await addMenuRemoveButton(
							addData.roleMenuMsg,
							addData.menuPlaceholder,
							userMessage.content,
							addData.maxSelect,
							addData.solo
						).catch(async (e) => {
							console.error(e);
							error = true;
							return await interaction.editReply({
								content: `Erreur:\n\`\`\`${e}\`\`\``,
							});
						});
					}

					if (error === true) return;

					await interaction.editReply({
						content: `👏 **Bravo !**\nVous pouvez désormais constater que il y a un nouveau menu dans <#${addData.roleChannel.id}>.`,
					});
				},
				(e) => {
					return console.error(e);
				}
			);
		} else if (subName === "remove") {
			var removeData = {
				guild: interaction.guild,
				mainChannel: interaction.channel,
				steps: null,
				confirmed: false,
				roleChannel: null,
				roleMenuMsg: null,
			};

			interaction.reply({
				content:
					"Veuillez ping le channel dans lequel est le menu de séléction des rôles.",
			});

			removeData.steps = 1;
			await awaitMessage(
				removeData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.match(/<#\d+>/g)) {
						removeData.roleChannel = await removeData.guild.channels.cache.get(
							String(message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
						);
						await message.delete();
					} else {
						await message.delete();
						return removeData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				},
				(e) => {
					return console.log(e);
				}
			);

			if (removeData.roleChannel === null) return;
			removeData.steps += 1;

			interaction.editReply({
				content: `Désormais, allez dans le channel <#${removeData.roleChannel.id}> et **répondez** au message avec le menu de séléction des rôles (vous pouvez dire n'importe quoi).`,
			});

			await awaitMessage(
				removeData.roleChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();

					if (message.reference !== null) {
						removeData.roleMenuMsg =
							await removeData.roleChannel.messages.fetch(
								message.reference.messageId
							);

						await message.delete();
					} else {
						await message.delete();
						return removeData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				}
			);

			if (removeData.roleMenuMsg === null) return;
			removeData.steps += 1;

			interaction.editReply(
				`Dites \`Ok\` pour continuer. <@${interaction.user.id}>`
			);

			await awaitMessage(
				removeData.mainChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();
					message.delete();

					if (message.content.toLowerCase() === "ok") {
						removeData.confirmed = true;
						removeData.steps += 1;
					} else {
						await removeData.mainChannel
							.send(`<@${interaction.user.id}>`)
							.then(async (message) => await message.delete());
						return interaction.editReply({
							content: "Oups ! Tu n'as pas dit `Ok` comme je te l'ai demandé.",
						});
					}
				}
			);

			if (removeData.confirmed === false) return;

			interaction.editReply({
				content: `Merci ! Maintenant, quelle menu voulez-vous enlever ? **Le bouton compte comme un menu.**\n*Par example, le premier menu est le numéro 1, le second est le numéro 2, etc...*`,
			});

			await awaitMessage(
				removeData.mainChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();
					const index = Number(message.content.match(/\d+/g)[0]);

					message.delete();
					await removeMenuRow(removeData.roleMenuMsg, index).catch((e) => {
						console.error(e);
					});

					interaction.editReply({
						content: "👏 **Bravo !** Tout c'est bien passé, et c'est bon !",
					});
				}
			);
		} else if (subName === "button") {
			var buttonData = {
				guild: interaction.guild,
				mainChannel: interaction.channel,
				steps: null,
				confirmed: false,
				roleMenuMsg: null,
				roleChannel: null,
			};

			interaction.reply({
				content:
					"Veuillez ping le channel dans lequel est le menu de séléction des rôles.",
			});

			buttonData.steps = 1;
			await awaitMessage(
				buttonData.mainChannel,
				interaction.user,
				async (collected) => {
					message = collected.first();

					if (message.content.match(/<#\d+>/g)) {
						buttonData.roleChannel = await buttonData.guild.channels.cache.get(
							String(message.content.match(/<#\d+>/g)[0]).match(/\d+/g)[0]
						);
						await message.delete();
					} else {
						await message.delete();
						return buttonData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				},
				(e) => {
					return console.log(e);
				}
			);

			if (buttonData.roleChannel === null) return;
			buttonData.steps += 1;

			interaction.editReply({
				content: `Désormais, allez dans le channel <#${buttonData.roleChannel.id}> et **répondez** au message avec le menu de séléction des rôles (vous pouvez dire n'importe quoi).`,
			});

			await awaitMessage(
				buttonData.roleChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();

					if (message.reference !== null) {
						buttonData.roleMenuMsg =
							await buttonData.roleChannel.messages.fetch(
								message.reference.messageId
							);

						await message.delete();
					} else {
						await message.delete();
						return buttonData.mainChannel.send(
							`Oups ! Vous n'avez pas mis de channel existant.`
						);
					}
				}
			);

			if (buttonData.roleMenuMsg === null) return;
			if (hasRemoveButton(buttonData.roleMenuMsg))
				return interaction.editReply({
					content:
						"Mince ! Il parrait qu'il y a déjà un bouton de suppression.",
				});
			buttonData.steps += 1;

			interaction.editReply(
				`Dites \`Ok\` pour ajouter le bouton de suppression. <@${interaction.user.id}>`
			);

			await awaitMessage(
				buttonData.mainChannel,
				interaction.user,
				async (collected) => {
					const message = collected.first();
					message.delete();

					if (message.content.toLowerCase() === "ok") {
						buttonData.confirmed = true;
						buttonData.steps += 1;
					} else {
						await buttonData.mainChannel
							.send(`<@${interaction.user.id}>`)
							.then(async (message) => await message.delete());
						return interaction.editReply({
							content: "Oups ! Tu n'as pas dit `Ok` comme je te l'ai demandé.",
						});
					}
				}
			);

			if (buttonData.confirmed === false) return;

			await addRemoveButton(buttonData.roleMenuMsg);

			interaction.editReply({
				content: "👏 **Bravo !** On peut enlever les rôles comme demandé !",
			});
		}
	},
};

/**
 * Add a row to the menu
 * @param {Message} message - The message object that the menu is being added to.
 * @param {String} placeholder - The placeholder text that appears in the menu.
 * @param {String} roles - The roles to add to the menu.
 * @param {Number} maxSelect - The maximum number of roles that can be selected.
 * @param {Boolean} solo - If the menu is acting by itself
 * @returns The return value is a Promise that resolves to the edited message.
 */
async function addMenuRow(message, placeholder, roles, maxSelect, solo = true) {
	var componentsToSet = [];

	message.components.forEach((actionrow) => {
		const x = new ActionRowBuilder().addComponents(actionrow.components);

		componentsToSet.push(x);
	});

	var array = [];
	if (!roles.match(/<@&\d+>/g)) return;
	roles.match(/<@&\d+>/g).forEach((string) => {
		let role = message.guild.roles.cache.get(string.match(/\d+/g)[0]);

		array.push({
			label: role.name,
			value: role.id,
			//emoji: role.unicodeEmoji ?? null,
			//default: false,
		});
	});

	const newComponent = new ActionRowBuilder().addComponents([
		new SelectMenuBuilder()
			.setMinValues(1)
			.setMaxValues(maxSelect)
			.setCustomId(
				!solo
					? `setRoles_${componentsToSet.length}`
					: `addRoles_${componentsToSet.length}`
			)
			.setPlaceholder(placeholder)
			.setDisabled(false)
			.setOptions(array),
	]);

	componentsToSet.push(newComponent);

	console.log(componentsToSet);

	if (componentsToSet.length > 5)
		throw Error(
			"Vous ne pouvez pas avoir plus de 5 menus de séléction de rôles."
		);

	await message.edit({ content: message.content, components: componentsToSet });
}

/**
 * It adds a select menu and a button to remove all roles from a user
 * @param {Message} message - The message object that the button will be added to.
 * @param {String} placeholder - The placeholder text that appears in the menu.
 * @param {String} roles - The roles that the user can select.
 * @param {Boolean} solo - If the menu acts by itself
 * @param {Number} maxSelect - The maximum number of roles that can be selected.
 */
async function addMenuRemoveButton(
	message,
	placeholder,
	roles,
	maxSelect,
	solo = true
) {
	// bouton de suppression
	const removeButton = new ButtonBuilder()
		.setStyle(ButtonStyle.Primary)
		.setLabel("Tout enlever")
		//.setEmoji("🗑")
		.setCustomId("removeRoles")
		.setDisabled(false);

	var componentsToSet = [];
	var hasButton = false;

	for (let i = 0; i < message.components.length; i++) {
		message.components[i].components.forEach((component) => {
			if (component.type === ComponentType.Button) hasButton = true;
			else
				componentsToSet.push(
					new ActionRowBuilder().addComponents([message.components[i]])
				);
		});
	}

	var array = [];
	if (!roles.match(/<@&\d+>/g)) return;
	roles.match(/<@&\d+>/g).forEach((string) => {
		let role = message.guild.roles.cache.get(string.match(/\d+/g)[0]);

		array.push({
			label: role.name,
			value: role.id,
			//emoji: role.unicodeEmoji ?? null,
			//default: false,
		});
	});

	const newComponent = new ActionRowBuilder().addComponents([
		new SelectMenuBuilder()
			.setMinValues(1)
			.setMaxValues(maxSelect)
			.setCustomId(
				!solo
					? `setRoles_${message.components.length}`
					: `addRoles_${message.components.length}`
			)
			.setPlaceholder(placeholder)
			.setDisabled(false)
			.setOptions(array),
	]);

	componentsToSet.push(newComponent);
	if (hasButton === false)
		componentsToSet.push(new ActionRowBuilder().addComponents([removeButton]));

	if (componentsToSet.length > 5)
		throw Error(
			"Vous ne pouvez pas avoir plus de 4 menus de séléction de rôles et un bouton de suppression."
		);

	await message.edit({
		content: message.content,
		components: componentsToSet,
	});
}

/**
 * It adds a button to the message that allows the user to remove all the roles from the user
 * @param {Message} message - The message object that the button will be added to.
 */
async function addRemoveButton(message) {
	const removeButton = new ButtonBuilder()
		.setStyle(ButtonStyle.Primary)
		.setLabel("Tout enlever")
		//.setEmoji("%F0%9F%97%91")
		.setCustomId("removeRoles")
		.setDisabled(false);

	var componentsToSet = actionRowstoBuilders(message.components);
	var hasButton = false;

	if (hasButton === false)
		componentsToSet.push(new ActionRowBuilder().addComponents([removeButton]));

	if (componentsToSet.length > 5)
		throw Error(
			"Vous ne pouvez pas avoir plus de 4 menus de séléction de rôles et un bouton de suppression."
		);

	console.log(componentsToSet);

	await message.edit({
		content: message.content,
		components: componentsToSet,
	});
}

/**
 * Returns true if the message has a remove button
 * @param {Message} message - The message object that was sent by the user.
 * @returns {Boolean} The function hasRemoveButton returns a boolean value.
 */
function hasRemoveButton(message) {
	const actualComponents = message.components;

	var hasButton = false;

	actualComponents.forEach((component) => {
		if (component.type === ComponentType.Button) hasButton = true;
	});

	return hasButton;
}

/**
 * It takes an array of action rows, and returns an array of action row builders
 * @param {Array<ActionRow>} actionRows - An array of objects that contain the components of the action row.
 * @returns {Array<ActionRowBuilder>} An array of ActionRowBuilders.
 */
function actionRowstoBuilders(actionRows) {
	var actionRowBuilders = [];

	actionRows.forEach((actionRow) => {
		actionRowBuilders.push(
			new ActionRowBuilder().addComponents(actionRow.components)
		);
	});

	return actionRowBuilders;
}

/**
 * Remove a row from the menu
 * @param message - The message object that was sent by the user.
 * @param index - The index of the row to remove.
 * @returns Nothing.
 */
async function removeMenuRow(message, index) {
	const all = message.components;
	all.splice(index - 1, 1);

	if (all.length <= 0 || all[0].type === "BUTTON") return message.delete();
	else {
		message.edit({
			content: message.content,
			components: actionRowstoBuilders(all),
		});
	}
}
