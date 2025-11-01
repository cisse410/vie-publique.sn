<script setup lang="ts">
interface Props {
  stats?: {
    total: number
    nouveaux: number
    renommes: number
    transferes: number
    supprimes: number
    inchanges: number
  }
  previousSnapshot?: {
    numero: string
    annee: number
  }
}

const props = defineProps<Props>()

const hasChanges = computed(() => {
  if (!props.stats) return false
  return props.stats.nouveaux > 0 ||
         props.stats.renommes > 0 ||
         props.stats.transferes > 0 ||
         props.stats.supprimes > 0
})

const changeItems = computed(() => {
  if (!props.stats) return []

  const items = []

  if (props.stats.nouveaux > 0) {
    items.push({
      label: 'Nouveaux',
      count: props.stats.nouveaux,
      color: 'green',
      icon: 'i-heroicons-plus-circle'
    })
  }

  if (props.stats.renommes > 0) {
    items.push({
      label: 'Renommés',
      count: props.stats.renommes,
      color: 'blue',
      icon: 'i-heroicons-pencil'
    })
  }

  if (props.stats.transferes > 0) {
    items.push({
      label: 'Transférés',
      count: props.stats.transferes,
      color: 'purple',
      icon: 'i-heroicons-arrow-right-circle'
    })
  }

  if (props.stats.supprimes > 0) {
    items.push({
      label: 'Supprimés',
      count: props.stats.supprimes,
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
  }

  if (props.stats.inchanges > 0) {
    items.push({
      label: 'Inchangés',
      count: props.stats.inchanges,
      color: 'gray',
      icon: 'i-heroicons-check-circle'
    })
  }

  return items
})
</script>

<template>
  <div v-if="stats && hasChanges" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
    <div class="flex items-start gap-3">
      <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div class="flex-grow">
        <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Comparaison avec le décret {{ previousSnapshot?.numero || 'précédent' }}
        </h3>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="item in changeItems"
            :key="item.label"
            class="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm"
          >
            <UIcon :name="item.icon" class="w-4 h-4" :class="`text-${item.color}-600 dark:text-${item.color}-400`" />
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ item.count }}
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
