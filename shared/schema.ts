import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Apps table
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  logo: text("logo"),
  type: text("type").notNull(), // Federal, Municipal, State
  category: text("category").notNull(),
  platform: text("platform").notNull(), // iOS, Android, Web, Cross-platform
  language: text("language"),
  screenCount: integer("screen_count").notNull().default(0),
  url: text("url"),
  airtableId: text("airtable_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Screens table
export const screens = pgTable("screens", {
  id: serial("id").primaryKey(),
  appId: integer("app_id").notNull().references(() => apps.id),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  flow: text("flow"),
  order: integer("order").notNull().default(0),
  airtableId: text("airtable_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertAppSchema = createInsertSchema(apps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScreenSchema = createInsertSchema(screens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type InsertApp = z.infer<typeof insertAppSchema>;
export type InsertScreen = z.infer<typeof insertScreenSchema>;
export type App = typeof apps.$inferSelect;
export type Screen = typeof screens.$inferSelect;
export type User = typeof users.$inferSelect;

// Upsert user type
export type UpsertUser = typeof users.$inferInsert;
