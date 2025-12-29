import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export function registerVoiceRoutes(app: Express): void {
  app.post("/api/voice/transcribe", async (req: Request, res: Response) => {
    try {
      const { audioData, mimeType = "audio/webm" } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: "Audio data is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: audioData,
                },
              },
              {
                text: "Transcribe the audio exactly as spoken. Only output the transcription, nothing else.",
              },
            ],
          },
        ],
      });

      const transcription = response.text || "";
      res.json({ transcription });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  app.post("/api/voice/generate-promo", async (req: Request, res: Response) => {
    try {
      const { description, businessType, dealType } = req.body;

      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }

      const prompt = `You are a marketing expert for local restaurants and food businesses. 
Based on this spoken description, create a professional promotional deal:

Description: "${description}"
Business Type: ${businessType || "restaurant"}
Deal Type: ${dealType || "discount"}

Generate a JSON response with:
{
  "title": "Catchy deal title (max 50 chars)",
  "description": "Compelling description (max 100 chars)",
  "suggestedDiscount": "Suggested discount percentage or value"
}

Be creative, engaging, and make the offer sound irresistible.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const promoData = jsonMatch ? JSON.parse(jsonMatch[0]) : { title: description, description: "", suggestedDiscount: "10%" };
      
      res.json(promoData);
    } catch (error) {
      console.error("Error generating promo:", error);
      res.status(500).json({ error: "Failed to generate promotion" });
    }
  });

  app.post("/api/voice/search-deals", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      const prompt = `Extract search parameters from this voice query about finding food deals:

Query: "${query}"

Return JSON with:
{
  "cuisine": "extracted cuisine type or null",
  "keywords": ["key", "search", "terms"],
  "priceRange": "budget/moderate/premium or null",
  "distance": "nearby/walking/driving or null"
}

Only return valid JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const text = response.text || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const searchParams = jsonMatch ? JSON.parse(jsonMatch[0]) : { keywords: query.split(" ") };
      
      res.json(searchParams);
    } catch (error) {
      console.error("Error parsing search:", error);
      res.status(500).json({ error: "Failed to parse search query" });
    }
  });
}
