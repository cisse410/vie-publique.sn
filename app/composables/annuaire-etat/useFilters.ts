import type { EntityType } from '~~/types/etat'

/**
 * Composable pour gérer les filtres de recherche
 * Utilise $fetch pour appeler les API routes serveur
 */
export const useFilters = () => {
  const searchQuery = useState<string>('etat:filterSearch', () => '')
  const selectedTypes = useState<string[]>('etat:filterTypes', () => [])
  const entityTypes = useState<EntityType[]>('etat:entityTypes', () => [])
  const showOnlyChanges = useState<boolean>('etat:filterChanges', () => false)

  /**
   * Charger les types d'entités
   */
  const fetchEntityTypes = async () => {
    if (entityTypes.value.length > 0) return // Déjà chargé

    try {
      entityTypes.value = await $fetch<EntityType[]>('/api/annuaire-etat/entities/types')
    } catch (error) {
      console.error('Error fetching entity types:', error)
      entityTypes.value = []
    }
  }

  /**
   * Réinitialiser tous les filtres
   */
  const resetFilters = () => {
    searchQuery.value = ''
    selectedTypes.value = []
    showOnlyChanges.value = false
  }

  /**
   * Ajouter/retirer un type de filtre
   */
  const toggleType = (typeCode: string) => {
    const index = selectedTypes.value.indexOf(typeCode)
    if (index > -1) {
      selectedTypes.value.splice(index, 1)
    } else {
      selectedTypes.value.push(typeCode)
    }
  }

  /**
   * Définir la recherche
   */
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  /**
   * Basculer le filtre "changements uniquement"
   */
  const toggleShowOnlyChanges = () => {
    showOnlyChanges.value = !showOnlyChanges.value
  }

  return {
    searchQuery,
    selectedTypes,
    entityTypes: entityTypes,
    showOnlyChanges,
    fetchEntityTypes,
    resetFilters,
    toggleType,
    setSearchQuery,
    toggleShowOnlyChanges
  }
}
