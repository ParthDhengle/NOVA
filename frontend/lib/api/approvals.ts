import { apiRequest, jsonBody } from './client'

export type ApprovalResponse = {
  approved: boolean
  values: Record<string, string>
}

export const approvalsApi = {
  respond: (approvalId: string, response: ApprovalResponse) =>
    apiRequest<void>(`/api/approvals/${encodeURIComponent(approvalId)}`, {
      method: 'POST',
      body: jsonBody(response),
    }),
}
