<script setup lang="ts">
import { useDecrees } from '~/composables/annuaire-etat/useDecrees'

const { keywords } = useSiteMetadata()
const route = useRoute()
const router = useRouter()

const title = "Historique des décrets de l'État du Sénégal"
const description =
  "Historique complet des décrets de répartition des services de l'État avec filtres avancés et comparaison entre différentes versions"

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  twitterCard: 'summary_large_image',
  twitterDescription: description,
  keywords: [
    ...keywords,
    'historique décrets',
    'répartition services État',
    'évolution organisation gouvernementale',
    'archives décrets Sénégal',
  ].join(', '),
})

// Filtres de la query string
const filters = reactive({
  dateDebut: (route.query.dateDebut as string) || '',
  dateFin: (route.query.dateFin as string) || '',
  search: (route.query.search as string) || '',
})

// Charger tous les décrets
const { decrees, loading: decreesLoading, fetchDecrees } = useDecrees()

onMounted(async () => {
  await fetchDecrees()
})

// Filtrage des décrets
const filteredDecrets = computed(() => {
  let filtered = [...decrees.value]

  // Filtre par date
  if (filters.dateDebut) {
    filtered = filtered.filter((d) => d.date_publication >= filters.dateDebut)
  }
  if (filters.dateFin) {
    filtered = filtered.filter((d) => d.date_publication <= filters.dateFin)
  }

  // Filtre par recherche
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase()
    filtered = filtered.filter(
      (d) =>
        d.numero.toLowerCase().includes(query) ||
        (d.pr && d.pr.toLowerCase().includes(query)) ||
        (d.pm && d.pm.toLowerCase().includes(query)),
    )
  }

  // Trier par date décroissante (plus récent en premier)
  return filtered.sort(
    (a, b) =>
      new Date(b.date_publication).getTime() - new Date(a.date_publication).getTime(),
  )
})

// Mise à jour des query params
const updateFilters = () => {
  const query: Record<string, string> = {}
  if (filters.dateDebut) query.dateDebut = filters.dateDebut
  if (filters.dateFin) query.dateFin = filters.dateFin
  if (filters.search.trim()) query.search = filters.search

  router.push({ query })
}

// Réinitialiser les filtres
const resetFilters = () => {
  filters.dateDebut = ''
  filters.dateFin = ''
  filters.search = ''
  router.push({ query: {} })
}

// Watchers pour mettre à jour les query params
watch(filters, () => {
  updateFilters()
}, { deep: true })

// Comparaison
const compareMode = ref(false)
const selectedDecrets = ref<number[]>([])

const toggleCompare = (decretId: number) => {
  const index = selectedDecrets.value.indexOf(decretId)
  if (index > -1) {
    selectedDecrets.value.splice(index, 1)
  } else {
    if (selectedDecrets.value.length < 2) {
      selectedDecrets.value.push(decretId)
    }
  }
}

const isSelected = (decretId: number) => selectedDecrets.value.includes(decretId)

const compareDecrets = () => {
  if (selectedDecrets.value.length === 2) {
    // TODO: Navigate to comparison page when implemented
    console.log('Compare decrets:', selectedDecrets.value)
  }
}

// Statistiques
const stats = computed(() => ({
  total: filteredDecrets.value.length,
  decretActif: filteredDecrets.value.find((d) => d.status === 'active'),
}))

// Format date
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="flex flex-col px-4 py-6">
    <!-- En-tête -->
    <div class="prose prose-sm mx-auto my-2 sm:prose">
      <h1 class="text-center dark:text-white">Historique des décrets</h1>
      <p class="text-center text-gray-600 dark:text-gray-400">
        Évolution de l'organisation de l'État du Sénégal au fil des années
      </p>
    </div>

    <div class="mx-auto mt-8 w-full max-w-4xl space-y-6">
      <!-- Retour -->
      <div>
        <NuxtLink
          to="/annuaire-etat"
          class="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
        >
          <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
          Retour à l'organisation actuelle
        </NuxtLink>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <UCard>
          <div class="text-center">
            <div v-if="decreesLoading" class="mx-auto h-8 w-16 animate-pulse rounded bg-primary-200 dark:bg-primary-800"></div>
            <div v-else class="text-2xl font-bold text-primary-600 md:text-3xl dark:text-primary-400">
              {{ stats.total }}
            </div>
            <div class="mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-400">Décrets</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div v-if="decreesLoading" class="mx-auto h-8 w-32 animate-pulse rounded bg-green-200 dark:bg-green-800"></div>
            <div v-else class="text-2xl font-bold text-green-600 md:text-3xl dark:text-green-400">
              {{ stats.decretActif?.numero || 'N/A' }}
            </div>
            <div class="mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-400">Décret actif</div>
          </div>
        </UCard>
        <UCard class="col-span-2 lg:col-span-1">
          <div class="text-center">
            <div v-if="decreesLoading" class="mx-auto h-8 w-24 animate-pulse rounded bg-orange-200 dark:bg-orange-800"></div>
            <div v-else class="text-2xl font-bold text-orange-600 md:text-3xl dark:text-orange-400">
              {{ filteredDecrets.length > 0 ? new Date(filteredDecrets[0].date_publication).getFullYear() : 'N/A' }}
            </div>
            <div class="mt-1 text-xs text-gray-600 md:text-sm dark:text-gray-400">Dernier décret</div>
          </div>
        </UCard>
      </div>

      <!-- Filtres avancés -->
      <UCard>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-sm font-semibold text-gray-900 md:text-base dark:text-white">
              Filtres avancés
            </h3>
            <UButton size="xs" variant="ghost" color="gray" @click="resetFilters">
              Réinitialiser
            </UButton>
          </div>
        </template>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <!-- Recherche -->
          <div class="lg:col-span-3">
            <label
              class="mb-1 block text-xs font-medium text-gray-700 md:text-sm dark:text-gray-300"
            >
              Recherche
            </label>
            <UInput
              v-model="filters.search"
              icon="i-heroicons-magnifying-glass"
              placeholder="Numéro, président, PM..."
              size="md"
            />
          </div>

          <!-- Date début -->
          <div>
            <label
              class="mb-1 block text-xs font-medium text-gray-700 md:text-sm dark:text-gray-300"
            >
              Date de début
            </label>
            <UInput v-model="filters.dateDebut" type="date" icon="i-heroicons-calendar" size="md" />
          </div>

          <!-- Date fin -->
          <div>
            <label
              class="mb-1 block text-xs font-medium text-gray-700 md:text-sm dark:text-gray-300"
            >
              Date de fin
            </label>
            <UInput v-model="filters.dateFin" type="date" icon="i-heroicons-calendar" size="md" />
          </div>
        </div>
      </UCard>

      <!-- Mode comparaison -->
      <div class="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div class="flex items-center gap-2">
          <UToggle v-model="compareMode" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mode comparaison
          </span>
          <span
            v-if="compareMode"
            class="hidden text-xs text-gray-500 sm:inline dark:text-gray-500"
          >
            (Sélectionnez 2 décrets)
          </span>
        </div>

        <UButton
          v-if="compareMode && selectedDecrets.length === 2"
          color="primary"
          icon="i-heroicons-arrows-right-left"
          size="sm"
          class="w-full md:w-auto"
          @click="compareDecrets"
        >
          Comparer
        </UButton>
      </div>

      <!-- Timeline des décrets -->
      <div class="space-y-4">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ filteredDecrets.length }} décret(s) trouvé(s)
        </div>

        <!-- Loading state -->
        <div v-if="decreesLoading" class="space-y-4">
          <div
            v-for="i in 3"
            :key="i"
            class="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
          ></div>
        </div>

        <!-- Timeline -->
        <div v-else class="relative">
          <!-- Ligne verticale -->
          <div class="absolute bottom-0 left-8 top-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          <!-- Décrets -->
          <div class="space-y-8">
            <div
              v-for="(decret, index) in filteredDecrets"
              :key="decret.id"
              class="relative pl-20"
            >
              <!-- Indicateur timeline -->
              <div class="absolute left-4 top-0">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full"
                  :class="[
                    decret.status === 'active'
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900'
                      : 'border-2 border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400',
                  ]"
                >
                  <UIcon
                    :name="
                      decret.status === 'active'
                        ? 'i-heroicons-check'
                        : 'i-heroicons-document-text'
                    "
                    class="h-4 w-4"
                  />
                </div>
              </div>

              <!-- Carte décret -->
              <UCard
                :class="[
                  'transition-all',
                  decret.status === 'active' ? 'border-2 border-primary-500' : '',
                  compareMode && isSelected(decret.id) ? 'ring-2 ring-blue-500' : '',
                ]"
              >
                <div class="space-y-3 md:space-y-4">
                  <!-- En-tête -->
                  <div
                    class="flex flex-col items-start justify-between gap-3 md:flex-row md:gap-4"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="mb-2 flex flex-wrap items-center gap-2">
                        <h3 class="text-base font-bold text-gray-900 md:text-lg dark:text-white">
                          Décret n° {{ decret.numero }}
                        </h3>
                        <UBadge
                          v-if="decret.status === 'active'"
                          color="primary"
                          variant="solid"
                          size="xs"
                        >
                          Actif
                        </UBadge>
                      </div>
                      <div
                        class="flex flex-wrap items-center gap-2 text-xs text-gray-500 md:gap-3 dark:text-gray-500"
                      >
                        <span class="flex items-center gap-1">
                          <UIcon name="i-heroicons-calendar" class="h-3 w-3" />
                          {{ formatDate(decret.date_publication) }}
                        </span>
                        <span v-if="decret.pr" class="flex items-center gap-1 truncate">
                          <UIcon name="i-heroicons-user" class="h-3 w-3 flex-shrink-0" />
                          <span class="hidden sm:inline">Président:</span> {{ decret.pr }}
                        </span>
                        <span v-if="decret.pm" class="flex items-center gap-1 truncate">
                          <UIcon name="i-heroicons-user-group" class="h-3 w-3 flex-shrink-0" />
                          PM: {{ decret.pm }}
                        </span>
                      </div>
                    </div>

                    <div class="flex w-full items-center gap-2 md:w-auto">
                      <UButton
                        v-if="compareMode"
                        :variant="isSelected(decret.id) ? 'solid' : 'outline'"
                        :color="isSelected(decret.id) ? 'blue' : 'gray'"
                        size="xs"
                        icon="i-heroicons-check"
                        :disabled="!isSelected(decret.id) && selectedDecrets.length >= 2"
                        class="flex-1 md:flex-initial"
                        @click="toggleCompare(decret.id)"
                      >
                        <span class="hidden sm:inline">{{
                          isSelected(decret.id) ? 'Sélectionné' : 'Sélectionner'
                        }}</span>
                        <span class="sm:hidden">{{ isSelected(decret.id) ? 'OK' : 'Choisir' }}</span>
                      </UButton>

                      <UButton
                        v-if="decret.document_url"
                        variant="outline"
                        color="gray"
                        size="xs"
                        icon="i-heroicons-document-text"
                        class="flex-1 md:flex-initial"
                        :to="decret.document_url"
                        target="_blank"
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
        </div>

        <!-- Message si aucun résultat -->
        <div v-if="!decreesLoading && filteredDecrets.length === 0" class="py-12 text-center">
          <UIcon name="i-heroicons-document-text" class="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p class="text-gray-600 dark:text-gray-400">Aucun décret trouvé avec ces critères</p>
          <UButton variant="soft" color="primary" class="mt-4" @click="resetFilters">
            Réinitialiser les filtres
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
