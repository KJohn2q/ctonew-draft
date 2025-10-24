<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PlusIcon, ClockIcon, CheckIcon, CalendarIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { useTasksStore } from '@/stores/tasks'
import TaskModal from '@/components/Task/TaskModal.vue'
import type { Task } from '@/types/task'

const tasksStore = useTasksStore()
const isLoading = ref(true)
const isTaskModalOpen = ref(false)
const editingTask = ref<Task | null>(null)

onMounted(async () => {
  try {
    // 获取任务数据
    await tasksStore.fetchBoard('default-board')
  } catch (error) {
    console.error('Failed to load tasks:', error)
  } finally {
    isLoading.value = false
  }
})

// 计算属性
const tasks = computed(() => tasksStore.tasks)

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

const completedTasks = computed(() => {
  return tasksStore.tasks.filter(task => task.columnId === 'done')
})

const highPriorityTasks = computed(() => {
  return tasksStore.tasks.filter(task => task.priority === 'high' && task.columnId !== 'done')
})

const getDeadlineClass = (dueAt?: Date) => {
  if (!dueAt) return 'text-gray-500'

  const now = new Date()
  const hoursUntilDue = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilDue < 0) return 'deadline-overdue'
  if (hoursUntilDue < 24) return 'deadline-soon'
  if (hoursUntilDue < 72) return 'deadline-soon'
  return 'deadline-normal'
}

const formatDeadline = (dueAt?: Date) => {
  if (!dueAt) return '无截止日期'
  return dueAt.toLocaleDateString('zh-CN')
}

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'badge-danger'
    case 'medium': return 'badge-warning'
    case 'low': return 'badge-success'
    default: return 'badge-gray'
  }
}

const openTaskModal = (task?: Task) => {
  editingTask.value = task || null
  isTaskModalOpen.value = true
}

const closeTaskModal = () => {
  isTaskModalOpen.value = false
  editingTask.value = null
}

const handleTaskSave = async (taskData: Partial<Task>) => {
  try {
    if (editingTask.value) {
      // 编辑现有任务
      await tasksStore.updateTask(editingTask.value.id, taskData)
    } else {
      // 创建新任务
      await tasksStore.createTask('default-board', taskData)
    }

    closeTaskModal()
  } catch (error) {
    console.error('Save task error:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 页面标题 -->
    <div class="main-content mb-8 fade-in-up">
      <h1 class="text-3xl font-bold text-gray-900">任务概览</h1>
      <p class="mt-2 text-gray-600">管理您的所有任务和项目</p>
    </div>

    <!-- 统计卡片 -->
    <div class="main-content mb-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in-up" style="animation-delay: 0.1s">
      <div class="card card-hover p-6 border-l-4 border-blue-500">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-blue-100 rounded-xl p-3">
            <CheckIcon class="w-6 h-6 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">今日任务</p>
            <p class="text-2xl font-bold text-gray-900 count-animation">{{ todayTasks.length }}</p>
            <p class="text-xs text-gray-500 mt-1">待处理</p>
          </div>
        </div>
      </div>

      <div class="card card-hover p-6 border-l-4 border-yellow-500">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-yellow-100 rounded-xl p-3">
            <ClockIcon class="w-6 h-6 text-yellow-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">即将到期</p>
            <p class="text-2xl font-bold text-gray-900 count-animation">{{ upcomingTasks.length }}</p>
            <p class="text-xs text-gray-500 mt-1">7天内</p>
          </div>
        </div>
      </div>

      <div class="card card-hover p-6 border-l-4 border-red-500">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-red-100 rounded-xl p-3">
            <CalendarIcon class="w-6 h-6 text-red-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">高优先级</p>
            <p class="text-2xl font-bold text-gray-900 count-animation" :class="{ 'badge-glow': highPriorityTasks.length > 0 }">{{ highPriorityTasks.length }}</p>
            <p class="text-xs text-gray-500 mt-1">需要关注</p>
          </div>
        </div>
      </div>

      <div class="card card-hover p-6 border-l-4 border-green-500">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-green-100 rounded-xl p-3">
            <UserGroupIcon class="w-6 h-6 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">已完成</p>
            <p class="text-2xl font-bold text-gray-900 count-animation">{{ completedTasks.length }}</p>
            <p class="text-xs text-gray-500 mt-1">本周完成</p>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="main-content flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div class="flex space-x-3 mb-4 sm:mb-0">
        <button class="btn btn-primary" @click="openTaskModal()">
          <PlusIcon class="w-4 h-4 mr-2" />
          新建任务
        </button>
        <button class="btn btn-secondary">
          <CalendarIcon class="w-4 h-4 mr-2" />
          批量操作
        </button>
      </div>
      <div class="flex space-x-2">
        <button class="btn btn-secondary">
          筛选
        </button>
        <button class="btn btn-secondary">
          排序
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="main-content flex justify-center py-20">
      <div class="loading-spinner w-10 h-10"></div>
    </div>

    <!-- 任务列表 -->
    <div v-else class="main-content">
      <div v-if="tasks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="task in tasks"
          :key="task.id"
          class="task-card group"
          @click="$router.push(`/task/${task.id}`)"
        >
          <!-- 任务头部 -->
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-semibold text-gray-900 flex-1 mr-2 line-clamp-2">{{ task.title }}</h3>
            <span :class="`badge ${getPriorityBadgeClass(task.priority)}`">
              {{ task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低' }}
            </span>
          </div>

          <!-- 任务描述 -->
          <p v-if="task.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
            {{ task.description }}
          </p>

          <!-- 任务信息 -->
          <div class="space-y-2">
            <!-- 截止日期 -->
            <div class="flex items-center text-sm" :class="getDeadlineClass(task.dueAt)">
              <ClockIcon class="w-4 h-4 mr-1" />
              <span>{{ formatDeadline(task.dueAt) }}</span>
            </div>

            <!-- 标签 -->
            <div v-if="task.labels.length > 0" class="flex flex-wrap gap-1">
              <span
                v-for="label in task.labels.slice(0, 2)"
                :key="label"
                class="badge badge-gray"
              >
                {{ label }}
              </span>
              <span
                v-if="task.labels.length > 2"
                class="badge badge-gray"
              >
                +{{ task.labels.length - 2 }}
              </span>
            </div>

            <!-- 进度条 -->
            <div v-if="task.progress > 0" class="space-y-1">
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>进度</span>
                <span>{{ task.progress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="`width: ${task.progress}%`"
                ></div>
              </div>
            </div>
          </div>

          <!-- 状态指示器 -->
          <div class="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
            <div class="flex items-center">
              <div
                class="w-2 h-2 rounded-full mr-2"
                :class="{
                  'bg-gray-400': task.columnId === 'todo',
                  'bg-blue-500': task.columnId === 'in-progress',
                  'bg-yellow-500': task.columnId === 'review',
                  'bg-green-500': task.columnId === 'done'
                }"
              ></div>
              <span class="text-xs text-gray-500">
                {{ task.columnId === 'todo' ? '待办' :
                   task.columnId === 'in-progress' ? '进行中' :
                   task.columnId === 'review' ? '审查中' : '已完成' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-16">
        <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <CheckIcon class="w-12 h-12 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">暂无任务</h3>
        <p class="text-gray-600 mb-8 max-w-md mx-auto">
          创建您的第一个任务来开始管理工作和项目进度
        </p>
        <button class="btn btn-primary btn-lg" @click="openTaskModal()">
          <PlusIcon class="w-5 h-5 mr-2" />
          创建任务
        </button>
      </div>
    </div>

    <!-- 任务模态框 -->
    <TaskModal
      :is-open="isTaskModalOpen"
      :task="editingTask"
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