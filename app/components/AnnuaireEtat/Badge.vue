<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      colorClasses,
    ]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  color?: 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'yellow'
  variant?: 'solid' | 'outline'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'gray',
  variant: 'solid',
})

const colorClasses = computed(() => {
  const { color, variant } = props

  if (variant === 'outline') {
    const outlineMap = {
      green: 'border border-green-500 dark:border-green-400 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30',
      orange: 'border border-orange-500 dark:border-orange-400 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30',
      red: 'border border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30',
      blue: 'border border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30',
      gray: 'border border-gray-500 dark:border-gray-400 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800',
      yellow: 'border border-yellow-500 dark:border-yellow-400 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30',
    }
    return outlineMap[color]
  }

  const solidMap = {
    green: 'bg-green-500 dark:bg-green-600 text-white',
    orange: 'bg-orange-500 dark:bg-orange-600 text-white',
    red: 'bg-red-500 dark:bg-red-600 text-white',
    blue: 'bg-blue-500 dark:bg-blue-600 text-white',
    gray: 'bg-gray-500 dark:bg-gray-600 text-white',
    yellow: 'bg-yellow-500 dark:bg-yellow-600 text-white',
  }
  return solidMap[color]
})
</script>
