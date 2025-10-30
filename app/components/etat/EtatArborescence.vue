<script setup lang="ts">
import type { OrgUnitWithComparison } from '../../../types/etat'
import TreeNodeEtat from './TreeNodeEtat.vue';

interface Props {
  tree: OrgUnitWithComparison[]
  loading?: boolean
}

const props = defineProps<Props>()

// État d'expansion des nœuds
const expandedNodes = ref<Set<string>>(new Set())

// Fonction pour toggle l'expansion d'un nœud
const toggleNode = (nodeId: string) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

// Vérifier si un nœud est expansé
const isExpanded = (nodeId: string) => expandedNodes.value.has(nodeId)

// Fonction récursive pour compter les descendants
const countDescendants = (node: OrgUnitWithComparison): number => {
  if (!node.children || node.children.length === 0) return 0
  return node.children.length + node.children.reduce((sum, child) => sum + countDescendants(child), 0)
}

// Badge color selon le statut
const getBadgeColor = (badge?: string) => {
  if (badge === 'Nouveau') return 'green'
  if (badge === 'Modifié') return 'orange'
  if (badge === 'Supprimé') return 'red'
  return 'gray'
}

// Expand all nodes
const expandAll = () => {
  const addAllIds = (nodes: OrgUnitWithComparison[]) => {
    nodes.forEach(node => {
      expandedNodes.value.add(node.id)
      if (node.children && node.children.length > 0) {
        addAllIds(node.children)
      }
    })
  }
  addAllIds(props.tree)
}

// Collapse all nodes
const collapseAll = () => {
  expandedNodes.value.clear()
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <!-- Header avec actions -->
    <div class="border-b border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Vue Arborescence
        </h2>
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-chevron-down"
            variant="soft"
            color="gray"
            size="xs"
            @click="expandAll"
          >
            Tout déplier
          </UButton>
          <UButton
            icon="i-heroicons-chevron-up"
            variant="soft"
            color="gray"
            size="xs"
            @click="collapseAll"
          >
            Tout replier
          </UButton>
        </div>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="p-4 space-y-2">
      <USkeleton v-for="i in 5" :key="i" class="h-12 w-full" />
    </div>

    <!-- Tree -->
    <div v-else class="p-4">
      <div v-if="tree.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
        Aucune donnée disponible
      </div>

      <!-- Recursive tree component -->
      <TreeNodeEtat
        v-for="node in tree"
        :key="node.id"
        :node="node"
        :level="0"
        :is-expanded="isExpanded(node.id)"
        @toggle="toggleNode"
      />
    </div>
  </div>
</template>
