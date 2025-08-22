export enum IStatuses {
  BACKLOG = 'BACKLOG',
  TODO = 'TO DO',
  DOING = 'DOING',
  REVIEW = 'REVIEW',
  MERGE = 'MERGE',
  DONE = 'DONE',
}

export enum IEventType {
  comment = 'comment',
  issue = 'issue',
}

export type IEventCategory = 'issue' | 'comment' | 'other';
export type IEventAction = 'created' | 'updated' | 'deleted' | 'other';
export type IEventMeta = {
  category: IEventCategory;
  action: IEventAction;
};
