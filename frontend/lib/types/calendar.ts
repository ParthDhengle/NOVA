import type { SchedulerTask } from "./task";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  created: string;
  updated: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  attendees?: {
    email: string;
  }[];
  reminders?: {
    overrides?: {
      minutes: number;
    }[];
  };
  extendedProperties?: {
    private?: {
      taskId: string;
      priority: SchedulerTask["priority"];
      status: SchedulerTask["status"];
      isTaskEvent: string;
      isAgenticTask: string;
      tags: string;
    };
  };
}