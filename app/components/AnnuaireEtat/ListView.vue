<template>
  <div class="list-view p-4">

    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <ListSkeleton v-for="i in 10" :key="i" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredEntities.length === 0" class="py-12 text-center text-gray-500">
      <p class="text-lg">Aucune entité trouvée</p>
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

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-8 flex justify-center">
      <UPagination
        v-model="currentPage"
        :total="filteredEntities.length"
        :default-page="1"
        :show-edges="true"
        :sibling-count="2"
        :active-button="{ color: 'yellow' }"
        :ui="{
          wrapper: 'flex items-center gap-1',
          base: 'min-w-8 min-h-8 flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          active: 'bg-gray-900 text-white dark:bg-gray-700',
          inactive:
            'bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotComparison, TreeNode } from '~~/types/etat'
import { pluralize } from '~~/utils/formatters'
import { searchInTree, sortByRelevance } from '~~/utils/search'
import { flattenTree } from '~~/utils/tree-builder'

interface Props {
  treeData: TreeNode[]
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
})

const emit = defineEmits<{
  'entity-click': [node: TreeNode]
  'update:currentPage': [page: number]
}>()

const currentPage = computed({
  get: () => props.currentPage,
  set: (value) => emit('update:currentPage', value),
})
const perPage = 20

// Flatten tree et exclure les entités de regroupement et sections virtuelles
const allEntities = computed(() => {
  const flattened = flattenTree(props.treeData)
  return flattened.filter(node =>
    node.type.code !== 'entite_regroupement' &&
    node.type.code !== 'section'
  )
})

// Filter and search
const filteredEntities = computed(() => {
  let result = allEntities.value

  // Filter by types
  if (props.selectedTypes.length > 0) {
    result = result.filter((node) => props.selectedTypes.includes(node.type.code))
  }

  // Search
  if (props.searchQuery) {
    const searchResults = searchInTree(props.treeData, props.searchQuery)
    const searchResultIds = new Set(flattenTree(searchResults).map((n) => n.entity.id))
    result = result.filter((node) => searchResultIds.has(node.entity.id))

    // Sort by relevance
    result = sortByRelevance(result, props.searchQuery)
  } else {
    // Default sort: alphabetical
    result = [...result].sort((a, b) =>
      a.entity.canonical_name.localeCompare(b.entity.canonical_name, 'fr'),
    )
  }

  return result
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredEntities.value.length / perPage))

const paginatedEntities = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return filteredEntities.value.slice(start, end)
})

// Reset page when filters change
watch(
  () => [props.searchQuery, props.selectedTypes],
  () => {
    if (props.currentPage !== 1) {
      emit('update:currentPage', 1)
    }
  },
)
</script>
