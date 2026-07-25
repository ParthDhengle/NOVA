export interface GoogleCalendarEvent {
  id: string;

  summary: string;
  description?: string;

  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };

  location?: string;

  attendees?: {
    email: string;
  }[];

  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: string;
      minutes: number;
    }[];
  };

  extendedProperties?: {
    private?: Record<string, string>;
  };

  colorId?: string;

  created?: string;
  updated?: string;
}