<script setup lang="ts">
import type { OrgUnitWithComparison } from '../../../types/etat'

interface Props {
  deletedUnits: OrgUnitWithComparison[]
}

const props = defineProps<Props>()

const isExpanded = ref(false)

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div v-if="deletedUnits.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
    <!-- Header -->
    <button
      @click="toggleExpanded"
      class="w-full flex items-center justify-between p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
    >
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-x-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
        <h3 class="text-sm font-semibold text-red-900 dark:text-red-100">
          Entités supprimées
        </h3>
        <UBadge color="red" variant="subtle" size="sm">
          {{ deletedUnits.length }}
        </UBadge>
      </div>
      <UIcon
        :name="isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
        class="w-5 h-5 text-red-600 dark:text-red-400"
      />
    </button>

    <!-- Liste des entités supprimées (collapsible) -->
    <div v-if="isExpanded" class="border-t border-red-200 dark:border-red-800 p-4 bg-white dark:bg-gray-800">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Ces entités étaient présentes dans le décret précédent mais n'apparaissent plus dans le décret actuel :
      </p>
      <div class="space-y-2">
        <div
          v-for="unit in deletedUnits"
          :key="unit.id"
          class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
        >
          <UIcon name="i-heroicons-building-office" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div class="flex-grow min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white line-through decoration-red-500">
              {{ unit.intitule_officiel }}
            </p>
            <p v-if="unit.public_entity?.org_type?.label" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ unit.public_entity.org_type.label }}
            </p>
          </div>
          <UBadge color="red" variant="subtle" size="xs">
            Supprimé
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>
