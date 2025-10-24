<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import type { Task } from '@/types/task'

interface Props {
  isOpen: boolean
  task?: Task | null
  columnId?: string
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  columnId: 'todo'
})

const emit = defineEmits<{
  close: []
  save: [task: Partial<Task>]
}>()

const form = ref<Partial<Task>>({
  title: '',
  description: '',
  priority: 'medium',
  columnId: props.columnId,
  dueAt: undefined,
  plannedStart: undefined,
  plannedEnd: undefined,
  labels: [],
  progress: 0
})

// 为了处理HTML date输入，创建计算属性
const plannedStartForInput = computed({
  get: () => formatDateForInput(form.value.plannedStart),
  set: (value: string) => {
    form.value.plannedStart = value ? new Date(value) : undefined
  }
})

const plannedEndForInput = computed({
  get: () => formatDateForInput(form.value.plannedEnd),
  set: (value: string) => {
    form.value.plannedEnd = value ? new Date(value) : undefined
  }
})

const dueAtForInput = computed({
  get: () => formatDateForInput(form.value.dueAt),
  set: (value: string) => {
    form.value.dueAt = value ? new Date(value) : undefined
  }
})

const newLabel = ref('')
const isLoading = ref(false)

const isEditing = computed(() => !!props.task?.id)

const isValid = computed(() => {
  return form.value.title && form.value.title.trim().length > 0
})

const priorityOptions = [
  { value: 'low', label: '低优先级', class: 'text-green-600 bg-green-50' },
  { value: 'medium', label: '中优先级', class: 'text-yellow-600 bg-yellow-50' },
  { value: 'high', label: '高优先级', class: 'text-red-600 bg-red-50' }
]

// 监听props变化，重置表单
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    if (props.task) {
      // 编辑模式
      form.value = { ...props.task }
    } else {
      // 新建模式
      form.value = {
        title: '',
        description: '',
        priority: 'medium',
        columnId: props.columnId,
        dueAt: undefined,
        plannedStart: undefined,
        plannedEnd: undefined,
        labels: [],
        progress: 0
      }
    }
  }
})

const addLabel = () => {
  const label = newLabel.value.trim()
  if (label && !form.value.labels?.includes(label)) {
    if (!form.value.labels) {
      form.value.labels = []
    }
    form.value.labels.push(label)
    newLabel.value = ''
  }
}

const removeLabel = (index: number) => {
  if (form.value.labels) {
    form.value.labels.splice(index, 1)
  }
}

const handleSave = async () => {
  if (!isValid.value || isLoading.value) return

  isLoading.value = true

  try {
    // 构建要保存的任务数据
    const taskData: Partial<Task> = {
      title: form.value.title?.trim(),
      description: form.value.description?.trim() || undefined,
      priority: form.value.priority || 'medium',
      columnId: form.value.columnId || props.columnId,
      dueAt: form.value.dueAt,
      plannedStart: form.value.plannedStart,
      plannedEnd: form.value.plannedEnd,
      labels: form.value.labels || [],
      progress: form.value.progress || 0
    }

    emit('save', taskData)
  } catch (error) {
    console.error('Save error:', error)
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  emit('close')
}

const formatDateForInput = (date?: Date) => {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50'
    case 'medium': return 'text-yellow-600 bg-yellow-50'
    case 'low': return 'text-green-600 bg-green-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="modal-overlay flex items-center justify-center z-50 p-4"
    @click.self="handleClose"
  >
    <div class="modal-content">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            {{ isEditing ? '编辑任务' : '创建任务' }}
          </h2>
          <p class="mt-1 text-sm text-gray-600">
            {{ isEditing ? '修改任务信息和设置' : '填写任务详情并设置相关信息' }}
          </p>
        </div>
        <button
          @click="handleClose"
          class="btn btn-ghost btn-sm rounded-full"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6">
        <form @submit.prevent="handleSave" class="space-y-6">
          <!-- 基本信息 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">基本信息</h3>

            <!-- 标题 -->
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                任务标题 <span class="text-red-500">*</span>
              </label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                required
                class="input"
                :class="{ 'input-error': !form.title }"
                placeholder="输入任务标题"
              />
            </div>

            <!-- 描述 -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                任务描述
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="4"
                class="input resize-none"
                placeholder="输入任务描述（可选）"
              />
            </div>
          </div>

          <!-- 分类设置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">分类设置</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 优先级 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="option in priorityOptions"
                    :key="option.value"
                    type="button"
                    @click="form.priority = option.value"
                    class="btn text-sm py-2"
                    :class="{
                      'btn-primary': form.priority === option.value,
                      'btn-secondary': form.priority !== option.value
                    }"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <!-- 状态 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  状态
                </label>
                <select
                  v-model="form.columnId"
                  class="input"
                >
                  <option value="todo">待办</option>
                  <option value="in-progress">进行中</option>
                  <option value="review">审查中</option>
                  <option value="done">已完成</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 时间安排 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">时间安排</h3>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="plannedStart" class="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon class="w-4 h-4 inline mr-1" />
                  计划开始
                </label>
                <input
                  id="plannedStart"
                  v-model="plannedStartForInput"
                  type="date"
                  class="input"
                />
              </div>

              <div>
                <label for="plannedEnd" class="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon class="w-4 h-4 inline mr-1" />
                  计划结束
                </label>
                <input
                  id="plannedEnd"
                  v-model="plannedEndForInput"
                  type="date"
                  class="input"
                />
              </div>

              <div>
                <label for="dueAt" class="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon class="w-4 h-4 inline mr-1 text-red-500" />
                  截止日期
                </label>
                <input
                  id="dueAt"
                  v-model="dueAtForInput"
                  type="date"
                  class="input"
                />
              </div>
            </div>
          </div>

          <!-- 进度和标签 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">其他设置</h3>

            <!-- 进度 -->
            <div>
              <label for="progress" class="block text-sm font-medium text-gray-700 mb-2">
                完成进度
              </label>
              <div class="flex items-center space-x-4">
                <input
                  id="progress"
                  v-model.number="form.progress"
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div class="flex items-center">
                  <span class="text-lg font-semibold text-gray-900 w-12 text-center">
                    {{ form.progress }}%
                  </span>
                </div>
              </div>
            </div>

            <!-- 标签 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div v-if="form.labels && form.labels.length > 0" class="flex flex-wrap gap-2 mb-3">
                <span
                  v-for="(label, index) in form.labels"
                  :key="index"
                  class="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {{ label }}
                  <button
                    type="button"
                    @click="removeLabel(index)"
                    class="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <XMarkIcon class="w-4 h-4" />
                  </button>
                </span>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="newLabel"
                  @keyup.enter="addLabel"
                  type="text"
                  class="input"
                  placeholder="输入标签名称"
                />
                <button
                  type="button"
                  @click="addLabel"
                  class="btn btn-primary"
                >
                  添加标签
                </button>
              </div>
            </div>
          </div>

          <!-- 按钮 -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              @click="handleClose"
              class="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="!isValid || isLoading"
              class="btn btn-primary"
            >
              <div v-if="isLoading" class="flex items-center">
                <div class="loading-spinner w-4 h-4 mr-2"></div>
                {{ isEditing ? '更新中...' : '创建中...' }}
              </div>
              <span v-else>{{ isEditing ? '更新任务' : '创建任务' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>