<template>
  <button
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all',
      active
        ? `bg-${color}-500 text-white shadow-md`
        : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`,
      sizeClasses,
    ]"
    @click="$emit('click')"
  >
    <span>{{ icon }}</span>
    <span>{{ type.label }}</span>
    <span v-if="count !== undefined" class="ml-1 opacity-75">({{ count }})</span>
  </button>
</template>

<script setup lang="ts">
import type { EntityType } from '~~/types/etat'
import { getEntityColor, getEntityIcon } from '~~/utils/entity-icons'

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

const icon = computed(() => getEntityIcon(props.type.code))
const color = computed(() => getEntityColor(props.type.code))

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
