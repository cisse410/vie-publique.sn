import type { SnapshotComparison } from '~~/types/etat'
import { useDecrees } from './useDecrees'

/**
 * Composable pour détecter les changements entre décrets
 * Utilise $fetch pour appeler les API routes serveur
 */
export const useEntityChanges = () => {
  const { selectedDecree, getPreviousDecree } = useDecrees()

  const changes = useState<Map<string, SnapshotComparison>>('etat:changes', () => new Map())
  const loading = useState<boolean>('etat:changesLoading', () => false)

  /**
   * Détecter les changements entre deux décrets
   */
  const detectChangesBetweenDecrees = async (
    currentDecreeId: string,
    previousDecreeId?: string
  ): Promise<Map<string, SnapshotComparison>> => {
    if (!previousDecreeId) {
      return new Map()
    }

    loading.value = true

    try {
      const result = await $fetch<{ changes: any[]; stats: any }>('/api/annuaire-etat/snapshots/compare', {
        query: {
          current: currentDecreeId,
          previous: previousDecreeId
        }
      })

      const changesMap = new Map<string, SnapshotComparison>()
      result.changes.forEach((change) => {
        changesMap.set(change.entity_id, change)
      })

      return changesMap
    } catch (error) {
      console.error('Error detecting changes:', error)
      return new Map()
    } finally {
      loading.value = false
    }
  }

  /**
   * Mettre à jour les changements pour le décret sélectionné
   */
  const updateChanges = async () => {
    if (!selectedDecree.value) {
      changes.value = new Map()
      return
    }

    const previousDecree = getPreviousDecree(selectedDecree.value)

    if (!previousDecree) {
      changes.value = new Map()
      return
    }

    changes.value = await detectChangesBetweenDecrees(
      selectedDecree.value.id,
      previousDecree.id
    )
  }

  /**
   * Rafraîchir les changements quand le décret change
   */
  watch(() => selectedDecree.value?.id, () => {
    updateChanges()
  }, { immediate: true })

  /**
   * Obtenir le statut de changement d'une entité
   */
  const getEntityChangeStatus = (entityId: string): SnapshotComparison | null => {
    return changes.value.get(entityId) || null
  }

  /**
   * Obtenir les statistiques de changements
   */
  const getChangeStats = () => {
    const stats = {
      new: 0,
      modified: 0,
      removed: 0,
      unchanged: 0,
      total: changes.value.size
    }

    changes.value.forEach((comparison) => {
      stats[comparison.change]++
    })

    return stats
  }

  return {
    changes: changes,
    loading: loading,
    detectChangesBetweenDecrees,
    updateChanges,
    getEntityChangeStatus,
    getChangeStats
  }
}
