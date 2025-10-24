<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftIcon, PencilIcon, TrashIcon, CheckIcon, CalendarIcon, ClockIcon, TagIcon, UserGroupIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useTasksStore } from '@/stores/tasks'
import type { Task } from '@/types/task'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()

const task = ref<Task | null>(null)
const isLoading = ref(true)
const isEditing = ref(false)
const editedTask = ref<Task | null>(null)

// 为了处理HTML date输入，创建计算属性
const editedDueAtForInput = computed({
  get: () => formatDateForInput(editedTask.value?.dueAt),
  set: (value: string) => {
    if (editedTask.value) {
      editedTask.value.dueAt = value ? new Date(value) : undefined
    }
  }
})

const editedPlannedStartForInput = computed({
  get: () => formatDateForInput(editedTask.value?.plannedStart),
  set: (value: string) => {
    if (editedTask.value) {
      editedTask.value.plannedStart = value ? new Date(value) : undefined
    }
  }
})

const editedPlannedEndForInput = computed({
  get: () => formatDateForInput(editedTask.value?.plannedEnd),
  set: (value: string) => {
    if (editedTask.value) {
      editedTask.value.plannedEnd = value ? new Date(value) : undefined
    }
  }
})

const formatDateForInput = (date?: Date) => {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

const completedSubtasks = computed(() => {
  if (!task.value || !task.value.subtasks) return 0
  return task.value.subtasks.filter(st => st.done).length
})

const totalSubtasks = computed(() => {
  if (!task.value || !task.value.subtasks) return 0
  return task.value.subtasks.length
})

const isOverdue = computed(() => {
  if (!task.value?.dueAt) return false
  return new Date() > task.value.dueAt
})

const getDeadlineStatus = () => {
  if (!task.value?.dueAt) return { text: '无截止日期', class: 'text-gray-500' }

  const now = new Date()
  const dueDate = task.value.dueAt
  const diffTime = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffTime < 0) return { text: `已逾期 ${Math.abs(diffDays)} 天`, class: 'text-red-600' }
  if (diffDays === 0) return { text: '今天到期', class: 'text-red-600' }
  if (diffDays === 1) return { text: '明天到期', class: 'text-yellow-600' }
  if (diffDays <= 3) return { text: `${diffDays} 天后到期`, class: 'text-yellow-600' }
  return { text: `${diffDays} 天后到期`, class: 'text-green-600' }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return '高优先级'
    case 'medium': return '中优先级'
    case 'low': return '低优先级'
    default: return '未设置'
  }
}

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'badge-danger'
    case 'medium': return 'badge-warning'
    case 'low': return 'badge-success'
    default: return 'badge-gray'
  }
}

const getStatusText = (columnId: string) => {
  switch (columnId) {
    case 'todo': return '待办'
    case 'in-progress': return '进行中'
    case 'review': return '审查中'
    case 'done': return '已完成'
    default: return '未知'
  }
}

const getStatusClass = (columnId: string) => {
  switch (columnId) {
    case 'todo': return 'text-gray-600 bg-gray-100'
    case 'in-progress': return 'text-blue-600 bg-blue-100'
    case 'review': return 'text-yellow-600 bg-yellow-100'
    case 'done': return 'text-green-600 bg-green-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

onMounted(async () => {
  const taskId = route.params.id as string

  try {
    // 从任务存储中获取任务数据
    const foundTask = tasksStore.tasks.find(t => t.id === taskId)

    if (foundTask) {
      task.value = foundTask
      editedTask.value = { ...foundTask }
    } else {
      // 如果找不到任务，返回仪表板
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Failed to load task:', error)
    router.push('/dashboard')
  } finally {
    isLoading.value = false
  }
})

const startEdit = () => {
  editedTask.value = { ...task.value! }
  isEditing.value = true
}

const saveEdit = async () => {
  try {
    if (editedTask.value) {
      await tasksStore.updateTask(task.value!.id, editedTask.value)
      task.value = { ...editedTask.value }
    }
    isEditing.value = false
  } catch (error) {
    console.error('Failed to save task:', error)
  }
}

const cancelEdit = () => {
  editedTask.value = { ...task.value! }
  isEditing.value = false
}

const deleteTask = async () => {
  if (confirm('确定要删除这个任务吗？')) {
    try {
      await tasksStore.deleteTask(task.value!.id)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }
}

const toggleSubtask = async (subtaskId: string) => {
  if (!task.value?.subtasks) return

  const subtask = task.value.subtasks.find(st => st.id === subtaskId)
  if (subtask) {
    subtask.done = !subtask.done
    // 更新进度
    const completed = task.value.subtasks.filter(st => st.done).length
    const total = task.value.subtasks.length
    task.value.progress = total > 0 ? Math.round((completed / total) * 100) : 0

    try {
      await tasksStore.updateTask(task.value.id, task.value)
    } catch (error) {
      console.error('Failed to update subtask:', error)
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 页面标题和操作栏 -->
    <div class="main-content mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <button
            @click="router.go(-1)"
            class="btn btn-ghost btn-sm mr-4"
          >
            <ArrowLeftIcon class="w-4 h-4 mr-2" />
            返回
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">任务详情</h1>
            <p class="mt-1 text-gray-600">查看和管理任务的所有信息</p>
          </div>
        </div>
        <div class="flex space-x-3">
          <button
            v-if="!isEditing"
            @click="startEdit"
            class="btn btn-secondary"
          >
            <PencilIcon class="w-4 h-4 mr-2" />
            编辑
          </button>
          <button
            v-if="isEditing"
            @click="saveEdit"
            class="btn btn-primary mr-2"
          >
            保存
          </button>
          <button
            v-if="isEditing"
            @click="cancelEdit"
            class="btn btn-secondary mr-2"
          >
            取消
          </button>
          <button
            @click="deleteTask"
            class="btn btn-danger"
          >
            <TrashIcon class="w-4 h-4 mr-2" />
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="main-content flex justify-center py-20">
      <div class="loading-spinner w-12 h-12"></div>
    </div>

    <div v-else-if="task" class="main-content">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 主要内容 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- 基本信息 -->
          <div class="card card-hover p-6 fade-in-up">
            <div v-if="!isEditing">
              <div class="flex items-start justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900 flex-1 mr-4">{{ task.title }}</h2>
                <div class="flex items-center space-x-2">
                  <span :class="`badge ${getPriorityClass(task.priority)}`">
                    {{ getPriorityText(task.priority) }}
                  </span>
                  <span :class="`badge ${getStatusClass(task.columnId)}`">
                    {{ getStatusText(task.columnId) }}
                  </span>
                </div>
              </div>
              <div v-if="task.description" class="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {{ task.description }}
              </div>
            </div>
            <div v-else>
              <input
                v-model="editedTask.title"
                class="input text-2xl font-bold text-gray-900 mb-4"
                placeholder="任务标题..."
              />
              <textarea
                v-model="editedTask.description"
                class="input text-gray-600 h-32 resize-none mb-4"
                placeholder="任务描述..."
              />
              <div class="flex items-center space-x-4">
                <select v-model="editedTask.priority" class="input flex-1">
                  <option value="low">低优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="high">高优先级</option>
                </select>
                <select v-model="editedTask.columnId" class="input flex-1">
                  <option value="todo">待办</option>
                  <option value="in-progress">进行中</option>
                  <option value="review">审查中</option>
                  <option value="done">已完成</option>
                </select>
              </div>
            </div>

            <!-- 标签 -->
            <div v-if="task.labels.length > 0" class="flex flex-wrap gap-2 mb-6">
              <span
                v-for="label in task.labels"
                :key="label"
                class="badge badge-gray"
              >
                <TagIcon class="w-3 h-3 mr-1" />
                {{ label }}
              </span>
            </div>

            <!-- 进度 -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-3">
                <span class="text-sm font-medium text-gray-700">完成进度</span>
                <span class="text-sm font-semibold text-blue-600">{{ task.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div
                  class="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  :style="`width: ${task.progress}%`"
                ></div>
              </div>
            </div>

            <!-- 子任务 -->
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900">子任务</h3>
                <span class="badge badge-primary">{{ completedSubtasks }}/{{ totalSubtasks }}</span>
              </div>
              <div class="space-y-3">
                <div
                  v-for="subtask in (task.subtasks || [])"
                  :key="subtask.id"
                  class="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  @click="toggleSubtask(subtask.id)"
                >
                  <div class="flex-shrink-0 mr-3">
                    <div
                      class="w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200"
                      :class="subtask.done ? 'bg-blue-600 border-blue-600' : 'border-gray-300'"
                    >
                      <CheckIcon v-if="subtask.done" class="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <span :class="subtask.done ? 'line-through text-gray-500' : 'text-gray-900'" class="flex-1">
                    {{ subtask.title }}
                  </span>
                </div>
                <button class="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <PlusIcon class="w-4 h-4 inline mr-2" />
                  添加子任务
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 侧边栏 -->
        <div class="space-y-6">
          <!-- 任务信息 -->
          <div class="card card-hover p-6 fade-in-up">
            <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <UserGroupIcon class="w-5 h-5 mr-2 text-blue-600" />
              任务信息
            </h3>
            <div class="space-y-4">
              <!-- 截止日期 -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">截止日期</label>
                  <CalendarIcon class="w-4 h-4 text-gray-400" />
                </div>
                <div v-if="!isEditing">
                  <div v-if="task.dueAt" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span class="text-gray-900">{{ task.dueAt.toLocaleDateString('zh-CN') }}</span>
                    <span :class="`text-xs px-2 py-1 rounded-full ${getDeadlineStatus().class === 'text-red-600' ? 'bg-red-100' : getDeadlineStatus().class === 'text-yellow-600' ? 'bg-yellow-100' : 'bg-green-100'}`">
                      {{ getDeadlineStatus().text }}
                    </span>
                  </div>
                  <span v-else class="text-gray-500">未设置截止日期</span>
                </div>
                <input
                  v-else
                  v-model="editedDueAtForInput"
                  type="date"
                  class="input"
                />
              </div>

              <!-- 计划时间 -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">计划时间</label>
                  <ClockIcon class="w-4 h-4 text-gray-400" />
                </div>
                <div v-if="!isEditing">
                  <div v-if="task.plannedStart && task.plannedEnd" class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-600">{{ task.plannedStart.toLocaleDateString('zh-CN') }}</div>
                    <div class="text-sm text-gray-900 font-medium">{{ task.plannedEnd.toLocaleDateString('zh-CN') }}</div>
                  </div>
                  <span v-else class="text-gray-500">未设置计划时间</span>
                </div>
                <div v-else class="space-y-2">
                  <input
                    v-model="editedPlannedStartForInput"
                    type="date"
                    class="input"
                    placeholder="开始日期"
                  />
                  <input
                    v-model="editedPlannedEndForInput"
                    type="date"
                    class="input"
                    placeholder="结束日期"
                  />
                </div>
              </div>

              <!-- 时间信息 -->
              <div class="pt-4 border-t border-gray-200">
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">创建时间</span>
                    <span class="text-gray-500">{{ task.createdAt.toLocaleString('zh-CN') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">最后更新</span>
                    <span class="text-gray-500">{{ task.updatedAt.toLocaleString('zh-CN') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="card card-hover p-6 fade-in-up">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
            <div class="space-y-3">
              <button class="btn btn-secondary w-full">
                <CalendarIcon class="w-4 h-4 mr-2" />
                添加到日历
              </button>
              <button class="btn btn-secondary w-full">
                <UserGroupIcon class="w-4 h-4 mr-2" />
                分配给他人
              </button>
              <button class="btn btn-secondary w-full">
                <ClockIcon class="w-4 h-4 mr-2" />
                设置提醒
              </button>
              <button class="btn btn-secondary w-full">
                <TagIcon class="w-4 h-4 mr-2" />
                复制任务
              </button>
            </div>
          </div>

          <!-- 相关统计 -->
          <div class="card card-hover p-6 fade-in-up">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">相关统计</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span class="text-sm text-blue-700">子任务完成率</span>
                <span class="text-sm font-semibold text-blue-900">{{ Math.round((completedSubtasks / totalSubtasks) * 100) || 0 }}%</span>
              </div>
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span class="text-sm text-green-700">任务进度</span>
                <span class="text-sm font-semibold text-green-900">{{ task.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>