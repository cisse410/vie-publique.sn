import type { PublicEntity } from '~~/types/etat'

export interface EntityWithChildren extends PublicEntity {
  child_entities: EntityWithNestedChildren[]
}

export interface EntityWithNestedChildren extends PublicEntity {
  official_label?: string
  child_entities?: EntityWithNestedChildren[]
}

export const useEntity = () => {
  const fetchEntity = async (slug: string): Promise<EntityWithChildren> => {
    return await $fetch<EntityWithChildren>(`/api/annuaire-etat/entities/${slug}`)
  }

  return {
    fetchEntity
  }
}
