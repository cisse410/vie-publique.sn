import { readItems } from '@directus/sdk'

/**
 * GET /api/snapshots/compare?current=123&previous=122
 * Compare les snapshots entre deux décrets
 */
export default defineCachedEventHandler(
  async (event) => {
    const query = getQuery(event)
    const currentDecreeId = query.current
    const previousDecreeId = query.previous

    if (!currentDecreeId || !previousDecreeId) {
      throw createError({
        statusCode: 400,
        message: 'Both current and previous decree IDs are required',
      })
    }

    const client = getEtatCmsClient()

    try {
      // Récupérer les snapshots des deux décrets en parallèle
      const [currentSnapshots, previousSnapshots] = await Promise.all([
        client.request(
          readItems('entity_snapshots', {
            filter: { decree_id: { _eq: currentDecreeId } },
            fields: ['id', 'official_label', 'public_entity_id.id', 'parent_snapshot_id.id'],
          }),
        ),
        client.request(
          readItems('entity_snapshots', {
            filter: { decree_id: { _eq: previousDecreeId } },
            fields: ['id', 'official_label', 'public_entity_id.id', 'parent_snapshot_id.id'],
          }),
        ),
      ])

      // Créer des maps pour comparaison rapide
      const currentMap = new Map()
      const previousMap = new Map()

      currentSnapshots.forEach((snapshot: any) => {
        const entityId = snapshot.public_entity_id?.id || snapshot.public_entity_id
        currentMap.set(entityId, snapshot)
      })

      previousSnapshots.forEach((snapshot: any) => {
        const entityId = snapshot.public_entity_id?.id || snapshot.public_entity_id
        previousMap.set(entityId, snapshot)
      })

      // Détecter les changements
      const changes: any[] = []

      // Nouvelles entités et modifications
      currentMap.forEach((current: any, entityId: number) => {
        const previous = previousMap.get(entityId)

        if (!previous) {
          changes.push({
            entity_id: entityId,
            change: 'new',
            label: current.official_label,
          })
        } else {
          const currentParentId = current.parent_snapshot_id?.id || current.parent_snapshot_id
          const previousParentId = previous.parent_snapshot_id?.id || previous.parent_snapshot_id

          const hasChanges =
            current.official_label !== previous.official_label ||
            currentParentId !== previousParentId

          if (hasChanges) {
            changes.push({
              entity_id: entityId,
              change: 'modified',
              label: current.official_label,
              changes_detail: {
                label_changed: current.official_label !== previous.official_label,
                parent_changed: currentParentId !== previousParentId,
                old_label: previous.official_label,
                new_label: current.official_label,
              },
            })
          }
        }
      })

      // Entités supprimées
      previousMap.forEach((previous: any, entityId: number) => {
        if (!currentMap.has(entityId)) {
          changes.push({
            entity_id: entityId,
            change: 'removed',
            label: previous.official_label,
          })
        }
      })

      // Statistiques
      const stats = {
        new: changes.filter((c) => c.change === 'new').length,
        modified: changes.filter((c) => c.change === 'modified').length,
        removed: changes.filter((c) => c.change === 'removed').length,
        total: changes.length,
      }

      return {
        changes,
        stats,
      }
    } catch (error: any) {
      console.error('Error comparing snapshots:', error)
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to compare snapshots',
      })
    }
  },
  {
    maxAge: 60 * 15, // Cache 15 minutes
    getKey: (event) => {
      const query = getQuery(event)
      return `snapshots:compare:${query.current}:${query.previous}`
    },
  },
)
