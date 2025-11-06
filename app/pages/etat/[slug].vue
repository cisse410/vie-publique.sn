<script setup lang="ts">
const { keywords, siteUrl } = useSiteMetadata()
const route = useRoute()

const slug = route.params.slug as string

// DONNÉES MOCKÉES - Mapping slug -> données
const mockEntitiesData: Record<string, any> = {
  'presidence-republique': {
    id: '1',
    slug: 'presidence-republique',
    name: 'Présidence de la République',
    type: 'presidence',
    description: 'La Présidence de la République du Sénégal est l\'institution suprême de l\'État. Elle assure la direction de la politique nationale et garantit le respect de la Constitution, l\'indépendance nationale, l\'intégrité du territoire et le respect des traités.',
    ministre: {
      nom: 'M. Bassirou Diomaye FAYE',
      titre: 'Président de la République',
      photo: null,
    },
    coordonnees: {
      adresse: 'Avenue Léopold Sédar Senghor',
      ville: 'Dakar',
      codePostal: '12000',
      telephone: '+221 33 823 45 45',
      fax: '+221 33 822 58 22',
      email: 'contact@presidence.sn',
      siteWeb: 'http://www.presidence.sn',
      horaires: 'Lundi - Vendredi: 8h00 - 18h00'
    },
    decret: {
      numero: '2024-940',
      date: '2024-04-05',
      dateFormatted: '05 Avril 2024',
      article: 'Article 1',
      lien: '#'
    },
    parent: null,
    cabinetsServices: [
      { id: '1-1', name: 'Cabinet du Président de la République', type: 'cabinet', responsable: null, slug: 'cabinet-president' },
      { id: '1-2', name: 'Cabinet militaire', type: 'cabinet', responsable: null, slug: 'cabinet-militaire' },
      { id: '1-3', name: 'Secrétariat général de la Présidence', type: 'service', responsable: null, slug: 'secretariat-general-presidence' }
    ],
    directions: [],
    etablissementsPublics: [],
    societes: []
  },
  'primature': {
    id: '2',
    slug: 'primature',
    name: 'Primature',
    type: 'primature',
    description: 'La Primature est chargée de la coordination de l\'action gouvernementale sous l\'autorité du Premier Ministre. Elle assure la mise en œuvre de la politique générale de l\'État et veille à l\'exécution des décisions du Conseil des Ministres.',
    ministre: {
      nom: 'M. Ousmane SONKO',
      titre: 'Premier Ministre',
      photo: null,
    },
    coordonnees: {
      adresse: 'Building administratif',
      ville: 'Dakar',
      codePostal: '12000',
      telephone: '+221 33 889 21 21',
      fax: '+221 33 823 56 18',
      email: 'contact@primature.sn',
      siteWeb: 'http://www.primature.sn',
      horaires: 'Lundi - Vendredi: 8h00 - 17h30'
    },
    decret: {
      numero: '2024-940',
      date: '2024-04-05',
      dateFormatted: '05 Avril 2024',
      article: 'Article 2',
      lien: '#'
    },
    parent: null,
    cabinetsServices: [
      { id: '2-1', name: 'Cabinet du Premier Ministre', type: 'cabinet', responsable: null, slug: 'cabinet-premier-ministre' },
      { id: '2-2', name: 'Secrétariat général du Gouvernement', type: 'service', responsable: null, slug: 'secretariat-general-gouvernement' }
    ],
    directions: [],
    etablissementsPublics: [],
    societes: []
  },
  'ministere-sante-action-sociale': {
    id: '3',
    slug: 'ministere-sante-action-sociale',
    name: 'Ministère de la Santé et de l\'Action sociale',
    type: 'ministere',
    description: 'Le Ministère de la Santé et de l\'Action sociale a pour mission d\'élaborer et de mettre en œuvre la politique nationale en matière de santé publique, d\'hygiène, de prévention, de soins de santé et d\'action sociale. Il assure également la supervision des établissements de santé publics et privés.',
    ministre: {
      nom: 'Mme Aïssatou MBODJ',
      titre: 'Ministre',
      photo: null,
    },
    coordonnees: {
      adresse: 'Fann Résidence, Rue Aimé Césaire',
      ville: 'Dakar',
      codePostal: '12500',
      telephone: '+221 33 869 44 50',
      fax: '+221 33 825 59 72',
      email: 'contact@sante.gouv.sn',
      siteWeb: 'http://www.sante.gouv.sn',
      horaires: 'Lundi - Vendredi: 8h00 - 17h00'
    },
    decret: {
      numero: '2024-940',
      date: '2024-04-05',
      dateFormatted: '05 Avril 2024',
      article: 'Article 3',
      lien: '#'
    },
    parent: null,
    cabinetsServices: [
      { id: '3-1', name: 'Cabinet du Ministre', type: 'cabinet', responsable: null, slug: 'cabinet-ministre-sante' },
      { id: '3-1-1', name: 'Chef de Cabinet', type: 'service', responsable: 'Dr. Fatou DIOP', slug: 'chef-cabinet-sante' },
      { id: '3-1-2', name: 'Conseiller technique', type: 'service', responsable: 'M. Abdou SARR', slug: 'conseiller-technique-sante' }
    ],
    directions: [
      { id: '3-2', name: 'Direction générale de la Santé', type: 'direction', responsable: 'Dr. Mamadou FALL', slug: 'direction-generale-sante' },
      { id: '3-3', name: 'Direction de la Prévention', type: 'direction', responsable: 'Dr. Aminata NDIAYE', slug: 'direction-prevention' },
      { id: '3-4', name: 'Direction des Établissements de santé', type: 'direction', responsable: 'Dr. Ousmane DIALLO', slug: 'direction-etablissements-sante' }
    ],
    etablissementsPublics: [
      { id: '3-e1', name: 'Centre hospitalier universitaire de Dakar', type: 'etablissement_public', directeur: 'Pr. Moussa SEYDI', slug: 'chu-dakar' },
      { id: '3-e2', name: 'Hôpital Principal de Dakar', type: 'etablissement_public', directeur: 'Dr. Amadou DIOP', slug: 'hopital-principal-dakar' },
      { id: '3-e3', name: 'Pharmacie Nationale d\'Approvisionnement', type: 'etablissement_public', directeur: 'M. Babacar NDIAYE', slug: 'pna' }
    ],
    societes: [
      { id: '3-s1', name: 'SUMA Assistance Sénégal', type: 'societe_nationale', directeur: 'Mme Aïcha FALL', slug: 'suma-assistance' }
    ]
  }
}

// Récupérer les données par slug
const mockEntity = mockEntitiesData[slug] || null

// Si l'entité n'existe pas, afficher une erreur 404
if (!mockEntity) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Entité non trouvée',
    fatal: true
  })
}

const title = mockEntity.name
const description = mockEntity.description
const url = `${siteUrl}/etat/${slug}`

// SEO Meta Tags optimisés
useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  twitterCard: "summary_large_image",
  twitterTitle: title,
  twitterDescription: description,
  ogUrl: url,
  keywords: [
    ...keywords,
    mockEntity.name,
    mockEntity.type,
    'organisation État Sénégal',
    'gouvernement sénégalais',
    'administration publique',
    mockEntity.ministre?.nom || ''
  ].filter(Boolean).join(", "),
})

// Structured Data pour SEO (Schema.org)
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'GovernmentOrganization',
        name: mockEntity.name,
        description: mockEntity.description,
        url,
        address: {
          '@type': 'PostalAddress',
          streetAddress: mockEntity.coordonnees.adresse,
          addressLocality: mockEntity.coordonnees.ville,
          postalCode: mockEntity.coordonnees.codePostal,
          addressCountry: 'SN'
        },
        telephone: mockEntity.coordonnees.telephone,
        email: mockEntity.coordonnees.email,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: mockEntity.coordonnees.telephone,
          email: mockEntity.coordonnees.email,
          contactType: 'Service public'
        }
      })
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: url
    }
  ]
})

// Tabs actif
const activeTab = ref('cabinet')

const tabs = computed(() => {
  const tabsList = []

  if (mockEntity.cabinetsServices?.length > 0) {
    tabsList.push({ id: 'cabinet', label: `Cabinet & Services (${mockEntity.cabinetsServices.length})`, count: mockEntity.cabinetsServices.length })
  }

  if (mockEntity.directions?.length > 0) {
    tabsList.push({ id: 'directions', label: `Directions (${mockEntity.directions.length})`, count: mockEntity.directions.length })
  }

  if (mockEntity.etablissementsPublics?.length > 0) {
    tabsList.push({ id: 'etablissements', label: `Établissements publics (${mockEntity.etablissementsPublics.length})`, count: mockEntity.etablissementsPublics.length })
  }

  if (mockEntity.societes?.length > 0) {
    tabsList.push({ id: 'societes', label: `Sociétés (${mockEntity.societes.length})`, count: mockEntity.societes.length })
  }

  return tabsList
})

// Couleur de badge par type
const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
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
    ministere: 'i-heroicons-building-office-2',
    direction: 'i-heroicons-folder',
    service: 'i-heroicons-document-text',
    etablissement_public: 'i-heroicons-building-storefront',
    societe_nationale: 'i-heroicons-building-office-2',
    cabinet: 'i-heroicons-briefcase',
  }
  return icons[type] || 'i-heroicons-rectangle-group'
}
</script>

<template>
  <article class="flex flex-col px-4 py-6">
    <!-- Breadcrumb -->
    <nav class="mx-auto w-full max-w-7xl mb-6" aria-label="Fil d'Ariane">
      <ol class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <NuxtLink to="/etat" class="hover:text-primary-600 dark:hover:text-primary-400" itemprop="item">
            <span itemprop="name">Organisation de l'État</span>
          </NuxtLink>
          <meta itemprop="position" content="1" />
        </li>
        <li>
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
        </li>
        <li v-if="mockEntity.parent" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <NuxtLink :to="`/etat/${mockEntity.parent.slug}`" class="hover:text-primary-600 dark:hover:text-primary-400" itemprop="item">
            <span itemprop="name">{{ mockEntity.parent.name }}</span>
          </NuxtLink>
          <meta itemprop="position" content="2" />
        </li>
        <li v-if="mockEntity.parent">
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
        </li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span class="text-gray-900 dark:text-white" itemprop="name">{{ mockEntity.name }}</span>
          <meta itemprop="position" :content="mockEntity.parent ? '3' : '2'" />
        </li>
      </ol>
    </nav>

    <div class="mx-auto w-full max-w-7xl">
      <!-- En-tête avec infos principales -->
      <header class="mb-6">
        <UCard>
          <div class="flex flex-col md:flex-row items-start gap-6">
            <!-- Photo du dirigeant (placeholder) -->
            <div class="flex-shrink-0">
              <div class="w-24 h-24 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
            </div>

            <!-- Informations principales -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex-1 min-w-0">
                  <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {{ mockEntity.name }}
                  </h1>
                  <div class="flex flex-wrap items-center gap-3 mb-4">
                    <UBadge :color="getTypeColor(mockEntity.type)" variant="subtle" size="md">
                      {{ mockEntity.type }}
                    </UBadge>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      Décret n° {{ mockEntity.decret.numero }} - {{ mockEntity.decret.dateFormatted }}
                    </span>
                  </div>
                  <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {{ mockEntity.description }}
                  </p>
                </div>
              </div>

              <!-- Dirigeant -->
              <div v-if="mockEntity.ministre" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-gray-500" />
                  <div>
                    <div class="text-xs text-gray-500 dark:text-gray-500">{{ mockEntity.ministre.titre }}</div>
                    <div class="font-semibold text-gray-900 dark:text-white">{{ mockEntity.ministre.nom }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </header>

      <!-- Layout 2 colonnes : Contenu principal + Coordonnées -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Contenu principal (2/3 de la largeur) -->
        <section class="lg:col-span-2">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Structures rattachées
              </h2>
            </template>

            <!-- Tabs -->
            <nav class="border-b border-gray-200 dark:border-gray-700 -mt-4 mb-4" aria-label="Sections">
              <div class="flex gap-4 overflow-x-auto">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="[
                    'px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  ]"
                  :aria-selected="activeTab === tab.id"
                  role="tab"
                >
                  {{ tab.label }}
                </button>
              </div>
            </nav>

            <!-- Contenu des tabs -->
            <div class="space-y-3" role="tabpanel">
              <!-- Cabinet & Services -->
              <div v-if="activeTab === 'cabinet' && mockEntity.cabinetsServices">
                <NuxtLink
                  v-for="item in mockEntity.cabinetsServices"
                  :key="item.id"
                  :to="`/etat/${item.slug}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer group transition-colors"
                >
                  <UIcon :name="getTypeIcon(item.type)" class="w-5 h-5 text-gray-500" />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 dark:text-white truncate">
                      {{ item.name }}
                    </div>
                    <div v-if="item.responsable" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {{ item.responsable }}
                    </div>
                  </div>
                  <UBadge :color="getTypeColor(item.type)" variant="subtle" size="xs">
                    {{ item.type }}
                  </UBadge>
                  <UButton
                    icon="i-heroicons-arrow-right"
                    variant="ghost"
                    size="xs"
                    color="gray"
                    class="opacity-0 group-hover:opacity-100"
                  />
                </NuxtLink>
              </div>

              <!-- Directions -->
              <div v-if="activeTab === 'directions' && mockEntity.directions">
                <NuxtLink
                  v-for="item in mockEntity.directions"
                  :key="item.id"
                  :to="`/etat/${item.slug}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer group transition-colors"
                >
                  <UIcon :name="getTypeIcon(item.type)" class="w-5 h-5 text-gray-500" />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 dark:text-white truncate">
                      {{ item.name }}
                    </div>
                    <div v-if="item.responsable" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {{ item.responsable }}
                    </div>
                  </div>
                  <UBadge :color="getTypeColor(item.type)" variant="subtle" size="xs">
                    {{ item.type }}
                  </UBadge>
                  <UButton
                    icon="i-heroicons-arrow-right"
                    variant="ghost"
                    size="xs"
                    color="gray"
                    class="opacity-0 group-hover:opacity-100"
                  />
                </NuxtLink>
              </div>

              <!-- Établissements publics -->
              <div v-if="activeTab === 'etablissements' && mockEntity.etablissementsPublics">
                <NuxtLink
                  v-for="item in mockEntity.etablissementsPublics"
                  :key="item.id"
                  :to="`/etat/${item.slug}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer group transition-colors"
                >
                  <UIcon :name="getTypeIcon(item.type)" class="w-5 h-5 text-gray-500" />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 dark:text-white truncate">
                      {{ item.name }}
                    </div>
                    <div v-if="item.directeur" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                      Directeur: {{ item.directeur }}
                    </div>
                  </div>
                  <UBadge :color="getTypeColor(item.type)" variant="subtle" size="xs">
                    Établissement public
                  </UBadge>
                  <UButton
                    icon="i-heroicons-arrow-right"
                    variant="ghost"
                    size="xs"
                    color="gray"
                    class="opacity-0 group-hover:opacity-100"
                  />
                </NuxtLink>
              </div>

              <!-- Sociétés -->
              <div v-if="activeTab === 'societes' && mockEntity.societes">
                <NuxtLink
                  v-for="item in mockEntity.societes"
                  :key="item.id"
                  :to="`/etat/${item.slug}`"
                  class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer group transition-colors"
                >
                  <UIcon :name="getTypeIcon(item.type)" class="w-5 h-5 text-gray-500" />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-gray-900 dark:text-white truncate">
                      {{ item.name }}
                    </div>
                    <div v-if="item.directeur" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                      Directeur: {{ item.directeur }}
                    </div>
                  </div>
                  <UBadge :color="getTypeColor(item.type)" variant="subtle" size="xs">
                    Société
                  </UBadge>
                  <UButton
                    icon="i-heroicons-arrow-right"
                    variant="ghost"
                    size="xs"
                    color="gray"
                    class="opacity-0 group-hover:opacity-100"
                  />
                </NuxtLink>
              </div>
            </div>
          </UCard>
        </section>

        <!-- Coordonnées (1/3 de la largeur) -->
        <aside class="lg:col-span-1">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Coordonnées
              </h2>
            </template>

            <div class="space-y-4">
              <!-- Adresse -->
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-gray-500 mb-1">Adresse</div>
                  <address class="text-sm text-gray-900 dark:text-white not-italic">
                    {{ mockEntity.coordonnees.adresse }}<br>
                    {{ mockEntity.coordonnees.ville }}
                    <span v-if="mockEntity.coordonnees.codePostal">, {{ mockEntity.coordonnees.codePostal }}</span>
                  </address>
                </div>
              </div>

              <!-- Téléphone -->
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-phone" class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-gray-500 mb-1">Téléphone</div>
                  <a
                    :href="`tel:${mockEntity.coordonnees.telephone}`"
                    class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {{ mockEntity.coordonnees.telephone }}
                  </a>
                </div>
              </div>

              <!-- Fax -->
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-printer" class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-gray-500 mb-1">Fax</div>
                  <div class="text-sm text-gray-900 dark:text-white break-all">
                    {{ mockEntity.coordonnees.fax }}
                  </div>
                </div>
              </div>

              <!-- Email -->
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-gray-500 mb-1">Email</div>
                  <a
                    :href="`mailto:${mockEntity.coordonnees.email}`"
                    class="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all"
                  >
                    {{ mockEntity.coordonnees.email }}
                  </a>
                </div>
              </div>

              <!-- Site web -->
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-gray-500 mb-1">Site web</div>
                  <a
                    :href="mockEntity.coordonnees.siteWeb"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all"
                  >
                    {{ mockEntity.coordonnees.siteWeb }}
                  </a>
                </div>
              </div>

              <!-- Horaires -->
              <div v-if="mockEntity.coordonnees.horaires" class="flex items-start gap-3">
                <UIcon name="i-heroicons-clock" class="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-gray-500 mb-1">Horaires</div>
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ mockEntity.coordonnees.horaires }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Décret de référence -->
            <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div class="text-xs text-gray-500 dark:text-gray-500 mb-2">Référence légale</div>
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-gray-500" />
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Décret n° {{ mockEntity.decret.numero }}
                </div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-500 mb-2">
                {{ mockEntity.decret.dateFormatted }} - {{ mockEntity.decret.article }}
              </div>
              <UButton
                label="Consulter le décret"
                icon="i-heroicons-arrow-top-right-on-square"
                variant="soft"
                size="xs"
                :to="mockEntity.decret.lien"
                target="_blank"
                class="w-full"
              />
            </div>
          </UCard>
        </aside>
      </div>
    </div>
  </article>
</template>
