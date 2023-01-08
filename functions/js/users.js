const Discord = require("discord.js");
const { correctEpoch } = require("./other");

module.exports = {
	getCreation(user) {
		const date = Date.parse(user.createdAt).toString();

		const timestamp = correctEpoch(date);
		return timestamp;
	},

	getJoined(member) {
		const timestamp = correctEpoch(member.guild.joinedTimestamp);
		return timestamp;
	},

	async getSpotify(user, channel, image = false) {
		if (!user.presence || typeof user.presence == "undefined")
			return console.error("No presences");
		await user.presence.activities.forEach(async (activity) => {
			if (
				activity.type === "LISTENING" &&
				activity.name === "Spotify" &&
				activity.assets !== null
			) {
				console.log(activity.timestamps);
				let trackIMG = `https://i.scdn.co/image/${activity.assets.largeImage.slice(
					8
				)}`;
				let trackURL = `https://open.spotify.com/track/${activity.syncId}`;

				let trackName = activity.details;
				let trackAuthor = activity.state;
				let trackAlbum = activity.assets.largeText;
				let trackStart = activity.timestamps.start;
				let trackEnd = activity.timestamps.end;

				trackAuthor = trackAuthor.replace(/;/g, ",");

				const spotifyBtn = new Discord.MessageButton()
					.setURL(trackURL)
					.setStyle("LINK")
					.setLabel(`Listen to ${trackName} on Spotify`);

				const spotifyBtns = new Discord.MessageActionRow().addComponents([
					spotifyBtn,
				]);

				if (image === false) {
					const spotifyEmbed = new Discord.MessageEmbed()
						.setAuthor(`${user.user.username} on Spotify`, "", trackURL)
						.setColor("#1DB954")
						.setThumbnail(trackIMG)
						.addField("Playing:", `__${trackName}__`, true)
						.addField("Artists:", `__${trackAuthor}__`, true)
						.addField("Album Name:", `__${trackAlbum}__`, true)
						.addField(
							"Started",
							`<t:${correctEpoch(await this.humanTimeToEpoch(trackStart))}:R>`,
							true
						)
						.addField(
							"Ending",
							`<t:${correctEpoch(await this.humanTimeToEpoch(trackEnd))}:R>`,
							true
						);

					return channel.send({
						embeds: [spotifyEmbed],
						components: [spotifyBtns],
					});
				} else if (image === true) {
					const card = new canvacord.Spotify()
						.setAuthor(trackAuthor)
						.setAlbum(trackAlbum)
						.setStartTimestamp(this.humanTimeToEpoch(trackStart, false))
						.setEndTimestamp(this.humanTimeToEpoch(trackEnd, false))
						.setImage(trackIMG)
						.setTitle(trackName);

					card.build().then((buffer) => {
						/* const spotifyIMG = */ canvacord.write(
							buffer,
							"assets/spotify.png"
						);
						const img = new Discord.MessageAttachment().setFile(
							"assets/spotify.png"
						);
						channel.send({ files: [img], components: [spotifyBtns] });
					});
				} else {
					console.error('Unknown "image" value');
				}
			}
		});
	},

	async getLastPresence(user, i = 0) {
		if (
			user.presence == null ||
			user.presence.id === "custom" ||
			user.presence == undefined ||
			user.presence?.activities == undefined
		)
			return console.error("No presences");
		activity = await user.presence.activities[i];
		if (activity == undefined) return console.error("No presences");
		if (!activity.timestamps) {
			const infos = {
				title: activity.name,
				type: activity.type,
				subtitle: activity.details,
				subsubtitle: activity.state,
				created: activity.createdTimestamp,
				timestamps: null,
			};
			return infos;
		} else if (
			activity.timestamps.start !== null &&
			activity.timestamps.end !== null
		) {
			const infos = {
				title: activity.name,
				type: activity.type,
				subtitle: activity.details,
				subsubtitle: activity.state,
				created: activity.createdTimestamp,
				timestamps: {
					start: activity.timestamps.start,
					end: activity.timestamps.end,
				},
			};
			return infos;
		} else if (
			activity.timestamps.start !== null &&
			activity.timestamps.end == null
		) {
			const infos = {
				title: activity.name,
				type: activity.type,
				subtitle: activity.details,
				subsubtitle: activity.state,
				created: activity.createdTimestamp,
				timestamps: {
					start: activity.timestamps.start,
					end: null,
				},
			};
			return infos;
		} else if (activity.timestamps == null) {
			const infos = {
				title: activity.name,
				type: activity.type,
				subtitle: activity.details,
				subsubtitle: activity.state,
				created: activity.createdTimestamp,
				timestamps: {
					start: null,
					end: activity.timestamps.end,
				},
			};
			return infos;
		}
	},

	async getBadges(user) {
		/*
        VERIFIED_BOT
        HOUSE_BRAVERY
        HOUSE_BALANCE
        HOUSE_BRILLIANCE
        DISCORD_EMPLOYEE
        PARTNERED_SERVER_OWNER
        HYPESQUAD_EVENTS
        BUGHUNTER_LEVEL_1
        BUGHUNTER_LEVEL_2
        EARLY_SUPPORTER
        TEAM_USER
        EARLY_VERIFIED_BOT_DEVELOPER
        DISCORD_CERTIFIED_MODERATOR
        */

		const badges = user.user.flags || (await user.fetchFlags());
		r = "";

		badges.toArray().forEach((badge) => {
			badge = this.setFirstCap(badge.toString().replace("_", " "));
			r = `${r}${badge}\n`;
		});
		return r;
	},
};
