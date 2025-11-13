import type { PublicEntity } from '~~/types/etat'

export interface EntityWithChildren extends PublicEntity {
  child_entities: PublicEntity[]
}

export const useEntity = () => {
  const fetchEntity = async (slug: string): Promise<EntityWithChildren> => {
    return await $fetch<EntityWithChildren>(`/api/annuaire-etat/entities/${slug}`)
  }

  return {
    fetchEntity
  }
}
