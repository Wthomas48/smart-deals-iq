// AI Service - OpenAI (primary) with Anthropic (backup)
export { openai, anthropic, generateText, generateTextStream, transcribeAudio, generateImage } from "./client";
export { registerVoiceRoutes } from "./voice";
export { registerChatRoutes, chatStorage, type IChatStorage, type Conversation, type Message } from "./chat";
export { registerImageRoutes } from "./image";
