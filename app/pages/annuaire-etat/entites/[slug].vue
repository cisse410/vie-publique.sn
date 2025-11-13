<script setup lang="ts">
import { useEntity } from '~/composables/annuaire-etat/useEntity'
import type { PublicEntity } from '~~/types/etat'

const { keywords, siteUrl } = useSiteMetadata()
const route = useRoute()
const { fetchEntity } = useEntity()

const slug = route.params.slug as string

// Fetch entity data with SSR via composable
const {
  data: entity,
  pending,
  error,
} = await useAsyncData(`entity-${slug}`, () => fetchEntity(slug))

// Si l'entité n'existe pas ou n'a pas de page publique, afficher une erreur 404
if (error.value || !entity.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Entité non trouvée ou n'a pas de page publique",
    fatal: true,
  })
}

const title = entity.value.canonical_name
const description =
  entity.value.description || `${entity.value.canonical_name} - Organisation de l'État du Sénégal`
const url = `${siteUrl}/annuaire-etat/entites/${slug}`

// SEO Meta Tags optimisés
useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  ogUrl: url,
  keywords: [
    ...keywords,
    entity.value.canonical_name,
    entity.value.entity_type_id.label,
    'organisation État Sénégal',
    'gouvernement sénégalais',
    'administration publique',
    'annuaire état',
  ]
    .filter(Boolean)
    .join(', '),
})

// Structured Data pour SEO (Schema.org)
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'GovernmentOrganization',
        name: entity.value.canonical_name,
        description: entity.value.description || entity.value.canonical_name,
        url,
        ...(entity.value.adresse && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: entity.value.adresse,
            addressCountry: 'SN',
          },
        }),
        ...(entity.value.phone && { telephone: entity.value.phone }),
        ...(entity.value.email && { email: entity.value.email }),
        ...(entity.value.phone || entity.value.email
          ? {
              contactPoint: {
                '@type': 'ContactPoint',
                ...(entity.value.phone && { telephone: entity.value.phone }),
                ...(entity.value.email && { email: entity.value.email }),
                contactType: 'Service public',
              },
            }
          : {}),
      }),
    },
  ],
  link: [
    {
      rel: 'canonical',
      href: url,
    },
  ],
})

// Group child entities into 3 fixed categories
const childrenByCategory = computed(() => {
  if (!entity.value?.child_entities) return { cabinet: [], secretariat: [], autres: [] }

  const cabinet: PublicEntity[] = []
  const secretariat: PublicEntity[] = []
  const autres: PublicEntity[] = []

  entity.value.child_entities.forEach((child: PublicEntity) => {
    const typeCode = child.entity_type_id.code.toLowerCase()

    if (typeCode.includes('cabinet')) {
      cabinet.push(child)
    } else if (typeCode.includes('secretariat')) {
      secretariat.push(child)
    } else {
      autres.push(child)
    }
  })

  return { cabinet, secretariat, autres }
})

// Active tab
const activeTab = ref('cabinet')

// Create tabs (only show tabs with content)
const tabs = computed(() => {
  const tabsList = []
  const categories = childrenByCategory.value

  if (categories.cabinet.length > 0) {
    tabsList.push({ id: 'cabinet', label: `Cabinet (${categories.cabinet.length})` })
  }

  if (categories.secretariat.length > 0) {
    tabsList.push({ id: 'secretariat', label: `Secrétariat (${categories.secretariat.length})` })
  }

  if (categories.autres.length > 0) {
    tabsList.push({ id: 'autres', label: `Autres administrations (${categories.autres.length})` })
  }

  return tabsList
})

// Set default active tab
watch(
  tabs,
  (newTabs) => {
    if (newTabs.length > 0 && !activeTab.value) {
      activeTab.value = newTabs[0].id
    }
  },
  { immediate: true },
)

// Couleur de badge par type
const getTypeColor = (typeCode: string) => {
  const colors: Record<string, string> = {
    ministere: 'purple',
    direction: 'green',
    direction_generale: 'green',
    service: 'orange',
    cabinet: 'gray',
    secretariat_etat: 'blue',
    presidence: 'red',
    primature: 'red',
  }
  return colors[typeCode] || 'gray'
}

// Icône par type
const getTypeIcon = (typeCode: string) => {
  const icons: Record<string, string> = {
    ministere: 'i-heroicons-building-office-2',
    direction: 'i-heroicons-folder',
    direction_generale: 'i-heroicons-folder',
    service: 'i-heroicons-document-text',
    cabinet: 'i-heroicons-briefcase',
    secretariat_etat: 'i-heroicons-building-office',
    presidence: 'i-heroicons-building-library',
    primature: 'i-heroicons-building-library',
  }
  return icons[typeCode] || 'i-heroicons-rectangle-group'
}
</script>

<template>
  <article v-if="!pending && entity" class="flex flex-col px-4 py-6">
    <!-- Breadcrumb -->
    <nav class="mx-auto mb-6 w-full max-w-7xl" aria-label="Fil d'Ariane">
      <ol
        class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        itemscope
        itemtype="https://schema.org/BreadcrumbList"
      >
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <NuxtLink
            to="/annuaire-etat"
            class="hover:text-primary-600 dark:hover:text-primary-400"
            itemprop="item"
          >
            <span itemprop="name">Annuaire de l'État</span>
          </NuxtLink>
          <meta itemprop="position" content="1" />
        </li>
        <li>
          <UIcon name="i-heroicons-chevron-right" class="h-4 w-4" />
        </li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span class="text-gray-900 dark:text-white" itemprop="name">{{
            entity.canonical_name
          }}</span>
          <meta itemprop="position" content="2" />
        </li>
      </ol>
    </nav>

    <div class="mx-auto w-full max-w-7xl">
      <!-- En-tête avec infos principales -->
      <header class="mb-6">
        <UCard>
          <div class="flex flex-col items-start gap-6 md:flex-row">
            <!-- Icon placeholder -->
            <div class="flex-shrink-0">
              <div
                class="from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br"
              >
                <UIcon
                  :name="getTypeIcon(entity.entity_type_id.code)"
                  class="text-primary-600 dark:text-primary-400 h-12 w-12"
                />
              </div>
            </div>

            <!-- Informations principales -->
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <h1 class="mb-3 text-2xl font-bold text-gray-900 md:text-3xl dark:text-white">
                    {{ entity.canonical_name }}
                  </h1>
                  <div class="mb-4 flex flex-wrap items-center gap-3">
                    <UBadge
                      :color="getTypeColor(entity.entity_type_id.code)"
                      variant="subtle"
                      size="md"
                    >
                      {{ entity.entity_type_id.label }}
                    </UBadge>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      Depuis
                      {{
                        new Date(entity.first_appearance).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      }}
                    </span>
                  </div>
                  <p
                    v-if="entity.description"
                    class="leading-relaxed text-gray-700 dark:text-gray-300"
                  >
                    {{ entity.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </header>

      <!-- Layout 2 colonnes : Contenu principal + Coordonnées -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Contenu principal (2/3 de la largeur) -->
        <section
          v-if="entity.child_entities && entity.child_entities.length > 0"
          class="lg:col-span-2"
        >
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Structures rattachées
              </h2>
            </template>

            <!-- Tabs -->
            <nav
              v-if="tabs.length > 1"
              class="-mt-4 mb-4 border-b border-gray-200 dark:border-gray-700"
              aria-label="Sections"
            >
              <div class="flex gap-4 overflow-x-auto">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  :class="[
                    'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
                  ]"
                  :aria-selected="activeTab === tab.id"
                  role="tab"
                >
                  {{ tab.label }}
                </button>
              </div>
            </nav>

            <!-- Contenu des tabs - NON CLIQUABLE -->
            <div class="space-y-3" role="tabpanel">
              <div
                v-for="child in childrenByCategory[activeTab]"
                :key="child.id"
                class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <UIcon
                  :name="getTypeIcon(child.entity_type_id.code)"
                  class="h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <div class="min-w-0 flex-1">
                  <div class="truncate font-medium text-gray-900 dark:text-white">
                    {{ child.official_label || child.canonical_name }}
                  </div>
                </div>
                <UBadge :color="getTypeColor(child.entity_type_id.code)" variant="subtle" size="xs">
                  {{ child.entity_type_id.label }}
                </UBadge>
              </div>
            </div>
          </UCard>
        </section>

        <!-- Empty state if no children -->
        <section v-else class="lg:col-span-2">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Structures rattachées
              </h2>
            </template>
            <div class="py-8 text-center text-gray-500 dark:text-gray-400">
              <UIcon name="i-heroicons-folder-open" class="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>Aucune structure rattachée pour le moment.</p>
            </div>
          </UCard>
        </section>

        <!-- Coordonnées (1/3 de la largeur) -->
        <aside class="lg:col-span-1">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Coordonnées</h2>
            </template>

            <div class="space-y-4">
              <!-- Adresse -->
              <div v-if="entity.adresse" class="flex items-start gap-3">
                <UIcon
                  name="i-heroicons-map-pin"
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <div class="min-w-0 flex-1">
                  <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">Adresse</div>
                  <address class="text-sm not-italic text-gray-900 dark:text-white">
                    {{ entity.adresse }}
                  </address>
                </div>
              </div>

              <!-- Téléphone -->
              <div v-if="entity.phone" class="flex items-start gap-3">
                <UIcon
                  name="i-heroicons-phone"
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <div class="min-w-0 flex-1">
                  <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">Téléphone</div>
                  <a
                    :href="`tel:${entity.phone}`"
                    class="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                  >
                    {{ entity.phone }}
                  </a>
                </div>
              </div>

              <!-- Email -->
              <div v-if="entity.email" class="flex items-start gap-3">
                <UIcon
                  name="i-heroicons-envelope"
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <div class="min-w-0 flex-1">
                  <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">Email</div>
                  <a
                    :href="`mailto:${entity.email}`"
                    class="text-primary-600 dark:text-primary-400 break-all text-sm hover:underline"
                  >
                    {{ entity.email }}
                  </a>
                </div>
              </div>

              <!-- Site web -->
              <div v-if="entity.web_site" class="flex items-start gap-3">
                <UIcon
                  name="i-heroicons-globe-alt"
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <div class="min-w-0 flex-1">
                  <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">Site web</div>
                  <a
                    :href="entity.web_site"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-600 dark:text-primary-400 break-all text-sm hover:underline"
                  >
                    {{ entity.web_site }}
                  </a>
                </div>
              </div>

              <!-- Réseaux sociaux -->
              <div
                v-if="entity.reseaux_sociaux && Object.keys(entity.reseaux_sociaux).length > 0"
                class="flex items-start gap-3"
              >
                <UIcon
                  name="i-heroicons-hashtag"
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                />
                <div class="min-w-0 flex-1">
                  <div class="mb-1 text-xs text-gray-500 dark:text-gray-400">Réseaux sociaux</div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      v-for="(url, platform) in entity.reseaux_sociaux"
                      :key="platform"
                      :href="url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary-600 dark:text-primary-400 text-sm capitalize hover:underline"
                    >
                      {{ platform }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Empty state if no coordonnées -->
              <div
                v-if="
                  !entity.adresse &&
                  !entity.phone &&
                  !entity.email &&
                  !entity.web_site &&
                  (!entity.reseaux_sociaux || Object.keys(entity.reseaux_sociaux).length === 0)
                "
                class="py-4 text-center text-gray-500 dark:text-gray-400"
              >
                <UIcon
                  name="i-heroicons-information-circle"
                  class="mx-auto mb-2 h-8 w-8 opacity-50"
                />
                <p class="text-sm">Aucune information de contact disponible.</p>
              </div>
            </div>
          </UCard>
        </aside>
      </div>
    </div>
  </article>

  <!-- Loading state -->
  <div v-else-if="pending" class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <UIcon
        name="i-heroicons-arrow-path"
        class="text-primary-500 mx-auto mb-4 h-8 w-8 animate-spin"
      />
      <p class="text-gray-600 dark:text-gray-400">Chargement de l'entité...</p>
    </div>
  </div>
</template>
