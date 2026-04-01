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

const warningMessage = `⚠️ **Hackathon Voice Room Notice**

You left your team voice room. Please **rejoin within 5 minutes** or you may be eliminated.

If you are unable to rejoin due to any issue, please **inform a moderator or the Support Team immediately**.

If you are experiencing technical problems, open a support request using **#open-ticket** in the **Support Center** so our team can assist you.`

client.on("ready", () => {
  console.log(`Bot is online as ${client.user.tag}`);
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  const oldChannel = oldState.channel;

  if (!oldChannel) return;

  // check if channel is inside the category
  if (
    oldChannel.parentId === CATEGORY_ID &&
    newState.channelId !== oldState.channelId
  ) {
    const member = oldState.member;

    // check participant role
    if (!member.roles.cache.has(PARTICIPANT_ROLE_ID)) return;

    // DM warning
    try {
      await member.send(warningMessage);
    } catch {}

    // log message
    const logChannel = oldState.guild.channels.cache.get(LOG_CHANNEL_ID);

    if (logChannel) {
      logChannel.send(
        `⚠️ **${member.user.username}** left **${oldChannel.name}**.`,
      );
    }
  }
});

client.login(
  "MTQ4ODcyNzQ5NzU5OTM1MzAwMw.GuXkwF.mFfI-LG5gJtdt06aj7AHNc5eNu-uVzIqqA9me4",
);
