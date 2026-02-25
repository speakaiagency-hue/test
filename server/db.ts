import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

type Database = ReturnType<typeof drizzle>;

let pool: Pool | null = null;
let db: Database | null = null;

/**
 * Inicializa a conexão com o banco de dados usando Drizzle + Postgres.
 * Garante singleton para evitar múltiplas conexões.
 */
export async function initializeDatabase(): Promise<Database> {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });

    db = drizzle(pool);
    console.log("✅ Database connected");
  }

  return db;
}

/**
 * Retorna a instância do banco já inicializada.
 * Se não existir, inicializa automaticamente.
 */
export async function getDatabase(): Promise<Database> {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Fecha a conexão com o banco (útil em testes ou desligamento).
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log("🛑 Database connection closed");
  }
}
