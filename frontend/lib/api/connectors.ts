import { apiRequest, jsonBody } from './client'
import type { Connector } from './types'

export const connectorsApi = {
  list: () => apiRequest<Connector[]>('/api/connectors'),
  catalog: () => apiRequest<Connector[]>('/api/connectors/catalog'),
  connect: (connectorId: string) =>
    apiRequest<Connector>(`/api/connectors/${encodeURIComponent(connectorId)}/connect`, {
      method: 'POST',
      body: jsonBody({}),
    }),
  disconnect: (connectorId: string) =>
    apiRequest<Connector>(`/api/connectors/${encodeURIComponent(connectorId)}/disconnect`, {
      method: 'POST',
      body: jsonBody({}),
    }),
  setEnabled: (connectorId: string, enabled: boolean) =>
    apiRequest<Connector>(`/api/connectors/${encodeURIComponent(connectorId)}`, {
      method: 'PATCH',
      body: jsonBody({ enabled }),
    }),
  remove: (connectorId: string) =>
    apiRequest<void>(`/api/connectors/${encodeURIComponent(connectorId)}`, {
      method: 'DELETE',
    }),
}
