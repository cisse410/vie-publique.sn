<script setup lang="ts">
import type { OrgUnitWithComparison } from '../../../types/etat'

interface Props {
  node: OrgUnitWithComparison
  level: number
  isExpanded: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  toggle: [nodeId: string]
}>()

// Calculer l'indentation
const indentClass = computed(() => {
  return `ml-${Math.min(props.level * 4, 12)}`
})

// Badge color selon le statut
const getBadgeColor = (badge?: string) => {
  if (badge === 'Nouveau') return 'green'
  if (badge === 'Renommé') return 'blue'
  if (badge === 'Transféré') return 'purple'
  if (badge === 'Renommé + Transféré') return 'orange'
  if (badge === 'Supprimé') return 'red'
  if (badge === 'Inchangé') return 'gray'
  return 'gray'
}

// Icône pour chaque type de changement
const getBadgeIcon = (badge?: string) => {
  if (badge === 'Nouveau') return 'i-heroicons-plus-circle'
  if (badge === 'Renommé') return 'i-heroicons-pencil'
  if (badge === 'Transféré') return 'i-heroicons-arrow-right-circle'
  if (badge === 'Renommé + Transféré') return 'i-heroicons-arrows-right-left'
  if (badge === 'Supprimé') return 'i-heroicons-x-circle'
  return undefined
}

// Vérifier si le nœud a des enfants
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

// Toggle l'expansion
const toggle = () => {
  if (hasChildren.value) {
    emit('toggle', props.node.id)
  }
}

// Expanded state for nested children
const expandedNodes = ref<Set<string>>(new Set())

const toggleChild = (nodeId: string) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const isChildExpanded = (nodeId: string) => expandedNodes.value.has(nodeId)
</script>

<template>
  <div class="border-l-2 border-gray-200 dark:border-gray-700" :style="{ marginLeft: `${level * 1.5}rem` }">
    <!-- Node item -->
    <div
      class="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer transition-colors"
      :class="{ 'bg-gray-50 dark:bg-gray-700/30': isExpanded && hasChildren }"
      @click="toggle"
    >
      <!-- Expand/Collapse icon -->
      <div class="flex-shrink-0 w-5">
        <UIcon
          v-if="hasChildren"
          :name="isExpanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
          class="text-gray-400"
        />
      </div>

      <!-- Type icon -->
      <div class="flex-shrink-0">
        <UIcon
          v-if="node.public_entity?.org_type?.icon"
          :name="node.public_entity.org_type.icon"
          class="text-primary-500"
        />
        <UIcon v-else name="i-heroicons-building-office" class="text-gray-400" />
      </div>

      <!-- Node title -->
      <div class="flex-grow">
        <span class="text-sm font-medium text-gray-900 dark:text-white">
          {{ node.intitule_officiel }}
        </span>
        <span v-if="node.public_entity?.org_type?.label" class="text-xs text-gray-500 dark:text-gray-400 ml-2">
          ({{ node.public_entity.org_type.label }})
        </span>
      </div>

      <!-- Badge de comparaison -->
      <div v-if="node.badge && node.badge !== 'Inchangé'" class="flex-shrink-0">
        <UTooltip v-if="node.changeDetails?.description" :text="node.changeDetails.description">
          <UBadge
            :color="getBadgeColor(node.badge)"
            variant="subtle"
            size="xs"
            :ui="{ rounded: 'rounded-full' }"
          >
            <UIcon v-if="getBadgeIcon(node.badge)" :name="getBadgeIcon(node.badge)" class="w-3 h-3" />
            {{ node.badge }}
          </UBadge>
        </UTooltip>
        <UBadge
          v-else
          :color="getBadgeColor(node.badge)"
          variant="subtle"
          size="xs"
          :ui="{ rounded: 'rounded-full' }"
        >
          <UIcon v-if="getBadgeIcon(node.badge)" :name="getBadgeIcon(node.badge)" class="w-3 h-3" />
          {{ node.badge }}
        </UBadge>
      </div>

      <!-- Children count -->
      <div v-if="hasChildren" class="flex-shrink-0">
        <UBadge color="gray" variant="soft" size="xs">
          {{ node.children!.length }}
        </UBadge>
      </div>
    </div>

    <!-- Children (recursive) -->
    <div v-if="isExpanded && hasChildren" class="mt-1">
      <TreeNodeEtat
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :is-expanded="isChildExpanded(child.id)"
        @toggle="toggleChild"
      />
    </div>
  </div>
</template>
