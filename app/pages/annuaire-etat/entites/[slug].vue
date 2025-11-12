<template>
  <div class="page-entity min-h-screen bg-gray-50">
    <!-- Loading state -->
    <div v-if="pending" class="container mx-auto px-4 py-8">
      <div class="animate-pulse space-y-4">
        <div class="h-8 bg-gray-200 rounded w-1/4"></div>
        <div class="h-12 bg-gray-200 rounded w-3/4"></div>
        <div class="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error || !entity" class="container mx-auto px-4 py-8">
      <div class="text-center py-12">
        <p class="text-2xl font-bold text-gray-900 mb-2">Entité introuvable</p>
        <p class="text-gray-600 mb-4">
          L'entité que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <NuxtLink
          to="/"
          class="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retour à l'accueil
        </NuxtLink>
      </div>
    </div>

    <!-- Entity content -->
    <div v-else>
      <!-- Header -->
      <EntityHeader
        :entity="entity"
        :current-snapshot="currentSnapshot"
      />

      <!-- Tabs -->
      <div class="bg-white border-b sticky top-0 z-40">
        <div class="container mx-auto px-4">
          <div class="flex gap-6">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-4 py-3 font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab content -->
      <div class="container mx-auto px-4 py-8">
        <EntityCurrent
          v-if="activeTab === 'apercu'"
          :snapshot="currentSnapshot!"
          :entity="entity"
          :children="childrenSnapshots"
        />

        <EntityHistory
          v-else-if="activeTab === 'historique'"
          :entity-id="entity.id"
        />

        <EntityDocuments
          v-else-if="activeTab === 'documents'"
          :entity="entity"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PublicEntity, EntitySnapshot } from '~~/types/etat'

const route = useRoute()
const slug = route.params.slug as string

// Active tab
const activeTab = ref('apercu')
const tabs = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'historique', label: 'Historique' },
  { id: 'documents', label: 'Documents' }
]

// Load entity data
const { data: entity, pending, error } = await useAsyncData(
  `entity-${slug}`,
  () => $fetch<PublicEntity>(`/api/annuaire-etat/entities/${slug}`)
)

// Load current snapshot
const { data: currentSnapshot } = await useAsyncData(
  `snapshot-${slug}`,
  async () => {
    if (!entity.value) return null
    return await $fetch<EntitySnapshot | null>(`/api/annuaire-etat/entities/${slug}/current-snapshot`)
  },
  {
    watch: [entity]
  }
)

// Load children
const { data: childrenSnapshots } = await useAsyncData(
  `children-${slug}`,
  async () => {
    if (!currentSnapshot.value) return []
    return await $fetch<EntitySnapshot[]>(`/api/snapshots/children/${currentSnapshot.value.id}`)
  },
  {
    watch: [currentSnapshot]
  }
)

// SEO
useHead({
  title: () => entity.value?.canonical_name || 'Entité',
  meta: [
    {
      name: 'description',
      content: () => currentSnapshot.value?.official_label || ''
    }
  ]
})
</script>
