<script setup lang="ts">

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
  twitterCard: "summary_large_image",
  twitterDescription: description,
  keywords: [
    ...keywords,
    "historique décrets",
    "répartition services État",
    "évolution organisation gouvernementale",
    "archives décrets Sénégal",
  ].join(", "),
})

// Filtres de la query string
const filters = reactive({
  dateDebut: (route.query.dateDebut as string) || '',
  dateFin: (route.query.dateFin as string) || '',
  typeEntite: (route.query.typeEntite as string) || 'all',
  ministere: (route.query.ministere as string) || 'all',
  typeChangement: (route.query.typeChangement as string) || 'all',
  search: (route.query.search as string) || '',
})

// Types de filtres
const typesEntites = [
  { value: 'all', label: 'Tous les types' },
  { value: 'ministere', label: 'Ministères' },
  { value: 'direction', label: 'Directions' },
  { value: 'service', label: 'Services' },
  { value: 'etablissement_public', label: 'Établissements publics' },
  { value: 'societe_nationale', label: 'Sociétés nationales' },
]

const typesChangements = [
  { value: 'all', label: 'Tous les changements' },
  { value: 'creation', label: 'Créations' },
  { value: 'suppression', label: 'Suppressions' },
  { value: 'transfert', label: 'Transferts' },
  { value: 'renommage', label: 'Renommages' },
  { value: 'fusion', label: 'Fusions' },
  { value: 'scission', label: 'Scissions' },
]

const ministeresOptions = [
  { value: 'all', label: 'Tous les ministères' },
  { value: 'sante', label: 'Ministère de la Santé' },
  { value: 'economie', label: 'Ministère de l\'Économie' },
  { value: 'education', label: 'Ministère de l\'Éducation' },
  { value: 'justice', label: 'Ministère de la Justice' },
  { value: 'interieur', label: 'Ministère de l\'Intérieur' },
]

// DONNÉES MOCKÉES POUR DÉMONSTRATION
const mockDecrets = [
  {
    id: '1',
    numero: '2024-940',
    titre: 'Répartition des services de l\'État et du contrôle des Établissements publics',
    date: '2024-04-05',
    dateFormatted: '05 Avril 2024',
    president: 'Bassirou Diomaye FAYE',
    premierMinistre: 'Ousmane SONKO',
    nbMinisteres: 25,
    nbChangements: 145,
    document_url: '#',
    isActive: true,
    changements: [
      {
        type: 'creation',
        entite: 'Ministère de la Santé et de l\'Action sociale',
        description: 'Création par fusion du Ministère de la Santé et du Ministère de l\'Action sociale',
        date: '2024-04-05'
      },
      {
        type: 'transfert',
        entite: 'Direction de la Planification',
        description: 'Transfert du Ministère de l\'Économie vers le Ministère de la Santé',
        date: '2024-04-05'
      },
      {
        type: 'renommage',
        entite: 'Agence nationale de la Statistique',
        description: 'Anciennement: Agence nationale de la Statistique et de la Démographie',
        date: '2024-04-05'
      }
    ]
  },
  {
    id: '2',
    numero: '2022-1480',
    titre: 'Répartition des services de l\'État',
    date: '2022-07-15',
    dateFormatted: '15 Juillet 2022',
    president: 'Macky SALL',
    premierMinistre: 'Amadou BA',
    nbMinisteres: 28,
    nbChangements: 98,
    document_url: '#',
    isActive: false,
    changements: [
      {
        type: 'creation',
        entite: 'Ministère de l\'Économie verte',
        description: 'Création d\'un nouveau ministère dédié à l\'économie verte',
        date: '2022-07-15'
      },
      {
        type: 'suppression',
        entite: 'Secrétariat d\'État chargé de la Diaspora',
        description: 'Suppression du secrétariat d\'État',
        date: '2022-07-15'
      }
    ]
  },
  {
    id: '3',
    numero: '2021-650',
    titre: 'Répartition des services de l\'État entre la Présidence, la Primature et les ministères',
    date: '2021-04-02',
    dateFormatted: '02 Avril 2021',
    president: 'Macky SALL',
    premierMinistre: 'Amadou BA',
    nbMinisteres: 26,
    nbChangements: 112,
    document_url: '#',
    isActive: false,
    changements: [
      {
        type: 'fusion',
        entite: 'Ministère des Affaires étrangères',
        description: 'Fusion avec le Ministère de la Coopération internationale',
        date: '2021-04-02'
      },
      {
        type: 'scission',
        entite: 'Ministère de l\'Éducation',
        description: 'Scission en Ministère de l\'Éducation nationale et Ministère de l\'Enseignement supérieur',
        date: '2021-04-02'
      }
    ]
  },
  {
    id: '4',
    numero: '2019-820',
    titre: 'Répartition des services de l\'État',
    date: '2019-04-06',
    dateFormatted: '06 Avril 2019',
    president: 'Macky SALL',
    premierMinistre: 'Mohammed Dionne',
    nbMinisteres: 32,
    nbChangements: 156,
    document_url: '#',
    isActive: false,
    changements: []
  },
  {
    id: '5',
    numero: '2017-1250',
    titre: 'Répartition des services de l\'État et du contrôle des Établissements publics',
    date: '2017-07-01',
    dateFormatted: '01 Juillet 2017',
    president: 'Macky SALL',
    premierMinistre: 'Mohammed Dionne',
    nbMinisteres: 30,
    nbChangements: 134,
    document_url: '#',
    isActive: false,
    changements: []
  }
]

// Filtrage des décrets
const filteredDecrets = computed(() => {
  let filtered = [...mockDecrets]

  // Filtre par date
  if (filters.dateDebut) {
    filtered = filtered.filter(d => d.date >= filters.dateDebut)
  }
  if (filters.dateFin) {
    filtered = filtered.filter(d => d.date <= filters.dateFin)
  }

  // Filtre par recherche
  if (filters.search.trim()) {
    const query = filters.search.toLowerCase()
    filtered = filtered.filter(d =>
      d.numero.toLowerCase().includes(query) ||
      d.titre.toLowerCase().includes(query) ||
      d.president.toLowerCase().includes(query) ||
      d.premierMinistre.toLowerCase().includes(query)
    )
  }

  // Filtre par type de changement
  if (filters.typeChangement !== 'all') {
    filtered = filtered.filter(d =>
      d.changements.some(c => c.type === filters.typeChangement)
    )
  }

  return filtered
})

// Mise à jour des query params
const updateFilters = () => {
  const query: Record<string, string> = {}
  if (filters.dateDebut) query.dateDebut = filters.dateDebut
  if (filters.dateFin) query.dateFin = filters.dateFin
  if (filters.typeEntite !== 'all') query.typeEntite = filters.typeEntite
  if (filters.ministere !== 'all') query.ministere = filters.ministere
  if (filters.typeChangement !== 'all') query.typeChangement = filters.typeChangement
  if (filters.search.trim()) query.search = filters.search

  router.push({ query })
}

// Réinitialiser les filtres
const resetFilters = () => {
  filters.dateDebut = ''
  filters.dateFin = ''
  filters.typeEntite = 'all'
  filters.ministere = 'all'
  filters.typeChangement = 'all'
  filters.search = ''
  router.push({ query: {} })
}

// Watchers pour mettre à jour les query params
watch(filters, () => {
  updateFilters()
}, { deep: true })

// Comparaison
const compareMode = ref(false)
const selectedDecrets = ref<string[]>([])

const toggleCompare = (decretId: string) => {
  const index = selectedDecrets.value.indexOf(decretId)
  if (index > -1) {
    selectedDecrets.value.splice(index, 1)
  } else {
    if (selectedDecrets.value.length < 2) {
      selectedDecrets.value.push(decretId)
    }
  }
}

const isSelected = (decretId: string) => selectedDecrets.value.includes(decretId)

// Couleurs pour les types de changements
const getChangementColor = (type: string) => {
  const colors: Record<string, string> = {
    creation: 'green',
    suppression: 'red',
    transfert: 'blue',
    renommage: 'orange',
    fusion: 'purple',
    scission: 'pink',
  }
  return colors[type] || 'gray'
}

// Icônes pour les types de changements
const getChangementIcon = (type: string) => {
  const icons: Record<string, string> = {
    creation: 'i-heroicons-plus-circle',
    suppression: 'i-heroicons-minus-circle',
    transfert: 'i-heroicons-arrow-right-circle',
    renommage: 'i-heroicons-pencil-square',
    fusion: 'i-heroicons-arrows-pointing-in',
    scission: 'i-heroicons-arrows-pointing-out',
  }
  return icons[type] || 'i-heroicons-document-text'
}

// Statistiques
const stats = computed(() => ({
  total: filteredDecrets.value.length,
  totalChangements: filteredDecrets.value.reduce((acc, d) => acc + d.nbChangements, 0),
  ministeresActifs: filteredDecrets.value.length > 0 ? filteredDecrets.value[0].nbMinisteres : 0,
  anneesMoyennes: filteredDecrets.value.length > 1
    ? Math.round((new Date(filteredDecrets.value[0].date).getTime() - new Date(filteredDecrets.value[filteredDecrets.value.length - 1].date).getTime()) / (1000 * 60 * 60 * 24 * 365) / (filteredDecrets.value.length - 1) * 10) / 10
    : 0,
}))
</script>

<template>
  <div class="flex flex-col px-4 py-6">
    <!-- En-tête -->
    <div class="prose prose-sm sm:prose mx-auto my-2">
      <h1 class="text-center dark:text-white">Historique des décrets</h1>
      <p class="text-center text-gray-600 dark:text-gray-400">
        Évolution de l'organisation de l'État du Sénégal au fil des années
      </p>
    </div>

    <div class="mx-auto w-full max-w-4xl mt-8 space-y-6">

      <!-- Retour -->
      <div>
        <NuxtLink
          to="/etat"
          class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Retour à l'organisation actuelle
        </NuxtLink>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">{{ stats.total }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Décrets</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{{ stats.totalChangements }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Changements</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{{ stats.ministeresActifs }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Ministères actuels</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{{ stats.anneesMoyennes }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Années entre décrets</div>
          </div>
        </UCard>
      </div>

      <!-- Filtres avancés -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h3 class="font-semibold text-sm md:text-base text-gray-900 dark:text-white">Filtres avancés</h3>
            <UButton
              size="xs"
              variant="ghost"
              color="gray"
              @click="resetFilters"
            >
              Réinitialiser
            </UButton>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <!-- Recherche -->
          <div class="lg:col-span-3">
            <label class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recherche
            </label>
            <UInput
              v-model="filters.search"
              icon="i-heroicons-magnifying-glass"
              placeholder="Numéro, titre..."
              size="md"
            />
          </div>

          <!-- Date début -->
          <div>
            <label class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de début
            </label>
            <UInput
              v-model="filters.dateDebut"
              type="date"
              icon="i-heroicons-calendar"
              size="md"
            />
          </div>

          <!-- Date fin -->
          <div>
            <label class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de fin
            </label>
            <UInput
              v-model="filters.dateFin"
              type="date"
              icon="i-heroicons-calendar"
              size="md"
            />
          </div>

          <!-- Type d'entité -->
          <div>
            <label class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type d'entité
            </label>
            <USelectMenu
              v-model="filters.typeEntite"
              :options="typesEntites"
              value-attribute="value"
              option-attribute="label"
              size="md"
            />
          </div>

          <!-- Ministère -->
          <div>
            <label class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ministère concerné
            </label>
            <USelectMenu
              v-model="filters.ministere"
              :options="ministeresOptions"
              value-attribute="value"
              option-attribute="label"
              size="md"
            />
          </div>

          <!-- Type de changement -->
          <div>
            <label class="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type de changement
            </label>
            <USelectMenu
              v-model="filters.typeChangement"
              :options="typesChangements"
              value-attribute="value"
              option-attribute="label"
              size="md"
            />
          </div>
        </div>
      </UCard>

      <!-- Mode comparaison -->
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UToggle v-model="compareMode" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mode comparaison
          </span>
          <span v-if="compareMode" class="text-xs text-gray-500 dark:text-gray-500 hidden sm:inline">
            (Sélectionnez 2 décrets)
          </span>
        </div>

        <UButton
          v-if="compareMode && selectedDecrets.length === 2"
          color="primary"
          icon="i-heroicons-arrows-right-left"
          size="sm"
          class="w-full md:w-auto"
        >
          Comparer
        </UButton>
      </div>

      <!-- Timeline des décrets -->
      <div class="space-y-4">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ filteredDecrets.length }} décret(s) trouvé(s)
        </div>

        <!-- Timeline -->
        <div class="relative">
          <!-- Ligne verticale -->
          <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

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
                  class="w-8 h-8 rounded-full flex items-center justify-center"
                  :class="[
                    decret.isActive
                      ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  ]"
                >
                  <UIcon
                    :name="decret.isActive ? 'i-heroicons-check' : 'i-heroicons-document-text'"
                    class="w-4 h-4"
                  />
                </div>
              </div>

              <!-- Carte décret -->
              <UCard
                :class="[
                  'transition-all',
                  decret.isActive ? 'border-2 border-primary-500' : '',
                  compareMode && isSelected(decret.id) ? 'ring-2 ring-blue-500' : '',
                ]"
              >
                <div class="space-y-3 md:space-y-4">
                  <!-- En-tête -->
                  <div class="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 class="font-bold text-base md:text-lg text-gray-900 dark:text-white">
                          Décret n° {{ decret.numero }}
                        </h3>
                        <UBadge v-if="decret.isActive" color="primary" variant="solid" size="xs">
                          Actif
                        </UBadge>
                      </div>
                      <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {{ decret.titre }}
                      </p>
                      <div class="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <span class="flex items-center gap-1">
                          <UIcon name="i-heroicons-calendar" class="w-3 h-3" />
                          {{ decret.dateFormatted }}
                        </span>
                        <span class="flex items-center gap-1 truncate">
                          <UIcon name="i-heroicons-user" class="w-3 h-3 flex-shrink-0" />
                          <span class="hidden sm:inline">Président:</span> {{ decret.president }}
                        </span>
                        <span class="flex items-center gap-1 truncate">
                          <UIcon name="i-heroicons-user-group" class="w-3 h-3 flex-shrink-0" />
                          PM: {{ decret.premierMinistre }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 w-full md:w-auto">
                      <UButton
                        v-if="compareMode"
                        :variant="isSelected(decret.id) ? 'solid' : 'outline'"
                        :color="isSelected(decret.id) ? 'blue' : 'gray'"
                        size="xs"
                        icon="i-heroicons-check"
                        :disabled="!isSelected(decret.id) && selectedDecrets.length >= 2"
                        @click="toggleCompare(decret.id)"
                        class="flex-1 md:flex-initial"
                      >
                        <span class="hidden sm:inline">{{ isSelected(decret.id) ? 'Sélectionné' : 'Sélectionner' }}</span>
                        <span class="sm:hidden">{{ isSelected(decret.id) ? 'OK' : 'Choisir' }}</span>
                      </UButton>

                      <UButton
                        variant="outline"
                        color="gray"
                        size="xs"
                        icon="i-heroicons-document-text"
                        class="flex-1 md:flex-initial"
                      >
                        <span class="hidden sm:inline">Voir le décret</span>
                        <span class="sm:hidden">Voir</span>
                      </UButton>
                    </div>
                  </div>

                  <!-- Statistiques du décret -->
                  <div class="flex items-center gap-4 md:gap-6 text-xs md:text-sm flex-wrap">
                    <div class="flex items-center gap-1">
                      <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-purple-600" />
                      <span class="font-medium text-gray-900 dark:text-white">{{ decret.nbMinisteres }}</span>
                      <span class="text-gray-600 dark:text-gray-400">ministères</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-blue-600" />
                      <span class="font-medium text-gray-900 dark:text-white">{{ decret.nbChangements }}</span>
                      <span class="text-gray-600 dark:text-gray-400">changements</span>
                    </div>
                  </div>

                  <!-- Principaux changements -->
                  <div v-if="decret.changements.length > 0" class="space-y-2">
                    <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                      Principaux changements:
                    </h4>
                    <div class="space-y-2">
                      <div
                        v-for="(changement, idx) in decret.changements"
                        :key="idx"
                        class="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50"
                      >
                        <UIcon
                          :name="getChangementIcon(changement.type)"
                          :class="[
                            'w-5 h-5 flex-shrink-0 mt-0.5',
                            `text-${getChangementColor(changement.type)}-600`
                          ]"
                        />
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <UBadge
                              :color="getChangementColor(changement.type)"
                              variant="subtle"
                              size="xs"
                            >
                              {{ changement.type }}
                            </UBadge>
                            <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {{ changement.entite }}
                            </span>
                          </div>
                          <p class="text-xs text-gray-600 dark:text-gray-400">
                            {{ changement.description }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </div>

        <!-- Message si aucun résultat -->
        <div
          v-if="filteredDecrets.length === 0"
          class="text-center py-12"
        >
          <UIcon name="i-heroicons-document-text" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p class="text-gray-600 dark:text-gray-400">
            Aucun décret trouvé avec ces critères
          </p>
          <UButton
            variant="soft"
            color="primary"
            class="mt-4"
            @click="resetFilters"
          >
            Réinitialiser les filtres
          </UButton>
        </div>
      </div>

    </div>
  </div>
</template>
