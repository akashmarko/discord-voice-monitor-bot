require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const CATEGORY_ID = "1488379740925722715";
const LOG_CHANNEL_ID = "1488706700440506499";
const PARTICIPANT_ROLE_ID = "1488371000734253166";

const joinTimers = new Map();
const cameraOffTimers = new Map();
const kickedUsers = new Set();

const leaveWarning = `
⚠️ **Hackathon Voice Room Notice**

You left your team voice room. Please **rejoin within 5 minutes** or you may be eliminated.

If you are unable to rejoin due to any issue, please **inform a moderator or the Support Team immediately**. Contact: +91 99566 94913

If you are experiencing technical problems, open a support request using <#1488244485795352667> in the **Support Center** so our team can assist you.
`;

client.on("ready", () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {

  const time = new Date().toLocaleString("en-US", {
  weekday: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata"
  });

  const logChannel = newState.guild.channels.cache.get(LOG_CHANNEL_ID);

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;
  const member = newState.member || oldState.member;

  if (!member) return;
  if (!member.roles.cache.has(PARTICIPANT_ROLE_ID)) return;

  // USER LEFT CATEGORY
  if (
    oldChannel &&
    oldChannel.parentId === CATEGORY_ID &&
    (!newChannel || newChannel.parentId !== CATEGORY_ID)
  ) {

    clearTimeout(joinTimers.get(member.id));
    joinTimers.delete(member.id);

    clearTimeout(cameraOffTimers.get(member.id));
    cameraOffTimers.delete(member.id);

    if (kickedUsers.has(member.id)) {
      kickedUsers.delete(member.id);
      return;
    }

    try {
      await member.send(leaveWarning);
    } catch {}

    // Log: left VC
    const leftVC = new EmbedBuilder()
      .setColor(0xe74c3c)//red
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
      .setDescription(`⚠️ ${member} **left voice channel** ${oldChannel}\n ${time}`)
    if (logChannel) {
      logChannel.send({ embeds: [leftVC] });
    }
  }

  // USER JOINED VC
  if (
    newChannel &&
    newChannel.parentId === CATEGORY_ID &&
    (!oldChannel || oldChannel.parentId !== CATEGORY_ID)
  ) {

    // Log: joined VC
    const joinedVC = new EmbedBuilder()
      .setColor(0x2ecc71) // green
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
      .setDescription(`${member} **joined voice channel** ${newChannel}\n ${time}`)
    if (logChannel) {
      logChannel.send({ embeds: [joinedVC] });
    }

    if (joinTimers.has(member.id)) return;

    const timer = setTimeout(() => {

      const state = member.voice;

      if (state.channel && !state.selfVideo) {

        kickedUsers.add(member.id);
        state.disconnect();

        try {
          member.send(
            `⚠️ **Hackathon Voice Room Notice**

            📷 You were removed because your **camera was not turned ON within 20 seconds**.`
          );
        } catch {}

        // Log: no camera kick
        const noCameraKick = new EmbedBuilder()
          .setColor(0xf1c40f) // yellow
          .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
          .setDescription(`📷 ${member} **was disconnected for not turning ON camera** ${state.channel}\n ${time}`)
        if (logChannel) {
          logChannel.send({ embeds: [noCameraKick] });
        }
      }

      joinTimers.delete(member.id);

    }, 20000);

    joinTimers.set(member.id, timer);
  }

  // CAMERA TURNED ON
  if (!oldState.selfVideo && newState.selfVideo) {

    clearTimeout(joinTimers.get(member.id));
    joinTimers.delete(member.id);

    clearTimeout(cameraOffTimers.get(member.id));
    cameraOffTimers.delete(member.id);

    // Log: camera on
    const cameraOn = new EmbedBuilder()
      .setColor(0x3498db) // blue
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
      .setDescription(`📷 ${member} **turned ON their camera** ${newChannel}\n ${time}`)
    if (logChannel) {
      logChannel.send({ embeds: [cameraOn] });
    }
  }

  // CAMERA TURNED OFF
  if (oldState.selfVideo && !newState.selfVideo && newChannel && newChannel.parentId === CATEGORY_ID) {

    // Log: camera off
    const cameraOff = new EmbedBuilder()
      .setColor(0xf39c12) // orange
      .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
      .setDescription(`📷 ${member} **turned OFF their camera** ${newChannel}\n ${time}`)
    if (logChannel) {
      logChannel.send({ embeds: [cameraOff] });
    }

    const timer = setTimeout(() => {

      const state = member.voice;

      if (state.channel && !state.selfVideo) {

        kickedUsers.add(member.id);
        state.disconnect();

        // log: camera off kick
        const cameraKick = new EmbedBuilder()
          .setColor(0xe67e22) // orange
          .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
          .setDescription(`📷 ${member} **was disconnected for keeping camera OFF** ${oldChannel}\n ${time}`)
        if (logChannel) {
          logChannel.send({ embeds: [cameraKick] });
        }
      }

      cameraOffTimers.delete(member.id);

    }, 20000);

    cameraOffTimers.set(member.id, timer);
  }

});

client.login(process.env.TOKEN);