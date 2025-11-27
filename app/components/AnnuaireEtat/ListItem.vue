<template>
  <div
    :class="[
      'list-item rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 transition-shadow hover:shadow-md',
      node.entity.has_public_page ? 'cursor-pointer' : 'cursor-default'
    ]"
    @click="node.entity.has_public_page && $emit('click')"
  >
    <div class="flex items-start gap-3">

      <!-- Content -->
      <div class="min-w-0 flex-1">
        <!-- Title -->
        <h3 class="mb-1 text-lg font-semibold text-gray-900 dark:text-white" v-html="highlightedLabel"></h3>

        <!-- Canonical name (if different) -->
        <p v-if="showCanonicalName" class="mb-2 text-sm text-gray-600 dark:text-gray-400">
          {{ node.entity.canonical_name }}
        </p>

        <!-- Badges and chips -->
        <div class="mt-2 flex flex-wrap gap-2">
          <!-- Ministry chip -->
          <UBadge v-if="parentLabel" color="purple" variant="subtle" size="xs">
            📍 {{ parentLabel }}
          </UBadge>

          <!-- Section type chip -->
          <UBadge v-if="sectionLabel" color="blue" variant="subtle" size="xs">
            {{ sectionLabel }}
          </UBadge>

          <!-- Entity type chip -->
          <!-- <TypeChip :type="node.type" size="sm" /> -->

          <Badge v-if="change?.change === 'new'" color="green">Nouveau</Badge>
          <Badge v-else-if="change?.change === 'modified'" color="orange">
            Modifié
            <span v-if="change.changes_detail?.label_changed" class="ml-1">(nom)</span>
            <span v-if="change.changes_detail?.parent_changed" class="ml-1">(tutelle)</span>
          </Badge>
          <Badge v-else-if="change?.change === 'removed'" color="red">Supprimé</Badge>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flex-shrink-0 text-gray-400">→</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotComparison, TreeNode } from '~~/types/etat'
import { getEntityIcon } from '~~/utils/entity-icons'
import { highlightSearchTerm } from '~~/utils/search'

interface Props {
  node: TreeNode
  change?: SnapshotComparison
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
})

defineEmits<{
  click: []
}>()

const entityIcon = computed(() => getEntityIcon(props.node.type.code))

const highlightedLabel = computed(() => {
  if (props.searchQuery) {
    return highlightSearchTerm(props.node.snapshot.official_label, props.searchQuery)
  }
  return props.node.snapshot.official_label
})

const showCanonicalName = computed(() => {
  return props.node.entity.canonical_name !== props.node.snapshot.official_label
})

// Find the parent ministry by traversing up the tree
const findParentMinistry = (node: TreeNode): string | null => {
  // If this node has no parent, return null
  if (!node.snapshot.parent_snapshot_id || typeof node.snapshot.parent_snapshot_id !== 'object') {
    return null
  }

  const parent = node.snapshot.parent_snapshot_id

  // Check if parent is a ministry, presidence, or primature
  if (parent.public_entity_id?.entity_type_id) {
    const parentTypeCode = parent.public_entity_id.entity_type_id.code
    if (['ministere', 'presidence', 'primature'].includes(parentTypeCode)) {
      return parent.official_label || parent.public_entity_id.canonical_name
    }
  }

  // If parent is not a ministry/presidence/primature, keep looking up
  // We need to check if parent_snapshot_id has its own parent
  if (parent.parent_snapshot_id && typeof parent.parent_snapshot_id === 'object') {
    // Recursively search up the tree
    const tempNode: TreeNode = {
      ...node,
      snapshot: parent
    } as TreeNode
    return findParentMinistry(tempNode)
  }

  // No ministry found, return the immediate parent as fallback
  return parent.official_label
}

const parentLabel = computed(() => {
  const ministry = findParentMinistry(props.node)
  return ministry
})

// Get section type label based on entity type
const sectionLabel = computed(() => {
  const typeCode = props.node.type.code

  const sectionMap: Record<string, string> = {
    cabinet: 'Cabinet et services rattachés',
    secretariat: 'Secrétariat général et services rattachés',
    direction: 'Directions',
    direction_generale: 'Directions',
    etablissement_public: 'Établissements publics',
    societe_nationale: 'Sociétés nationales',
    societe_participation_publique: 'Sociétés à participation publique',
  }

  return sectionMap[typeCode] || null
})
</script>
