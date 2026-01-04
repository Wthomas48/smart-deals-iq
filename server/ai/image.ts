import type { Express, Request, Response } from "express";
import { generateImage } from "./client";

export function registerImageRoutes(app: Express): void {
  // Generate image using OpenAI DALL-E 3
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Enhance prompt for better food/deal imagery
      const enhancedPrompt = `Professional marketing image for a restaurant deal: ${prompt}. High quality, appetizing, commercial photography style.`;

      const dataUrl = await generateImage(enhancedPrompt);

      // Extract base64 data from data URL
      const base64Match = dataUrl.match(/base64,(.+)/);
      const b64_json = base64Match ? base64Match[1] : "";

      res.json({
        b64_json,
        mimeType: "image/png",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Generate deal flyer/banner
  app.post("/api/generate-flyer", async (req: Request, res: Response) => {
    try {
      const { dealTitle, dealDescription, businessName, discount } = req.body;

      if (!dealTitle) {
        return res.status(400).json({ error: "Deal title is required" });
      }

      const prompt = `Create a professional restaurant promotional flyer for:
Business: ${businessName || "Restaurant"}
Deal: ${dealTitle}
Description: ${dealDescription || ""}
Discount: ${discount || "Special Offer"}

Style: Modern, clean, appetizing food photography, bold text overlay, vibrant colors. Marketing/advertising quality.`;

      const dataUrl = await generateImage(prompt);
      const base64Match = dataUrl.match(/base64,(.+)/);
      const b64_json = base64Match ? base64Match[1] : "";

      res.json({
        b64_json,
        mimeType: "image/png",
      });
    } catch (error) {
      console.error("Error generating flyer:", error);
      res.status(500).json({ error: "Failed to generate flyer" });
    }
  });
}
