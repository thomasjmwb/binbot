import { Client, GatewayIntentBits, PermissionFlagsBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Bot token from Discord Developer Portal
const TOKEN = process.env.DISCORD_BOT_TOKEN;

const clientReady = new Promise((resolve) => {
  client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    resolve(client);
  });
});

// Login to Discord with your bot token
client.login(TOKEN);

export async function sendAnnouncementToDiscord(message) {
  const readyClient = await clientReady;
  const channel = readyClient.channels.cache.get(
    process.env.DISCORD_NOTIFICATION_CHANNEL_ID
  );
  if (
    channel &&
    channel
      .permissionsFor(readyClient.user)
      .has(PermissionFlagsBits.MentionEveryone)
  ) {
    return channel.send(`@everyone ${message}`);
  }
  return Promise.reject(new Error("Channel not found or missing permissions"));
}
