<script setup lang="ts">
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '@/types/task'

interface Props {
  task: Task
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: [task: Task]
}>()

const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: props.task.id })

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
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

const handleClick = () => {
  emit('click', props.task)
}
</script>

<template>
  <div
    ref="setNodeRef"
    :style="style"
    class="bg-white p-4 rounded-lg shadow-sm border-2 cursor-move hover:shadow-md transition-shadow"
    :class="getPriorityClass(task.priority)"
    v-bind="attributes"
    v-on="listeners"
    @click="handleClick"
  >
    <div class="flex items-start justify-between mb-2">
      <h4 class="font-medium text-gray-900 text-sm line-clamp-2">{{ task.title }}</h4>
      <div
        v-if="task.dueAt"
        class="px-2 py-1 text-xs rounded-full border ml-2 flex-shrink-0"
        :class="getDeadlineColor(task.dueAt)"
      >
        {{ formatDeadline(task.dueAt) }}
      </div>
    </div>

    <p v-if="task.description" class="text-gray-600 text-xs mb-3 line-clamp-2">
      {{ task.description }}
    </p>

    <div class="flex flex-wrap gap-1 mb-2">
      <span
        v-for="label in task.labels.slice(0, 3)"
        :key="label"
        class="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
      >
        {{ label }}
      </span>
      <span
        v-if="task.labels.length > 3"
        class="px-1 py-0.5 text-xs bg-gray-100 text-gray-800 rounded"
      >
        +{{ task.labels.length - 3 }}
      </span>
    </div>

    <div v-if="task.progress > 0" class="w-full bg-gray-200 rounded-full h-1">
      <div
        class="bg-blue-600 h-1 rounded-full transition-all duration-300"
        :style="`width: ${task.progress}%`"
      ></div>
    </div>
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