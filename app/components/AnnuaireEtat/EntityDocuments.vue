<template>
  <div class="entity-documents">
    <section class="bg-white p-6 rounded-lg border">
      <h2 class="text-xl font-bold mb-6">Documents</h2>

      <div class="space-y-4">
        <!-- Decree document -->
        <a
          v-if="currentDecree?.document_url"
          :href="currentDecree.document_url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="flex-shrink-0 text-3xl">📄</div>
          <div class="flex-1">
            <div class="font-medium">
              {{ formatDecreeNumber(currentDecree.numero) }}
            </div>
            <div class="text-sm text-gray-600">
              Décret portant répartition des services de l'État
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Publié le {{ formatDate(currentDecree.date_publication) }}
            </div>
          </div>
          <div class="flex-shrink-0 text-gray-400">
            ↗️
          </div>
        </a>

        <!-- Placeholder for future documents -->
        <div class="text-center py-8 text-gray-500 text-sm">
          <p>D'autres documents pourront être ajoutés ici :</p>
          <ul class="mt-2 space-y-1">
            <li>• Décrets de nomination</li>
            <li>• Organigrammes</li>
            <li>• Rapports d'activité</li>
            <li>• Budgets</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Decree, PublicEntity } from '~~/types/etat';
import { formatDate, formatDecreeNumber } from '~~/utils/formatters';

interface Props {
  entity: PublicEntity
  currentDecree?: Decree
}

const props = defineProps<Props>()
</script>
