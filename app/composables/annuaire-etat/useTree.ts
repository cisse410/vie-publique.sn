import type { TreeNode, EntitySnapshotWithRelations } from '~~/types/etat'
import { buildTree } from '~~/utils/tree-builder'
import { useDecrees } from './useDecrees'

/**
 * Composable pour gérer l'arborescence des entités
 * Utilise $fetch pour appeler les API routes serveur
 */
export const useTree = () => {
  const { selectedDecree } = useDecrees()

  const treeData = useState<TreeNode[]>('etat:treeData', () => [])
  const loading = useState<boolean>('etat:treeLoading', () => false)
  const error = useState<Error | null>('etat:treeError', () => null)

  /**
   * Charger l'arborescence pour un décret donné
   */
  const fetchTree = async (decreeId: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, data: EntitySnapshotWithRelations[] }>(`/api/annuaire-etat/entities/tree?decree_id=${decreeId}`)
      treeData.value = buildTree(response.data)
    } catch (err) {
      error.value = err as Error
      treeData.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Rafraîchir l'arbre quand le décret change
   */
  watch(() => selectedDecree.value?.id, (newId) => {
    if (newId) {
      fetchTree(newId)
    }
  }, { immediate: true })

  /**
   * Trouver un nœud par l'ID de l'entité
   */
  const findNodeByEntityId = (entityId: string, nodes?: TreeNode[]): TreeNode | null => {
    const searchNodes = nodes || treeData.value

    for (const node of searchNodes) {
      if (node.entity.id === entityId) {
        return node
      }

      if (node.children.length > 0) {
        const found = findNodeByEntityId(entityId, node.children)
        if (found) return found
      }
    }

    return null
  }

  /**
   * Obtenir tous les nœuds aplatis
   */
  const flattenTree = (nodes?: TreeNode[]): TreeNode[] => {
    const searchNodes = nodes || treeData.value
    const result: TreeNode[] = []

    const flatten = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        result.push(node)
        if (node.children.length > 0) {
          flatten(node.children)
        }
      }
    }

    flatten(searchNodes)
    return result
  }

  return {
    treeData: treeData,
    loading: loading,
    error: error,
    fetchTree,
    findNodeByEntityId,
    flattenTree
  }
}
