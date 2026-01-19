import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerVoiceRoutes, registerChatRoutes, registerImageRoutes } from "./ai";
import { registerVendorListingRoutes } from "./vendor-listings";
import { registerPaymentRoutes } from "./payments";
import { registerAuthRoutes } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Railway
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Authentication routes (JWT)
  registerAuthRoutes(app);

  // AI-powered routes (OpenAI primary, Anthropic backup)
  registerVoiceRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Business logic routes
  registerVendorListingRoutes(app);

  // Payment & subscription routes (Stripe)
  registerPaymentRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
