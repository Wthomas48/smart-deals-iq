import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Lazy-initialized clients to prevent crashes when API keys are not set
let _openai: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

// OpenAI client (primary) - lazy initialization
export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Anthropic client (backup) - lazy initialization
export function getAnthropic(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// Legacy exports for backward compatibility
export const openai = { get client() { return getOpenAI(); } };
export const anthropic = { get client() { return getAnthropic(); } };

/**
 * Generate text completion with OpenAI (primary) and Anthropic (backup)
 */
export async function generateText(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const { systemPrompt, maxTokens = 1024, temperature = 0.7 } = options || {};

  // Try OpenAI first
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return response.choices[0]?.message?.content || "";
  } catch (openaiError) {
    console.error("OpenAI error, falling back to Anthropic:", openaiError);

    // Fallback to Anthropic
    try {
      const response = await getAnthropic().messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: maxTokens,
        system: systemPrompt || undefined,
        messages: [{ role: "user", content: prompt }],
      });

      const textContent = response.content.find((c) => c.type === "text");
      return textContent?.text || "";
    } catch (anthropicError) {
      console.error("Anthropic also failed:", anthropicError);
      throw new Error("Both AI providers failed");
    }
  }
}

/**
 * Generate text with streaming (OpenAI primary, Anthropic backup)
 */
export async function* generateTextStream(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
  }
): AsyncGenerator<string> {
  const { systemPrompt, maxTokens = 2048 } = options || {};

  // Try OpenAI first
  try {
    const stream = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (openaiError) {
    console.error("OpenAI streaming error, falling back to Anthropic:", openaiError);

    // Fallback to Anthropic streaming
    const stream = await getAnthropic().messages.stream({
      model: "claude-3-haiku-20240307",
      max_tokens: maxTokens,
      system: systemPrompt || undefined,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = "audio/webm"
): Promise<string> {
  const extension = mimeType.split("/")[1] || "webm";
  // Convert Buffer to Uint8Array for File constructor compatibility
  const uint8Array = new Uint8Array(audioBuffer);
  const file = new File([uint8Array], `audio.${extension}`, { type: mimeType });

  const response = await getOpenAI().audio.transcriptions.create({
    model: "whisper-1",
    file,
  });

  return response.text;
}

/**
 * Generate image using OpenAI DALL-E 3
 */
export async function generateImage(prompt: string): Promise<string> {
  const response = await getOpenAI().images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    response_format: "b64_json",
  });

  if (!response.data || !response.data[0]?.b64_json) {
    throw new Error("No image data in response");
  }
  const imageData = response.data[0].b64_json;

  return `data:image/png;base64,${imageData}`;
}
