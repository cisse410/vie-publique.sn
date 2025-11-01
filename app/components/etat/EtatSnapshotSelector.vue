<script setup lang="ts">
import type { OrgSnapshot } from '../../../types/etat'

interface Props {
  snapshots: OrgSnapshot[]
  currentSnapshotNumero?: string
}

const props = defineProps<Props>()

const router = useRouter()
const route = useRoute()

// Sélectionner le snapshot actif par défaut (par numero)
const selectedNumero = ref(props.currentSnapshotNumero || props.snapshots.find(s => s.est_actif)?.numero || '')

// Synchroniser avec les query params (SEO-friendly avec numero)
watch(selectedNumero, (newNumero) => {
  if (newNumero) {
    const query = { ...route.query }
    // Utiliser le param 'decret' pour le SEO
    query.decret = newNumero
    // Supprimer l'ancien param snapshot_id s'il existe
    delete query.snapshot_id
    router.push({ query })
  }
})

// Mettre à jour quand les props changent
watch(() => props.currentSnapshotNumero, (newNumero) => {
  if (newNumero && newNumero !== selectedNumero.value) {
    selectedNumero.value = newNumero
  }
})

const activeSnapshot = computed(() => props.snapshots.find(s => s.est_actif))
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div class="flex-shrink-0">
        <label for="snapshot-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Décret de répartition
        </label>
      </div>

      <div class="flex-grow">
        <USelectMenu
          v-model="selectedNumero"
          :options="snapshots"
          value-attribute="numero"
          option-attribute="numero"
          searchable
          searchable-placeholder="Rechercher un décret..."
          class="w-full"
        >
          <template #label>
            <div v-if="selectedNumero" class="flex items-center gap-2">
              <UBadge v-if="selectedNumero === activeSnapshot?.numero" color="green" variant="subtle">
                Actif
              </UBadge>
              <span>Décret {{ snapshots.find(s => s.numero === selectedNumero)?.numero }}</span>
              <span class="text-gray-500 text-sm">
                ({{ snapshots.find(s => s.numero === selectedNumero)?.annee }})
              </span>
            </div>
            <span v-else class="text-gray-500">Sélectionner un décret</span>
          </template>

          <template #option="{ option }">
            <div class="flex items-center justify-between w-full">
              <div class="flex flex-col">
                <span class="font-medium">Décret {{ option.numero }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ new Date(option.date_publication).toLocaleDateString('fr-FR') }}
                </span>
              </div>
              <UBadge v-if="option.est_actif" color="green" variant="subtle" size="xs">
                Actif
              </UBadge>
            </div>
          </template>
        </USelectMenu>
      </div>

      <div v-if="snapshots.find(s => s.numero === selectedNumero)?.document_url" class="flex-shrink-0">
        <UButton
          :to="snapshots.find(s => s.numero === selectedNumero)?.document_url"
          target="_blank"
          icon="i-heroicons-document-text"
          variant="soft"
          color="primary"
          size="sm"
        >
          Voir le document officiel
        </UButton>
      </div>
    </div>
  </div>
</template>
