import chalk from 'chalk';
import {
  Guild,
  GuildMember,
  PermissionFlagsBits,
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import GuildDB from '../schemas/Guild';
import { GuildOption } from '../types';
import {
  IEventAction,
  IEventCategory,
  IEventMeta,
  IEventType,
  IStatuses,
  IStatusMetaReturn,
} from './types';
import mongoose from 'mongoose';

type IThemeColors = keyof typeof themeColors;

const themeColors = {
  text: '#00b3d3',
  variable: '#ff624d',
  error: '#f5426c',

  b_bl: '#81e898',
  b_todo: '#c1f2fc',
  b_doing: '#00b3d3',
  b_rev: '#9374ec',
  b_merge: '#e78a48',
  b_done: '#02bd06',

  new: '#00b3d3',
  update: '#81ec7d',
  delete: '#f5426c',
} as const;

const emojis = {
  comment_add: '<:comadd:1409489201300508714>',
  comment_del: '<:comdel:1409489532474228856>',
  comment_up: '<:comupd:1409489631342366751>',
  kanban: '<:kanban:1409490224140124231>',
  mention: '<:mention:1409489764427628636>',

  task_add: '<:taskadd:1409492835232776216>',
  task_new: '<:tasknew:1409492879054737460>',
  task_rev: '<:taskrev:1409492892904329258>',
  task_doing: '<:taskdoing:1409492866174291978>',
  merge: '<:merge:1409495682687176756>',
  task_done: '<:taskdone:1409607140112465970>',

  logo: '<:logo:1409443273797406780>',
  error: '<:error:1409618137120243862>',
};

export const getThemeColor = (color: IThemeColors) =>
  Number(`0x${themeColors[color].substring(1)}`);

export const color = (color: IThemeColors, message: any) => {
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

export const getDiscId = (username: string, pingable?: boolean): string => {
  const normalized = username.toLowerCase();
  const discId = discUserMap[normalized];
  if (!discId) return username;
  return pingable ? `<@${discId}>` : discId;
};

export const replaceWithMention = (text: string): string => {
  return text.replace(/\[~(\w+)\]/g, (_, username) => {
    const id = getDiscId(username);
    return `<@${id}>`;
  });
};

export const getContentModifierFromStatus = (
  eventType: keyof typeof IEventType,
  status: IStatuses | IEventAction
): IStatusMetaReturn => {
  console.log('💛 status: ', eventType, status);

  const defaultReturnValue = {
    emoji: emojis.error,
    color: getThemeColor('error')
  }

  // Issue event type handler
  if (eventType === IEventType.issue) {


    switch ((status as IStatuses).toLowerCase()) {
      case IStatuses.BACKLOG.toLowerCase():
        return { emoji: emojis.task_add, color: getThemeColor('b_bl') };
      case IStatuses.TODO.toLowerCase():
        return { emoji: emojis.task_new, color: getThemeColor('b_todo') };
      case IStatuses.DOING.toLowerCase():
        return { emoji: emojis.task_doing, color: getThemeColor('b_doing') };
      case IStatuses.REVIEW.toLowerCase():
        return { emoji: emojis.task_rev, color: getThemeColor('b_rev') };
      case IStatuses.MERGE.toLowerCase():
        return { emoji: emojis.merge, color: getThemeColor('b_merge') };
      case IStatuses.DONE.toLowerCase():
        return { emoji: emojis.task_done, color: getThemeColor('b_done') };
      default:
        return defaultReturnValue;
    }
  }
  // Comment event type handler
  if (eventType === IEventType.comment) {
    switch ((status as IEventAction).toLowerCase()) {
      case IStatuses.CREATED.toLowerCase():
        return { emoji: emojis.comment_add, color: getThemeColor('new') };
      case IStatuses.UPDATED.toLowerCase():
        return { emoji: emojis.comment_up, color: getThemeColor('update') };
      case IStatuses.DELETED.toLowerCase():
        return { emoji: emojis.comment_del, color: getThemeColor('delete') };
      default:
        return defaultReturnValue;
    }
  }

  return defaultReturnValue;
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
    case 'issue_created':
      category = 'issue';
      action = 'created';
      break;

    default:
      category = 'other';
      action = 'other';
  }

  return { category, action };
};