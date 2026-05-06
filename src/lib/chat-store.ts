import { desc, eq } from 'drizzle-orm';

import type { Chat } from '@/lib/chat';
import { db, ensureDatabase } from '@/lib/db';
import { chatsTable, preferencesTable } from '@/lib/db/schema';
import { LocalAIProvider, resolveLocalAIProvider } from '@/lib/local-ai';

const SELECTED_MODEL_PREFERENCE_KEY = 'selected-model';
const SELECTED_PROVIDER_PREFERENCE_KEY = 'selected-provider';

function parseMessages(messages: string): Chat['messages'] {
  try {
    return JSON.parse(messages) as Chat['messages'];
  } catch {
    return [];
  }
}

function mapChatRow(row: typeof chatsTable.$inferSelect): Chat {
  return {
    id: row.id,
    title: row.title,
    messages: parseMessages(row.messages),
    model: row.model,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listChats(): Chat[] {
  ensureDatabase();

  return db.select().from(chatsTable).orderBy(desc(chatsTable.updatedAt)).all().map(mapChatRow);
}

export function upsertChat(chat: Chat): Chat {
  ensureDatabase();

  db.insert(chatsTable)
    .values({
      id: chat.id,
      title: chat.title,
      model: chat.model,
      messages: JSON.stringify(chat.messages),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    })
    .onConflictDoUpdate({
      target: chatsTable.id,
      set: {
        title: chat.title,
        model: chat.model,
        messages: JSON.stringify(chat.messages),
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
    })
    .run();

  return chat;
}

export function removeChat(chatId: string) {
  ensureDatabase();

  db.delete(chatsTable).where(eq(chatsTable.id, chatId)).run();
}

export function getSelectedModel(): string | null {
  ensureDatabase();

  const [preference] = db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.key, SELECTED_MODEL_PREFERENCE_KEY))
    .limit(1)
    .all();

  return preference?.value ?? null;
}

export function setSelectedModel(selectedModel: string | null) {
  ensureDatabase();

  if (!selectedModel) {
    db.delete(preferencesTable).where(eq(preferencesTable.key, SELECTED_MODEL_PREFERENCE_KEY)).run();
    return null;
  }

  const updatedAt = Date.now();

  db.insert(preferencesTable)
    .values({
      key: SELECTED_MODEL_PREFERENCE_KEY,
      value: selectedModel,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: preferencesTable.key,
      set: {
        value: selectedModel,
        updatedAt,
      },
    })
    .run();

  return selectedModel;
}

export function getSelectedProvider(): LocalAIProvider {
  ensureDatabase();

  const [preference] = db
    .select()
    .from(preferencesTable)
    .where(eq(preferencesTable.key, SELECTED_PROVIDER_PREFERENCE_KEY))
    .limit(1)
    .all();

  return resolveLocalAIProvider(preference?.value);
}

export function setSelectedProvider(provider: LocalAIProvider) {
  ensureDatabase();

  const updatedAt = Date.now();

  db.insert(preferencesTable)
    .values({
      key: SELECTED_PROVIDER_PREFERENCE_KEY,
      value: provider,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: preferencesTable.key,
      set: {
        value: provider,
        updatedAt,
      },
    })
    .run();

  return provider;
}
