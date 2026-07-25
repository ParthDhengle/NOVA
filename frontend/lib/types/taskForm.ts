import type { SchedulerTask } from "./task";

export interface TaskFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  date: string;
  priority: SchedulerTask["priority"];
  isAgenticTask: boolean;
  tags: string;
  location: string;
  attendees: string;
  reminderMinutes: number;
}