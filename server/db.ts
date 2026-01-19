import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

// Database connection singleton
let db: ReturnType<typeof drizzle> | null = null;
let pool: pg.Pool | null = null;

/**
 * Initialize database connection
 * Returns null if DATABASE_URL is not set (allows app to run without DB in dev mode)
 */
export function getDb() {
  if (db) return db;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn("[DB] DATABASE_URL not set - running without database");
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      // Production-ready pool configuration
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds when connecting
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false } // Required for most cloud providers
        : undefined,
    });

    // Handle pool errors
    pool.on("error", (err: Error) => {
      console.error("[DB] Unexpected pool error:", err);
    });

    db = drizzle(pool, { schema });
    console.log("[DB] Database connection established");
    return db;
  } catch (error) {
    console.error("[DB] Failed to connect to database:", error);
    return null;
  }
}

/**
 * Close database connection (for graceful shutdown)
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log("[DB] Database connection closed");
  }
}

/**
 * Check if database is available
 */
export function isDbAvailable(): boolean {
  return db !== null;
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  const database = getDb();
  if (!database) return false;

  try {
    // Simple query to test connection
    await pool!.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("[DB] Connection test failed:", error);
    return false;
  }
}

// Export schema for use in queries
export { schema };
