import {
  Client,
  GatewayIntentBits,
  Collection,
  PermissionFlagsBits,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { Command, SlashCommand } from './types';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';
import express from 'express';
import jiraRoutes from './routes/jira';

config();
const { Guilds, MessageContent, GuildMessages, GuildMembers } = GatewayIntentBits;
const client = new Client({ intents: [Guilds, MessageContent, GuildMessages, GuildMembers] });

client.slashCommands = new Collection<string, SlashCommand>();
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, number>();

const handlersDir = join(__dirname, './handlers');
readdirSync(handlersDir).forEach((handler) => {
  if (!handler.endsWith('.js')) return;
  require(`${handlersDir}/${handler}`)(client);
});

client.once('ready', () => {
  const channelId = process.env.CHANNEL_ID;

  if (!channelId) {
    console.error(`❌ Could not find channel with ID: ${channelId}`);
    return;
  }
  const channel = client.channels.cache.get(channelId) as TextChannel;
  if (!channel) {
    console.error(`❌ Could not find channel: ${channel}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('Bot Status')
    .setDescription('✅ The bot is now **online** and ready to go!')
    .setColor('Green')
    .setTimestamp()
    .setFooter({ text: `Bot started at`, iconURL: client.user?.displayAvatarURL() || undefined });

  console.log('✅ Bot is running');
  channel.send({ embeds: [embed] });
});

const app = express();
app.use(express.json());
app.use('/bot', jiraRoutes(client));
// app.use("/bot",gitlabRoutes(client))

// start express server
app.listen(3000, () => {
  console.log('🚀 Jira online');
});

client.login(process.env.TOKEN);
