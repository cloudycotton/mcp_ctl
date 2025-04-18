import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  description: text("description"),
  repository: text("repository"),
  maintainer: text("maintainer"),
  meta: jsonb("meta").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
