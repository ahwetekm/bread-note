import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ============================================================================
// USERS TABLE
// ============================================================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  password: text('password').notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  resetTokenExpiry: integer('reset_token_expiry', { mode: 'timestamp' }),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ============================================================================
// FOLDERS TABLE (Hierarchical structure)
// ============================================================================
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: text('parent_id').references((): any => folders.id, { onDelete: 'cascade' }),
  color: text('color'),
  icon: text('icon'),
  position: integer('position').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  version: integer('version').notNull().default(1),
}, (table) => ({
  userIdIdx: index('folders_user_id_idx').on(table.userId),
  parentIdIdx: index('folders_parent_id_idx').on(table.parentId),
}));

// ============================================================================
// NOTES TABLE
// ============================================================================
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  title: text('title').notNull().default('Untitled'),
  content: text('content').notNull().default(''),
  plainText: text('plain_text').notNull().default(''),
  coverImage: text('cover_image'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  version: integer('version').notNull().default(1),
}, (table) => ({
  userIdIdx: index('notes_user_id_idx').on(table.userId),
  folderIdIdx: index('notes_folder_id_idx').on(table.folderId),
  pinnedIdx: index('notes_pinned_idx').on(table.isPinned),
  favoriteIdx: index('notes_favorite_idx').on(table.isFavorite),
  updatedAtIdx: index('notes_updated_at_idx').on(table.updatedAt),
  // SQLite FTS5 will be added later for full-text search on plainText
}));

// ============================================================================
// TAGS TABLE
// ============================================================================
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdIdx: index('tags_user_id_idx').on(table.userId),
  nameIdx: index('tags_name_idx').on(table.name),
}));

// ============================================================================
// NOTE_TAGS TABLE (Many-to-Many relationship)
// ============================================================================
export const noteTags = sqliteTable('note_tags', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  noteIdIdx: index('note_tags_note_id_idx').on(table.noteId),
  tagIdIdx: index('note_tags_tag_id_idx').on(table.tagId),
  uniqueNoteTag: index('note_tags_unique_idx').on(table.noteId, table.tagId),
}));

// ============================================================================
// TODOS TABLE (Supports subtasks via parentId self-reference)
// ============================================================================
export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  noteId: text('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: text('parent_id').references((): any => todos.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  position: integer('position').notNull().default(0),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  reminderAt: integer('reminder_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  version: integer('version').notNull().default(1),
}, (table) => ({
  userIdIdx: index('todos_user_id_idx').on(table.userId),
  noteIdIdx: index('todos_note_id_idx').on(table.noteId),
  parentIdIdx: index('todos_parent_id_idx').on(table.parentId),
  completedIdx: index('todos_completed_idx').on(table.isCompleted),
  priorityIdx: index('todos_priority_idx').on(table.priority),
}));

// ============================================================================
// SHARES TABLE (Public links and user-specific shares)
// ============================================================================
export const shares = sqliteTable('shares', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  sharedBy: text('shared_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sharedWith: text('shared_with').references(() => users.id, { onDelete: 'cascade' }),
  shareToken: text('share_token').unique(),
  permission: text('permission', { enum: ['view', 'edit'] }).notNull().default('view'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  noteIdIdx: index('shares_note_id_idx').on(table.noteId),
  sharedByIdx: index('shares_shared_by_idx').on(table.sharedBy),
  sharedWithIdx: index('shares_shared_with_idx').on(table.sharedWith),
  shareTokenIdx: index('shares_token_idx').on(table.shareToken),
}));

// ============================================================================
// NOTIFICATIONS TABLE
// ============================================================================
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['share', 'reminder', 'sync_error', 'mention', 'system']
  }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('action_url'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  typeIdx: index('notifications_type_idx').on(table.type),
}));

// ============================================================================
// SYNC_METADATA TABLE (Tracks last sync per device)
// ============================================================================
export const syncMetadata = sqliteTable('sync_metadata', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull(),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }).notNull(),
  syncVersion: integer('sync_version').notNull().default(1),
  pendingChanges: integer('pending_changes').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdIdx: index('sync_metadata_user_id_idx').on(table.userId),
  deviceIdIdx: index('sync_metadata_device_id_idx').on(table.deviceId),
  uniqueUserDevice: index('sync_metadata_unique_idx').on(table.userId, table.deviceId),
}));

// ============================================================================
// TYPE EXPORTS (for TypeScript)
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type NoteTag = typeof noteTags.$inferSelect;
export type NewNoteTag = typeof noteTags.$inferInsert;

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;
