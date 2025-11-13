import { readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities/tree
 * Récupère l'arborescence complète pour un décret avec cache de 15 minutes
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
        filter: { decree_id: { _eq: decreeId as string } },
        fields: [
          '*',
          'public_entity_id.*',
          'public_entity_id.entity_type_id.*',
          'parent_snapshot_id.*',
          'parent_snapshot_id.public_entity_id.*',
          'parent_snapshot_id.public_entity_id.entity_type_id.*'
        ],
        limit: -1  // Récupérer tous les items
      })
    )

    return {
      success: true,
      data: snapshots
    }
  } catch (error) {
    console.error('Error fetching tree:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch entity tree'
    })
  }
}, {
  maxAge: 60 * 15, // Cache 15 minutes
  getKey: (event) => {
    const query = getQuery(event)
    return `entities:tree:${query.decree_id}`
  }
})
