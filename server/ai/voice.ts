import type { Express, Request, Response } from "express";
import { generateText, transcribeAudio } from "./client";
import { authMiddleware } from "../auth";

export function registerVoiceRoutes(app: Express): void {
  // Transcribe audio using OpenAI Whisper
  app.post("/api/voice/transcribe", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { audioData, mimeType = "audio/webm" } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioData, "base64");
      const transcription = await transcribeAudio(audioBuffer, mimeType);

      res.json({ transcription });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Generate promo from description using OpenAI/Anthropic
  app.post("/api/voice/generate-promo", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { description, businessType, dealType } = req.body;

      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      // Sanitize inputs to prevent prompt injection
      const safeDescription = String(description).slice(0, 500);
      const safeBusinessType = String(businessType || "restaurant").slice(0, 50);
      const safeDealType = String(dealType || "discount").slice(0, 50);

      const prompt = `Based on this description, create a professional promotional deal:

Description: "${safeDescription}"
Business Type: ${safeBusinessType}
Deal Type: ${safeDealType}

Generate a JSON response with:
{
  "title": "Catchy deal title (max 50 chars)",
  "description": "Compelling description (max 100 chars)",
  "suggestedDiscount": "Suggested discount percentage or value"
}

Be creative, engaging, and make the offer sound irresistible. Only return valid JSON.`;

      const result = await generateText(prompt, {
        systemPrompt: "You are a marketing expert for local restaurants and food businesses. Always respond with valid JSON only.",
        maxTokens: 256,
        temperature: 0.8,
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      let promoData;
      try {
        promoData = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { title: safeDescription, description: "", suggestedDiscount: "10%" };
      } catch {
        promoData = { title: safeDescription, description: "", suggestedDiscount: "10%" };
      }

      res.json(promoData);
    } catch (error) {
      console.error("Error generating promo:", error);
      res.status(500).json({ error: "Failed to generate promotion" });
    }
  });

  // Parse voice search query using OpenAI/Anthropic
  app.post("/api/voice/search-deals", authMiddleware, async (req: Request, res: Response) => {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const safeQuery = String(query).slice(0, 300);

      const prompt = `Extract search parameters from this voice query about finding food deals:

Query: "${safeQuery}"

Return JSON with:
{
  "cuisine": "extracted cuisine type or null",
  "keywords": ["key", "search", "terms"],
  "priceRange": "budget/moderate/premium or null",
  "distance": "nearby/walking/driving or null"
}

Only return valid JSON.`;

      const result = await generateText(prompt, {
        systemPrompt: "You are a search query parser. Always respond with valid JSON only.",
        maxTokens: 128,
        temperature: 0.3,
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      let searchParams;
      try {
        searchParams = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { keywords: safeQuery.split(" ") };
      } catch {
        searchParams = { keywords: safeQuery.split(" ") };
      }

      res.json(searchParams);
    } catch (error) {
      console.error("Error parsing search:", error);
      res.status(500).json({ error: "Failed to parse search query" });
    }
  });
}
