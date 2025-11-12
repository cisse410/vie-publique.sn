<template>
  <div
    class="list-item cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    @click="$emit('click')"
  >
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div class="flex-shrink-0 text-2xl">
        {{ entityIcon }}
      </div>

      <!-- Content -->
      <div class="min-w-0 flex-1">
        <!-- Title -->
        <h3 class="mb-1 text-lg font-semibold text-gray-900" v-html="highlightedLabel"></h3>

        <!-- Canonical name (if different) -->
        <p v-if="showCanonicalName" class="mb-2 text-sm text-gray-600">
          {{ node.entity.canonical_name }}
        </p>

        <!-- Parent -->
        <div v-if="parentLabel" class="mb-2 text-sm text-gray-500">📍 {{ parentLabel }}</div>

        <!-- Badges -->
        <div class="mt-2 flex flex-wrap gap-2">
          <TypeChip :type="node.type" size="sm" />

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

const parentLabel = computed(() => {
  if (!props.node.snapshot.parent_snapshot_id) return null

  if (typeof props.node.snapshot.parent_snapshot_id === 'object') {
    return props.node.snapshot.parent_snapshot_id.official_label
  }

  return null
})
</script>
