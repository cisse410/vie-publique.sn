<template>
  <div class="tree-view p-4">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-3">
      <TreeSkeleton v-for="i in 5" :key="i" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!treeData || treeData.length === 0" class="py-12 text-center text-gray-500 dark:text-gray-400">
      <p class="text-lg">Aucune entité trouvée</p>
      <p class="mt-2 text-sm">Essayez de modifier vos filtres de recherche</p>
    </div>

    <!-- Tree nodes -->
    <div v-else class="space-y-1">
      <TreeNode
        v-for="root in treeData"
        :key="root.snapshot.id"
        :node="root"
        :changes="changes"
        :search-query="searchQuery"
        @node-click="handleNodeClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotComparison, TreeNode } from '~~/types/etat'

interface Props {
  treeData: TreeNode[]
  loading?: boolean
  changes?: Map<string, SnapshotComparison>
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  changes: () => new Map(),
  searchQuery: '',
})

const emit = defineEmits<{
  'node-click': [node: TreeNode]
}>()

const handleNodeClick = (node: TreeNode) => {
  emit('node-click', node)
}
</script>
