import type { Express, Request, Response } from "express";
import {
  insertVendorListingSchema,
  updateVendorLocationSchema,
  type VendorListing,
  type InsertVendorListing,
  type UpdateVendorLocation,
} from "../shared/schema";
import { z } from "zod";

// In-memory storage for vendor listings (replace with database in production)
// This can be easily migrated to PostgreSQL with Drizzle when ready
const vendorListings: Map<string, VendorListing> = new Map();

// Rate limiting for location updates (1 update per hour for free tier)
const locationUpdateTimestamps: Map<string, Date> = new Map();
const LOCATION_UPDATE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function generateId(): string {
  return `vl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function canUpdateLocation(userId: string): { allowed: boolean; waitTime?: number } {
  const lastUpdate = locationUpdateTimestamps.get(userId);
  if (!lastUpdate) {
    return { allowed: true };
  }

  const timeSinceUpdate = Date.now() - lastUpdate.getTime();
  if (timeSinceUpdate >= LOCATION_UPDATE_COOLDOWN_MS) {
    return { allowed: true };
  }

  return {
    allowed: false,
    waitTime: Math.ceil((LOCATION_UPDATE_COOLDOWN_MS - timeSinceUpdate) / 60000)
  };
}

export function registerVendorListingRoutes(app: Express): void {
  // ==========================================
  // PUBLIC ROUTES (No auth required)
  // ==========================================

  // GET /api/vendors/public - Get all free vendor listings for map display
  app.get("/api/vendors/public", (_req: Request, res: Response) => {
    try {
      const listings = Array.from(vendorListings.values())
        .filter((v) => v.vendorTier === "free")
        .map((v) => ({
          id: v.id,
          businessName: v.businessName,
          category: v.category,
          description: v.description,
          locationLat: v.locationLat,
          locationLng: v.locationLng,
          city: v.city,
          state: v.state,
          lastLocationUpdate: v.lastLocationUpdate,
          // Exclude sensitive data: userId, phone, etc.
        }));

      res.json({ vendors: listings, count: listings.length });
    } catch (error) {
      console.error("Error fetching public vendors:", error);
      res.status(500).json({ error: "Failed to fetch vendors" });
    }
  });

  // GET /api/vendors/public/:id - Get single vendor public info
  app.get("/api/vendors/public/:id", (req: Request, res: Response) => {
    try {
      const vendor = vendorListings.get(req.params.id);

      if (!vendor || vendor.vendorTier !== "free") {
        return res.status(404).json({ error: "Vendor not found" });
      }

      res.json({
        id: vendor.id,
        businessName: vendor.businessName,
        category: vendor.category,
        description: vendor.description,
        phone: vendor.phone, // Allow phone for "Get Directions" / contact
        locationLat: vendor.locationLat,
        locationLng: vendor.locationLng,
        city: vendor.city,
        state: vendor.state,
        lastLocationUpdate: vendor.lastLocationUpdate,
      });
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ error: "Failed to fetch vendor" });
    }
  });

  // ==========================================
  // VENDOR AUTHENTICATED ROUTES
  // ==========================================

  // POST /api/vendors/listing - Create a new vendor listing
  app.post("/api/vendors/listing", (req: Request, res: Response) => {
    try {
      const { userId, ...listingData } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      // Check if vendor already has a listing
      const existingListing = Array.from(vendorListings.values()).find(
        (v) => v.userId === userId
      );

      if (existingListing) {
        return res.status(400).json({
          error: "You already have a listing. Use PUT to update it.",
          existingId: existingListing.id
        });
      }

      // Validate input
      const validatedData = insertVendorListingSchema.parse(listingData);

      const now = new Date();
      const newListing: VendorListing = {
        id: generateId(),
        userId,
        businessName: validatedData.businessName,
        category: validatedData.category,
        description: validatedData.description ?? null,
        phone: validatedData.phone ?? null,
        locationLat: validatedData.locationLat,
        locationLng: validatedData.locationLng,
        city: validatedData.city,
        state: validatedData.state,
        vendorTier: "free",
        createdAt: now,
        updatedAt: now,
        lastLocationUpdate: now,
      };

      vendorListings.set(newListing.id, newListing);
      locationUpdateTimestamps.set(userId, now);

      res.status(201).json({
        message: "Listing created successfully",
        listing: newListing
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error creating listing:", error);
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  // GET /api/vendors/listing/my - Get current vendor's listing
  app.get("/api/vendors/listing/my", (req: Request, res: Response) => {
    try {
      const userId = req.headers["x-user-id"] as string;

      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      const listing = Array.from(vendorListings.values()).find(
        (v) => v.userId === userId
      );

      if (!listing) {
        return res.status(404).json({ error: "No listing found", hasListing: false });
      }

      // Check if location can be updated
      const locationUpdateStatus = canUpdateLocation(userId);

      res.json({
        listing,
        hasListing: true,
        canUpdateLocation: locationUpdateStatus.allowed,
        locationUpdateWaitMinutes: locationUpdateStatus.waitTime || 0,
        tier: "free",
        tierLimits: {
          staticLocationOnly: true,
          locationUpdateCooldownMinutes: 60,
          noRealTimeTracking: true,
          noPromotions: true,
          noPriorityPlacement: true,
        }
      });
    } catch (error) {
      console.error("Error fetching my listing:", error);
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  // PUT /api/vendors/listing/:id - Update vendor listing details
  app.put("/api/vendors/listing/:id", (req: Request, res: Response) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const listingId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      const listing = vendorListings.get(listingId);

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      if (listing.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this listing" });
      }

      const { businessName, category, description, phone } = req.body;

      const updatedListing: VendorListing = {
        ...listing,
        businessName: businessName || listing.businessName,
        category: category || listing.category,
        description: description !== undefined ? description : listing.description,
        phone: phone !== undefined ? phone : listing.phone,
        updatedAt: new Date(),
      };

      vendorListings.set(listingId, updatedListing);

      res.json({
        message: "Listing updated successfully",
        listing: updatedListing
      });
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ error: "Failed to update listing" });
    }
  });

  // PATCH /api/vendors/listing/:id/location - Update location (rate limited)
  app.patch("/api/vendors/listing/:id/location", (req: Request, res: Response) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const listingId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      const listing = vendorListings.get(listingId);

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      if (listing.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this listing" });
      }

      // Check rate limit
      const updateStatus = canUpdateLocation(userId);
      if (!updateStatus.allowed) {
        return res.status(429).json({
          error: "Location update rate limit exceeded",
          waitMinutes: updateStatus.waitTime,
          message: `Free tier allows 1 location update per hour. Please wait ${updateStatus.waitTime} minutes.`
        });
      }

      // Validate location data
      const validatedLocation = updateVendorLocationSchema.parse(req.body);

      const now = new Date();
      const updatedListing: VendorListing = {
        ...listing,
        locationLat: validatedLocation.locationLat,
        locationLng: validatedLocation.locationLng,
        city: validatedLocation.city || listing.city,
        state: validatedLocation.state || listing.state,
        updatedAt: now,
        lastLocationUpdate: now,
      };

      vendorListings.set(listingId, updatedListing);
      locationUpdateTimestamps.set(userId, now);

      res.json({
        message: "Location updated successfully",
        listing: updatedListing,
        nextUpdateAvailable: new Date(now.getTime() + LOCATION_UPDATE_COOLDOWN_MS).toISOString()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      console.error("Error updating location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  // DELETE /api/vendors/listing/:id - Delete vendor listing
  app.delete("/api/vendors/listing/:id", (req: Request, res: Response) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const listingId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: "User ID required" });
      }

      const listing = vendorListings.get(listingId);

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      if (listing.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this listing" });
      }

      vendorListings.delete(listingId);
      locationUpdateTimestamps.delete(userId);

      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ error: "Failed to delete listing" });
    }
  });

  console.log("Vendor listing routes registered");
}
