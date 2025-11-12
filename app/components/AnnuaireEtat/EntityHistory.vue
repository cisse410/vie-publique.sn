<template>
  <div class="entity-history">
    <section class="rounded-lg border bg-white p-6">
      <h2 class="mb-6 text-xl font-bold">Historique</h2>

      <!-- Loading -->
      <div v-if="pending" class="space-y-4">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="mb-2 h-4 w-1/4 rounded bg-gray-200"></div>
          <div class="h-3 w-3/4 rounded bg-gray-200"></div>
        </div>
      </div>

      <!-- Timeline -->
      <div v-else-if="history && history.length > 0" class="relative">
        <!-- Vertical line -->
        <div class="absolute bottom-0 left-4 top-0 w-0.5 bg-gray-200"></div>

        <!-- Timeline items -->
        <div class="space-y-6">
          <div v-for="(item, index) in history" :key="item.id" class="relative pl-12">
            <!-- Dot -->
            <div
              :class="[
                'absolute left-2 h-4 w-4 rounded-full border-2 border-white',
                index === 0 ? 'bg-blue-500' : 'bg-gray-300',
              ]"
            ></div>

            <!-- Content -->
            <div>
              <div class="mb-1 flex items-center gap-2">
                <span class="font-medium">
                  {{ formatDecreeLabel(item) }}
                </span>
                <Badge v-if="index === 0" color="blue">Actuel</Badge>
                <Badge v-if="item.change_type" :color="getChangeColor(item.change_type)">
                  {{ formatChangeType(item.change_type) }}
                </Badge>
              </div>

              <div class="mb-2 text-sm text-gray-600">
                {{ formatDecreeDate(item) }}
              </div>

              <div class="text-sm">
                <div class="font-medium">{{ item.official_label }}</div>
              </div>

              <!-- Change notes -->
              <div v-if="item.change_notes" class="mt-2 rounded bg-gray-50 p-3 text-sm">
                {{ item.change_notes }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="py-8 text-center text-gray-500">Aucun historique disponible</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ChangeType, EntitySnapshot } from '~~/types/etat'
import { formatChangeType, formatDate, formatDecreeNumber } from '~~/utils/formatters'

interface Props {
  entityId: number
}

const props = defineProps<Props>()

// Load history
const { data: history, pending } = await useAsyncData(`history-${props.entityId}`, () =>
  $fetch<EntitySnapshot[]>(`/api/annuaire-etat/entities/slug/history`, {
    query: { entity_id: props.entityId },
  }),
)

const formatDecreeLabel = (snapshot: EntitySnapshot): string => {
  const decree = typeof snapshot.decree_id === 'object' ? snapshot.decree_id : null
  return decree ? formatDecreeNumber(decree.numero) : ''
}

const formatDecreeDate = (snapshot: EntitySnapshot): string => {
  const decree = typeof snapshot.decree_id === 'object' ? snapshot.decree_id : null
  return decree ? formatDate(decree.date_publication, 'long') : ''
}

const getChangeColor = (changeType: ChangeType): 'green' | 'orange' | 'red' | 'blue' => {
  switch (changeType) {
    case 'new':
      return 'green'
    case 'modified':
    case 'renamed':
    case 'transferred':
      return 'orange'
    case 'removed':
      return 'red'
    default:
      return 'blue'
  }
}
</script>
