export interface MessageAction {
  type:
    | "accept_schedule"
    | "reschedule"
    | "send_email"
    | "run_operation";
  label: string;
  payload?: unknown;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: number;
  actions?: MessageAction[];
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  summary?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}