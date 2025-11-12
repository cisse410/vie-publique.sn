<template>
  <div class="entity-header bg-white border-b">
    <div class="container mx-auto px-4 py-6">
      <!-- Breadcrumb -->
      <nav class="mb-4 text-sm text-gray-600">
        <NuxtLink to="/" class="hover:text-blue-600">Accueil</NuxtLink>
        <span class="mx-2">›</span>
        <span>{{ entity.canonical_name }}</span>
      </nav>

      <!-- Main info -->
      <div class="flex flex-col md:flex-row md:items-start gap-4">
        <!-- Icon -->
        <div class="flex-shrink-0 text-5xl">
          {{ entityIcon }}
        </div>

        <!-- Content -->
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">
            {{ entity.canonical_name }}
          </h1>

          <p v-if="currentSnapshot" class="text-lg text-gray-600 mb-3">
            {{ currentSnapshot.official_label }}
          </p>

          <!-- Type badge -->
          <div class="flex flex-wrap gap-2 mb-4">
            <TypeChip :type="entityType" size="lg" />
          </div>

          <!-- Contact info -->
          <div v-if="hasContactInfo" class="flex flex-wrap gap-4 text-sm">
            <a
              v-if="entity.web_site"
              :href="entity.web_site"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              🌐 {{ formatUrl(entity.web_site) }}
            </a>

            <a
              v-if="entity.phone"
              :href="`tel:${entity.phone}`"
              class="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              📞 {{ formatPhone(entity.phone) }}
            </a>

            <a
              v-if="entity.email"
              :href="`mailto:${entity.email}`"
              class="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              ✉️ {{ entity.email }}
            </a>
          </div>

          <!-- Social networks -->
          <div v-if="entity.reseaux_sociaux" class="flex gap-3 mt-3">
            <a
              v-for="(url, network) in entity.reseaux_sociaux"
              :key="network"
              :href="url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-2xl hover:opacity-75 transition-opacity"
              :title="network"
            >
              {{ getSocialIcon(network) }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EntitySnapshot, PublicEntity } from '~~/types/etat'
import { getEntityIcon } from '~~/utils/entity-icons'
import { formatPhone, formatUrl } from '~~/utils/formatters'

interface Props {
  entity: PublicEntity
  currentSnapshot?: EntitySnapshot | null
}

const props = defineProps<Props>()

const entityType = computed(() => {
  return typeof props.entity.entity_type_id === 'object'
    ? props.entity.entity_type_id
    : null
})

const entityIcon = computed(() => {
  return entityType.value ? getEntityIcon(entityType.value.code) : '📍'
})

const hasContactInfo = computed(() => {
  return props.entity.web_site || props.entity.phone || props.entity.email
})

const getSocialIcon = (network: string): string => {
  const icons: Record<string, string> = {
    facebook: '📘',
    twitter: '🐦',
    instagram: '📷',
    linkedin: '💼',
    youtube: '📺'
  }
  return icons[network.toLowerCase()] || '🔗'
}
</script>
