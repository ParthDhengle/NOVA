import {apiClient} from "@/lib/api/client";
import type { CalendarEvent } from "../types/calendar";

export const calendarApi = {
  list(params?: Record<string, string | number | boolean>) {
    return apiClient.get<CalendarEvent[]>("/api/events", params);
  },

  create(event: unknown) {
    return apiClient.post<CalendarEvent>("/api/events", event);
  },

  update(eventId: string, event: unknown) {
    return apiClient.patch<CalendarEvent>(
      `/api/events/primary/${eventId}`,
      event
    );
  },

  remove(eventId: string) {
    return apiClient.delete(`/api/events/primary/${eventId}`);
  },
};