import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, Column, Board } from '@/types/task'
import apiClient from '@/services/api'

export const useTasksStore = defineStore('tasks', () => {
  // 状态
  const tasks = ref<Task[]>([])
  const columns = ref<Column[]>([])
  const boards = ref<Board[]>([])
  const currentBoard = ref<Board | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const tasksByColumn = computed(() => {
    const result: Record<string, Task[]> = {}

    columns.value.forEach(column => {
      result[column.id] = tasks.value.filter(task => task.columnId === column.id)
    })

    return result
  })

  const tasksByStatus = computed(() => {
    const result: Record<string, Task[]> = {
      'overdue': [],
      'due-soon': [],
      'upcoming': [],
      'no-deadline': []
    }

    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    tasks.value.forEach(task => {
      if (!task.dueAt) {
        result['no-deadline'].push(task)
      } else if (task.dueAt < now) {
        result['overdue'].push(task)
      } else if (task.dueAt <= tomorrow) {
        result['due-soon'].push(task)
      } else if (task.dueAt <= nextWeek) {
        result['upcoming'].push(task)
      } else {
        result['no-deadline'].push(task)
      }
    })

    return result
  })

  const getTaskById = computed(() => {
    return (taskId: string) => tasks.value.find(task => task.id === taskId)
  })

  const getColumnById = computed(() => {
    return (columnId: string) => columns.value.find(column => column.id === columnId)
  })

  // 辅助函数
  const saveTasksToStorage = () => {
    localStorage.setItem('tasks', JSON.stringify(tasks.value))
  }

  const saveColumnsToStorage = () => {
    localStorage.setItem('columns', JSON.stringify(columns.value))
  }

  // 方法
  const fetchBoards = async (workspaceId: string) => {
    isLoading.value = true
    error.value = null

    try {
      boards.value = await apiClient.getWorkspaceBoards(workspaceId)
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取看板失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createBoard = async (workspaceId: string, title: string, description?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const newBoard = await apiClient.createBoard(workspaceId, title, description)
      boards.value.push(newBoard)
      return newBoard
    } catch (err: any) {
      error.value = err.response?.data?.message || '创建看板失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchBoard = async (boardId: string) => {
    isLoading.value = true
    error.value = null

    try {
      // 临时解决方案：使用本地存储的模拟数据
      const storedTasks = localStorage.getItem('tasks')
      const storedColumns = localStorage.getItem('columns')

      if (storedTasks) {
        tasks.value = JSON.parse(storedTasks).map((task: any) => ({
          ...task,
          dueAt: task.dueAt ? new Date(task.dueAt) : undefined,
          plannedStart: task.plannedStart ? new Date(task.plannedStart) : undefined,
          plannedEnd: task.plannedEnd ? new Date(task.plannedEnd) : undefined,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt)
        }))
      } else {
        // 初始示例数据
        const today = new Date()
        tasks.value = [
          {
            id: '1',
            title: '完成项目提案',
            description: '准备下周一的项目提案文档',
            priority: 'high' as const,
            columnId: 'todo',
            dueAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7), // 一周后
            plannedStart: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), // 5天后
            plannedEnd: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7), // 一周后
            labels: ['工作', '重要'],
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '2',
            title: '代码审查',
            description: '审查团队成员提交的代码',
            priority: 'medium' as const,
            columnId: 'in-progress',
            dueAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3), // 3天后
            plannedStart: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), // 明天
            plannedEnd: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3), // 3天后
            labels: ['开发'],
            progress: 50,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '3',
            title: '日历测试任务',
            description: '用于测试日历显示功能的任务',
            priority: 'high' as const,
            columnId: 'todo',
            dueAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), // 5天后
            plannedStart: new Date(today.getFullYear(), today.getMonth(), 28), // 本月28号
            plannedEnd: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), // 5天后
            labels: ['测试', '日历'],
            progress: 25,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
        saveTasksToStorage()
      }

      if (storedColumns) {
        columns.value = JSON.parse(storedColumns).map((column: any) => ({
          ...column,
          createdAt: new Date(column.createdAt),
          updatedAt: new Date(column.updatedAt)
        }))
      } else {
        columns.value = [
          {
            id: 'todo',
            title: '待办',
            wipLimit: 5,
            boardId: boardId,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'in-progress',
            title: '进行中',
            wipLimit: 3,
            boardId: boardId,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'review',
            title: '审查中',
            wipLimit: null,
            boardId: boardId,
            order: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'done',
            title: '已完成',
            wipLimit: null,
            boardId: boardId,
            order: 4,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
        saveColumnsToStorage()
      }

      currentBoard.value = {
        id: boardId,
        title: '默认看板',
        description: '这是一个默认的看板',
        workspaceId: 'default-workspace',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return currentBoard.value
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取看板失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createTask = async (boardId: string, taskData: Partial<Task>) => {
    isLoading.value = true
    error.value = null

    try {
      // 临时解决方案：直接在本地创建任务
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskData.title || '',
        description: taskData.description,
        priority: taskData.priority || 'medium',
        columnId: taskData.columnId || 'todo',
        dueAt: taskData.dueAt,
        plannedStart: taskData.plannedStart,
        plannedEnd: taskData.plannedEnd,
        labels: taskData.labels || [],
        progress: taskData.progress || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      tasks.value.push(newTask)
      saveTasksToStorage()
      return newTask
    } catch (err: any) {
      error.value = err.response?.data?.message || '创建任务失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    isLoading.value = true
    error.value = null

    try {
      const updatedTask = await apiClient.updateTask(taskId, updates)

      const index = tasks.value.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }

      return updatedTask
    } catch (err: any) {
      error.value = err.response?.data?.message || '更新任务失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteTask = async (taskId: string) => {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.deleteTask(taskId)

      const index = tasks.value.findIndex(task => task.id === taskId)
      if (index !== -1) {
        tasks.value.splice(index, 1)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '删除任务失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const moveTask = async (taskId: string, newColumnId: string) => {
    isLoading.value = true
    error.value = null

    try {
      // 临时解决方案：直接在本地更新任务
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        task.columnId = newColumnId
        task.updatedAt = new Date()
        saveTasksToStorage()
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '移动任务失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const planTaskTime = async (taskId: string, plannedStart?: Date, plannedEnd?: Date) => {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.planTaskTime(taskId, plannedStart, plannedEnd)

      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        if (plannedStart) task.plannedStart = plannedStart
        if (plannedEnd) task.plannedEnd = plannedEnd
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '规划任务时间失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createColumn = async (boardId: string, title: string, wipLimit?: number) => {
    isLoading.value = true
    error.value = null

    try {
      const newColumn = await apiClient.createColumn(boardId, title, wipLimit)
      columns.value.push(newColumn)
      return newColumn
    } catch (err: any) {
      error.value = err.response?.data?.message || '创建列失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateColumn = async (columnId: string, updates: Partial<Column>) => {
    isLoading.value = true
    error.value = null

    try {
      const updatedColumn = await apiClient.updateColumn(columnId, updates)

      const index = columns.value.findIndex(column => column.id === columnId)
      if (index !== -1) {
        columns.value[index] = updatedColumn
      }

      return updatedColumn
    } catch (err: any) {
      error.value = err.response?.data?.message || '更新列失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteColumn = async (columnId: string) => {
    isLoading.value = true
    error.value = null

    try {
      await apiClient.deleteColumn(columnId)

      const index = columns.value.findIndex(column => column.id === columnId)
      if (index !== -1) {
        columns.value.splice(index, 1)
      }

      // 同时删除该列中的所有任务
      tasks.value = tasks.value.filter(task => task.columnId !== columnId)
    } catch (err: any) {
      error.value = err.response?.data?.message || '删除列失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchCalendarTasks = async (workspaceId: string, from: Date, to: Date) => {
    isLoading.value = true
    error.value = null

    try {
      const calendarTasks = await apiClient.getCalendarTasks(workspaceId, from, to)
      return calendarTasks
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取日历任务失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const reset = () => {
    tasks.value = []
    columns.value = []
    boards.value = []
    currentBoard.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    // 状态
    tasks,
    columns,
    boards,
    currentBoard,
    isLoading,
    error,

    // 计算属性
    tasksByColumn,
    tasksByStatus,
    getTaskById,
    getColumnById,

    // 方法
    fetchBoards,
    createBoard,
    fetchBoard,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    planTaskTime,
    createColumn,
    updateColumn,
    deleteColumn,
    fetchCalendarTasks,
    clearError,
    reset
  }
})