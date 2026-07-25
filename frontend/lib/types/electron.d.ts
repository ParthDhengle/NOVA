export {};

import type { AgentOp } from "./agent";
import type { ChatMessage, ChatSession } from "./chat";
import type { SchedulerTask } from "./task";

export type NovaRole =
  | "friend"
  | "mentor"
  | "girlfriend"
  | "husband"
  | "guide";

export type Integration = {
  id: string;
  name: string;
  enabled: boolean;
  status: "connected" | "disconnected" | "error";
  lastSync?: number;
};

export type Unsubscribe = () => void;

declare global {
  interface Window {
    api: {
      requestExpand(): void;
      requestMinimize(): void;
      setAlwaysOnTop(flag: boolean): void;

      windowMinimize(): void;
      windowMaximize(): void;
      windowClose(): void;
      miniClose(): void;

      transcribeStart(sessionId: string): Promise<void>;
      transcribeStop(sessionId: string): Promise<void>;

      transcribeStream(
        sessionId: string,
        onTranscript: (
          text: string,
          partial: boolean
        ) => void
      ): void;

      listLocalModels(): Promise<string[]>;

      speak(text: string, voiceId?: string): Promise<void>;

      sendMessage(
        message: string,
        sessionId?: string
      ): Promise<{ sessionId: string }>;

      onMessageStream(
        cb: (message: ChatMessage) => void
      ): Unsubscribe;

      executeAction(action: {
        type: string;
        payload?: unknown;
      }): Promise<{ ok: boolean }>;

      onAgentOpsUpdate(
        cb: (ops: AgentOp[]) => void
      ): Unsubscribe;

      createTask(
        task: Omit<
          SchedulerTask,
          "id" | "createdAt" | "updatedAt"
        >
      ): Promise<SchedulerTask>;

      updateTask(
        id: string,
        updates: Partial<SchedulerTask>
      ): Promise<SchedulerTask>;

      deleteTask(id: string): Promise<void>;

      getTasks(): Promise<SchedulerTask[]>;

      getChatSessions(): Promise<ChatSession[]>;

      getChatSession(id: string): Promise<ChatSession>;

      deleteChatSession(id: string): Promise<void>;

      searchChats(query: string): Promise<ChatSession[]>;

      openExternalAuth(
        service: "email" | "google" | "calendar"
      ): Promise<void>;

      enableIntegration(
        service: string,
        credentials: unknown
      ): Promise<{ ok: boolean }>;

      getIntegrations(): Promise<Integration[]>;

      exportDashboardPDF(payload: {
        html: string;
      }): Promise<{ path: string }>;

      getUserPreferences(): Promise<{
        role: NovaRole;
        voiceEnabled: boolean;
        selectedModel: string;
        alwaysOnTop: boolean;
      }>;

      updateUserPreferences(
        prefs: unknown
      ): Promise<void>;

      notify(title: string, body?: string): void;

      onThemeChange(
        cb: (theme: "dark" | "light") => void
      ): Unsubscribe;

      getAppVersion(): Promise<string>;
    };

    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: unknown): {
            requestCode(): void;
          };
        };
      };
    };
  }
}