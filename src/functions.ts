import chalk from 'chalk';
import {
  Guild,
  GuildMember,
  PermissionFlagsBits,
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import GuildDB from './schemas/Guild';
import { GuildOption } from './types';
import { IEventAction, IEventCategory, IEventMeta, IEventType, IStatuses } from './helper/types';
import mongoose from 'mongoose';

type colorType = 'text' | 'variable' | 'error';

const themeColors = {
  text: '#ff8e4d',
  variable: '#ff624d',
  error: '#f5426c',
};

export const getThemeColor = (color: colorType) => Number(`0x${themeColors[color].substring(1)}`);

export const color = (color: colorType, message: any) => {
  return chalk.hex(themeColors[color])(message);
};

export const checkPermissions = (member: GuildMember, permissions: Array<PermissionResolvable>) => {
  let neededPermissions: PermissionResolvable[] = [];
  permissions.forEach((permission) => {
    if (!member.permissions.has(permission)) neededPermissions.push(permission);
  });
  if (neededPermissions.length === 0) return null;
  return neededPermissions.map((p) => {
    if (typeof p === 'string') return p.split(/(?=[A-Z])/).join(' ');
    else
      return Object.keys(PermissionFlagsBits)
        .find((k) => Object(PermissionFlagsBits)[k] === p)
        ?.split(/(?=[A-Z])/)
        .join(' ');
  });
};

export const sendTimedMessage = (message: string, channel: TextChannel, duration: number) => {
  channel
    .send(message)
    .then((m) => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration));
  return;
};

export const getGuildOption = async (guild: Guild, option: GuildOption) => {
  if (mongoose.connection.readyState === 0) throw new Error('Database not connected.');
  let foundGuild = await GuildDB.findOne({ guildID: guild.id });
  if (!foundGuild) return null;
  return foundGuild.options[option];
};

export const setGuildOption = async (guild: Guild, option: GuildOption, value: any) => {
  if (mongoose.connection.readyState === 0) throw new Error('Database not connected.');
  let foundGuild = await GuildDB.findOne({ guildID: guild.id });
  if (!foundGuild) return null;
  foundGuild.options[option] = value;
  foundGuild.save();
};

export const discUserMap: Record<string, string> = {
  sylvester: '413755451373518864',
  oscar: '1402211230709710940',
  pinto: '569117240461492224',
  gerard: '881799522290892832',
  jerold: '790562807149887508',
  hilpert: '727170736866852975',
};

export function getDiscId(username: string, pingable?: boolean): string {
  const normalized = username.toLowerCase();
  const discId = discUserMap[normalized];
  if (!discId) return username;
  return pingable ? `<@${discId}>` : discId;
}

export const getStatusMeta = (status: IStatuses) => {
  switch (status) {
    case IStatuses.BACKLOG:
      return { emoji: '🗂️', color: 'gray' };
    case IStatuses.TODO:
      return { emoji: '📝', color: 'blue' };
    case IStatuses.DOING:
      return { emoji: '🔄', color: 'orange' };
    case IStatuses.REVIEW:
      return { emoji: '👀', color: 'purple' };
    case IStatuses.MERGE:
      return { emoji: '🔀', color: 'teal' };
    case IStatuses.DONE:
      return { emoji: '✅', color: 'green' };
  }
};

export const returnIssueCategory = (eventType: string): IEventMeta => {
  let category: IEventCategory = 'other';
  let action: IEventAction = 'other';

  switch (eventType) {
    // Comment events
    case 'issue_commented':
      category = 'comment';
      action = 'created';
      break;
    case 'issue_comment_edited':
      category = 'comment';
      action = 'updated';
      break;
    case 'issue_comment_deleted':
      category = 'comment';
      action = 'deleted';
      break;

    // Issue events
    case 'issue_generic':
      category = 'issue';
      action = 'updated';
      break;

    default:
      category = 'other';
      action = 'other';
  }

  return { category, action };
};
