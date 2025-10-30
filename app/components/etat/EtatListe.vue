<script setup lang="ts">
import type { PublicEntity, OrgType, OrgUnit } from '../../../types/etat'

interface EntityWithParent extends PublicEntity {
  current_unit?: OrgUnit
  parent_name?: string
  parents?: string[]
}

interface Props {
  entities: EntityWithParent[]
  orgTypes: OrgType[]
  total: number
  page: number
  pageSize?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 20,
  loading: false
})

const router = useRouter()
const route = useRoute()

// État local pour la recherche et les filtres
const searchQuery = ref((route.query.search as string) || '')
const selectedTypeId = ref((route.query.type as string) || '')
const currentPage = ref(props.page)

// Type sélectionné (objet complet pour USelectMenu)
const selectedType = computed({
  get: () => {
    if (!selectedTypeId.value) return { id: '', label: 'Tous les types' }
    return props.orgTypes.find(t => t.id === selectedTypeId.value) || { id: '', label: 'Tous les types' }
  },
  set: (value) => {
    selectedTypeId.value = value?.id || ''
  }
})

// Calculer le nombre de pages
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

// Debounce pour la recherche
const debouncedSearch = ref(searchQuery.value)
let searchTimeout: NodeJS.Timeout

watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal
    updateQueryParams()
  }, 500)
})

// Mettre à jour les query params
const updateQueryParams = () => {
  const query: any = { ...route.query }

  if (debouncedSearch.value) {
    query.search = debouncedSearch.value
  } else {
    delete query.search
  }

  if (selectedTypeId.value) {
    query.type = selectedTypeId.value
  } else {
    delete query.type
  }

  query.page = currentPage.value.toString()
  query.view = 'liste'

  router.push({ query })
}

// Watch des changements de filtres
watch(selectedTypeId, () => {
  currentPage.value = 1
  updateQueryParams()
})

watch(currentPage, () => {
  updateQueryParams()
})

// Synchroniser avec les props
watch(() => props.page, (newPage) => {
  currentPage.value = newPage
})

// Clear filters
const clearFilters = () => {
  searchQuery.value = ''
  selectedTypeId.value = ''
  currentPage.value = 1
  updateQueryParams()
}

const hasFilters = computed(() => searchQuery.value || selectedTypeId.value)
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md">
    <!-- Header avec recherche et filtres -->
    <div class="border-b border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Vue Liste
        </h2>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ total }} entité{{ total > 1 ? 's' : '' }}
        </div>
      </div>

      <!-- Filters row -->
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Search -->
        <div class="flex-grow">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Rechercher une entité..."
            :loading="loading"
          />
        </div>

        <!-- Type filter -->
        <div class="w-full sm:w-64">
          <USelectMenu
            v-model="selectedType"
            :options="[{ id: '', label: 'Tous les types' }, ...orgTypes]"
            placeholder="Filtrer par type"
            option-attribute="label"
          />
        </div>

        <!-- Clear filters -->
        <UButton
          v-if="hasFilters"
          icon="i-heroicons-x-mark"
          variant="soft"
          color="gray"
          @click="clearFilters"
        >
          Effacer
        </UButton>
      </div>
    </div>

    <!-- Liste des entités -->
    <div class="divide-y divide-gray-200 dark:divide-gray-700">
      <!-- Skeleton loading -->
      <div v-if="loading" class="p-4 space-y-3">
        <USkeleton v-for="i in pageSize" :key="i" class="h-16 w-full" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="entities.length === 0"
        class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mb-3" />
        <p class="text-lg font-medium">Aucune entité trouvée</p>
        <p class="text-sm mt-1">Essayez de modifier vos critères de recherche</p>
      </div>

      <!-- List items -->
      <div
        v-else
        v-for="entity in entities"
        :key="entity.id"
        class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div class="flex items-start gap-4">
          <!-- Icon -->
          <div class="flex-shrink-0 mt-1">
            <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
              <UIcon
                name="i-heroicons-building-office"
                class="w-6 h-6 text-gray-400"
              />
            </div>
          </div>

          <!-- Content -->
          <div class="flex-grow min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ entity.nom_canonique }}
                </h3>
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <!-- Afficher tous les parents dans des badges séparés -->
                  <UBadge
                    v-for="(parent, index) in entity.parents"
                    :key="index"
                    color="gray"
                    variant="subtle"
                    size="sm"
                  >
                    {{ parent }}
                  </UBadge>
                  <!-- Afficher le type seulement si pas de parents -->
                  <UBadge v-if="!entity.parents?.length && entity.org_type" color="gray" variant="subtle" size="sm">
                    {{ entity.org_type.label }}
                  </UBadge>
                </div>
              </div>
            </div>

            <!-- Description -->
            <p v-if="entity.description" class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {{ entity.description }}
            </p>

            <!-- Meta info -->
            <div v-if="entity.site_web || entity.email || entity.telephone" class="flex flex-wrap gap-3 mt-3 text-xs">
              <a
                v-if="entity.site_web"
                :href="entity.site_web"
                target="_blank"
                class="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
              >
                <UIcon name="i-heroicons-globe-alt" />
                Site web
              </a>
              <a
                v-if="entity.email"
                :href="`mailto:${entity.email}`"
                class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <UIcon name="i-heroicons-envelope" />
                {{ entity.email }}
              </a>
              <span v-if="entity.telephone" class="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <UIcon name="i-heroicons-phone" />
                {{ entity.telephone }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="border-t border-gray-200 dark:border-gray-700 p-4">
      <UPagination
        v-model="currentPage"
        :page-count="pageSize"
        :total="total"
        :max="7"
        show-last
        show-first
      />
    </div>
  </div>
</template>
