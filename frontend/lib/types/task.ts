export interface SchedulerTask {
  id: string;
  title: string;
  description?: string;

  startAt: string;
  endAt: string;
  date: string;

  priority: "High" | "Medium" | "Low";
  status: "pending" | "completed" | "cancelled";

  tags?: string[];

  isAgenticTask?: boolean;
  aiSuggested?: boolean;

  location?: string;
  attendees?: string[];

  reminderMinutes?: number;

  createdAt: string;
  updatedAt: string;

  googleEventId?: string;
}