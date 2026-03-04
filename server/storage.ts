import { eq } from "drizzle-orm";
import { getDb, schema, isDbAvailable } from "./db";
import { type User, type InsertUser, users } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for CRUD operations
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
}

// PostgreSQL Database Storage
export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return result[0];
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(users).where(eq(users.appleId, appleId)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase(),
    }).returning();

    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
}

// In-Memory Storage (fallback for development without database)
export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user as any).appleId === appleId
    );
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user as any).googleId === googleId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      email: insertUser.email.toLowerCase(),
      password: insertUser.password ?? null,
      role: insertUser.role || "customer",
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      phone: insertUser.phone || null,
      avatarUrl: insertUser.avatarUrl || null,
      appleId: (insertUser as any).appleId || null,
      googleId: (insertUser as any).googleId || null,
      authProvider: (insertUser as any).authProvider || "email",
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Helper method to get all users (for debugging)
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

// Create storage instance based on environment
let _storage: IStorage | null = null;

function createStorage(): IStorage {
  // Always try database first in production
  if (process.env.NODE_ENV === "production") {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production");
    }
    console.log("[Storage] Using PostgreSQL database storage");
    return new DbStorage();
  }

  // In development, try database if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    console.log("[Storage] Using PostgreSQL database storage (development)");
    return new DbStorage();
  }

  console.log("[Storage] Using in-memory storage (development mode)");
  return new MemStorage();
}

/**
 * Switch to in-memory storage fallback.
 * Called by server startup when DB connection test fails in development.
 */
export function fallbackToMemStorage() {
  if (_storage instanceof MemStorage) return;
  console.log("[Storage] Falling back to in-memory storage (database unreachable)");
  _storage = new MemStorage();
}

_storage = createStorage();

export const storage: IStorage = new Proxy({} as IStorage, {
  get(_target, prop) {
    return (_storage as any)[prop];
  },
});
