import type { SchedulerTask } from "@/lib/types/task";
import type { CalendarEvent } from "@/lib/types/calendar";

export const taskToCalendarEvent = (task: SchedulerTask) => {
    return {
      summary: `📋 ${task.title}`, // Add task emoji to distinguish from regular events
      description: `${task.description || ''}\n\n--- Task Details ---\nPriority: ${task.priority}\nStatus: ${task.status}\nTags: ${task.tags?.join(', ') || 'None'}\nAgentic Task: ${task.isAgenticTask ? 'Yes' : 'No'}\n\nCreated by AI Scheduler`,
      start: {
        dateTime: task.startAt,
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: task.endAt,
        timeZone: 'Asia/Kolkata',
      },
      location: task.location,
      attendees: task.attendees?.map(email => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: task.reminderMinutes ? [
          { method: 'popup', minutes: task.reminderMinutes },
          { method: 'email', minutes: task.reminderMinutes }
        ] : []
      },
      extendedProperties: {
        private: {
          taskId: task.id,
          isTaskEvent: 'true',
          priority: task.priority,
          status: task.status,
          isAgenticTask: task.isAgenticTask?.toString() || 'false',
          tags: task.tags?.join(',') || '',
          createdByAIScheduler: 'true'
        }
      },
      // Color-code by priority (Google Calendar color IDs)
      colorId: task.priority === 'High' ? '11' : task.priority === 'Medium' ? '5' : '2'
    };
  };

  // Convert Google Calendar Event back to SchedulerTask
export const calendarEventToTask = (event: CalendarEvent): SchedulerTask | null => {
    const extProps = event.extendedProperties?.private;
    if (!extProps?.isTaskEvent) return null;

    return {
      id: extProps.taskId,
      googleEventId: event.id,
      title: event.summary?.replace(/^📋 /, '') || '', // Remove task emoji
      description: event.description?.split('\n\n--- Task Details ---')[0] || '',
      startAt: event.start?.dateTime ,
      endAt: event.end?.dateTime ,
      date: new Date(event.start?.dateTime).toISOString().split('T')[0],
      priority: (extProps.priority as 'High' | 'Medium' | 'Low') || 'Medium',
      status: (extProps.status as 'pending' | 'completed' | 'cancelled') || 'pending',
      tags: extProps.tags ? extProps.tags.split(',').filter(Boolean) : [],
      isAgenticTask: extProps.isAgenticTask === 'true',
      location: event.location || '',
      attendees: event.attendees?.map((a:{email:string}) => a.email) || [],
      reminderMinutes: event.reminders?.overrides?.[0]?.minutes || 15,
      createdAt: event.created,
      updatedAt: event.updated,
      aiSuggested: false,
    };
  };

  // Get priority styling
export const getPriorityStyle = (priority: SchedulerTask["priority"]) => {
    switch (priority) {
      case 'High':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'Medium':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'Low':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

export const formatTime = (date: Date): string => {
    return date.toTimeString().slice(0, 5);
  };