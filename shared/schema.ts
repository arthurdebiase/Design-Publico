import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Apps table
export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  logo: text("logo"),
  cloudinaryLogo: text("cloudinary_logo"), // Cloudinary URL for the app logo (from "importing" field in Airtable)
  type: text("type").notNull(), // Federal, Municipal, State
  category: text("category").notNull(),
  categories: text("categories").array(), // Multiple categories from the Airtable 'categories' column
  platform: text("platform").notNull(), // iOS, Android, Web, Cross-platform
  language: text("language"),
  screenCount: integer("screen_count").notNull().default(0),
  url: text("url"),
  slug: text("slug"),  // URL-friendly version of the name
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
  cloudinaryUrl: text("cloudinary_url"), // URL from Cloudinary (from "importing" field in Airtable)
  altText: text("alt_text"),  // Alt text for image accessibility
  flow: text("flow"),
  order: integer("order").notNull().default(0),
  tags: text("tags").array(),
  category: text("category"),
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

// Types
export type InsertApp = z.infer<typeof insertAppSchema>;
export type InsertScreen = z.infer<typeof insertScreenSchema>;
export type App = typeof apps.$inferSelect;
export type Screen = typeof screens.$inferSelect;
