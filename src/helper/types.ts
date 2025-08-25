import { ColorResolvable } from 'discord.js';

export enum IStatuses {
  BACKLOG = 'BACKLOG',
  TODO = 'TO DO',
  DOING = 'DOING',
  REVIEW = 'REVIEW',
  MERGE = 'MERGE',
  DONE = 'DONE',
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

export type IStatusMetaReturn = {
  color: ColorResolvable;
  emoji: string;
};

export enum IEventType {
  issue = 'issue',
  comment = 'comment'
}

export type IEventCategory = 'issue' | 'comment' | 'other';
export type IEventAction = 'created' | 'updated' | 'deleted' | 'other';
export type IEventMeta = {
  category: IEventCategory;
  action: IEventAction;
};
