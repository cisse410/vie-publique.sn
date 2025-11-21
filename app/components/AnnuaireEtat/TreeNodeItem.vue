<template>
  <div class="tree-node-item">
    <div
      :class="[
        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors',
        isVirtualSection
          ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800',
      ]"
      :style="{ marginLeft: `${level * 20}px` }"
      @click="handleClick"
    >
      <!-- Expand/Collapse button -->
      <button
        v-if="hasChildren"
        @click.stop="toggleExpand"
        class="flex h-5 w-5 flex-shrink-0 items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <UIcon :name="isExpanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'" class="h-4 w-4" />
      </button>
      <span v-else class="w-5 flex-shrink-0"></span>

      <!-- Icon -->
      <UIcon
        :name="nodeIcon"
        class="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
      />

      <!-- Label with search highlight -->
      <span
        :class="[
          'flex-1 truncate font-medium',
          isVirtualSection
            ? 'font-semibold text-blue-700 dark:text-blue-300'
            : 'text-gray-900 dark:text-white'
        ]"
        v-html="highlightedLabel"
      ></span>

      <!-- Badges -->
      <div class="flex flex-shrink-0 items-center gap-2">
        <UBadge v-if="changeStatus === 'new'" color="green" size="xs">Nouveau</UBadge>
        <UBadge v-else-if="changeStatus === 'modified'" color="orange" size="xs">Modifié</UBadge>
        <UBadge v-else-if="changeStatus === 'removed'" color="red" size="xs">Supprimé</UBadge>
      </div>
    </div>

    <!-- Children (recursive) -->
    <div v-if="isExpanded && hasChildren" class="mt-1">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :search-query="searchQuery"
        :changes="changes"
        @node-click="$emit('node-click', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotComparison } from '~~/types/etat'
import { highlightSearchTerm } from '~~/utils/search'

interface UTreeNode {
  id: string
  label: string
  icon?: string
  defaultOpen?: boolean
  children?: UTreeNode[]
  metadata: {
    entity: any
    type: any
    snapshot: any
    changeStatus?: string
    isVirtualSection: boolean
    originalNode: any
  }
}

interface Props {
  node: UTreeNode
  level?: number
  searchQuery?: string
  changes?: Map<string, SnapshotComparison>
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  searchQuery: '',
  changes: () => new Map()
})

defineEmits<{
  'node-click': [node: any]
}>()

const isExpanded = ref(props.node.defaultOpen ?? props.level < 2)

const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

const isVirtualSection = computed(() => props.node.metadata?.isVirtualSection ?? false)

const changeStatus = computed(() => props.node.metadata?.changeStatus)

const nodeIcon = computed(() => props.node.icon || 'i-heroicons-rectangle-group')

const highlightedLabel = computed(() => {
  if (props.searchQuery) {
    return highlightSearchTerm(props.node.label, props.searchQuery)
  }
  return props.node.label
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const handleClick = () => {
  if (isVirtualSection.value || hasChildren.value) {
    toggleExpand()
  } else {
    // Emit the original TreeNode
    const originalNode = props.node.metadata?.originalNode
    if (originalNode) {
      // Navigate to entity page if it has a public page
      if (originalNode.entity.has_public_page) {
        navigateTo(`/annuaire-etat/entites/${originalNode.entity.slug}`)
      }
    }
  }
}
</script>
