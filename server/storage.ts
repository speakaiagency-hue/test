import { 
  type User, 
  type InsertUser, 
  users, 
  userCredits, 
  creditTransactions, 
  creditsEvents,
  pendingPurchases
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, sql } from "drizzle-orm";

let db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    db = drizzle(pool);

    // Criação das tabelas (se não existirem)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        name TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS user_credits (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        credits INTEGER NOT NULL DEFAULT 0,
        total_purchased INTEGER NOT NULL DEFAULT 0,
        total_used INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        kiwify_purchase_id TEXT,
        operation_type TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS credits_events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR NOT NULL UNIQUE,
        user_id VARCHAR NOT NULL,
        product_id VARCHAR,
        product_name TEXT,
        credits_applied INTEGER NOT NULL,
        raw_payload JSON,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pending_purchases (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        product_id TEXT,
        credits INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        used BOOLEAN DEFAULT false
      );
    `);
  }
  return db;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserAvatar(id: string, avatar: string): Promise<User | undefined>;
  updateUserProfile(id: string, data: { name: string; email: string }): Promise<User | undefined>;
  updateUserPassword(id: string, password: string): Promise<User | undefined>;
  getUserCredits(userId: string): Promise<any>;
  addCredits(userId: string, amount: number, purchaseId?: string): Promise<any>;
  deductCredits(userId: string, amount: number): Promise<any>;
  hasProcessedPurchase(purchaseId: string): Promise<any>;
  logWebhookEvent(
    purchaseId: string,
    userId: string,
    credits: number,
    productId?: string,
    productName?: string,
    rawPayload?: any
  ): Promise<void>;

  addPendingPurchase(data: { purchaseId: string; email: string; productId: string; credits: number; status: string }): Promise<void>;
  findPendingPurchasesByEmail(email: string): Promise<any[]>;
  markPendingAsUsed(purchaseId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const database = await getDb();
    const result = await database.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string) {
    const database = await getDb();
    const result = await database.select().from(users).where(eq(users.username, username.toLowerCase()));
    return result[0];
  }

  async getUserByEmail(email: string) {
    const database = await getDb();
    const normalizedEmail = email.toLowerCase();
    const result = await database.select().from(users).where(eq(users.email, normalizedEmail));
    return result[0];
  }

  async createUser(user: InsertUser) {
    const database = await getDb();
    const normalizedUser = {
      ...user,
      username: user.username.toLowerCase(),
      email: user.email?.toLowerCase(),
    };
    const result = await database.insert(users).values(normalizedUser).returning();
    const newUser = result[0];

    // Cria registro inicial de créditos
    await database.insert(userCredits).values({
      userId: newUser.id,
      credits: 0,
      totalPurchased: 0,
      totalUsed: 0,
    });

    return newUser;
  }

  async updateUserAvatar(id: string, avatar: string) {
    const database = await getDb();
    const result = await database.update(users).set({ avatar }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserProfile(id: string, data: { name: string; email: string }) {
    const database = await getDb();
    const result = await database.update(users).set({
      name: data.name,
      email: data.email.toLowerCase(),
    }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserPassword(id: string, password: string) {
    const database = await getDb();
    const result = await database.update(users).set({ password }).where(eq(users.id, id)).returning();
    return result[0];
  }

  // ✅ Créditos
  async getUserCredits(userId: string) {
    const database = await getDb();
    const result = await database.select().from(userCredits).where(eq(userCredits.userId, userId));
    return result[0];
  }

  async addCredits(userId: string, amount: number, purchaseId?: string) {
    const database = await getDb();

    const existing = await database.select().from(userCredits).where(eq(userCredits.userId, userId));
    if (existing.length === 0) {
      await database.insert(userCredits).values({
        userId,
        credits: amount,
        totalPurchased: amount,
        totalUsed: 0,
      });
    } else {
      await database.update(userCredits)
        .set({
          credits: sql`${userCredits.credits} + ${amount}`,
          totalPurchased: sql`${userCredits.totalPurchased} + ${amount}`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(userCredits.userId, userId));
    }

    await database.insert(creditTransactions).values({
      userId,
      type: "purchase",
      amount,
      description: "Créditos adicionados",
      kiwifyPurchaseId: purchaseId,
      operationType: "system",
    });
  }

  async deductCredits(userId: string, amount: number) {
    const database = await getDb();

    await database.update(userCredits)
      .set({
        credits: sql`${userCredits.credits} - ${amount}`,
        totalUsed: sql`${userCredits.totalUsed} + ${amount}`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(userCredits.userId, userId));

    await database.insert(creditTransactions).values({
      userId,
      type: "usage",
      amount,
      description: "Créditos utilizados",
      operationType: "system",
    });
  }

  async hasProcessedPurchase(purchaseId: string) {
    const database = await getDb();
    const result = await database.select().from(creditsEvents).where(eq(creditsEvents.eventId, purchaseId));
    return result.length > 0;
  }

  async logWebhookEvent(
    purchaseId: string,
    userId: string,
    credits: number,
    productId?: string,
    productName?: string,
    rawPayload?: any
  ) {
    const database = await getDb();
    await database.insert(creditsEvents).values({
      eventId: purchaseId,
      userId,
      productId,
      productName,
      creditsApplied: credits,
      rawPayload,
    });
  }

    // ✅ Compras pendentes
  async addPendingPurchase(data: { purchaseId: string; email: string; productId: string; credits: number; status: string }) {
    const database = await getDb();
    await database.insert(pendingPurchases).values({
      purchaseId: data.purchaseId,
      email: data.email.toLowerCase(), // normaliza email
      productId: data.productId,
      credits: data.credits,
      status: data.status,
    });
  }

  async findPendingPurchasesByEmail(email: string) {
    const database = await getDb();
    const normalizedEmail = email.toLowerCase();
    const result = await database
      .select()
      .from(pendingPurchases)
      .where(eq(pendingPurchases.email, normalizedEmail))
      .where(eq(pendingPurchases.used, false));
    return result;
  }

  async markPendingAsUsed(purchaseId: string) {
    const database = await getDb();
    await database
      .update(pendingPurchases)
      .set({ used: true })
      .where(eq(pendingPurchases.purchaseId, purchaseId));
  }
}

export const storage = new DatabaseStorage();
