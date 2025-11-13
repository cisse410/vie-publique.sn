<template>
  <button
    :class="[
      'inline-flex items-center gap-1.5 rounded-full text-sm font-medium transition-all',
      colorClasses,
      sizeClasses,
    ]"
    @click="$emit('click')"
  >
    <span>{{ type.label }}</span>
    <span v-if="count !== undefined" class="ml-1 opacity-75">({{ count }})</span>
  </button>
</template>

<script setup lang="ts">
import type { EntityType } from '~~/types/etat'
import { getEntityColor } from '~~/utils/entity-icons'

interface Props {
  type: EntityType
  active?: boolean
  count?: number
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  size: 'md',
})

defineEmits<{
  click: []
}>()

const color = computed(() => getEntityColor(props.type.code))

const colorClasses = computed(() => {
  const c = color.value

  // Map of explicit color classes for Tailwind JIT
  const activeMap: Record<string, string> = {
    'blue': 'bg-blue-500 dark:bg-blue-600 text-white shadow-md',
    'green': 'bg-green-500 dark:bg-green-600 text-white shadow-md',
    'purple': 'bg-purple-500 dark:bg-purple-600 text-white shadow-md',
    'orange': 'bg-orange-500 dark:bg-orange-600 text-white shadow-md',
    'red': 'bg-red-500 dark:bg-red-600 text-white shadow-md',
    'yellow': 'bg-yellow-500 dark:bg-yellow-600 text-white shadow-md',
    'pink': 'bg-pink-500 dark:bg-pink-600 text-white shadow-md',
    'indigo': 'bg-indigo-500 dark:bg-indigo-600 text-white shadow-md',
    'teal': 'bg-teal-500 dark:bg-teal-600 text-white shadow-md',
    'cyan': 'bg-cyan-500 dark:bg-cyan-600 text-white shadow-md',
    'gray': 'bg-gray-500 dark:bg-gray-600 text-white shadow-md',
  }

  const inactiveMap: Record<string, string> = {
    'blue': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800',
    'green': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800',
    'purple': 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800',
    'orange': 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800',
    'red': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800',
    'yellow': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800',
    'pink': 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-800',
    'indigo': 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800',
    'teal': 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800',
    'cyan': 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-800',
    'gray': 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
  }

  if (props.active) {
    return activeMap[c] || activeMap['gray']
  } else {
    return inactiveMap[c] || inactiveMap['gray']
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs px-2 py-0.5'
    case 'lg':
      return 'text-base px-4 py-2'
    default:
      return 'text-sm px-3 py-1'
  }
})
</script>
