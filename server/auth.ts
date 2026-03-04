import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as jose from "jose";
import { z } from "zod";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./email";
import {
  registerUserSchema,
  loginUserSchema,
  socialAuthSchema,
  type SafeUser,
  type UserRole,
  type User,
} from "../shared/schema";

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const BCRYPT_ROUNDS = 12;

// Warn if using default JWT secret in production
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("[Auth] WARNING: Using default JWT_SECRET in production is insecure!");
}

// Token payload type
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Refresh tokens store with expiry (in-memory — use Redis for horizontal scaling)
interface RefreshTokenEntry {
  token: string;
  expiresAt: number;
}
const refreshTokens = new Map<string, RefreshTokenEntry>();
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Periodic cleanup of expired refresh tokens (every 6 hours)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, entry] of refreshTokens) {
    if (now > entry.expiresAt) {
      refreshTokens.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[Auth] Cleaned ${cleaned} expired refresh tokens`);
  }
}, 6 * 60 * 60 * 1000);

// Password reset codes store (in-memory - consider Redis for production scaling)
interface ResetCode {
  code: string;
  expiresAt: number;
  attempts: number; // Track failed verification attempts
}
const resetCodes = new Map<string, ResetCode>();
const RESET_CODE_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const MAX_RESET_ATTEMPTS = 5;

function generateResetCode(): string {
  // Generate a cryptographically random 6-digit code
  const { randomInt } = require("crypto");
  return randomInt(100000, 999999).toString();
}

function cleanExpiredResetCodes() {
  const now = Date.now();
  for (const [email, data] of resetCodes) {
    if (now > data.expiresAt) {
      resetCodes.delete(email);
    }
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" } as any);
  refreshTokens.set(refreshToken, {
    token: refreshToken,
    expiresAt: Date.now() + REFRESH_TOKEN_EXPIRY_MS,
  });
  return { accessToken, refreshToken };
}

function sanitizeUser(user: User): SafeUser {
  const { password, appleId, googleId, ...safeUser } = user as any;
  return safeUser as SafeUser;
}

// ===========================================
// SOCIAL AUTH TOKEN VERIFICATION
// ===========================================

// Apple Sign-In verification
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_CLIENT_IDS = [
  "com.smartdealsiq.app",
  "com.smartdealsiq.app.dev",
  "com.smartdealsiq.app.preview",
];

interface SocialTokenPayload {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  isPrivateEmail?: boolean;
}

async function verifyAppleIdentityToken(identityToken: string): Promise<SocialTokenPayload> {
  const JWKS = jose.createRemoteJWKSet(new URL(APPLE_JWKS_URL));

  const { payload } = await jose.jwtVerify(identityToken, JWKS, {
    issuer: APPLE_ISSUER,
    audience: APPLE_CLIENT_IDS,
  });

  if (!payload.sub) {
    throw new Error("Apple identity token missing subject claim");
  }

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    emailVerified: payload.email_verified === "true" || payload.email_verified === true,
    isPrivateEmail: payload.is_private_email === "true" || payload.is_private_email === true,
  };
}

// Google Sign-In verification
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUER = ["https://accounts.google.com", "accounts.google.com"];

async function verifyGoogleIdentityToken(identityToken: string): Promise<SocialTokenPayload> {
  const JWKS = jose.createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

  const { payload } = await jose.jwtVerify(identityToken, JWKS, {
    issuer: GOOGLE_ISSUER,
  });

  if (!payload.sub) {
    throw new Error("Google identity token missing subject claim");
  }

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    emailVerified: payload.email_verified === true,
  };
}

// ===========================================
// SEED DEMO USERS
// ===========================================

async function seedDemoUsers() {
  // Only seed in development mode
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const DEMO_PASSWORD = "demo1234";

  try {
    // Check if demo customer exists
    const existingCustomer = await storage.getUserByEmail("customer@demo.com");
    if (!existingCustomer) {
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
      await storage.createUser({
        email: "customer@demo.com",
        username: "democustomer",
        password: hashedPassword,
        role: "customer",
        firstName: "Demo",
        lastName: "Customer",
      });
      console.log("[Auth] Demo customer seeded: customer@demo.com");
    }

    // Check if demo vendor exists
    const existingVendor = await storage.getUserByEmail("vendor@demo.com");
    if (!existingVendor) {
      const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
      await storage.createUser({
        email: "vendor@demo.com",
        username: "demovendor",
        password: hashedPassword,
        role: "vendor",
        firstName: "Demo",
        lastName: "Vendor",
      });
      console.log("[Auth] Demo vendor seeded: vendor@demo.com");
    }

    console.log("[Auth] Demo users available (password: demo1234)");
  } catch (error) {
    console.warn("[Auth] Could not seed demo users:", error);
  }
}

// ===========================================
// SEED APPLE REVIEW TEST ACCOUNT
// ===========================================

async function seedReviewAccount() {
  const REVIEW_EMAIL = "review@smartdealsiq.com";
  const REVIEW_PASSWORD = "review123!";

  try {
    const existing = await storage.getUserByEmail(REVIEW_EMAIL);
    if (!existing) {
      const hashedPassword = await bcrypt.hash(REVIEW_PASSWORD, BCRYPT_ROUNDS);
      await storage.createUser({
        email: REVIEW_EMAIL,
        username: "applereview",
        password: hashedPassword,
        role: "customer",
        firstName: "Apple",
        lastName: "Review",
      });
      console.log("[Auth] Apple review account seeded: review@smartdealsiq.com");
    } else {
      // Ensure password stays in sync — update it on every startup
      const hashedPassword = await bcrypt.hash(REVIEW_PASSWORD, BCRYPT_ROUNDS);
      await storage.updateUser(existing.id, { password: hashedPassword });
      console.log("[Auth] Apple review account verified: review@smartdealsiq.com");
    }
  } catch (error) {
    console.warn("[Auth] Could not seed review account:", error);
  }
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
  // Seed demo users on startup (dev only)
  seedDemoUsers();
  // Seed Apple review test account (all environments)
  seedReviewAccount();

  // Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerUserSchema.parse(req.body);

      // Normalize email and password
      const normalizedEmail = data.email.trim().toLowerCase();
      const normalizedPassword = data.password.trim();

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(normalizedEmail);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(data.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(normalizedPassword, BCRYPT_ROUNDS);

      // Create user
      const newUser = await storage.createUser({
        email: normalizedEmail,
        username: data.username.trim(),
        password: hashedPassword,
        role: data.role,
        firstName: data.firstName?.trim(),
        lastName: data.lastName?.trim(),
      });

      // Generate tokens
      const tokens = generateTokens({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role as UserRole,
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

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginUserSchema.parse(req.body);

      // Normalize email and password
      const normalizedEmail = data.email.trim().toLowerCase();
      const normalizedPassword = data.password.trim();

      console.log(`[Auth] Login attempt for: ${normalizedEmail}`);

      // Find user by email
      const user = await storage.getUserByEmail(normalizedEmail);

      if (!user) {
        return res.status(401).json({ error: "No account found with this email. Please sign up first." });
      }

      // Social auth users cannot use email/password login
      if (!user.password) {
        const provider = (user as any).authProvider || "social";
        const providerName = provider === "apple" ? "Sign in with Apple" : provider === "google" ? "Sign in with Google" : "social sign-in";
        return res.status(401).json({
          error: `This account uses ${providerName}. Please use that option to sign in.`,
          authProvider: provider,
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(normalizedPassword, user.password);
      if (!validPassword) {
        console.log(`[Auth] Invalid password for: ${normalizedEmail}`);
        return res.status(401).json({ error: "Invalid password. Please try again." });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Generate tokens with the user's actual stored role
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
      });

      console.log(`[Auth] Login successful: ${user.email} (${user.role})`);

      // Always return the user with their actual role - client handles routing
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

  // Social auth (Apple Sign-In / Google Sign-In)
  app.post("/api/auth/social", async (req: Request, res: Response) => {
    try {
      const data = socialAuthSchema.parse(req.body);

      // Verify identity token with the appropriate provider
      let socialPayload: SocialTokenPayload;
      try {
        if (data.provider === "apple") {
          socialPayload = await verifyAppleIdentityToken(data.identityToken);
        } else if (data.provider === "google") {
          socialPayload = await verifyGoogleIdentityToken(data.identityToken);
        } else {
          return res.status(400).json({ error: "Unsupported auth provider" });
        }
      } catch (verifyError) {
        console.error(`[Auth] ${data.provider} token verification failed:`, verifyError);
        return res.status(401).json({ error: `Invalid ${data.provider} identity token` });
      }

      const providerUserId = socialPayload.sub;
      const providerEmail = socialPayload.email?.toLowerCase();

      // 1. Check if user already exists by provider ID
      let user = data.provider === "apple"
        ? await storage.getUserByAppleId(providerUserId)
        : await storage.getUserByGoogleId(providerUserId);

      if (user) {
        // Existing user — sign them in
        await storage.updateUser(user.id, { lastLoginAt: new Date() });

        const tokens = generateTokens({
          userId: user.id,
          email: user.email,
          role: user.role as UserRole,
        });

        console.log(`[Auth] ${data.provider} Sign-In: existing user ${user.email} (${user.role})`);

        return res.json({
          message: "Login successful",
          user: sanitizeUser(user),
          ...tokens,
          isNewUser: false,
        });
      }

      // 2. Check if email already exists (account linking)
      if (providerEmail) {
        const existingByEmail = await storage.getUserByEmail(providerEmail);
        if (existingByEmail) {
          // Link provider ID to existing account
          const linkUpdates: Partial<User> = {
            lastLoginAt: new Date(),
            emailVerified: true,
          };
          if (data.provider === "apple") {
            (linkUpdates as any).appleId = providerUserId;
          } else {
            (linkUpdates as any).googleId = providerUserId;
          }

          const updatedUser = await storage.updateUser(existingByEmail.id, linkUpdates);

          const tokens = generateTokens({
            userId: existingByEmail.id,
            email: existingByEmail.email,
            role: existingByEmail.role as UserRole,
          });

          console.log(`[Auth] ${data.provider} Sign-In: linked to existing account ${existingByEmail.email} (${existingByEmail.role})`);

          return res.json({
            message: "Login successful",
            user: sanitizeUser(updatedUser!),
            ...tokens,
            isNewUser: false,
          });
        }
      }

      // 3. New user — need role selection if not provided
      if (!data.role) {
        return res.status(200).json({
          needsRole: true,
          message: "Please select a role to complete registration",
        });
      }

      // 4. Create new user
      const emailForUser = providerEmail || `${data.provider}_${providerUserId.slice(0, 8)}@private.smartdealsiq.com`;
      const baseUsername = (providerEmail?.split("@")[0] || `${data.provider}_${providerUserId.slice(0, 8)}`)
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 24);
      const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      const username = (baseUsername || "user") + suffix;

      const createData: any = {
        email: emailForUser,
        username: username.slice(0, 30),
        password: null,
        role: data.role,
        firstName: data.firstName?.trim() || undefined,
        lastName: data.lastName?.trim() || undefined,
        authProvider: data.provider,
        emailVerified: socialPayload.emailVerified || false,
      };

      if (data.provider === "apple") {
        createData.appleId = providerUserId;
      } else {
        createData.googleId = providerUserId;
      }

      const newUser = await storage.createUser(createData);

      const tokens = generateTokens({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role as UserRole,
      });

      console.log(`[Auth] ${data.provider} Sign-In: new user created ${newUser.email} (${newUser.role})`);

      return res.status(201).json({
        message: "Registration successful",
        user: sanitizeUser(newUser),
        ...tokens,
        isNewUser: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Social auth error:", error);
      res.status(500).json({ error: "Social authentication failed" });
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
  app.get("/api/auth/me", authMiddleware, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.user!.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: sanitizeUser(user) });
  });

  // Update profile
  app.put("/api/auth/profile", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { firstName, lastName, phone, username } = req.body;
      const updates: Partial<User> = {};

      // Check username uniqueness if changing
      if (username && username !== user.username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername && existingUsername.id !== user.id) {
          return res.status(400).json({ error: "Username already taken" });
        }
        updates.username = username;
      }

      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (phone !== undefined) updates.phone = phone;

      const updatedUser = await storage.updateUser(user.id, updates);

      res.json({
        message: "Profile updated",
        user: sanitizeUser(updatedUser!),
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

      const user = await storage.getUser(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Social auth users without a password can set one
      if (!user.password) {
        if (!currentPassword) {
          const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
          await storage.updateUser(user.id, { password: hashedPassword });
          return res.json({ message: "Password set successfully" });
        }
        return res.status(400).json({ error: "This account uses social sign-in and has no password to verify." });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Delete account
  app.delete("/api/auth/account", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { password, confirmed } = req.body;

      const user = await storage.getUser(req.user!.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Social auth users (no password): require explicit confirmation
      if (!user.password) {
        if (!confirmed) {
          return res.status(400).json({ error: "Please confirm account deletion" });
        }
      } else {
        // Email/password users: require password verification
        if (!password) {
          return res.status(400).json({ error: "Password required to delete account" });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          return res.status(401).json({ error: "Incorrect password" });
        }
      }

      // Delete user
      await storage.deleteUser(user.id);

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Check if email exists
  app.get("/api/auth/check-email/:email", async (req: Request, res: Response) => {
    const { email } = req.params;
    const user = await storage.getUserByEmail(email);
    res.json({ exists: !!user });
  });

  // Check if username exists
  app.get("/api/auth/check-username/:username", async (req: Request, res: Response) => {
    const { username } = req.params;
    const user = await storage.getUserByUsername(username);
    res.json({ exists: !!user });
  });

  // Step 1: Request password reset — sends a 6-digit verification code
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Clean up expired codes periodically
      cleanExpiredResetCodes();

      // Always return success to avoid revealing whether the email exists
      const user = await storage.getUserByEmail(normalizedEmail);

      if (user) {
        const code = generateResetCode();
        resetCodes.set(normalizedEmail, {
          code,
          expiresAt: Date.now() + RESET_CODE_EXPIRY_MS,
          attempts: 0,
        });

        // Send code via Zoho SMTP email
        const sent = await sendPasswordResetEmail(normalizedEmail, code);
        if (!sent) {
          console.error(`[Auth] Failed to send reset email to ${normalizedEmail}`);
        }
      } else {
        console.log(`[Auth] Password reset requested for non-existent email: ${normalizedEmail}`);
      }

      res.json({ message: "If an account with this email exists, a verification code has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request. Please try again." });
    }
  });

  // Step 2: Verify code and reset password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Email, verification code, and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const resetData = resetCodes.get(normalizedEmail);

      // Check if a reset code exists
      if (!resetData) {
        return res.status(400).json({ error: "No reset code found. Please request a new one." });
      }

      // Check if code has expired
      if (Date.now() > resetData.expiresAt) {
        resetCodes.delete(normalizedEmail);
        return res.status(400).json({ error: "Reset code has expired. Please request a new one." });
      }

      // Check max attempts to prevent brute force
      if (resetData.attempts >= MAX_RESET_ATTEMPTS) {
        resetCodes.delete(normalizedEmail);
        return res.status(429).json({ error: "Too many attempts. Please request a new code." });
      }

      // Verify the code
      if (resetData.code !== code.trim()) {
        resetData.attempts += 1;
        return res.status(400).json({ error: "Invalid verification code. Please try again." });
      }

      // Code is valid — reset the password
      const user = await storage.getUserByEmail(normalizedEmail);
      if (!user) {
        resetCodes.delete(normalizedEmail);
        return res.status(400).json({ error: "Account not found." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await storage.updateUser(user.id, { password: hashedPassword });

      // Remove used code
      resetCodes.delete(normalizedEmail);

      console.log(`[Auth] Password reset successful for: ${normalizedEmail}`);

      res.json({ message: "Password has been reset successfully. You can now sign in with your new password." });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password. Please try again." });
    }
  });

  // Health check endpoint
  app.get("/api/auth/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  });

  console.log("[Auth] Routes registered");
}
