import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, doublePrecision, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export const userRoleEnum = z.enum(["customer", "vendor", "admin"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // bcrypt hashed
  role: text("role").notNull().default("customer"), // customer, vendor, admin
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// Schema for user registration
export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: userRoleEnum.default("customer"),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
});

// Schema for user login
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  emailVerified: true,
});

export const selectUserSchema = createSelectSchema(users);

// Safe user type (without password)
export const safeUserSchema = selectUserSchema.omit({ password: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SafeUser = z.infer<typeof safeUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// Vendor category enum
export const vendorCategoryEnum = z.enum(["food_truck", "restaurant", "vendor"]);
export type VendorCategory = z.infer<typeof vendorCategoryEnum>;

// Vendor tier enum
export const vendorTierEnum = z.enum(["free", "starter", "pro_monthly", "pro_yearly"]);
export type VendorTier = z.infer<typeof vendorTierEnum>;

// Subscription status enum
export const subscriptionStatusEnum = z.enum(["active", "canceled", "past_due", "trialing", "incomplete"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

// Vendor Listings table for the FREE "Listed & Discovery" tier
export const vendorListings = pgTable("vendor_listings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Owner of this listing (vendor)
  businessName: text("business_name").notNull(),
  category: text("category").notNull(), // food_truck, restaurant, vendor
  description: text("description"),
  phone: text("phone"),
  locationLat: doublePrecision("location_lat").notNull(),
  locationLng: doublePrecision("location_lng").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  vendorTier: text("vendor_tier").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLocationUpdate: timestamp("last_location_update").defaultNow().notNull(),
});

// Zod schemas for vendor listings
export const insertVendorListingSchema = createInsertSchema(vendorListings, {
  businessName: z.string().min(1, "Business name is required").max(100),
  category: vendorCategoryEnum,
  description: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(50),
  vendorTier: vendorTierEnum.default("free"),
}).omit({ id: true, createdAt: true, updatedAt: true, lastLocationUpdate: true });

export const updateVendorLocationSchema = z.object({
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(50).optional(),
});

export const selectVendorListingSchema = createSelectSchema(vendorListings);

export type InsertVendorListing = z.infer<typeof insertVendorListingSchema>;
export type UpdateVendorLocation = z.infer<typeof updateVendorLocationSchema>;
export type VendorListing = typeof vendorListings.$inferSelect;

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  productId: text("product_id").notNull(), // prod_starter, prod_monthly, prod_yearly
  status: text("status").notNull().default("active"), // active, canceled, past_due, etc.
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectSubscriptionSchema = createSelectSchema(subscriptions);

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Payment History table
export const paymentHistory = pgTable("payment_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(), // paid, failed, pending
  description: text("description"),
  invoicePdf: text("invoice_pdf"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
  createdAt: true,
});

export const selectPaymentHistorySchema = createSelectSchema(paymentHistory);

export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;

export * from "./models/chat";
