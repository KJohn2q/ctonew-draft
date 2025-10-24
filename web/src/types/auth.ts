export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: Date
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}