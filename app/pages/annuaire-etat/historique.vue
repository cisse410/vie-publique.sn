<template>
  <div class="page-historique min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="border-b bg-white">
      <div class="container mx-auto px-4 py-6">
        <h1 class="mb-2 text-3xl font-bold">Historique des décrets</h1>
        <p class="text-gray-600">
          Consultez l'évolution de l'organisation de l'État à travers les différents décrets de
          répartition
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Timeline -->
      <div class="mx-auto max-w-4xl">
        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute bottom-0 left-8 top-0 w-0.5 bg-gray-200"></div>

          <!-- Decree items -->
          <div class="space-y-8">
            <div v-for="decree in decrees" :key="decree.id" class="relative pl-20">
              <!-- Dot -->
              <div
                :class="[
                  'absolute left-5 h-6 w-6 rounded-full border-4 border-white shadow',
                  decree.status === 'active' ? 'bg-blue-500' : 'bg-gray-400',
                ]"
              ></div>

              <!-- Card -->
              <div class="rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                <div class="mb-4 flex items-start justify-between">
                  <div>
                    <h2 class="mb-2 text-2xl font-bold">
                      {{ formatDecreeNumber(decree.numero) }}
                    </h2>
                    <p class="text-gray-600">
                      {{ formatDate(decree.date_publication, 'long') }}
                    </p>
                  </div>

                  <Badge v-if="decree.status === 'active'" color="blue" class="text-sm">
                    EN COURS
                  </Badge>
                </div>

                <!-- Metadata -->
                <dl class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div v-if="decree.pr">
                    <dt class="text-sm font-medium text-gray-500">Président de la République</dt>
                    <dd class="mt-1">{{ decree.pr }}</dd>
                  </div>
                  <div v-if="decree.pm">
                    <dt class="text-sm font-medium text-gray-500">Premier Ministre</dt>
                    <dd class="mt-1">{{ decree.pm }}</dd>
                  </div>
                </dl>

                <!-- Actions -->
                <div class="flex gap-3">
                  <button
                    @click="viewDecree(decree)"
                    class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                  >
                    Consulter l'organisation
                  </button>

                  <a
                    v-if="decree.document_url"
                    :href="decree.document_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                  >
                    📄 Voir le document officiel
                  </a>

                  <button
                    v-if="canCompare(decree)"
                    @click="compareDecrees(decree)"
                    class="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-50"
                  >
                    🔄 Comparer avec le précédent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDecrees } from '~/composables/annuaire-etat/useDecrees'
import type { Decree } from '~~/types/etat'
import { formatDate, formatDecreeNumber } from '~~/utils/formatters'

// SEO
useHead({
  title: "Historique des décrets - Annuaire de l'État",
  meta: [
    {
      name: 'description',
      content:
        "Consultez l'historique complet des décrets de répartition des services de l'État du Sénégal.",
    },
  ],
})

const { decrees, fetchDecrees, selectDecree, getPreviousDecree } = useDecrees()

onMounted(() => {
  fetchDecrees()
})

const viewDecree = (decree: Decree) => {
  selectDecree(decree)
  navigateTo('/')
}

const canCompare = (decree: Decree): boolean => {
  const previous = getPreviousDecree(decree)
  return previous !== null
}

const compareDecrees = (decree: Decree) => {
  const previous = getPreviousDecree(decree)
  if (previous) {
    navigateTo(`/comparer?current=${decree.numero}&previous=${previous.numero}`)
  }
}
</script>
