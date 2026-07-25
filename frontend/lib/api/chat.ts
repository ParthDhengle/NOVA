import { apiClient } from "./client";
import type { ChatMessage, ChatSession } from "@/lib/types/chat";

interface BackendResponse {
  result: {
    display_response: string;
    mode: string;
  };
  session_id: string;
}

export const chatApi = {
  async sendMessage(query: string, sessionId?: string) {
    return apiClient.post<BackendResponse>("/process_query", {
      query,
      session_id: sessionId,
    });
  },

  async getChatHistory(sessionId?: string) {
    const params = sessionId ? `?session_id=${sessionId}` : "";

    return apiClient.get<ChatMessage[]>(`/chat_history${params}`);
  },

  async getChatSessions() {
    return apiClient.get<ChatSession[]>("/chat_sessions");
  },

  async getChatSession(sessionId: string) {
    const sessions = await this.getChatSessions();

    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    const history = await this.getChatHistory(sessionId);

    return {
      ...session,
      messages: history,
    };
  },

  async deleteChatSession(sessionId: string) {
    await apiClient.delete(`/chat_sessions/${sessionId}`);
  },
};