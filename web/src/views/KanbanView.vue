<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PlusIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
import { useTasksStore } from '@/stores/tasks'
import TaskModal from '@/components/Task/TaskModal.vue'
import type { Task } from '@/types/task'

interface Column {
  id: string
  title: string
  wipLimit?: number
}

const tasksStore = useTasksStore()
const isLoading = ref(true)
const isTaskModalOpen = ref(false)
const selectedColumnId = ref<string>('todo')

const columns = ref<Column[]>([
  { id: 'todo', title: '待办', wipLimit: 5 },
  { id: 'in-progress', title: '进行中', wipLimit: 3 },
  { id: 'review', title: '审查中', wipLimit: null },
  { id: 'done', title: '已完成', wipLimit: null }
])

onMounted(async () => {
  try {
    // 获取当前用户的任务数据
    // TODO: 替换为实际的看板ID
    await tasksStore.fetchBoard('default-board')
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    isLoading.value = false
  }
})

const getTasksForColumn = (columnId: string) => {
  return tasksStore.tasks.filter(task => task.columnId === columnId)
}

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'border-red-400'
    case 'medium': return 'border-yellow-400'
    case 'low': return 'border-green-400'
    default: return 'border-gray-200'
  }
}

const getDeadlineColor = (dueAt?: Date) => {
  if (!dueAt) return 'border-gray-200'

  const now = new Date()
  const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilDue < 0) return 'border-red-500'
  if (hoursUntilDue < 24) return 'border-red-400'
  if (hoursUntilDue < 72) return 'border-yellow-400'
  return 'border-green-400'
}

const formatDeadline = (dueAt?: Date) => {
  if (!dueAt) return ''
  return dueAt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const getWipLimitClass = (column: Column) => {
  if (!column.wipLimit) return ''
  const taskCount = getTasksForColumn(column.id).length
  if (taskCount >= column.wipLimit) return 'text-red-600 bg-red-50'
  if (taskCount >= column.wipLimit * 0.8) return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}

const onDragStart = (event: DragEvent, task: Task) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', task.id)
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const openTaskModal = (columnId: string) => {
  selectedColumnId.value = columnId
  isTaskModalOpen.value = true
}

const closeTaskModal = () => {
  isTaskModalOpen.value = false
  selectedColumnId.value = 'todo'
}

const handleTaskSave = async (taskData: any) => {
  try {
    // 设置任务的列ID
    taskData.columnId = selectedColumnId.value

    // TODO: 替换为实际的看板ID
    await tasksStore.createTask('default-board', taskData)
    closeTaskModal()
  } catch (error) {
    console.error('Failed to create task:', error)
  }
}

const onDrop = async (event: DragEvent, columnId: string) => {
  event.preventDefault()
  if (event.dataTransfer) {
    const taskId = event.dataTransfer.getData('text/plain')
    const task = tasksStore.tasks.find(t => t.id === taskId)
    if (task && task.columnId !== columnId) {
      try {
        // 调用API更新任务状态
        await tasksStore.moveTask(taskId, columnId)
      } catch (error) {
        console.error('Failed to move task:', error)
      }
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 页面标题 -->
    <div class="main-content mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">看板</h1>
          <p class="mt-2 text-gray-600">拖拽任务卡片来更改状态</p>
        </div>
        <button class="btn btn-primary">
          <PlusIcon class="w-4 h-4 mr-2" />
          添加列
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="loading-spinner w-10 h-10"></div>
    </div>

    <!-- 看板主体 -->
    <div v-else class="main-content overflow-x-auto pb-6">
      <div class="flex gap-4 min-w-max">
        <div
          v-for="column in columns"
          :key="column.id"
          class="flex-shrink-0 w-96"
          @dragover="onDragOver"
          @drop="onDrop($event, column.id)"
        >
          <div class="kanban-column">
            <!-- 列标题 -->
            <div class="kanban-header">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">{{ column.title }}</h3>
                <div class="flex items-center gap-2">
                  <!-- WIP 限制指示器 -->
                  <div v-if="column.wipLimit" class="flex items-center">
                    <div class="w-16 h-2 bg-gray-200 rounded-full mr-2">
                      <div
                        class="h-2 rounded-full transition-all duration-300"
                        :class="{
                          'bg-red-500': getTasksForColumn(column.id).length >= column.wipLimit,
                          'bg-yellow-500': getTasksForColumn(column.id).length >= column.wipLimit * 0.8,
                          'bg-green-500': getTasksForColumn(column.id).length < column.wipLimit * 0.8
                        }"
                        :style="`width: ${(getTasksForColumn(column.id).length / column.wipLimit) * 100}%`"
                      ></div>
                    </div>
                    <span
                      :class="`text-xs font-medium ${getWipLimitClass(column)}`"
                    >
                      {{ getTasksForColumn(column.id).length }}/{{ column.wipLimit }}
                    </span>
                  </div>
                  <span v-else class="badge badge-gray">
                    {{ getTasksForColumn(column.id).length }}
                  </span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="flex items-center gap-1 mt-3">
                <button
                  @click="openTaskModal(column.id)"
                  class="btn btn-ghost btn-sm flex-1"
                  title="添加任务"
                >
                  <PlusIcon class="w-4 h-4 mr-1" />
                  添加任务
                </button>
                <button class="btn btn-ghost btn-sm" title="列设置">
                  <EllipsisVerticalIcon class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- 任务卡片列表 -->
            <div class="space-y-3 min-h-[400px]">
              <div
                v-for="task in getTasksForColumn(column.id)"
                :key="task.id"
                draggable="true"
                @dragstart="onDragStart($event, task)"
                class="task-card group"
                :class="`border-l-4 priority-${task.priority}`"
                @click="$router.push(`/task/${task.id}`)"
              >
                <!-- 任务头部 -->
                <div class="flex items-start justify-between mb-3">
                  <h4 class="font-medium text-gray-900 flex-1 mr-2">{{ task.title }}</h4>
                  <div
                    v-if="task.dueAt"
                    class="px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap"
                    :class="{
                      'deadline-overdue': getDeadlineColor(task.dueAt) === 'border-red-500',
                      'deadline-soon': getDeadlineColor(task.dueAt) === 'border-yellow-400',
                      'deadline-normal': getDeadlineColor(task.dueAt) === 'border-green-400'
                    }"
                  >
                    {{ formatDeadline(task.dueAt) }}
                  </div>
                </div>

                <!-- 任务描述 -->
                <p v-if="task.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
                  {{ task.description }}
                </p>

                <!-- 标签 -->
                <div v-if="task.labels.length > 0" class="flex flex-wrap gap-1 mb-3">
                  <span
                    v-for="label in task.labels.slice(0, 3)"
                    :key="label"
                    class="badge badge-gray"
                  >
                    {{ label }}
                  </span>
                  <span
                    v-if="task.labels.length > 3"
                    class="badge badge-gray"
                  >
                    +{{ task.labels.length - 3 }}
                  </span>
                </div>

                <!-- 底部信息 -->
                <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                  <!-- 进度条 -->
                  <div v-if="task.progress > 0" class="flex-1 mr-3">
                    <div class="flex items-center text-xs text-gray-500 mb-1">
                      <div class="w-12 h-2 bg-gray-200 rounded-full mr-2">
                        <div
                          class="h-2 bg-blue-600 rounded-full transition-all duration-300"
                          :style="`width: ${task.progress}%`"
                        ></div>
                      </div>
                      <span>{{ task.progress }}%</span>
                    </div>
                  </div>

                  <!-- 优先级指示器 -->
                  <div class="flex items-center gap-1">
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="{
                        'bg-red-500': task.priority === 'high',
                        'bg-yellow-500': task.priority === 'medium',
                        'bg-green-500': task.priority === 'low'
                      }"
                    ></div>
                    <span class="text-xs text-gray-500">
                      {{ task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低' }}
                    </span>
                  </div>
                </div>

                <!-- 拖拽提示 -->
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div class="text-xs text-gray-400">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <!-- 空状态提示 -->
              <div v-if="getTasksForColumn(column.id).length === 0" class="text-center py-12 text-gray-400">
                <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <PlusIcon class="w-8 h-8 text-gray-300" />
                </div>
                <p class="text-sm mb-2">暂无任务</p>
                <button
                  @click="openTaskModal(column.id)"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  添加第一个任务
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务创建模态框 -->
    <TaskModal
      :is-open="isTaskModalOpen"
      :column-id="selectedColumnId"
      @close="closeTaskModal"
      @save="handleTaskSave"
    />
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>