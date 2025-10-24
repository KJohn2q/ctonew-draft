<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { CalendarIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useTasksStore } from '@/stores/tasks'
import TaskModal from '@/components/Task/TaskModal.vue'

const tasksStore = useTasksStore()
const isLoading = ref(true)
const currentMonth = ref(new Date())
const isTaskModalOpen = ref(false)
const selectedDate = ref<Date | null>(null)

onMounted(async () => {
  try {
    // 获取当前用户的任务数据
    // TODO: 替换为实际的工作区ID
    await tasksStore.fetchBoard('default-board')
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    isLoading.value = false
  }
})

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50'
    case 'medium': return 'text-yellow-600 bg-yellow-50'
    case 'low': return 'text-green-600 bg-green-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

const monthYear = computed(() => {
  return currentMonth.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  })
})

const daysInMonth = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // 获取第一天是星期几（0=Sunday, 1=Monday, etc.）
  const startingDayOfWeek = firstDay.getDay()

  const days = []

  // 填充月初的空白
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }

  // 填充月份的日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }

  return days
})

const getTasksForDate = (date: Date) => {
  if (!date) return []

  return tasksStore.tasks.filter(task => {
    const taskDate = task.plannedStart || task.dueAt
    if (!taskDate) return false
    return taskDate.toDateString() === date.toDateString()
  })
}

const previousMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1)
}

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1)
}

const isToday = (date: Date) => {
  if (!date) return false
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const todayTasks = computed(() => {
  const today = new Date()
  return tasksStore.tasks.filter(task => {
    const taskDate = task.plannedStart || task.dueAt
    if (!taskDate) return false
    return taskDate.toDateString() === today.toDateString()
  })
})

const upcomingTasks = computed(() => {
  return tasksStore.tasks.filter(task => {
    if (!task.dueAt) return false
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return task.dueAt > now && task.dueAt <= weekFromNow
  })
})

const openTaskModal = (date?: Date) => {
  selectedDate.value = date || null
  isTaskModalOpen.value = true
}

const closeTaskModal = () => {
  isTaskModalOpen.value = false
  selectedDate.value = null
}

const handleTaskSave = async (taskData: any) => {
  try {
    if (selectedDate.value) {
      // 如果选择了日期，设置为计划开始时间
      taskData.plannedStart = selectedDate.value
    }

    // TODO: 替换为实际的看板ID
    await tasksStore.createTask('default-board', taskData)
    closeTaskModal()
  } catch (error) {
    console.error('Failed to create task:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 页面标题 -->
    <div class="main-content mb-8">
      <h1 class="text-3xl font-bold text-gray-900">日历</h1>
      <p class="mt-2 text-gray-600">查看和管理任务的时间安排</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="loading-spinner w-10 h-10"></div>
    </div>

    <!-- 主内容区域 -->
    <div v-else class="main-content">
      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <!-- 侧边栏 -->
        <div class="xl:col-span-1 space-y-6">
        <!-- 今日任务卡片 -->
        <div class="card card-hover p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">今日任务</h3>
            <div class="flex items-center text-blue-600">
              <CalendarIcon class="w-5 h-5" />
              <span class="ml-2 badge badge-primary">{{ todayTasks.length }}</span>
            </div>
          </div>
          <div class="space-y-3">
            <div
              v-for="task in todayTasks"
              :key="task.id"
              class="task-card border-l-4"
              :class="`priority-${task.priority}`"
              @click="$router.push(`/task/${task.id}`)"
            >
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-900">{{ task.title }}</h4>
                <span :class="`badge badge-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}`">
                  {{ task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低' }}
                </span>
              </div>
              <p v-if="task.description" class="text-sm text-gray-600 line-clamp-2">
                {{ task.description }}
              </p>
            </div>
            <div v-if="todayTasks.length === 0" class="text-center py-6 text-gray-500">
              <CalendarIcon class="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p class="text-sm">今日无任务</p>
            </div>
          </div>
        </div>

        <!-- 即将到期任务 -->
        <div class="card card-hover p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">即将到期</h3>
            <span class="badge badge-warning">{{ upcomingTasks.length }}</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="task in upcomingTasks.slice(0, 5)"
              :key="task.id"
              class="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
              @click="$router.push(`/task/${task.id}`)"
            >
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-sm text-gray-900">{{ task.title }}</h4>
                <div v-if="task.dueAt" class="flex items-center text-xs text-gray-500">
                  <CalendarIcon class="w-3 h-3 mr-1" />
                  {{ task.dueAt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }}
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="label in task.labels.slice(0, 2)"
                  :key="label"
                  class="badge badge-gray"
                >
                  {{ label }}
                </span>
              </div>
            </div>
            <div v-if="upcomingTasks.length === 0" class="text-center py-6 text-gray-500">
              <p class="text-sm">暂无即将到期的任务</p>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
          <div class="space-y-3">
            <button @click="openTaskModal()" class="btn btn-primary w-full">
              <PlusIcon class="w-4 h-4 mr-2" />
              新建任务
            </button>
            <button class="btn btn-secondary w-full">
              <CalendarIcon class="w-4 h-4 mr-2" />
              导入日历
            </button>
          </div>
        </div>
      </div>

      <!-- 日历主体 -->
      <div class="xl:col-span-3">
        <div class="card p-6">
          <!-- 月份导航 -->
          <div class="flex items-center justify-between mb-6">
            <button
              @click="previousMonth"
              class="btn btn-ghost btn-sm"
            >
              <ChevronLeftIcon class="w-4 h-4" />
            </button>
            <h2 class="text-2xl font-bold text-gray-900">{{ monthYear }}</h2>
            <button
              @click="nextMonth"
              class="btn btn-ghost btn-sm"
            >
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>

          <!-- 星期标题 -->
          <div class="grid grid-cols-7 gap-2 mb-3">
            <div class="text-center text-sm font-semibold text-gray-700 py-3 bg-gray-50 rounded-lg">日</div>
            <div class="text-center text-sm font-semibold text-gray-700 py-3 bg-gray-50 rounded-lg">一</div>
            <div class="text-center text-sm font-semibold text-gray-700 py-3 bg-gray-50 rounded-lg">二</div>
            <div class="text-center text-sm font-semibold text-gray-700 py-3 bg-gray-50 rounded-lg">三</div>
            <div class="text-center text-sm font-semibold text-gray-700 py-3 bg-gray-50 rounded-lg">四</div>
            <div class="text-center text-sm font-semibold text-gray-700 py-3 bg-gray-50 rounded-lg">五</div>
            <div class="text-center text-sm font-semibold text-gray-700 py-3 bg-gray-50 rounded-lg">六</div>
          </div>

          <!-- 日期网格 -->
          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="(date, index) in daysInMonth"
              :key="index"
              class="calendar-day rounded-lg"
              :class="{
                'calendar-day-today': isToday(date),
                'calendar-day-other-month': !date,
                'cursor-pointer': date,
                'bg-white': date
              }"
              @click="date && openTaskModal(date)"
            >
              <div v-if="date" class="h-full">
                <div
                  class="text-sm font-semibold mb-2 px-2 py-1 rounded"
                  :class="{ 'bg-blue-600 text-white': isToday(date) }"
                >
                  {{ date.getDate() }}
                </div>
                <div class="space-y-1 px-1">
                  <div
                    v-for="task in getTasksForDate(date).slice(0, 3)"
                    :key="task.id"
                    class="text-xs p-1.5 rounded cursor-pointer hover:shadow-sm transition-all duration-200 truncate"
                    :class="{
                      'bg-red-100 text-red-800 hover:bg-red-200': task.priority === 'high',
                      'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': task.priority === 'medium',
                      'bg-green-100 text-green-800 hover:bg-green-200': task.priority === 'low'
                    }"
                    @click.stop="$router.push(`/task/${task.id}`)"
                    :title="task.title"
                  >
                    {{ task.title }}
                  </div>
                  <div
                    v-if="getTasksForDate(date).length > 3"
                    class="text-xs text-center py-1 text-gray-500 bg-gray-50 rounded"
                  >
                    +{{ getTasksForDate(date).length - 3 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>

    <!-- 任务创建模态框 -->
    <TaskModal
      :is-open="isTaskModalOpen"
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

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>