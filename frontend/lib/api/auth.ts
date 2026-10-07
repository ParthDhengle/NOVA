import { apiRequest, jsonBody } from './client'
import type { User } from './types'

export type Credentials = { email: string; password: string }
export type Registration = Credentials & { username: string }
export type LoginResponse = {
  token: string
}

export const authApi = {
  login: async (credentials: Credentials) => {
    const response = await apiRequest<LoginResponse>(
      '/api/auth/login',
      {
        method: 'POST',
        body: jsonBody(credentials),
      }
    )

    localStorage.setItem('nova_token', response.token)

    return apiRequest<User>('/api/auth/is_auth')
  },

  register: async (registration: Registration) => {
  await apiRequest<User>('/api/auth/register', {
    method: 'POST',
    body: jsonBody(registration),
  })

  return authApi.login({
    email: registration.email,
    password: registration.password,
  })
},
  logout: async () => {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    })

    localStorage.removeItem('nova_token')
  },
  currentUser: () => apiRequest<User>('/api/auth/is_auth'),
}
