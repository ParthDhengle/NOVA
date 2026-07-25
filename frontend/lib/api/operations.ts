import { apiClient } from "./client";
import type { AgentOp } from "@/lib/types/agent";

export interface CreateOperationRequest {
  name: string;
  parameters?: Record<string, unknown>;
}

export const operationsApi = {
  getOperations(status?: string) {
    const params = status
      ? `?status=${encodeURIComponent(status)}`
      : "";

    return apiClient.get<AgentOp[]>(`/operations${params}`);
  },

  async queueOperation(data: CreateOperationRequest) {
    const response = await apiClient.post<{
      op_id: string;
    }>("/operations", data);

    return response.op_id;
  },
};