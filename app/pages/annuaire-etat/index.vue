<script setup lang="ts">
import ListView from '~/components/AnnuaireEtat/ListView.vue'
import TreeView from '~/components/AnnuaireEtat/TreeView.vue'
import { useDecrees } from '~/composables/annuaire-etat/useDecrees'
import { useEntityChanges } from '~/composables/annuaire-etat/useEntityChanges'
import { useFilters } from '~/composables/annuaire-etat/useFilters'
import { useTree } from '~/composables/annuaire-etat/useTree'
import type { TreeNode } from '~~/types/etat'
import { searchInTree } from '~~/utils/search'
import { filterTree, flattenTree, groupMinistries, applyGroupingToTree } from '~~/utils/tree-builder'

const { keywords } = useSiteMetadata()
const route = useRoute()
const router = useRouter()

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

// Composables
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
  searchQuery: filterSearchQuery,
  selectedTypes: filterSelectedTypes,
  entityTypes,
  fetchEntityTypes,
  toggleType,
  setSearchQuery: setFilterSearchQuery,
  resetFilters: resetFilterState,
} = useFilters()

// Query params pour SEO
const viewMode = computed({
  get: () => (route.query.view as 'tree' | 'list') || 'tree',
  set: (value) => router.push({ query: { ...route.query, view: value, page: undefined } }),
})

const searchQuery = computed({
  get: () => (route.query.search as string) || '',
  set: (value) => {
    // Sync avec le composable de filtres
    setFilterSearchQuery(value)
    router.push({ query: { ...route.query, search: value || undefined, page: undefined } })
  },
})

const selectedTypes = computed({
  get: () => {
    const types = route.query.types
    if (!types) return []
    return Array.isArray(types) ? types : [types]
  },
  set: (value) => router.push({ query: { ...route.query, types: value.length > 0 ? value : undefined, page: undefined } }),
})

const currentPage = computed({
  get: () => {
    const page = route.query.page
    if (!page) return 1
    return parseInt(page as string, 10) || 1
  },
  set: (value) => {
    router.push({ query: { ...route.query, page: value > 1 ? value.toString() : undefined } })
  },
})

// Sync query params avec composable filters au montage
watch(
  () => [route.query.search, route.query.types],
  () => {
    if (route.query.search) {
      setFilterSearchQuery(route.query.search as string)
    }
  },
  { immediate: true }
)

// Chargement des données
onMounted(async () => {
  await Promise.all([fetchDecrees(), fetchEntityTypes()])
})

// Tree data avec groupement des ministères et sections
const groupedTreeData = computed(() => {
  if (!treeData.value || treeData.value.length === 0) return []
  const withMinistries = groupMinistries(treeData.value)
  return applyGroupingToTree(withMinistries)
})

// Filtered tree data
const filteredTreeData = computed(() => {
  let result = groupedTreeData.value

  // Filter by search
  if (searchQuery.value) {
    result = searchInTree(result, searchQuery.value)
  }

  // Filter by types
  if (selectedTypes.value.length > 0) {
    result = filterTree(result, (node) => selectedTypes.value.includes(node.type.code))
  }

  return result
})

// Change statistics
const changeStats = computed(() => {
  return getChangeStats()
})

// Statistics by entity type
const stats = computed(() => {
  if (!treeData.value || treeData.value.length === 0) {
    return {
      ministeres: 0,
      etablissements_publics: 0,
      societes_participation: 0,
      societes_nationales: 0,
      total: 0,
    }
  }

  const allEntities = flattenTree(treeData.value)

  // Compter uniquement les ministères (pas présidence ni primature)
  // On compte dans toutes les entités, pas seulement les racines
  const ministeres = allEntities.filter(
    (node) => node.type.code === 'ministere'
  ).length

  const etablissements_publics = allEntities.filter(
    (node) => node.type.code === 'etablissement_public'
  ).length

  const societes_participation = allEntities.filter(
    (node) => node.type.code === 'societe_participation_publique'
  ).length

  const societes_nationales = allEntities.filter(
    (node) => node.type.code === 'societe_nationale'
  ).length

  return {
    ministeres,
    etablissements_publics,
    societes_participation,
    societes_nationales,
    total: allEntities.length,
  }
})

// Filtered result count (flatten tree to count all entities, not just root nodes)
const filteredResultCount = computed(() => {
  return flattenTree(filteredTreeData.value).length
})

// Types de filtres à afficher (seulement les 4 types principaux)
const displayedFilterTypes = computed(() => {
  const allowedCodes = ['ministere', 'etablissement_public', 'societe_participation_publique', 'societe_nationale']
  return entityTypes.value.filter(type => allowedCodes.includes(type.code))
})

// Functions
const setSearchQuery = (value: string) => {
  searchQuery.value = value
}

const handleToggleType = (typeCode: string) => {
  const current = selectedTypes.value
  if (current.includes(typeCode)) {
    selectedTypes.value = current.filter((t) => t !== typeCode)
  } else {
    selectedTypes.value = [...current, typeCode]
  }
  toggleType(typeCode)
}

const resetFilters = () => {
  resetFilterState()
  router.push({ query: { view: viewMode.value } })
}

// Navigate to entity
const navigateToEntity = (node: TreeNode) => {
  if (node.entity.has_public_page) {
    navigateTo(`/annuaire-etat/entites/${node.entity.slug}`)
  }
}
</script>

<template>
  <div class="flex flex-col px-4 py-6">
    <!-- En-tête -->
    <div class="prose prose-sm mx-auto my-2 sm:prose">
      <h1 class="text-center dark:text-white">Organisation de l'État du Sénégal</h1>
      <p class="text-center text-gray-600 dark:text-gray-400">
        Répartition des services de l'État selon le décret n° {{ selectedDecree?.numero }}
      </p>
    </div>

    <div class="mx-auto mt-8 w-full max-w-6xl space-y-6">
      <!-- Bannière Décret Actif -->
      <UCard class="ring-2 ring-blue-500 dark:ring-blue-500">
        <div class="space-y-3 md:space-y-4">
          <div class="flex flex-col items-start justify-between gap-3 md:flex-row md:gap-4">
            <div class="min-w-0 flex-1">
              <div v-if="decreesLoading" class="h-6 w-48 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div v-else class="mb-2 flex flex-wrap items-center gap-2">
                <h3 class="text-base font-bold text-gray-900 md:text-lg dark:text-white">
                  Décret n° {{ selectedDecree?.numero }}
                </h3>
                <UBadge color="green" variant="subtle" size="xs">
                  En vigueur
                </UBadge>
              </div>
              <div v-if="decreesLoading" class="h-4 w-64 animate-pulse bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
              <div
                v-else
                class="flex flex-wrap items-center gap-2 text-xs text-gray-500 md:gap-3 dark:text-gray-500"
              >
                <span class="flex items-center gap-1">
                  <UIcon name="i-heroicons-calendar" class="h-3 w-3" />
                  {{ selectedDecree?.date_publication }}
                </span>
                <span v-if="selectedDecree?.pr" class="flex items-center gap-1 truncate">
                  <UIcon name="i-heroicons-user" class="h-3 w-3 flex-shrink-0" />
                  <span class="hidden sm:inline">Président:</span> {{ selectedDecree?.pr }}
                </span>
                <span v-if="selectedDecree?.pm" class="flex items-center gap-1 truncate">
                  <UIcon name="i-heroicons-user-group" class="h-3 w-3 flex-shrink-0" />
                  PM: {{ selectedDecree?.pm }}
                </span>
              </div>
            </div>

            <div class="flex w-full items-center gap-2 md:w-auto">
              <UButton
                variant="outline"
                color="primary"
                size="xs"
                icon="i-heroicons-clock"
                class="flex-1 md:flex-initial"
                to="/annuaire-etat/historique"
              >
                <span class="hidden sm:inline">Voir historique</span>
                <span class="sm:hidden">Historique</span>
              </UButton>
              <UButton
                v-if="selectedDecree?.document_url"
                variant="outline"
                color="gray"
                size="xs"
                icon="i-heroicons-document-text"
                class="flex-1 md:flex-initial"
                :to="selectedDecree.document_url"
                target="_blank"
              >
                <span class="hidden sm:inline">Voir le décret</span>
                <span class="sm:hidden">Voir</span>
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Statistiques -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <UCard class="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-default">
          <div class="text-center">
            <div v-if="treeLoading" class="flex justify-center">
              <div class="h-8 w-16 animate-pulse bg-purple-200 dark:bg-purple-800 rounded"></div>
            </div>
            <div v-else class="text-2xl font-bold text-purple-600 md:text-3xl dark:text-purple-400">
              {{ stats.ministeres }}
            </div>
            <div class="mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-400">Ministères</div>
          </div>
        </UCard>
        <UCard class="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-default">
          <div class="text-center">
            <div v-if="treeLoading" class="flex justify-center">
              <div class="h-8 w-16 animate-pulse bg-green-200 dark:bg-green-800 rounded"></div>
            </div>
            <div v-else class="text-2xl font-bold text-green-600 md:text-3xl dark:text-green-400">
              {{ stats.etablissements_publics }}
            </div>
            <div class="mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-400">Établissements publics</div>
          </div>
        </UCard>
        <UCard class="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-default">
          <div class="text-center">
            <div v-if="treeLoading" class="flex justify-center">
              <div class="h-8 w-16 animate-pulse bg-orange-200 dark:bg-orange-800 rounded"></div>
            </div>
            <div v-else class="text-2xl font-bold text-orange-600 md:text-3xl dark:text-orange-400">
              {{ stats.societes_participation }}
            </div>
            <div class="mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-400">Sociétès à participation publique</div>
          </div>
        </UCard>
        <UCard class="transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-default">
          <div class="text-center">
            <div v-if="treeLoading" class="flex justify-center">
              <div class="h-8 w-16 animate-pulse bg-blue-200 dark:bg-blue-800 rounded"></div>
            </div>
            <div v-else class="text-2xl font-bold text-blue-600 md:text-3xl dark:text-blue-400">
              {{ stats.societes_nationales }}
            </div>
            <div class="mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-400">Sociétés nationales</div>
          </div>
        </UCard>
      </div>

      <!-- Sélecteur de vue et recherche -->
      <div class="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <div class="flex items-center gap-2">
          <UButton
            :variant="viewMode === 'tree' ? 'solid' : 'soft'"
            color="primary"
            icon="i-heroicons-squares-2x2"
            size="sm"
            @click="viewMode = 'tree'"
          >
            Arborescence
          </UButton>
          <UButton
            :variant="viewMode === 'list' ? 'solid' : 'soft'"
            color="primary"
            icon="i-heroicons-list-bullet"
            size="sm"
            @click="viewMode = 'list'"
          >
            Liste
          </UButton>
        </div>

        <!-- Recherche -->
        <UInput
          :model-value="searchQuery"
          @update:model-value="setSearchQuery"
          icon="i-heroicons-magnifying-glass"
          placeholder="Rechercher une entité..."
          class="flex-1"
          size="md"
        />

        <!-- Filtre par type (pour la vue liste) -->
        <USelectMenu
          v-if="viewMode === 'list' && entityTypes.length > 0"
          v-model="selectedTypes"
          :options="displayedFilterTypes"
          multiple
          placeholder="Filtrer par type"
          value-attribute="code"
          option-attribute="label"
          class="w-full md:w-64"
          size="md"
        >
          <template #label>
            <span v-if="selectedTypes.length === 0">Filtrer par type</span>
            <span v-else>{{ selectedTypes.length }} type(s)</span>
          </template>
        </USelectMenu>
      </div>

      <!-- Résultat de recherche -->
      <div
        v-if="searchQuery || selectedTypes.length > 0"
        class="text-sm text-gray-600 dark:text-gray-400"
      >
        {{ filteredResultCount }} résultat(s)
        <UButton
          v-if="searchQuery || selectedTypes.length > 0"
          variant="ghost"
          color="gray"
          size="xs"
          @click="resetFilters"
          class="ml-2"
        >
          Réinitialiser
        </UButton>
      </div>

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
        v-model:current-page="currentPage"
        @entity-click="navigateToEntity"
      />
    </div>
  </div>
</template>
