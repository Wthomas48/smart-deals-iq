import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { registerVoiceRoutes } from "./replit_integrations/voice";

export async function registerRoutes(app: Express): Promise<Server> {
  registerVoiceRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
