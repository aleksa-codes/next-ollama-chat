import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const chatsTable = sqliteTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  model: text('model').notNull(),
  messages: text('messages').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const preferencesTable = sqliteTable('preferences', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
