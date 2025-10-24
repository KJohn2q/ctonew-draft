import axios from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'

// TODO: 配置环境变量
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器 - 添加认证token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器 - 处理token过期
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refreshToken,
              })

              const { accessToken } = response.data
              localStorage.setItem('accessToken', accessToken)

              // 重试原始请求
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // 刷新失败，跳转到登录页
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // 认证相关API
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async signup(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/signup', { email, password, name })
    return response.data
  }

  async logout() {
    const response = await this.client.post('/auth/logout')
    return response.data
  }

  async refreshAccessToken(refreshToken: string) {
    const response = await this.client.post('/auth/refresh', { refreshToken })
    return response.data
  }

  // 工作空间相关API
  async getWorkspaces() {
    const response = await this.client.get('/workspaces')
    return response.data
  }

  async createWorkspace(name: string, description?: string) {
    const response = await this.client.post('/workspaces', { name, description })
    return response.data
  }

  async getWorkspaceBoards(workspaceId: string) {
    const response = await this.client.get(`/workspaces/${workspaceId}/boards`)
    return response.data
  }

  async createBoard(workspaceId: string, title: string, description?: string) {
    const response = await this.client.post(`/workspaces/${workspaceId}/boards`, { title, description })
    return response.data
  }

  // 看板相关API
  async getBoard(boardId: string) {
    const response = await this.client.get(`/boards/${boardId}`)
    return response.data
  }

  async updateBoard(boardId: string, data: any) {
    const response = await this.client.patch(`/boards/${boardId}`, data)
    return response.data
  }

  async getBoardColumns(boardId: string) {
    const response = await this.client.get(`/boards/${boardId}/columns`)
    return response.data
  }

  async createColumn(boardId: string, title: string, wipLimit?: number) {
    const response = await this.client.post(`/boards/${boardId}/columns`, { title, wipLimit })
    return response.data
  }

  async updateColumn(columnId: string, data: any) {
    const response = await this.client.patch(`/columns/${columnId}`, data)
    return response.data
  }

  async deleteColumn(columnId: string) {
    const response = await this.client.delete(`/columns/${columnId}`)
    return response.data
  }

  // 任务相关API
  async getBoardTasks(boardId: string, filters?: {
    status?: string
    label?: string
    dueRange?: { start: Date; end: Date }
    assignee?: string
  }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.label) params.append('label', filters.label)
    if (filters?.dueRange) {
      params.append('dueStart', filters.dueRange.start.toISOString())
      params.append('dueEnd', filters.dueRange.end.toISOString())
    }
    if (filters?.assignee) params.append('assignee', filters.assignee)

    const response = await this.client.get(`/boards/${boardId}/tasks?${params.toString()}`)
    return response.data
  }

  async createTask(boardId: string, data: any) {
    const response = await this.client.post(`/boards/${boardId}/tasks`, data)
    return response.data
  }

  async getTask(taskId: string) {
    const response = await this.client.get(`/tasks/${taskId}`)
    return response.data
  }

  async updateTask(taskId: string, data: any) {
    const response = await this.client.patch(`/tasks/${taskId}`, data)
    return response.data
  }

  async deleteTask(taskId: string) {
    const response = await this.client.delete(`/tasks/${taskId}`)
    return response.data
  }

  async moveTask(taskId: string, columnId: string) {
    const response = await this.client.patch(`/tasks/${taskId}/move`, { columnId })
    return response.data
  }

  async planTaskTime(taskId: string, plannedStart?: Date, plannedEnd?: Date) {
    const response = await this.client.patch(`/tasks/${taskId}/planTime`, { plannedStart, plannedEnd })
    return response.data
  }

  // 子任务相关API
  async getTaskSubtasks(taskId: string) {
    const response = await this.client.get(`/tasks/${taskId}/subtasks`)
    return response.data
  }

  async createSubtask(taskId: string, title: string, dueAt?: Date, order?: number) {
    const response = await this.client.post(`/tasks/${taskId}/subtasks`, { title, dueAt, order })
    return response.data
  }

  async updateSubtask(subtaskId: string, data: any) {
    const response = await this.client.patch(`/subtasks/${subtaskId}`, data)
    return response.data
  }

  async deleteSubtask(subtaskId: string) {
    const response = await this.client.delete(`/subtasks/${subtaskId}`)
    return response.data
  }

  // 资源相关API
  async getTaskResources(taskId: string) {
    const response = await this.client.get(`/tasks/${taskId}/resources`)
    return response.data
  }

  async createResource(taskId: string, type: 'url' | 'file', value: string, meta?: any) {
    const response = await this.client.post(`/tasks/${taskId}/resources`, { type, value, meta })
    return response.data
  }

  async deleteResource(resourceId: string) {
    const response = await this.client.delete(`/resources/${resourceId}`)
    return response.data
  }

  // 日历相关API
  async getCalendarTasks(workspaceId: string, from: Date, to: Date) {
    const response = await this.client.get(`/calendar?workspaceId=${workspaceId}&from=${from.toISOString()}&to=${to.toISOString()}`)
    return response.data
  }

  // 提醒和通知相关API
  async createReminder(taskId: string, offset: number, type: 'notification' | 'email' = 'notification') {
    const response = await this.client.post('/reminders', { taskId, offset, type })
    return response.data
  }

  async getNotifications() {
    const response = await this.client.get('/notifications')
    return response.data
  }

  async markNotificationAsRead(notificationId: string) {
    const response = await this.client.patch(`/notifications/${notificationId}`, { isRead: true })
    return response.data
  }
}

export const apiClient = new ApiClient()
export default apiClient