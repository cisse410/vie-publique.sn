<template>
  <div class="list-view p-4">
    <!-- Stats bar -->
    <div v-if="filteredEntities.length > 0" class="mb-4 text-sm text-gray-600">
      <span class="font-medium">{{ filteredEntities.length }}</span>
      {{ pluralize(filteredEntities.length, 'entité', 'entités') }}
      <span v-if="searchQuery"> correspondant à "{{ searchQuery }}"</span>
    </div>

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
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <Pagination v-model="currentPage" :total-pages="totalPages" />
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
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  changes: () => new Map(),
  searchQuery: '',
  selectedTypes: () => [],
})

const emit = defineEmits<{
  'entity-click': [node: TreeNode]
}>()

const currentPage = ref(1)
const perPage = 20

// Flatten tree
const allEntities = computed(() => flattenTree(props.treeData))

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
    currentPage.value = 1
  },
)
</script>
