<template>
  <div class="sticky top-0 z-50 border-b bg-white shadow-sm">
    <div class="container mx-auto px-4 py-3">
      <!-- Première ligne : Décret + Recherche + Toggle Vue -->
      <div class="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <!-- Sélecteur de décret -->
        <DecreeSelector
          v-model="localSelectedDecree"
          :decrees="decrees"
          class="w-full flex-shrink-0 md:w-auto"
        />

        <!-- Barre de recherche -->
        <SearchBar
          v-model="localSearchQuery"
          placeholder="Rechercher une entité..."
          class="flex-1"
        />

        <!-- Toggle Vue (Arborescence / Liste) -->
        <div class="flex flex-shrink-0 gap-2">
          <button
            @click="$emit('view-change', 'tree')"
            :class="[
              'rounded-lg px-4 py-2 font-medium transition-colors',
              currentView === 'tree'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
            title="Vue arborescence"
          >
            <span class="hidden sm:inline">🌳 Arborescence</span>
            <span class="sm:hidden">🌳</span>
          </button>
          <button
            @click="$emit('view-change', 'list')"
            :class="[
              'rounded-lg px-4 py-2 font-medium transition-colors',
              currentView === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
            title="Vue liste"
          >
            <span class="hidden sm:inline">📋 Liste</span>
            <span class="sm:hidden">📋</span>
          </button>
        </div>
      </div>

      <!-- Deuxième ligne : Filtres types -->
      <div class="mt-3 flex flex-wrap gap-2">
        <TypeChip
          v-for="type in entityTypes"
          :key="type.code"
          :type="type"
          :active="selectedTypes.includes(type.code)"
          @click="toggleType(type.code)"
          class="cursor-pointer"
        />

        <!-- Bouton réinitialiser filtres -->
        <button
          v-if="hasActiveFilters"
          @click="$emit('reset-filters')"
          class="px-3 py-1 text-sm text-gray-600 underline hover:text-gray-900"
        >
          Réinitialiser
        </button>
      </div>

      <!-- Statistiques de changements (si disponibles) -->
      <div v-if="changeStats && changeStats.total > 0" class="mt-3 flex gap-4 text-sm">
        <span class="text-gray-600">
          <span class="font-semibold text-green-600">{{ changeStats.new }}</span> nouveau(x)
        </span>
        <span class="text-gray-600">
          <span class="font-semibold text-orange-600">{{ changeStats.modified }}</span> modifié(s)
        </span>
        <span class="text-gray-600">
          <span class="font-semibold text-red-600">{{ changeStats.removed }}</span> supprimé(s)
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Decree, EntityType } from '~~/types/etat'

interface Props {
  currentView: 'tree' | 'list'
  decrees: Decree[]
  selectedDecree: Decree | null
  entityTypes: EntityType[]
  selectedTypes: string[]
  searchQuery: string
  changeStats?: {
    new: number
    modified: number
    removed: number
    unchanged: number
    total: number
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'view-change': [view: 'tree' | 'list']
  'decree-change': [decree: Decree]
  search: [query: string]
  'type-toggle': [typeCode: string]
  'reset-filters': []
}>()

const localSelectedDecree = computed({
  get: () => props.selectedDecree,
  set: (value) => value && emit('decree-change', value),
})

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit('search', value),
})

const toggleType = (typeCode: string) => {
  emit('type-toggle', typeCode)
}

const hasActiveFilters = computed(() => {
  return props.searchQuery.length > 0 || props.selectedTypes.length > 0
})
</script>
