import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------- USERS ----------------
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name"),
  avatar: text("avatar"),
  status: text("status").default("active"),
});

// ---------------- USER CREDITS ----------------
export const userCredits = pgTable("user_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  credits: integer("credits").default(0).notNull(),
  totalPurchased: integer("total_purchased").default(0).notNull(),
  totalUsed: integer("total_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ---------------- CREDIT TRANSACTIONS ----------------
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // "purchase", "usage", "refund", "admin"
  amount: integer("amount").notNull(),
  description: text("description"),
  kiwifyPurchaseId: text("kiwify_purchase_id"),
  operationType: text("operation_type"), // "chat", "image", "prompt", "video"
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------------- CREDITS EVENTS (idempotência) ----------------
export const creditsEvents = pgTable("credits_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().unique(), // purchase_id da Kiwify
  userId: varchar("user_id").notNull(),
  productId: varchar("product_id"),
  productName: text("product_name"),
  creditsApplied: integer("credits_applied").notNull(),
  rawPayload: json("raw_payload"), // guarda payload bruto para auditoria
  createdAt: timestamp("created_at").defaultNow(),
});

// ---------------- PENDING PURCHASES ----------------
export const pendingPurchases = pgTable("pending_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseId: text("purchase_id").notNull().unique(),
  email: text("email").notNull(),
  productId: text("product_id"),
  credits: integer("credits").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  used: boolean("used").default(false),
});

// ---------------- SCHEMAS ----------------
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// ---------------- TYPES ----------------
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserCredits = typeof userCredits.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type CreditEvent = typeof creditsEvents.$inferSelect;
export type PendingPurchase = typeof pendingPurchases.$inferSelect;
