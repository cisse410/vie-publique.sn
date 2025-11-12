import type { EntitySnapshotWithRelations, SnapshotComparison } from '~~/types/etat'

/**
 * Détecte les changements entre deux ensembles de snapshots
 */
export function detectChanges(
  currentSnapshots: EntitySnapshotWithRelations[],
  previousSnapshots: EntitySnapshotWithRelations[]
): Map<string, SnapshotComparison> {
  const changes = new Map<string, SnapshotComparison>()

  // Créer des maps pour accès rapide par entity_id
  const currentMap = new Map<string, EntitySnapshotWithRelations>()
  const previousMap = new Map<string, EntitySnapshotWithRelations>()

  currentSnapshots.forEach(snapshot => {
    const entityId = typeof snapshot.public_entity_id === 'object'
      ? snapshot.public_entity_id.id
      : snapshot.public_entity_id
    currentMap.set(entityId, snapshot)
  })

  previousSnapshots.forEach(snapshot => {
    const entityId = typeof snapshot.public_entity_id === 'object'
      ? snapshot.public_entity_id.id
      : snapshot.public_entity_id
    previousMap.set(entityId, snapshot)
  })

  // Détecter les nouvelles entités et les modifications
  currentMap.forEach((currentSnapshot, entityId) => {
    const previousSnapshot = previousMap.get(entityId)

    if (!previousSnapshot) {
      // Nouvelle entité
      changes.set(entityId, {
        entity_id: entityId,
        change: 'new'
      })
    } else {
      // Vérifier les modifications
      const hasChanges = compareSnapshots(currentSnapshot, previousSnapshot)

      if (hasChanges) {
        changes.set(entityId, {
          entity_id: entityId,
          change: 'modified',
          changes_detail: getChangesDetail(currentSnapshot, previousSnapshot)
        })
      } else {
        changes.set(entityId, {
          entity_id: entityId,
          change: 'unchanged'
        })
      }
    }
  })

  // Détecter les entités supprimées
  previousMap.forEach((previousSnapshot, entityId) => {
    if (!currentMap.has(entityId)) {
      changes.set(entityId, {
        entity_id: entityId,
        change: 'removed'
      })
    }
  })

  return changes
}

/**
 * Compare deux snapshots et détecte s'il y a des changements
 */
function compareSnapshots(
  current: EntitySnapshotWithRelations,
  previous: EntitySnapshotWithRelations
): boolean {
  // Comparer le label officiel
  if (current.official_label !== previous.official_label) {
    return true
  }

  // Comparer le parent
  const currentParentId = getParentId(current)
  const previousParentId = getParentId(previous)

  if (currentParentId !== previousParentId) {
    return true
  }

  return false
}

/**
 * Obtient les détails des changements entre deux snapshots
 */
function getChangesDetail(
  current: EntitySnapshotWithRelations,
  previous: EntitySnapshotWithRelations
) {
  const detail: SnapshotComparison['changes_detail'] = {}

  // Changement de label
  if (current.official_label !== previous.official_label) {
    detail.label_changed = true
    detail.old_label = previous.official_label
    detail.new_label = current.official_label
  }

  // Changement de parent
  const currentParentId = getParentId(current)
  const previousParentId = getParentId(previous)

  if (currentParentId !== previousParentId) {
    detail.parent_changed = true
    detail.old_parent = getParentLabel(previous)
    detail.new_parent = getParentLabel(current)
  }

  return detail
}

/**
 * Obtient l'ID du parent d'un snapshot
 */
function getParentId(snapshot: EntitySnapshotWithRelations): number | null {
  if (!snapshot.parent_snapshot_id) return null

  if (typeof snapshot.parent_snapshot_id === 'object') {
    return snapshot.parent_snapshot_id.id
  }

  return snapshot.parent_snapshot_id
}

/**
 * Obtient le label du parent d'un snapshot
 */
function getParentLabel(snapshot: EntitySnapshotWithRelations): string | undefined {
  if (!snapshot.parent_snapshot_id) return undefined

  if (typeof snapshot.parent_snapshot_id === 'object') {
    return snapshot.parent_snapshot_id.official_label
  }

  return undefined
}

/**
 * Filtre les changements par type
 */
export function filterChangesByType(
  changes: Map<string, SnapshotComparison>,
  type: 'new' | 'modified' | 'removed' | 'unchanged'
): string[] {
  const result: string[] = []

  changes.forEach((comparison, entityId) => {
    if (comparison.change === type) {
      result.push(entityId)
    }
  })

  return result
}

/**
 * Obtient les statistiques des changements
 */
export function getChangeStatistics(changes: Map<string, SnapshotComparison>) {
  const stats = {
    new: 0,
    modified: 0,
    removed: 0,
    unchanged: 0,
    total: changes.size
  }

  changes.forEach((comparison) => {
    stats[comparison.change]++
  })

  return stats
}
