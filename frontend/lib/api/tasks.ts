import { apiClient } from "./client";
import type { SchedulerTask } from "@/lib/types/task";
export type CreateTaskRequest = Omit<
  SchedulerTask,
  "id" | "createdAt" | "updatedAt"
>;

export const tasksApi = {
  async getTasks() {
    return apiClient.get<SchedulerTask[]>("/tasks");
  },

  async createTask(task: CreateTaskRequest) {
    return apiClient.post<SchedulerTask>("/tasks", task);
  },

  async updateTask(
    taskId: string,
    updates: Partial<SchedulerTask>
  ) {
    return apiClient.put<SchedulerTask>(
      `/tasks/${taskId}`,
      updates
    );
  },

  async deleteTask(taskId: string) {
    return apiClient.delete<void>(`/tasks/${taskId}`);
  },
};