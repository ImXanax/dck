import { ChannelType, Message, EmbedBuilder } from 'discord.js';
import { checkPermissions, getGuildOption, sendTimedMessage } from '../helper/functions';
import { BotEvent } from '../types';
import mongoose from 'mongoose';

const event: BotEvent = {
  name: 'messageCreate',
  execute: async (message: Message) => {
    // Ignore bots
    if (message.author.bot) return;

    console.log('✔ out: ', message);
    // ----- DM Logging -----
    if (!message.guild) {
      console.log('✔ message: ', message.content);
      const logChannelId = process.env.CHANNEL_ID;
      if (!logChannelId) return;

      const logChannel = await message.client.channels.fetch(logChannelId).catch(() => null);
      if (!logChannel || !logChannel.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setTitle('New DM Received')
        .setColor('Blue')
        .setThumbnail(message.author.displayAvatarURL())
        .addFields(
          { name: 'User', value: `${message.author.tag} (${message.author.id})` },
          { name: 'Message', value: message.content || '[No Text Content]' }
        )
        .setTimestamp();

      logChannel.send({ embeds: [embed] });
      console.log(`[DM] ${message.author.tag}: ${message.content}`);
      return; // Stop further processing for DMs
    }

    // ----- Guild Message Handling -----
    if (!message.member) return;

    let prefix = process.env.PREFIX;
    if (mongoose.connection.readyState === 1) {
      const guildPrefix = await getGuildOption(message.guild, 'prefix');
      if (guildPrefix) prefix = guildPrefix;
    }

    if (!message.content.startsWith(prefix)) return;
    if (message.channel.type !== ChannelType.GuildText) return;

    const args = message.content.substring(prefix.length).split(' ');
    let command = message.client.commands.get(args[0]);

    if (!command) {
      const commandFromAlias = message.client.commands.find((cmd) => cmd.aliases.includes(args[0]));
      if (commandFromAlias) command = commandFromAlias;
      else return;
    }

    const cooldown = message.client.cooldowns.get(
      `${command.name}-${message.member.user.username}`
    );
    const neededPermissions = checkPermissions(message.member, command.permissions);
    if (neededPermissions !== null)
      return sendTimedMessage(
        `You don't have enough permissions to use this command.\nNeeded permissions: ${neededPermissions.join(', ')}`,
        message.channel,
        5000
      );

    if (command.cooldown && cooldown) {
      if (Date.now() < cooldown) {
        sendTimedMessage(
          `You have to wait ${Math.floor(Math.abs(Date.now() - cooldown) / 1000)} second(s) to use this command again.`,
          message.channel,
          5000
        );
        return;
      }
      message.client.cooldowns.set(
        `${command.name}-${message.member.user.username}`,
        Date.now() + command.cooldown * 1000
      );
      setTimeout(() => {
        message.client.cooldowns.delete(`${command?.name}-${message.member?.user.username}`);
      }, command.cooldown * 1000);
    } else if (command.cooldown && !cooldown) {
      message.client.cooldowns.set(
        `${command.name}-${message.member.user.username}`,
        Date.now() + command.cooldown * 1000
      );
    }

    command.execute(message, args);
  },
};

export default event;
