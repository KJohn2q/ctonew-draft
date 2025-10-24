export interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  columnId: string
  dueAt?: Date
  plannedStart?: Date
  plannedEnd?: Date
  labels: string[]
  progress: number
  createdAt: Date
  updatedAt: Date
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  done: boolean
  dueAt?: Date
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Column {
  id: string
  title: string
  wipLimit?: number
  boardId: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Board {
  id: string
  title: string
  description?: string
  workspaceId: string
  createdAt: Date
  updatedAt: Date
}

export interface Label {
  id: string
  name: string
  color: string
  workspaceId: string
  createdAt: Date
  updatedAt: Date
}

export interface Resource {
  id: string
  taskId: string
  type: 'url' | 'file'
  value: string
  meta?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Reminder {
  id: string
  taskId: string
  offset: number // 提前多少毫秒提醒
  type: 'notification' | 'email'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  taskId?: string
  type: 'reminder' | 'deadline' | 'system'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}