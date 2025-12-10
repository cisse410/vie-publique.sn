import { readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities/list
 * Récupère une liste plate d'entités pour un décret (sans hiérarchie)
 * Optimisé pour la vue liste - évite les doublons du tree-builder
 */
export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event)
  const decreeId = query.decree_id

  if (!decreeId) {
    throw createError({
      statusCode: 400,
      message: 'decree_id query parameter is required'
    })
  }

  const client = getEtatCmsClient()

  try {
    // Récupérer tous les snapshots pour ce décret
    const snapshots = await client.request(
      readItems('entity_snapshots', {
        filter: {
          decree_id: { _eq: decreeId as string }
        },
        fields: [
          '*',
          'public_entity_id.*',
          'public_entity_id.entity_type_id.*'
        ],
        limit: -1
      })
    )

    // Dédupliquer par entity_id et filtrer côté serveur
    const uniqueEntities = new Map()

    snapshots.forEach((snapshot: any) => {
      const entity = typeof snapshot.public_entity_id === 'object'
        ? snapshot.public_entity_id
        : null

      if (!entity) return

      const entityType = typeof entity.entity_type_id === 'object'
        ? entity.entity_type_id
        : null

      // Exclure les entités de regroupement et sections
      if (entityType && ['entite_regroupement', 'section'].includes(entityType.code)) {
        return
      }

      // Dédupliquer par entity_id
      if (!uniqueEntities.has(entity.id)) {
        uniqueEntities.set(entity.id, {
          snapshot,
          entity,
          type: entityType
        })
      }
    })

    return {
      success: true,
      data: Array.from(uniqueEntities.values())
    }
  } catch (error) {
    console.error('Error fetching entity list:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch entity list'
    })
  }
}, {
  maxAge: 60 * 15, // Cache 15 minutes
  getKey: (event) => {
    const query = getQuery(event)
    return `entities:list:${query.decree_id}`
  }
})
