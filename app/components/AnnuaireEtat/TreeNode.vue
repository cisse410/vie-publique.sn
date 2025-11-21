<template>
  <div class="tree-node">
    <div
      :class="[
        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors',
        isVirtualSection
          ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800',
        isExpanded && !isVirtualSection && 'bg-gray-50 dark:bg-gray-800',
        isExpanded && isVirtualSection && 'bg-blue-100 dark:bg-blue-900/30',
      ]"
      :style="{ marginLeft: `${level * 24}px` }"
      @click="handleClick"
    >
      <!-- Expand/Collapse button -->
      <button
        v-if="hasChildren"
        @click.stop="toggle"
        class="flex h-5 w-5 flex-shrink-0 items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <UIcon :name="isExpanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'" class="w-4 h-4" />
      </button>
      <span v-else class="w-5 flex-shrink-0"></span>

      <!-- Label with search highlight -->
      <span
        :class="[
          'flex-1 font-medium',
          isVirtualSection
            ? 'text-blue-700 font-semibold dark:text-blue-300'
            : 'text-gray-900 dark:text-white'
        ]"
        v-html="highlightedLabel"
      ></span>

      <!-- Badges -->
      <div class="flex flex-shrink-0 items-center gap-2">
        <!-- <TypeChip :type="node.type" size="sm" /> -->

        <Badge v-if="changeStatus === 'new'" color="green">Nouveau</Badge>
        <Badge v-else-if="changeStatus === 'modified'" color="orange">Modifié</Badge>
        <Badge v-else-if="changeStatus === 'removed'" color="red">Supprimé</Badge>

        <Badge v-if="node.isNew" color="green">Nouveau</Badge>
        <Badge v-else-if="node.isModified" color="orange">Modifié</Badge>
      </div>
    </div>

    <!-- Children -->
    <Transition name="slide-fade" @enter="onEnter" @leave="onLeave">
      <div v-if="isExpanded && hasChildren" class="tree-children">
        <TreeNode
          v-for="child in node.children"
          :key="child.snapshot.id"
          :node="child"
          :level="level + 1"
          :changes="changes"
          :search-query="searchQuery"
          @node-click="$emit('node-click', $event)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { SnapshotComparison, TreeNode } from '~~/types/etat'
import { getEntityIcon } from '~~/utils/entity-icons'
import { highlightSearchTerm } from '~~/utils/search'

interface Props {
  node: TreeNode
  level?: number
  changes?: Map<string, SnapshotComparison>
  searchQuery?: string
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  changes: () => new Map(),
  searchQuery: '',
})

const emit = defineEmits<{
  'node-click': [node: TreeNode]
}>()

const isExpanded = ref(props.level < 2) // Auto-expand first 2 levels

const hasChildren = computed(() => props.node.children.length > 0)

const isVirtualSection = computed(() => {
  return props.node.type.code === 'section' || props.node.entity.id.startsWith('virtual-')
})

const changeStatus = computed(() => {
  const change = props.changes?.get(props.node.entity.id)
  return change?.change
})

const highlightedLabel = computed(() => {
  if (props.searchQuery) {
    return highlightSearchTerm(props.node.snapshot.official_label, props.searchQuery)
  }
  return props.node.snapshot.official_label
})

const toggle = () => {
  isExpanded.value = !isExpanded.value
}

const handleClick = () => {
  // Les sections virtuelles ne peuvent qu'être expand/collapse
  if (isVirtualSection.value || hasChildren.value) {
    toggle()
  } else {
    emit('node-click', props.node)
  }
}

// Animation transitions
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.offsetHeight // Force reflow
  element.style.height = element.scrollHeight + 'px'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  element.offsetHeight // Force reflow
  element.style.height = '0'
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  height: 0;
}
</style>
