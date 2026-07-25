import { getAuth } from "firebase/auth";
import { chatApi } from "@/lib/api/chat";
import type { ChatMessage, ChatSession } from "@/lib/types/chat";

export interface ChatServiceCallbacks {
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (isTyping: boolean) => void;
  onError?: (error: Error) => void;
  onSessionUpdate?: (session: ChatSession) => void;
}

class ChatService {
  private callbacks: ChatServiceCallbacks = {};
  private currentSessionId: string | null = null;
  private isProcessing = false;

  setCallbacks(callbacks: ChatServiceCallbacks) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks,
    };
  }

  async sendMessage(
    content: string,
    sessionId?: string
  ): Promise<ChatMessage> {
    if (!getAuth().currentUser) {
      throw new Error("User not authenticated");
    }

    if (this.isProcessing) {
      throw new Error("Another message is being processed");
    }

    this.isProcessing = true;

    this.currentSessionId =
      sessionId ??
      this.currentSessionId ??
      `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      this.callbacks.onTyping?.(true);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content,
        role: "user",
        timestamp: Date.now(),
      };

      this.callbacks.onMessage?.(userMessage);

      const response = await chatApi.sendMessage(
        content,
        this.currentSessionId
      );

      if (response.session_id) {
        this.currentSessionId = response.session_id;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: response.result.display_response,
        role: "assistant",
        timestamp: Date.now(),
        actions: [
          {
            type: "accept_schedule",
            label: "Schedule Follow-up",
            payload: {},
          },
          {
            type: "run_operation",
            label: "Analyze Further",
            payload: {},
          },
        ],
      };

      this.callbacks.onMessage?.(assistantMessage);

      if (this.currentSessionId) {
        const session = await chatApi.getChatSession(this.currentSessionId);
        this.callbacks.onSessionUpdate?.(session);
      }

      return assistantMessage;
    } catch (error) {
      console.error("Chat service error:", error);
      this.callbacks.onError?.(error as Error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.callbacks.onTyping?.(false);
    }
  }

  async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
    try {
      return await chatApi.getChatHistory(sessionId);
    } catch (error) {
      console.error("Failed to get chat history:", error);
      this.callbacks.onError?.(error as Error);
      return [];
    }
  }

  async getChatSessions(): Promise<ChatSession[]> {
    try {
      return await chatApi.getChatSessions();
    } catch (error) {
      console.error("Failed to get chat sessions:", error);
      this.callbacks.onError?.(error as Error);
      return [];
    }
  }

  async getChatSession(sessionId: string): Promise<ChatSession> {
    try {
      return await chatApi.getChatSession(sessionId);
    } catch (error) {
      console.error("Failed to get chat session:", error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  createNewSession(): ChatSession {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const session: ChatSession = {
      id: sessionId,
      title: "New Chat",
      summary: "",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.currentSessionId = sessionId;
    this.callbacks.onSessionUpdate?.(session);

    return session;
  }

  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  setCurrentSession(sessionId: string) {
    this.currentSessionId = sessionId;
  }

  clearCurrentSession() {
    this.currentSessionId = null;
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

export const chatService = new ChatService();
export default chatService;