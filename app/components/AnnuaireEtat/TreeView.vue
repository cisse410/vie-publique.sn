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

    <!-- UTree component -->
    <div v-else>
      <UAccordion
        v-for="root in uTreeNodes"
        :key="root.id"
        :items="[{ label: root.label, defaultOpen: true, slot: `tree-${root.id}` }]"
        :ui="{ wrapper: 'space-y-1' }"
        class="mb-2"
      >
        <template #[`tree-${root.id}`]>
          <div class="space-y-1 pt-2">
            <div
              v-for="child in root.children"
              :key="child.id"
              class="tree-node-wrapper"
            >
              <TreeNodeItem
                :node="child"
                :level="0"
                :search-query="searchQuery"
                :changes="changes"
                @node-click="handleNodeClick"
              />
            </div>
          </div>
        </template>
      </UAccordion>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotComparison, TreeNode } from '~~/types/etat'

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
    originalNode: TreeNode
  }
}

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

// Transform TreeNode to UTree format
const uTreeNodes = computed(() => {
  return transformToUTree(props.treeData)
})

function transformToUTree(nodes: TreeNode[]): UTreeNode[] {
  return nodes.map(node => {
    // Use change_type from snapshot instead of comparison
    let changeStatus: string | undefined
    if (node.isNew) changeStatus = 'new'
    else if (node.isModified) changeStatus = 'modified'
    else if (node.isRemoved) changeStatus = 'removed'
    else if (node.snapshot.change_type === 'unchanged') changeStatus = 'unchanged'

    const isVirtualSection = node.type.code === 'section' || node.type.code === 'entite_regroupement' || node.entity.id.startsWith('virtual-')

    return {
      id: node.entity.id,
      label: node.snapshot.official_label,
      icon: getEntityIcon(node.type.code),
      defaultOpen: node.level < 2,
      children: node.children.length > 0 ? transformToUTree(node.children) : undefined,
      metadata: {
        entity: node.entity,
        type: node.type,
        snapshot: node.snapshot,
        changeStatus,
        isVirtualSection,
        originalNode: node
      }
    }
  })
}

function getEntityIcon(typeCode: string): string {
  const icons: Record<string, string> = {
    presidence: 'i-heroicons-building-library',
    primature: 'i-heroicons-building-library',
    ministere: 'i-heroicons-building-office-2',
    cabinet: 'i-heroicons-briefcase',
    secretariat: 'i-heroicons-building-office',
    direction: 'i-heroicons-folder',
    direction_generale: 'i-heroicons-folder',
    service: 'i-heroicons-document-text',
    section: 'i-heroicons-rectangle-group',
    etablissement_public: 'i-heroicons-building-storefront',
    societe_nationale: 'i-heroicons-building-storefront',
    societe_participation_publique: 'i-heroicons-building-storefront',
  }
  return icons[typeCode] || 'i-heroicons-rectangle-group'
}

const handleNodeClick = (node: TreeNode) => {
  emit('node-click', node)
}
</script>
