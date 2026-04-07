require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

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

const timers = new Map();

const warningMessage = `

⚠️ **Hackathon Voice Room Notice**

You left your team voice room. Please **rejoin within 5 minutes** or you may be eliminated.

If you are unable to rejoin due to any issue, please **inform a moderator or the Support Team immediately**. Contact: +91 99566 94913

If you are experiencing technical problems, open a support request using **#open-ticket** in the **Support Center** so our team can assist you.`;

client.on("ready", () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {

  const logChannel = newState.guild.channels.cache.get(LOG_CHANNEL_ID);

  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  const member = newState.member || oldState.member;

  if (!member) return;
  if (!member.roles.cache.has(PARTICIPANT_ROLE_ID)) return;

  // USER LEFT CATEGORY COMPLETELY
  if (
    oldChannel &&
    oldChannel.parentId === CATEGORY_ID &&
    (!newChannel || newChannel.parentId !== CATEGORY_ID)
  ) {

    // clear camera timer
    const timer = timers.get(member.id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(member.id);
    }

    // DM warning
    try {
      await member.send(warningMessage);
    } catch {}

    // log
    if (logChannel) {
      logChannel.send(
        `⚠️ ${member} left **${oldChannel.name}**.`,
      );
    }
  }

  // USER JOINED TEAM VOICE CHANNEL
  if (
    newChannel &&
    newChannel.parentId === CATEGORY_ID &&
    (!oldChannel || oldChannel.parentId !== CATEGORY_ID)
  ) {

    // prevent duplicate timers
    if (timers.has(member.id)) return;

    const timer = setTimeout(() => {

      const state = member.voice;

      if (state.channel && !state.selfVideo) {

        state.disconnect();

        if (logChannel) {
          logChannel.send(
            `📷 ${member} was disconnected from **${state.channel.name}** for not turning ON camera.`,
          );
        }

      }

      timers.delete(member.id);

    }, 20000);

    timers.set(member.id, timer);
  }

  // CAMERA TURNED ON
  if (!oldState.selfVideo && newState.selfVideo) {

    const timer = timers.get(member.id);

    if (timer) {
      clearTimeout(timer);
      timers.delete(member.id);

      if (logChannel) {
        logChannel.send(
          `📷 ${member} turned ON their camera.`,
        );
      }
    }
  }

});

client.login(process.env.TOKEN);