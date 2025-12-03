<template>
  <div class="entity-current space-y-6">
    <!-- Current structure -->
    <section class="rounded-lg border bg-white p-6">
      <h2 class="mb-4 text-xl font-bold">Structure actuelle</h2>

      <div class="space-y-4">
        <!-- Official label -->
        <div>
          <dt class="text-sm font-medium text-gray-500">Intitulé officiel</dt>
          <dd class="mt-1 text-lg">{{ snapshot.official_label }}</dd>
        </div>

        <!-- Parent -->
        <div v-if="parentInfo">
          <dt class="text-sm font-medium text-gray-500">Rattachement</dt>
          <dd class="mt-1">
            <NuxtLink
              :to="`/annuaire-etat/${parentInfo.type}/${parentInfo.slug}`"
              class="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              {{ parentInfo.label }}
            </NuxtLink>
          </dd>
        </div>

        <!-- Decree -->
        <div v-if="decreeInfo">
          <dt class="text-sm font-medium text-gray-500">Décret</dt>
          <dd class="mt-1">
            {{ decreeInfo }}
          </dd>
        </div>

        <!-- First appearance -->
        <div v-if="entity.first_appearance">
          <dt class="text-sm font-medium text-gray-500">Première apparition</dt>
          <dd class="mt-1">{{ formatDate(entity.first_appearance) }}</dd>
        </div>
      </div>
    </section>

    <!-- Children -->
    <section v-if="children && children.length > 0" class="rounded-lg border bg-white p-6">
      <h2 class="mb-4 text-xl font-bold">Structures rattachées ({{ children.length }})</h2>

      <div class="space-y-2">
        <div
          v-for="child in children"
          :key="child.id"
          class="cursor-pointer rounded-lg p-3 transition-colors hover:bg-gray-50"
          @click="navigateTo(`/annuaire-etat/${getChildType(child)}/${getChildSlug(child)}`)"
        >
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ getChildIcon(child) }}</span>
            <span class="flex-1">{{ child.official_label }}</span>
            <span class="text-gray-400">→</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { EntitySnapshot, PublicEntity } from '~~/types/etat'
import { getEntityIcon } from '~~/utils/entity-icons'
import { formatDate, formatDecreeNumber } from '~~/utils/formatters'

interface Props {
  snapshot: EntitySnapshot
  entity: PublicEntity
  children?: EntitySnapshot[]
}

const props = withDefaults(defineProps<Props>(), {
  children: () => [],
})

// Parent info
const parentInfo = computed(() => {
  if (!props.snapshot.parent_snapshot_id) return null

  const parent =
    typeof props.snapshot.parent_snapshot_id === 'object' ? props.snapshot.parent_snapshot_id : null

  if (!parent) return null

  const parentEntity = typeof parent.public_entity_id === 'object' ? parent.public_entity_id : null

  if (!parentEntity) return null

  const entityType = typeof parentEntity.entity_type_id === 'object'
    ? parentEntity.entity_type_id.code
    : parentEntity.entity_type_id

  return {
    slug: parentEntity.slug,
    label: parentEntity.canonical_name,
    type: entityType
  }
})

// Decree info
const decreeInfo = computed(() => {
  const decree = typeof props.snapshot.decree_id === 'object' ? props.snapshot.decree_id : null

  if (!decree) return null

  return `${formatDecreeNumber(decree.numero)} du ${formatDate(decree.date_publication)}`
})

const getChildIcon = (child: EntitySnapshot) => {
  const entity = typeof child.public_entity_id === 'object' ? child.public_entity_id : null
  const type = entity && typeof entity.entity_type_id === 'object' ? entity.entity_type_id : null
  return type ? getEntityIcon(type.code) : '📍'
}

const getChildSlug = (child: EntitySnapshot): string => {
  const entity = typeof child.public_entity_id === 'object' ? child.public_entity_id : null
  return entity?.slug || ''
}

const getChildType = (child: EntitySnapshot): string => {
  const entity = typeof child.public_entity_id === 'object' ? child.public_entity_id : null
  if (!entity) return ''
  const entityType = typeof entity.entity_type_id === 'object'
    ? entity.entity_type_id.code
    : entity.entity_type_id
  return entityType || ''
}
</script>
