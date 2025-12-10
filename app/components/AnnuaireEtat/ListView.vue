<template>
  <div class="list-view p-4">

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-primary animate-spin" />
        <span class="text-lg font-medium text-gray-700 dark:text-gray-300">Chargement des entités...</span>
      </div>
      <div class="mt-6 space-y-3 w-full max-w-2xl">
        <ListSkeleton v-for="i in 5" :key="i" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredEntities.length === 0" class="py-12 text-center text-gray-500">
      <UIcon name="i-heroicons-inbox" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-lg font-medium">Aucune entité trouvée</p>
      <p class="mt-2 text-sm">Essayez de modifier vos critères de recherche</p>
    </div>

    <!-- List items -->
    <div v-else class="space-y-3">
      <ListItem
        v-for="node in paginatedEntities"
        :key="node.entity.id"
        :node="node"
        :change="changes.get(node.entity.id)"
        :search-query="searchQuery"
        @click="$emit('entity-click', node)"
      />
    </div>

    <!-- Pagination personnalisée -->
    <div v-if="totalPages > 1" class="mt-8 flex justify-center">
      <div class="flex items-center gap-1">
        <!-- Bouton précédent -->
        <UButton
          icon="i-heroicons-chevron-left"
          size="sm"
          color="gray"
          variant="ghost"
          :disabled="currentPage === 1"
          @click="currentPage = currentPage - 1"
        />

        <!-- Première page -->
        <UButton
          v-if="totalPages > 0"
          :label="'1'"
          size="sm"
          :color="currentPage === 1 ? 'yellow' : 'gray'"
          :variant="currentPage === 1 ? 'solid' : 'ghost'"
          @click="currentPage = 1"
        />

        <!-- Points de suspension début -->
        <span v-if="currentPage > 3" class="px-2 text-gray-500">...</span>

        <!-- Pages intermédiaires -->
        <template v-for="page in totalPages" :key="page">
          <UButton
            v-if="page > 1 && page < totalPages && Math.abs(page - currentPage) <= 1"
            :label="page.toString()"
            size="sm"
            :color="currentPage === page ? 'yellow' : 'gray'"
            :variant="currentPage === page ? 'solid' : 'ghost'"
            @click="currentPage = page"
          />
        </template>

        <!-- Points de suspension fin -->
        <span v-if="currentPage < totalPages - 2" class="px-2 text-gray-500">...</span>

        <!-- Dernière page -->
        <UButton
          v-if="totalPages > 1"
          :label="totalPages.toString()"
          size="sm"
          :color="currentPage === totalPages ? 'yellow' : 'gray'"
          :variant="currentPage === totalPages ? 'solid' : 'ghost'"
          @click="currentPage = totalPages"
        />

        <!-- Bouton suivant -->
        <UButton
          icon="i-heroicons-chevron-right"
          size="sm"
          color="gray"
          variant="ghost"
          :disabled="currentPage === totalPages"
          @click="currentPage = currentPage + 1"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotComparison, TreeNode } from '~~/types/etat'
import { sortByRelevance } from '~~/utils/search'

interface Props {
  entities: TreeNode[]
  loading?: boolean
  changes?: Map<string, SnapshotComparison>
  searchQuery?: string
  selectedTypes?: string[]
  currentPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  changes: () => new Map(),
  searchQuery: '',
  selectedTypes: () => [],
  currentPage: 1,
  entities: () => [],
})

const emit = defineEmits<{
  'entity-click': [node: TreeNode]
  'update:currentPage': [page: number]
  'update:filteredCount': [count: number]
}>()

const currentPage = computed({
  get: () => props.currentPage,
  set: (value) => emit('update:currentPage', value),
})
const perPage = 20

// Track if component is mounted to avoid resetting page on initial load
const isMounted = ref(false)
onMounted(() => {
  isMounted.value = true
})

// Utilise directement la liste plate d'entités (pas de tree-builder)
const allEntities = computed(() => {
  return props.entities
})

// Filtrer et trier les entités
const filteredEntities = computed(() => {
  let result = allEntities.value

  // Filter by types
  if (props.selectedTypes.length > 0) {
    result = result.filter((node) =>
      node.type && props.selectedTypes.includes(node.type.code)
    )
  }

  // Filter by search query
  if (props.searchQuery) {
    const searchLower = props.searchQuery.toLowerCase()
    result = result.filter((node) => {
      const entityName = node.entity.canonical_name?.toLowerCase() || ''
      const officialLabel = node.snapshot.official_label?.toLowerCase() || ''
      return entityName.includes(searchLower) || officialLabel.includes(searchLower)
    })

    // Sort by search relevance
    result = sortByRelevance(result, props.searchQuery)
  } else {
    // Default sort: alphabetical
    result = [...result].sort((a, b) =>
      a.entity.canonical_name.localeCompare(b.entity.canonical_name, 'fr'),
    )
  }

  return result
})

// Émettre le nombre d'entités filtrées vers le parent
watch(
  () => filteredEntities.value.length,
  (count) => {
    emit('update:filteredCount', count)
  },
  { immediate: true }
)

// Pagination
const totalPages = computed(() => {
  return Math.ceil(filteredEntities.value.length / perPage)
})

const paginatedEntities = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return filteredEntities.value.slice(start, end)
})

// Clé réactive pour forcer le re-render de UPagination quand les filtres changent
const paginationKey = computed(() => {
  return `${filteredEntities.value.length}-${props.searchQuery}-${props.selectedTypes.join(',')}`
})

// Reset page à 1 quand les filtres changent (mais pas au montage initial)
watch(
  () => [props.searchQuery, props.selectedTypes],
  (newVal, oldVal) => {
    // Only reset if component is mounted and filters actually changed
    if (!isMounted.value) return

    // Compare old and new values to avoid resetting when only reference changes
    const [newSearch, newTypes] = newVal
    const [oldSearch, oldTypes] = oldVal || ['', []]

    const searchChanged = newSearch !== oldSearch
    const typesChanged = JSON.stringify(newTypes) !== JSON.stringify(oldTypes)

    if ((searchChanged || typesChanged) && props.currentPage !== 1) {
      emit('update:currentPage', 1)
    }
  },
)
</script>
