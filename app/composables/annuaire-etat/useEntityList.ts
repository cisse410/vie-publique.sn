import type { TreeNode } from '~~/types/etat'
import { useDecrees } from './useDecrees'

/**
 * Composable pour gérer la liste plate des entités (pour la vue liste)
 * Utilise une requête directe sans arbre hiérarchique pour éviter les doublons
 */
export const useEntityList = () => {
  const { selectedDecree } = useDecrees()

  const entities = useState<TreeNode[]>('etat:entityList', () => [])
  const loading = useState<boolean>('etat:entityListLoading', () => false)
  const error = useState<Error | null>('etat:entityListError', () => null)

  /**
   * Charger la liste des entités pour un décret donné
   */
  const fetchEntityList = async (decreeId: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, data: TreeNode[] }>(
        `/api/annuaire-etat/entities/list?decree_id=${decreeId}`
      )
      entities.value = response.data
    } catch (err) {
      console.error('[useEntityList] Error fetching entities:', err)
      error.value = err as Error
      entities.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Rafraîchir la liste quand le décret change
   */
  watch(() => selectedDecree.value?.id, (newId) => {
    if (newId) {
      fetchEntityList(newId)
    }
  }, { immediate: true })

  return {
    entities,
    loading,
    error,
    fetchEntityList
  }
}
