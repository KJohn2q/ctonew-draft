<script setup lang="ts">
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Task, Column } from '@/types/task'
import DraggableTask from './DraggableTask.vue'
import { PlusIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'

interface Props {
  column: Column
  tasks: Task[]
  activeTask?: Task | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'task-click': [task: Task]
  'task-move': [taskId: string, newColumnId: string]
  'task-reorder': [taskIds: string[]]
  'add-task': [columnId: string]
  'column-settings': [columnId: string]
}>()

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  })
)

const getWipLimitClass = (column: Column, taskCount: number) => {
  if (!column.wipLimit) return ''
  if (taskCount >= column.wipLimit) return 'text-red-600 bg-red-50'
  if (taskCount >= column.wipLimit * 0.8) return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}

const handleDragStart = (event: DragStartEvent) => {
  // 拖拽开始时的处理
}

const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event

  if (over) {
    const activeId = active.id as string
    const overId = over.id as string

    // 如果拖拽到列上而不是另一个任务上
    if (over.data.current?.type === 'column') {
      const columnId = over.id as string
      emit('task-move', activeId, columnId)
    }
  }
}

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event

  if (over && active.id !== over.id) {
    const activeId = active.id as string
    const overId = over.id as string

    // 重新排序同一列中的任务
    const oldIndex = props.tasks.findIndex(task => task.id === activeId)
    const newIndex = props.tasks.findIndex(task => task.id === overId)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newTaskIds = [...props.tasks.map(task => task.id)]
      newTaskIds.splice(oldIndex, 1)
      newTaskIds.splice(newIndex, 0, activeId)
      emit('task-reorder', newTaskIds)
    }
  }
}
</script>

<template>
  <div class="flex-shrink-0 w-80">
    <div class="bg-gray-100 rounded-lg p-4">
      <!-- 列标题 -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-medium text-gray-900">{{ column.title }}</h3>
        <div class="flex items-center gap-2">
          <span
            v-if="column.wipLimit"
            :class="`px-2 py-1 text-xs font-medium rounded-full ${getWipLimitClass(column, tasks.length)}`"
          >
            {{ tasks.length }}/{{ column.wipLimit }}
          </span>
          <span v-else class="text-gray-500 text-sm">
            {{ tasks.length }}
          </span>
          <button
            @click="emit('add-task', column.id)"
            class="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <PlusIcon class="w-4 h-4" />
          </button>
          <button
            @click="emit('column-settings', column.id)"
            class="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <EllipsisVerticalIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="space-y-2 min-h-[200px]">
        <DndContext
          :sensors="sensors"
          :collision-detection="closestCenter"
          @drag-start="handleDragStart"
          @drag-over="handleDragOver"
          @drag-end="handleDragEnd"
        >
          <SortableContext
            :items="tasks.map(task => task.id)"
            :strategy="verticalListSortingStrategy"
          >
            <DraggableTask
              v-for="task in tasks"
              :key="task.id"
              :task="task"
              @click="emit('task-click', $event)"
            />
          </SortableContext>

          <DragOverlay v-if="activeTask">
            <DraggableTask :task="activeTask" />
          </DragOverlay>
        </DndContext>

        <!-- 添加任务按钮 -->
        <button
          @click="emit('add-task', column.id)"
          class="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + 添加任务
        </button>
      </div>
    </div>
  </div>
</template>