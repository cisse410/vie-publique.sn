<script setup lang="ts">

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
  twitterCard: "summary_large_image",
  twitterDescription: description,
  keywords: [
    ...keywords,
    "Etat du Sénégal",
    "Présidence de la République du Sénégal",
    "ministres du Sénégal",
    "nomination du Premier Ministre",
    "primature",
    "Premier Ministre",
    "DG Sénégal",
    "administration centrale des ministères",
    "composition du Gouvernement",
    "constitution",
    "décret",
    "organisation administrative",
  ].join(", "),
})

// Vue active (arborescence ou liste)
const currentView = computed(() => (route.query.view as string) || 'arborescence')

// Basculer entre les vues
const switchView = (view: 'arborescence' | 'liste') => {
  const query = { ...route.query, view }
  router.push({ query })
}

// Recherche et filtres pour la vue liste
const searchQuery = ref('')
const selectedType = ref('all')

// Types d'entités
const entityTypes = [
  { value: 'all', label: 'Tous les types' },
  { value: 'ministere', label: 'Ministères' },
  { value: 'direction', label: 'Directions' },
  { value: 'service', label: 'Services' },
  { value: 'etablissement_public', label: 'Établissements publics' },
  { value: 'societe_nationale', label: 'Sociétés nationales' },
]

// DONNÉES MOCKÉES POUR DÉMONSTRATION
const mockData = {
  decret: {
    numero: "2024-940",
    date: "05 Avril 2024",
    titre: "Répartition des services de l'État et du contrôle des Établissements publics"
  },
  arborescence: [
    {
      id: '1',
      slug: 'presidence-republique',
      name: 'Présidence de la République',
      type: 'presidence',
      icon: 'i-heroicons-building-office',
      color: 'primary',
      children: [
        {
          id: '1-1',
          name: 'Cabinet du Président de la République',
          type: 'cabinet',
          description: 'Direction et coordination des activités présidentielles',
          children: [
            { id: '1-1-1', name: 'Bureau du Chef de Cabinet', type: 'service', children: [] },
            { id: '1-1-2', name: 'Cellule de Communication', type: 'service', children: [] },
          ]
        },
        {
          id: '1-2',
          name: 'Cabinet militaire',
          type: 'cabinet',
          children: [
            { id: '1-2-1', name: 'Service de sécurité présidentielle', type: 'service', children: [] }
          ]
        },
        {
          id: '1-3',
          name: 'Secrétariat général de la Présidence',
          type: 'service',
          children: []
        }
      ]
    },
    {
      id: '2',
      slug: 'primature',
      name: 'Primature',
      type: 'primature',
      icon: 'i-heroicons-building-library',
      color: 'blue',
      children: [
        {
          id: '2-1',
          name: 'Cabinet du Premier Ministre',
          type: 'cabinet',
          children: [
            { id: '2-1-1', name: 'Direction de Cabinet', type: 'direction', children: [] }
          ]
        },
        {
          id: '2-2',
          name: 'Secrétariat général du Gouvernement',
          type: 'service',
          children: []
        }
      ]
    },
    {
      id: '3',
      name: 'Ministères',
      type: 'ministeres',
      icon: 'i-heroicons-building-office-2',
      color: 'purple',
      children: [
        {
          id: '3-1',
          slug: 'ministere-sante-action-sociale',
          name: 'Ministère de la Santé et de l\'Action sociale',
          type: 'ministere',
          ministre: 'Mme Aïssatou MBODJ',
          children: [
            {
              id: '3-1-1',
              name: 'Cabinet du Ministre',
              type: 'cabinet',
              children: []
            },
            {
              id: '3-1-2',
              name: 'Direction générale de la Santé',
              type: 'direction',
              directeur: 'Dr. Mamadou FALL',
              children: [
                { id: '3-1-2-1', name: 'Division Prévention', type: 'service', children: [] },
                { id: '3-1-2-2', name: 'Division Épidémiologie', type: 'service', children: [] }
              ]
            },
            {
              id: '3-1-3',
              name: 'Centre hospitalier universitaire de Dakar',
              type: 'etablissement_public',
              supervised: true,
              children: []
            },
            {
              id: '3-1-4',
              name: 'Pharmacie nationale d\'approvisionnement',
              type: 'etablissement_public',
              supervised: true,
              children: []
            }
          ]
        },
        {
          id: '3-2',
          name: 'Ministère de l\'Économie et des Finances',
          slug: 'ministere-de-l-econome-et-des-finances',
          type: 'ministere',
          ministre: 'M. Cheikh DIBA',
          children: [
            {
              id: '3-2-1',
              name: 'Cabinet du Ministre',
              type: 'cabinet',
              children: []
            },
            {
              id: '3-2-2',
              name: 'Direction générale du Budget',
              type: 'direction',
              children: [
                { id: '3-2-2-1', name: 'Direction du Budget', type: 'service', children: [] },
                { id: '3-2-2-2', name: 'Direction de la Comptabilité publique', type: 'service', children: [] }
              ]
            },
            {
              id: '3-2-3',
              name: 'Direction générale des Impôts et des Domaines',
              type: 'direction',
              children: []
            }
          ]
        },
        {
          id: '3-3',
          name: 'Ministère de l\'Éducation nationale',
          type: 'ministere',
          ministre: 'M. Moustapha MAMBA GUIRASSY',
          children: [
            {
              id: '3-3-1',
              name: 'Cabinet du Ministre',
              type: 'cabinet',
              children: []
            },
            {
              id: '3-3-2',
              name: 'Direction de l\'Enseignement élémentaire',
              type: 'direction',
              children: [
                { id: '3-3-2-1', name: 'Bureau de la Pédagogie', type: 'service', children: [] }
              ]
            },
            {
              id: '3-3-3',
              name: 'Direction de l\'Enseignement moyen secondaire général',
              type: 'direction',
              children: []
            }
          ]
        }
      ]
    }
  ],
  listeEntites: [
    { id: '3', name: 'Ministère de la Santé et de l\'Action sociale', type: 'ministere', parent: 'État du Sénégal', ministre: 'Mme Aïssatou MBODJ' },
    { id: '4', name: 'Ministère de l\'Économie et des Finances', type: 'ministere', parent: 'État du Sénégal', ministre: 'M. Cheikh DIBA' },
    { id: '5', name: 'Ministère de l\'Éducation nationale', type: 'ministere', parent: 'État du Sénégal', ministre: 'M. Moustapha MAMBA GUIRASSY' },
    { id: '3-2', name: 'Direction générale de la Santé', type: 'direction', parent: 'Ministère de la Santé', directeur: 'Dr. Mamadou FALL' },
    { id: '4-2', name: 'Direction générale du Budget', type: 'direction', parent: 'Ministère de l\'Économie' },
    { id: '4-3', name: 'Direction générale des Impôts et des Domaines', type: 'direction', parent: 'Ministère de l\'Économie' },
    { id: '5-2', name: 'Direction de l\'Enseignement élémentaire', type: 'direction', parent: 'Ministère de l\'Éducation' },
    { id: '5-3', name: 'Direction de l\'Enseignement moyen secondaire général', type: 'direction', parent: 'Ministère de l\'Éducation' },
    { id: '3-2-1', name: 'Division Prévention', type: 'service', parent: 'Direction générale de la Santé' },
    { id: '3-2-2', name: 'Division Épidémiologie', type: 'service', parent: 'Direction générale de la Santé' },
    { id: '4-2-1', name: 'Direction du Budget', type: 'service', parent: 'Direction générale du Budget' },
    { id: '4-2-2', name: 'Direction de la Comptabilité publique', type: 'service', parent: 'Direction générale du Budget' },
    { id: '3-3', name: 'Centre hospitalier universitaire de Dakar', type: 'etablissement_public', parent: 'Ministère de la Santé', supervised: true },
    { id: '3-4', name: 'Pharmacie nationale d\'approvisionnement', type: 'etablissement_public', parent: 'Ministère de la Santé', supervised: true },
  ]
}

// Filtrage des données pour la vue liste
const filteredEntities = computed(() => {
  let filtered = mockData.listeEntites

  // Filtre par type
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(entity => entity.type === selectedType.value)
  }

  // Filtre par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(entity =>
      entity.name.toLowerCase().includes(query) ||
      entity.parent.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Couleur de badge par type
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    presidence: 'primary',
    primature: 'blue',
    ministere: 'purple',
    direction: 'green',
    service: 'orange',
    etablissement_public: 'red',
    societe_nationale: 'pink',
    cabinet: 'gray',
  }
  return colors[type] || 'gray'
}

// Icône par type
const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    presidence: 'i-heroicons-building-office',
    primature: 'i-heroicons-building-library',
    ministere: 'i-heroicons-building-office-2',
    direction: 'i-heroicons-folder',
    service: 'i-heroicons-document-text',
    etablissement_public: 'i-heroicons-building-storefront',
    societe_nationale: 'i-heroicons-building-office-2',
    cabinet: 'i-heroicons-briefcase',
  }
  return icons[type] || 'i-heroicons-rectangle-group'
}

// Statistiques mockées
const stats = computed(() => {
  // Les ministères sont maintenant des enfants du parent "Ministères" (id: '3')
  const ministeresParent = mockData.arborescence.find(e => e.id === '3')
  const nbMinisteres = ministeresParent?.children?.length || 0

  return {
    ministeres: nbMinisteres,
    directions: mockData.listeEntites.filter(e => e.type === 'direction').length,
    services: mockData.listeEntites.filter(e => e.type === 'service').length,
    etablissements: mockData.listeEntites.filter(e => e.type === 'etablissement_public').length,
  }
})

// État d'expansion pour l'arborescence (tous ouverts par défaut)
const expandedNodes = ref<Set<string>>(new Set(['1', '2', '3', '3-1', '3-2', '3-3']))

const toggleNode = (nodeId: string) => {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const isExpanded = (nodeId: string) => expandedNodes.value.has(nodeId)
</script>

<template>
  <div class="flex flex-col px-4 py-6">
    <!-- En-tête -->
    <div class="prose prose-sm sm:prose mx-auto my-2">
      <h1 class="text-center dark:text-white">Organisation de l'État du Sénégal</h1>
      <p class="text-center text-gray-600 dark:text-gray-400">
        Répartition des services de l'État selon le décret n° {{ mockData.decret.numero }}
      </p>
    </div>

    <div class="mx-auto w-full max-w-6xl mt-8 space-y-6">
      <!-- Bannière Décret Actif -->
      <UCard class="bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 border-x-4 border-l-blue-500 dark:border-l-blue-500">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 class="font-semibold text-gray-900 dark:text-white">Décret n° {{ mockData.decret.numero }}</h3>
              <UBadge color="green" variant="subtle" size="xs">En vigueur</UBadge>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ mockData.decret.titre }}
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Publié le {{ mockData.decret.date }}
            </p>
          </div>
          <NuxtLink to="/etat/historique">
            <UButton
              icon="i-heroicons-clock"
              variant="soft"
              color="primary"
              size="sm"
            >
              Voir l'historique
            </UButton>
          </NuxtLink>
        </div>
      </UCard>

      <!-- Statistiques -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{{ stats.ministeres }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Ministères</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{{ stats.directions }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Directions</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{{ stats.services }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Services</div>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <div class="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{{ stats.etablissements }}</div>
            <div class="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">Établissements</div>
          </div>
        </UCard>
      </div>

      <!-- Sélecteur de vue -->
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <UButton
            :variant="currentView === 'arborescence' ? 'solid' : 'soft'"
            color="primary"
            icon="i-heroicons-squares-2x2"
            size="sm"
            @click="switchView('arborescence')"
          >
            Arborescence
          </UButton>
          <UButton
            :variant="currentView === 'liste' ? 'solid' : 'soft'"
            color="primary"
            icon="i-heroicons-list-bullet"
            size="sm"
            @click="switchView('liste')"
          >
            Liste
          </UButton>
        </div>

        <NuxtLink
          to="/etat/historique"
          class="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
        >
          <UIcon name="i-heroicons-clock" class="w-4 h-4" />
          Voir l'historique
        </NuxtLink>
      </div>

      <!-- VUE ARBORESCENCE - Simplifiée avec chevrons uniquement -->
      <div v-if="currentView === 'arborescence'" class="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-1">
        <div v-for="rootEntity in mockData.arborescence" :key="rootEntity.id" class="space-y-1">
          <!-- Root level -->
          <div class="flex items-start gap-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded transition-colors">
            <button
              v-if="rootEntity.children?.length"
              @click="toggleNode(rootEntity.id)"
              class="flex-shrink-0 mt-0.5"
            >
              <UIcon
                :name="isExpanded(rootEntity.id) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                class="w-4 h-4 text-gray-600 dark:text-gray-400"
              />
            </button>
            <div v-else class="w-4" />

            <NuxtLink
              v-if="rootEntity.slug"
              :to="`/etat/${rootEntity.slug}`"
              class="flex-1 min-w-0"
            >
              <div class="font-medium text-gray-900 dark:text-white">
                {{ rootEntity.name }}
              </div>
            </NuxtLink>
            <div v-else class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white">
                {{ rootEntity.name }}
              </div>
            </div>
          </div>

          <!-- Level 1 children -->
          <div v-if="isExpanded(rootEntity.id) && rootEntity.children?.length" class="space-y-0.5">
            <div v-for="child1 in rootEntity.children" :key="child1.id">
              <div class="flex items-start gap-2 py-1.5 pl-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded transition-colors">
                <button
                  v-if="child1.children?.length"
                  @click="toggleNode(child1.id)"
                  class="flex-shrink-0 mt-0.5"
                >
                  <UIcon
                    :name="isExpanded(child1.id) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                    class="w-4 h-4 text-gray-600 dark:text-gray-400"
                  />
                </button>
                <div v-else class="w-4" />

                <NuxtLink
                  :to="`/etat/${(child1 as any).slug || child1.id}`"
                  class="flex-1 min-w-0"
                >
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ child1.name }}
                  </div>
                </NuxtLink>
              </div>

              <!-- Level 2 children -->
              <div v-if="isExpanded(child1.id) && child1.children?.length" class="space-y-0.5">
                <div v-for="child2 in child1.children" :key="child2.id">
                  <div class="flex items-start gap-2 py-1.5 pl-12 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded transition-colors">
                    <button
                      v-if="child2.children?.length"
                      @click="toggleNode(child2.id)"
                      class="flex-shrink-0 mt-0.5"
                    >
                      <UIcon
                        :name="isExpanded(child2.id) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                        class="w-4 h-4 text-gray-600 dark:text-gray-400"
                      />
                    </button>
                    <div v-else class="w-4" />

                    <NuxtLink
                      :to="`/etat/${(child2 as any).slug || child2.id}`"
                      class="flex-1 min-w-0"
                    >
                      <div class="text-sm text-gray-900 dark:text-white">
                        {{ child2.name }}
                      </div>
                    </NuxtLink>
                  </div>

                  <!-- Level 3 children -->
                  <div v-if="isExpanded(child2.id) && child2.children?.length" class="space-y-0.5">
                    <NuxtLink
                      v-for="child3 in child2.children"
                      :key="child3.id"
                      :to="`/etat/${(child3 as any).slug || child3.id}`"
                      class="flex items-start gap-2 py-1.5 pl-16 hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded transition-colors"
                    >
                      <div class="w-4" />
                      <div class="flex-1 min-w-0 text-sm text-gray-700 dark:text-gray-300">
                        {{ child3.name }}
                      </div>
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- VUE LISTE -->
      <div v-if="currentView === 'liste'" class="space-y-4">
        <!-- Filtres -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Rechercher..."
            class="flex-1"
            size="md"
          />
          <USelectMenu
            v-model="selectedType"
            :options="entityTypes"
            value-attribute="value"
            option-attribute="label"
            class="w-full md:w-56"
            size="md"
          />
        </div>

        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ filteredEntities.length }} entité(s) trouvée(s)
        </div>

        <!-- Liste -->
        <div class="grid gap-3">
          <UCard
            v-for="entity in filteredEntities"
            :key="entity.id"
            class="hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="flex items-center gap-4">
              <UIcon
                :name="getTypeIcon(entity.type)"
                class="w-8 h-8 md:w-10 md:h-10 text-gray-500 dark:text-gray-400 flex-shrink-0"
              />

              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ entity.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">
                  {{ entity.parent }}
                </p>

                <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <UBadge :color="getTypeColor(entity.type)" variant="subtle" size="xs">
                    {{ entity.type.replace('_', ' ') }}
                  </UBadge>
                  <span v-if="entity.ministre" class="truncate">{{ entity.ministre }}</span>
                  <span v-if="entity.directeur" class="truncate">{{ entity.directeur }}</span>
                </div>
              </div>

              <UButton
                icon="i-heroicons-arrow-right"
                variant="ghost"
                size="sm"
                color="gray"
              />
            </div>
          </UCard>
        </div>

        <!-- Message si aucun résultat -->
        <div v-if="filteredEntities.length === 0" class="text-center py-12">
          <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p class="text-gray-600 dark:text-gray-400">
            Aucune entité trouvée
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
