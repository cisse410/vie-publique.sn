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
      green: 'border border-green-500 text-green-700 bg-green-50',
      orange: 'border border-orange-500 text-orange-700 bg-orange-50',
      red: 'border border-red-500 text-red-700 bg-red-50',
      blue: 'border border-blue-500 text-blue-700 bg-blue-50',
      gray: 'border border-gray-500 text-gray-700 bg-gray-50',
      yellow: 'border border-yellow-500 text-yellow-700 bg-yellow-50',
    }
    return outlineMap[color]
  }

  const solidMap = {
    green: 'bg-green-500 text-white',
    orange: 'bg-orange-500 text-white',
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    gray: 'bg-gray-500 text-white',
    yellow: 'bg-yellow-500 text-white',
  }
  return solidMap[color]
})
</script>
