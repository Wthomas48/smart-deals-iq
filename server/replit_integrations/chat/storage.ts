export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

const conversationsStore: Map<number, Conversation> = new Map();
const messagesStore: Map<number, Message[]> = new Map();
let nextConvoId = 1;
let nextMsgId = 1;

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    return conversationsStore.get(id);
  },

  async getAllConversations() {
    return Array.from(conversationsStore.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  async createConversation(title: string) {
    const conversation: Conversation = {
      id: nextConvoId++,
      title,
      createdAt: new Date(),
    };
    conversationsStore.set(conversation.id, conversation);
    messagesStore.set(conversation.id, []);
    return conversation;
  },

  async deleteConversation(id: number) {
    conversationsStore.delete(id);
    messagesStore.delete(id);
  },

  async getMessagesByConversation(conversationId: number) {
    return messagesStore.get(conversationId) || [];
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const message: Message = {
      id: nextMsgId++,
      conversationId,
      role,
      content,
      createdAt: new Date(),
    };
    const msgs = messagesStore.get(conversationId) || [];
    msgs.push(message);
    messagesStore.set(conversationId, msgs);
    return message;
  },
};

