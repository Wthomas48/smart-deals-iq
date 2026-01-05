import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import {
  registerUserSchema,
  loginUserSchema,
  type SafeUser,
  type UserRole,
} from "../shared/schema";

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = 12;

// Token payload type
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// User type
interface StoredUser {
  id: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ===========================================
// PERSISTENT FILE-BASED USER STORAGE
// ===========================================
const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("[Auth] Created data directory:", DATA_DIR);
  }
}

// Load users from file
function loadUsers(): Map<string, StoredUser> {
  ensureDataDir();

  if (!fs.existsSync(USERS_FILE)) {
    console.log("[Auth] No users file found, starting fresh");
    return new Map();
  }

  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    const usersArray: StoredUser[] = JSON.parse(data);
    const usersMap = new Map<string, StoredUser>();

    for (const user of usersArray) {
      usersMap.set(user.id, user);
    }

    console.log(`[Auth] Loaded ${usersMap.size} users from storage`);
    return usersMap;
  } catch (error) {
    console.error("[Auth] Failed to load users:", error);
    return new Map();
  }
}

// Save users to file
function saveUsers() {
  ensureDataDir();

  try {
    const usersArray = Array.from(users.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersArray, null, 2));
    console.log(`[Auth] Saved ${usersArray.length} users to storage`);
  } catch (error) {
    console.error("[Auth] Failed to save users:", error);
  }
}

// Initialize users from persistent storage
const users = loadUsers();

// Refresh tokens store (in-memory is fine for these)
const refreshTokens = new Set<string>();

// ===========================================
// SEED DEMO USERS (if not already present)
// ===========================================
const DEMO_PASSWORD_HASH = "$2b$12$.7Crer35kc5rc0m/xU2GseW9RmllvnfDAj/JiLxrhFwX2e.rJclL6"; // demo1234

async function seedDemoUsers() {
  const now = new Date().toISOString();
  let needsSave = false;

  // Demo customer
  if (!Array.from(users.values()).some(u => u.email === "customer@demo.com")) {
    users.set("demo_customer_1", {
      id: "demo_customer_1",
      email: "customer@demo.com",
      username: "democustomer",
      password: DEMO_PASSWORD_HASH,
      role: "customer",
      firstName: "Demo",
      lastName: "Customer",
      phone: undefined,
      avatarUrl: undefined,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: undefined,
    });
    needsSave = true;
  }

  // Demo vendor
  if (!Array.from(users.values()).some(u => u.email === "vendor@demo.com")) {
    users.set("demo_vendor_1", {
      id: "demo_vendor_1",
      email: "vendor@demo.com",
      username: "demovendor",
      password: DEMO_PASSWORD_HASH,
      role: "vendor",
      firstName: "Demo",
      lastName: "Vendor",
      phone: undefined,
      avatarUrl: undefined,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: undefined,
    });
    needsSave = true;
  }

  if (needsSave) {
    saveUsers();
    console.log("[Auth] Demo users seeded: customer@demo.com, vendor@demo.com (password: demo1234)");
  } else {
    console.log("[Auth] Demo users already exist");
  }
}

// Seed demo users on startup
seedDemoUsers();

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" } as any);
  refreshTokens.add(refreshToken);
  return { accessToken, refreshToken };
}

function sanitizeUser(user: StoredUser): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser as unknown as SafeUser;
}

// ===========================================
// MIDDLEWARE
// ===========================================

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      req.user = decoded;
    } catch {
      // Token invalid, continue without user
    }
  }

  next();
}

// ===========================================
// AUTH ROUTES
// ===========================================

export function registerAuthRoutes(app: Express) {
  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerUserSchema.parse(req.body);

      // Check if email already exists
      const existingEmail = Array.from(users.values()).find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase()
      );
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Check if username already exists
      const existingUsername = Array.from(users.values()).find(
        (u) => u.username.toLowerCase() === data.username.toLowerCase()
      );
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newUser: StoredUser = {
        id: userId,
        email: data.email.toLowerCase(),
        username: data.username,
        password: hashedPassword,
        role: data.role as UserRole,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: undefined,
        avatarUrl: undefined,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };

      users.set(userId, newUser);
      saveUsers(); // Persist to file

      // Generate tokens
      const tokens = generateTokens({
        userId,
        email: newUser.email,
        role: newUser.role,
      });

      console.log(`[Auth] New user registered: ${newUser.email} (${newUser.role})`);

      res.status(201).json({
        message: "Registration successful",
        user: sanitizeUser(newUser),
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login (with auto-registration for new users)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginUserSchema.parse(req.body);
      // Get role from request body (optional, defaults based on context)
      const requestedRole = (req.body.role as UserRole) || "customer";

      console.log(`[Auth] Login attempt for: ${data.email}`);

      // Find user by email
      let user = Array.from(users.values()).find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase()
      );

      if (!user) {
        // Auto-register new user with provided credentials
        console.log(`[Auth] User not found, auto-registering: ${data.email}`);

        const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const username = data.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

        user = {
          id: userId,
          email: data.email.toLowerCase(),
          username: username || `user_${Date.now()}`,
          password: hashedPassword,
          role: requestedRole,
          firstName: username,
          lastName: undefined,
          phone: undefined,
          avatarUrl: undefined,
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
        };

        users.set(userId, user);
        saveUsers();
        console.log(`[Auth] Auto-registered new user: ${user.email} (${user.role})`);
      } else {
        // Existing user - verify password
        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
          console.log(`[Auth] Invalid password for: ${data.email}`);
          return res.status(401).json({ error: "Invalid email or password" });
        }

        // Update last login
        user.lastLoginAt = new Date().toISOString();
        users.set(user.id, user);
        saveUsers();
      }

      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      console.log(`[Auth] Login successful: ${user.email} (${user.role})`);

      res.json({
        message: "Login successful",
        user: sanitizeUser(user),
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Refresh token
  app.post("/api/auth/refresh", (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    if (!refreshTokens.has(refreshToken)) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;

      // Remove old refresh token
      refreshTokens.delete(refreshToken);

      // Generate new tokens
      const tokens = generateTokens({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      res.json(tokens);
    } catch {
      refreshTokens.delete(refreshToken);
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  });

  // Logout
  app.post("/api/auth/logout", authMiddleware, (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }

    res.json({ message: "Logged out successfully" });
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, (req: Request, res: Response) => {
    const user = users.get(req.user!.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: sanitizeUser(user) });
  });

  // Update profile
  app.put("/api/auth/profile", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = users.get(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { firstName, lastName, phone, username } = req.body;

      // Check username uniqueness if changing
      if (username && username !== user.username) {
        const existingUsername = Array.from(users.values()).find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== user.id
        );
        if (existingUsername) {
          return res.status(400).json({ error: "Username already taken" });
        }
        user.username = username;
      }

      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phone !== undefined) user.phone = phone;
      user.updatedAt = new Date().toISOString();

      users.set(user.id, user);
      saveUsers(); // Persist to file

      res.json({
        message: "Profile updated",
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change password
  app.post("/api/auth/change-password", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new password required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const user = users.get(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash and update new password
      user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      user.updatedAt = new Date().toISOString();
      users.set(user.id, user);
      saveUsers(); // Persist to file

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Delete account
  app.delete("/api/auth/account", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password required to delete account" });
      }

      const user = users.get(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      // Delete user
      users.delete(user.id);
      saveUsers(); // Persist to file

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Check if email exists
  app.get("/api/auth/check-email/:email", (req: Request, res: Response) => {
    const { email } = req.params;
    const exists = Array.from(users.values()).some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    res.json({ exists });
  });

  // Check if username exists
  app.get("/api/auth/check-username/:username", (req: Request, res: Response) => {
    const { username } = req.params;
    const exists = Array.from(users.values()).some(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    res.json({ exists });
  });

  // Reset password (for users who forgot their password)
  // In production, this should send an email with a reset link
  // For development/demo, we allow direct password reset
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ error: "Email and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Find user by email
      const user = Array.from(users.values()).find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        // Don't reveal if email exists or not for security
        // But return success to prevent email enumeration attacks
        console.log(`[Auth] Password reset attempted for non-existent email: ${email}`);
        return res.json({ message: "If an account with this email exists, the password has been reset." });
      }

      // Hash and update new password
      user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      user.updatedAt = new Date().toISOString();
      users.set(user.id, user);
      saveUsers();

      console.log(`[Auth] Password reset successful for: ${email}`);

      res.json({ message: "Password has been reset successfully. You can now sign in with your new password." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password. Please try again." });
    }
  });

  // List all users (debug endpoint - remove in production)
  app.get("/api/auth/debug/users", (_req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Not available in production" });
    }

    const userList = Array.from(users.values()).map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
    }));

    res.json({ count: userList.length, users: userList });
  });

  console.log("Auth routes registered");
}
