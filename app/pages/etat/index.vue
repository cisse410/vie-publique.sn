<script setup lang="ts">
import { useEtatSnapshots } from '~/composables/etat/useEtatSnapshots'
import { useEtatTypes } from '~/composables/etat/useEtatTypes'
import type { OrgType } from '../../../types/etat'
import { useEtatArborescence } from '~/composables/etat/useEtatArborescence'
import { useEtatListe } from '~/composables/etat/useEtatListe'

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

// Snapshot numero depuis les query params (SEO-friendly)
const snapshotNumero = computed(() => route.query.decret as string | undefined || route.query.snapshot as string | undefined)
const searchQuery = computed(() => route.query.search as string | undefined)
const typeQuery = computed(() => route.query.type as string | undefined)
const pageQuery = computed(() => parseInt((route.query.page as string) || '1', 10))

// PATTERN : Template → Composable → API → Directus SDK

// 1. Charger les snapshots disponibles via composable
const { data: snapshotsData, pending: snapshotsPending } = useEtatSnapshots()

// 2. Charger les types d'organisations disponibles
const { data: typesData, pending: typesPending } = useEtatTypes()

// 3. Charger l'arborescence via composable (uniquement si vue = arborescence)
const { data: arborescenceData, pending: arborescencePending } = useEtatArborescence(snapshotNumero)

// 4. Charger la liste via composable (uniquement si vue = liste)
const { data: listeData, pending: listePending } = useEtatListe({
  snapshotNumero,
  search: searchQuery,
  type: typeQuery,
  page: pageQuery,
})

// Extraire les types d'organisations depuis l'API dédiée
const orgTypesData = computed(() => {
  return typesData.value?.types || []
})

// Basculer entre les vues
const switchView = (view: 'arborescence' | 'liste') => {
  const query = { ...route.query, view }
  // Supprimer les params spécifiques à la liste si on revient à l'arborescence
  if (view === 'arborescence') {
    delete query.search
    delete query.type
    delete query.page
  }
  router.push({ query })
}

// Gérer les erreurs
const hasError = computed(() => {
  return !snapshotsData.value?.snapshots || snapshotsData.value.snapshots.length === 0
})
</script>

<template>
  <div class="flex flex-col px-4 py-6">
    <div class="prose prose-sm sm:prose mx-auto my-2">
      <h1 class="text-center dark:text-white">Organisation de l'État du Sénégal</h1>
      <p class="text-center text-gray-600 dark:text-gray-400">
        Répartition des services de l'État selon les décrets officiels
      </p>
    </div>

    <div class="mx-auto w-full max-w-7xl mt-8 space-y-6">

      <!-- Snapshot Selector -->
      <EtatSnapshotSelector
        v-if="snapshotsData?.snapshots"
        :snapshots="snapshotsData.snapshots"
        :current-snapshot-numero="snapshotNumero"
      />

      <!-- Statistiques de changements (uniquement en vue arborescence) -->
      <EtatStats
        v-if="currentView === 'arborescence' && arborescenceData?.stats"
        :stats="arborescenceData.stats"
        :previous-snapshot="arborescenceData.previousSnapshot"
      />

      <!-- View Switcher -->
      <div class="flex items-center gap-2">
        <UButton
          :variant="currentView === 'arborescence' ? 'solid' : 'soft'"
          color="primary"
          icon="i-heroicons-squares-2x2"
          @click="switchView('arborescence')"
        >
          Arborescence
        </UButton>
        <UButton
          :variant="currentView === 'liste' ? 'solid' : 'soft'"
          color="primary"
          icon="i-heroicons-list-bullet"
          @click="switchView('liste')"
        >
          Liste
        </UButton>
      </div>

      <!-- Vue Arborescence -->
      <div v-if="currentView === 'arborescence'" class="space-y-6">
        <!-- Entités supprimées -->
        <EtatDeletedUnits
          v-if="arborescenceData?.deletedUnits"
          :deleted-units="arborescenceData.deletedUnits"
        />

        <!-- Arbre -->
        <EtatArborescence
          :tree="arborescenceData?.tree || []"
          :loading="arborescencePending"
        />
      </div>

      <!-- Vue Liste -->
      <EtatListe
        v-if="currentView === 'liste'"
        :entities="listeData?.entities || []"
        :org-types="orgTypesData"
        :total="listeData?.total || 0"
        :page="listeData?.page || 1"
        :page-size="listeData?.pageSize || 20"
        :loading="listePending"
      />
    </div>
  </div>
</template>
