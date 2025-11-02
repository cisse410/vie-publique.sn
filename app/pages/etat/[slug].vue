<script setup lang="ts">
import { useEtatEntity } from '~/composables/etat/useEtatEntity'
import { hasDetailPage, hasFullDetailPage, groupChildrenByType } from '~/utils/etat-helpers'
const { keywords } = useSiteMetadata()

const route = useRoute()
const router = useRouter()

// Récupérer le slug depuis l'URL
const slug = computed(() => route.params.slug as string)
const snapshotNumero = computed(() => route.query.decret as string | undefined || route.query.snapshot as string | undefined)

// Charger les données de l'entité
const { data: entityData, pending, error } = useEtatEntity(slug, snapshotNumero)

// Vérifier si l'entité a une page de détail
watch(entityData, (data) => {
  if (data && !hasDetailPage(data.entity.org_type?.code)) {
    // Type sans page de détail, rediriger vers la liste
    const query = snapshotNumero.value ? { decret: snapshotNumero.value } : {}
    router.replace({ path: '/etat', query })
  }
})

// Déterminer le type de page (complète ou simplifiée)
const isFullDetailPage = computed(() =>
  entityData.value?.entity.org_type?.code &&
  hasFullDetailPage(entityData.value.entity.org_type.code)
)

// Grouper les enfants par type pour les tabs
const groupedChildren = computed(() => {
  if (!entityData.value?.childUnits) return null
  return groupChildrenByType(entityData.value.childUnits)
})

// Tabs pour les entités complètes
const tabs = computed(() => {
  if (!groupedChildren.value) return []

  const result = []

  if (groupedChildren.value.cabinet.length > 0) {
    result.push({
      key: 'cabinet',
      label: 'Cabinet',
      badge: groupedChildren.value.cabinet.length
    })
  }

  if (groupedChildren.value.secretariats.length > 0) {
    result.push({
      key: 'secretariats',
      label: 'Secrétariats',
      badge: groupedChildren.value.secretariats.length
    })
  }

  if (groupedChildren.value.directions.length > 0) {
    result.push({
      key: 'directions',
      label: 'Directions',
      badge: groupedChildren.value.directions.length
    })
  }

  if (groupedChildren.value.autres.length > 0) {
    result.push({
      key: 'autres',
      label: 'Autres administrations',
      badge: groupedChildren.value.autres.length
    })
  }

  return result
})

const selectedTab = ref(tabs.value[0]?.key || 'cabinet')

// Enfants à afficher selon le tab sélectionné
const currentTabChildren = computed(() => {
  if (!groupedChildren.value) return []
  return groupedChildren.value[selectedTab.value as keyof typeof groupedChildren.value] || []
})

// SEO
const title = computed(() => {
  if (!entityData.value) return "Chargement..."
  return `${entityData.value.entity.nom_canonique} - Organisation de l'État`
})

const description = computed(() => {
  if (!entityData.value) return ""
  return entityData.value.entity.description ||
    `Informations sur ${entityData.value.entity.nom_canonique} dans l'organisation de l'État du Sénégal`
})

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

// Gestion d'erreur
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    message: error.value.message || "Entité non trouvée",
    fatal: true,
  })
}

// Retour à la liste
const goBack = () => {
  const query = snapshotNumero.value ? { decret: snapshotNumero.value } : {}
  router.push({ path: '/etat', query })
}
</script>

<template>
  <div class="flex flex-col px-4 py-6">
    <!-- Breadcrumb / Retour -->
    <div class="mx-auto w-full max-w-7xl mb-6">
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        color="gray"
        size="sm"
        @click="goBack"
      >
        Retour à la liste
      </UButton>
    </div>

    <!-- Loading state -->
    <div v-if="pending" class="mx-auto w-full max-w-7xl">
      <USkeleton class="h-32 w-full mb-4" />
      <USkeleton class="h-64 w-full" />
    </div>

    <!-- Content -->
    <div v-else-if="entityData" class="mx-auto w-full max-w-7xl">
      <!-- Layout à 2 colonnes pour les pages complètes -->
      <div v-if="isFullDetailPage" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Colonne principale (gauche/centre) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Header Card -->
          <UCard>
            <template #header>
              <div class="flex items-start justify-between gap-4">
                <div class="flex-grow">
                  <div class="flex items-center gap-3 mb-2">
                    <UBadge
                      v-if="entityData.entity.org_type?.label"
                      color="green"
                      variant="subtle"
                    >
                      {{ entityData.entity.org_type.label }}
                    </UBadge>
                  </div>
                  <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ entityData.entity.nom_canonique }}
                  </h1>
                </div>
              </div>
            </template>

            <!-- Description -->
            <div v-if="entityData.entity.description" class="prose prose-sm dark:prose-invert max-w-none">
              <p>{{ entityData.entity.description }}</p>
            </div>
          </UCard>

          <!-- Rattachement hiérarchique actuel -->
          <UCard v-if="entityData.currentUnits.length > 0">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Rattachement dans le décret {{ entityData.snapshot.numero }}
              </h2>
            </template>

            <div class="space-y-3">
              <div
                v-for="unit in entityData.currentUnits"
                :key="unit.id"
                class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <p class="font-medium text-gray-900 dark:text-white mb-2">
                  {{ unit.intitule_officiel }}
                </p>
                <div v-if="unit.parent" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <UIcon name="i-heroicons-arrow-up" class="w-4 h-4" />
                  <span>Rattaché à : {{ unit.parent.intitule_officiel }}</span>
                </div>
                <p v-if="unit.notes" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {{ unit.notes }}
                </p>
              </div>
            </div>
          </UCard>

          <!-- Entités rattachées avec tabs -->
          <UCard v-if="tabs.length > 0">
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Entités rattachées
              </h2>
            </template>

            <!-- Tabs -->
            <UTabs v-model="selectedTab" :items="tabs">
              <template #item="{ item }">
                <div class="py-4 space-y-2">
                  <NuxtLink
                    v-for="child in currentTabChildren"
                    :key="child.id"
                    :to="`/etat/${child.public_entity?.slug}${snapshotNumero ? `?decret=${snapshotNumero}` : ''}`"
                    class="block p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ child.public_entity?.nom_canonique || child.intitule_officiel }}
                        </p>
                        <p v-if="child.public_entity?.org_type?.label" class="text-sm text-gray-600 dark:text-gray-400">
                          {{ child.public_entity.org_type.label }}
                        </p>
                      </div>
                      <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-gray-400" />
                    </div>
                  </NuxtLink>

                  <p v-if="currentTabChildren.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Aucune entité dans cette catégorie
                  </p>
                </div>
              </template>
            </UTabs>
          </UCard>

          <!-- Historique dans les décrets -->
          <UCard>
            <template #header>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                Historique dans les décrets
              </h2>
            </template>

            <div class="space-y-3">
              <div
                v-for="item in entityData.history"
                :key="item.snapshot.id"
                class="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                :class="{
                  'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700': item.snapshot.id === entityData.snapshot.id
                }"
              >
                <div class="flex-shrink-0">
                  <UIcon
                    :name="item.present ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                    :class="item.present ? 'text-green-600' : 'text-red-600'"
                    class="w-6 h-6"
                  />
                </div>
                <div class="flex-grow min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-medium text-gray-900 dark:text-white">
                      Décret {{ item.snapshot.numero }} ({{ item.snapshot.annee }})
                    </p>
                    <UBadge
                      v-if="item.snapshot.id === entityData.snapshot.id"
                      color="primary"
                      variant="subtle"
                      size="xs"
                    >
                      Actuel
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ item.present ? 'Présent' : 'Absent' }}
                    {{ item.present && item.units.length > 1 ? ` (${item.units.length} rattachements)` : '' }}
                  </p>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Colonne de droite: Coordonnées -->
        <div class="lg:col-span-1">
          <UCard>
            <template #header>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Coordonnées
              </h2>
            </template>

            <div class="space-y-4">
              <!-- Site web -->
              <div v-if="entityData.entity.site_web" class="flex items-start gap-3">
                <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Site web</p>
                  <ULink
                    :to="entityData.entity.site_web"
                    target="_blank"
                    class="text-sm text-primary-600 hover:underline break-all"
                  >
                    {{ entityData.entity.site_web }}
                  </ULink>
                </div>
              </div>

              <!-- Email -->
              <div v-if="entityData.entity.email" class="flex items-start gap-3">
                <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <ULink
                    :to="`mailto:${entityData.entity.email}`"
                    class="text-sm text-primary-600 hover:underline break-all"
                  >
                    {{ entityData.entity.email }}
                  </ULink>
                </div>
              </div>

              <!-- Téléphone -->
              <div v-if="entityData.entity.telephone" class="flex items-start gap-3">
                <UIcon name="i-heroicons-phone" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</p>
                  <ULink
                    :to="`tel:${entityData.entity.telephone}`"
                    class="text-sm text-primary-600 hover:underline"
                  >
                    {{ entityData.entity.telephone }}
                  </ULink>
                </div>
              </div>

              <!-- Adresse -->
              <div v-if="entityData.entity.adresse" class="flex items-start gap-3">
                <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</p>
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ entityData.entity.adresse }}
                  </p>
                </div>
              </div>

              <!-- Réseaux sociaux -->
              <div v-if="entityData.entity.reseaux_sociaux && Object.keys(entityData.entity.reseaux_sociaux).some(k => entityData.entity.reseaux_sociaux?.[k])" class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Réseaux sociaux</p>
                <div class="space-y-2">
                  <!-- Facebook -->
                  <ULink
                    v-if="entityData.entity.reseaux_sociaux.facebook"
                    :to="entityData.entity.reseaux_sociaux.facebook"
                    target="_blank"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
                    <span>Facebook</span>
                  </ULink>

                  <!-- Twitter -->
                  <ULink
                    v-if="entityData.entity.reseaux_sociaux.twitter"
                    :to="entityData.entity.reseaux_sociaux.twitter"
                    target="_blank"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
                    <span>Twitter</span>
                  </ULink>

                  <!-- LinkedIn -->
                  <ULink
                    v-if="entityData.entity.reseaux_sociaux.linkedin"
                    :to="entityData.entity.reseaux_sociaux.linkedin"
                    target="_blank"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
                    <span>LinkedIn</span>
                  </ULink>

                  <!-- Instagram -->
                  <ULink
                    v-if="entityData.entity.reseaux_sociaux.instagram"
                    :to="entityData.entity.reseaux_sociaux.instagram"
                    target="_blank"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
                    <span>Instagram</span>
                  </ULink>

                  <!-- YouTube -->
                  <ULink
                    v-if="entityData.entity.reseaux_sociaux.youtube"
                    :to="entityData.entity.reseaux_sociaux.youtube"
                    target="_blank"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
                    <span>YouTube</span>
                  </ULink>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Layout simplifié pour Pôles et Agences -->
      <div v-else class="space-y-6">
        <!-- Header Card -->
        <UCard>
          <template #header>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-grow">
                <div class="flex items-center gap-3 mb-2">
                  <UBadge
                    v-if="entityData.entity.org_type?.label"
                    color="blue"
                    variant="subtle"
                  >
                    {{ entityData.entity.org_type.label }}
                  </UBadge>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ entityData.entity.nom_canonique }}
                </h1>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Description -->
            <div v-if="entityData.entity.description" class="prose prose-sm dark:prose-invert max-w-none">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</p>
              <p>{{ entityData.entity.description }}</p>
            </div>

            <!-- Coordonnées -->
            <div class="space-y-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Coordonnées</p>

              <!-- Site web -->
              <div v-if="entityData.entity.site_web" class="flex items-start gap-3">
                <UIcon name="i-heroicons-globe-alt" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Site web</p>
                  <ULink
                    :to="entityData.entity.site_web"
                    target="_blank"
                    class="text-sm text-primary-600 hover:underline break-all"
                  >
                    {{ entityData.entity.site_web }}
                  </ULink>
                </div>
              </div>

              <!-- Email -->
              <div v-if="entityData.entity.email" class="flex items-start gap-3">
                <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <ULink
                    :to="`mailto:${entityData.entity.email}`"
                    class="text-sm text-primary-600 hover:underline break-all"
                  >
                    {{ entityData.entity.email }}
                  </ULink>
                </div>
              </div>

              <!-- Téléphone -->
              <div v-if="entityData.entity.telephone" class="flex items-start gap-3">
                <UIcon name="i-heroicons-phone" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</p>
                  <ULink
                    :to="`tel:${entityData.entity.telephone}`"
                    class="text-sm text-primary-600 hover:underline"
                  >
                    {{ entityData.entity.telephone }}
                  </ULink>
                </div>
              </div>

              <!-- Adresse -->
              <div v-if="entityData.entity.adresse" class="flex items-start gap-3">
                <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div class="min-w-0 flex-grow">
                  <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</p>
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ entityData.entity.adresse }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Rattachement hiérarchique (parent) -->
        <UCard v-if="entityData.currentUnits.length > 0">
          <template #header>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Rattachement hiérarchique
            </h2>
          </template>

          <div class="space-y-3">
            <div
              v-for="unit in entityData.currentUnits"
              :key="unit.id"
              class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div v-if="unit.parent" class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-arrow-up" class="w-4 h-4 text-gray-500" />
                <span class="text-gray-600 dark:text-gray-400">Rattaché à :</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ unit.parent.intitule_officiel }}</span>
              </div>
              <p v-if="unit.notes" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {{ unit.notes }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Historique -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Historique dans les décrets
            </h2>
          </template>

          <div class="space-y-3">
            <div
              v-for="item in entityData.history"
              :key="item.snapshot.id"
              class="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              :class="{
                'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700': item.snapshot.id === entityData.snapshot.id
              }"
            >
              <div class="flex-shrink-0">
                <UIcon
                  :name="item.present ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                  :class="item.present ? 'text-green-600' : 'text-red-600'"
                  class="w-6 h-6"
                />
              </div>
              <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-medium text-gray-900 dark:text-white">
                    Décret {{ item.snapshot.numero }} ({{ item.snapshot.annee }})
                  </p>
                  <UBadge
                    v-if="item.snapshot.id === entityData.snapshot.id"
                    color="primary"
                    variant="subtle"
                    size="xs"
                  >
                    Actuel
                  </UBadge>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ item.present ? 'Présent' : 'Absent' }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
