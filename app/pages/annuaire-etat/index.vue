<script setup lang="ts">
import ListView from '~/components/AnnuaireEtat/ListView.vue'
import StickyBar from '~/components/AnnuaireEtat/StickyBar.vue'
import TreeView from '~/components/AnnuaireEtat/TreeView.vue'
import { useDecrees } from '~/composables/annuaire-etat/useDecrees'
import { useEntityChanges } from '~/composables/annuaire-etat/useEntityChanges'
import { useFilters } from '~/composables/annuaire-etat/useFilters'
import { useTree } from '~/composables/annuaire-etat/useTree'
import type { TreeNode } from '~~/types/etat'
import { searchInTree } from '~~/utils/search'
import { filterTree } from '~~/utils/tree-builder'

const { keywords } = useSiteMetadata()

const title = "Organisation de l'Etat du Sénégal"
const description =
  "Répartition des services de l'Etat et du contrôle des Etablissements publics, des sociétés nationales et des sociétés à participation publique entre la Présidence de la République, la Primature et les ministères"

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  twitterCard: 'summary_large_image',
  twitterDescription: description,
  keywords: [
    ...keywords,
    'Etat du Sénégal',
    'Présidence de la République du Sénégal',
    'ministres du Sénégal',
    'nomination du Premier Ministre',
    'primature',
    'Premier Ministre',
    'DG Sénégal',
    'administration centrale des ministères',
    'composition du Gouvernement',
    'constitution',
    'décret',
    'organisation administrative',
  ].join(', '),
})

const {
  decrees,
  selectedDecree,
  loading: decreesLoading,
  fetchDecrees,
  selectDecree,
} = useDecrees()

const { treeData, loading: treeLoading } = useTree()

const { changes, getChangeStats } = useEntityChanges()

const {
  searchQuery,
  selectedTypes,
  entityTypes,
  fetchEntityTypes,
  toggleType,
  setSearchQuery,
  resetFilters,
} = useFilters()

// View mode
const viewMode = ref<'tree' | 'list'>('tree')

// Load data on mount
onMounted(async () => {
  await Promise.all([fetchDecrees(), fetchEntityTypes()])
})

// Filtered tree data
const filteredTreeData = computed(() => {
  console.log('[index.vue] Computing filteredTreeData, treeData:', treeData.value.length)
  let result = treeData.value

  // Filter by search
  if (searchQuery.value) {
    result = searchInTree(result, searchQuery.value)
    console.log('[index.vue] After search filter:', result.length)
  }

  // Filter by types
  if (selectedTypes.value.length > 0) {
    result = filterTree(result, (node) => selectedTypes.value.includes(node.type.code))
    console.log('[index.vue] After type filter:', result.length)
  }

  console.log('[index.vue] Final filteredTreeData:', result.length, result[0])
  return result
})

// Change statistics
const changeStats = computed(() => {
  return getChangeStats()
})

// Navigate to entity
const navigateToEntity = (node: TreeNode) => {
  navigateTo(`/entites/${node.entity.slug}`)
}
</script>

<template>
  <div class="flex flex-col px-4 py-6">
    <div class="prose prose-sm mx-auto my-2 sm:prose">
      <h1 class="text-center dark:text-white">Organisation de l'État du Sénégal</h1>
      <p class="text-center text-gray-600 dark:text-gray-400">
        Répartition des services de l'État selon le décret {{ selectedDecree?.numero }}
      </p>
    </div>

    <div class="mx-auto mt-8 w-full max-w-6xl space-y-6">

      <UCard class="ring-2 ring-blue-500 dark:ring-blue-500">
        <div class="space-y-3 md:space-y-4">
          <div class="flex flex-col items-start justify-between gap-3 md:flex-row md:gap-4">
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <UIcon
                  name="i-heroicons-document-text"
                  class="text-blue-600 dark:text-blue-400 h-5 w-5"
                />
                <h3 class="text-base font-bold text-gray-900 md:text-lg dark:text-white">
                  Décret {{ selectedDecree?.numero }}
                </h3>
                <UBadge color="green" variant="subtle" size="xs"> En vigueur </UBadge>
              </div>
              <p class="mb-2 text-xs text-gray-600 md:text-sm dark:text-gray-400">
                Répartition des services de l'État et du contrôle des Établissements publics
              </p>
              <div
                class="flex flex-wrap items-center gap-2 text-xs text-gray-500 md:gap-3 dark:text-gray-500"
              >
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="h-3 w-3" />
                  {{ selectedDecree?.date_publication }}
                </span>
                <span class="flex items-center gap-1 truncate">
                  <UIcon name="i-heroicons-user" class="h-3 w-3 flex-shrink-0" />
                  <span class="hidden sm:inline">Président:</span> {{ selectedDecree?.pr }}
                </span>
                <span class="flex items-center gap-1 truncate">
                  <UIcon name="i-heroicons-user-group" class="h-3 w-3 flex-shrink-0" />
                  PM: {{ selectedDecree?.pm }}
                </span>
              </div>
            </div>

            <div class="flex w-full items-center gap-2 md:w-auto">
              <UButton
                variant="outline"
                color="gray"
                size="xs"
                icon="i-heroicons-document-text"
                class="flex-1 md:flex-initial"
                :to="selectedDecree?.document_url"
              >
                <span class="hidden sm:inline">Voir le décret</span>
                <span class="sm:hidden">Voir</span>
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>

  <div class="page-index min-h-screen bg-gray-50">
    <StickyBar
      :current-view="viewMode"
      :decrees="decrees"
      :selected-decree="selectedDecree"
      :entity-types="entityTypes"
      :selected-types="selectedTypes"
      :search-query="searchQuery"
      :change-stats="changeStats"
      @view-change="viewMode = $event"
      @decree-change="selectDecree"
      @search="setSearchQuery"
      @type-toggle="toggleType"
      @reset-filters="resetFilters"
    />

    <!-- Main content -->
    <div class="container mx-auto">
      <!-- Tree view -->
      <TreeView
        v-if="viewMode === 'tree'"
        :tree-data="filteredTreeData"
        :loading="treeLoading"
        :changes="changes"
        :search-query="searchQuery"
        @node-click="navigateToEntity"
      />

      <!-- List view -->
      <ListView
        v-else
        :tree-data="filteredTreeData"
        :loading="treeLoading"
        :changes="changes"
        :search-query="searchQuery"
        :selected-types="selectedTypes"
        @entity-click="navigateToEntity"
      />
    </div>
  </div>
</template>
