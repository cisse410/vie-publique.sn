import { readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities/:slug/history
 * Récupère l'historique complet d'une entité
 */
export default defineCachedEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Entity slug is required'
    })
  }

  const client = getEtatCmsClient()

  try {
    // 1. Récupérer l'entité
    const entities = await client.request(
      readItems('public_entities', {
        filter: { slug: { _eq: slug } },
        limit: 1,
        fields: ['id']
      })
    )

    if (!entities || entities.length === 0) {
      throw createError({
        statusCode: 404,
        message: `Entity ${slug} not found`
      })
    }

    const entityId = entities[0].id

    // 2. Récupérer tous les snapshots
    const snapshots = await client.request(
      readItems('entity_snapshots', {
        filter: { public_entity_id: { _eq: entityId } },
        sort: ['-decree_id.date_publication'],
        fields: [
          '*',
          'decree_id.id',
          'decree_id.numero',
          'decree_id.date_publication',
          'decree_id.status',
          'parent_snapshot_id.id',
          'parent_snapshot_id.official_label',
          'parent_snapshot_id.public_entity_id.id',
          'parent_snapshot_id.public_entity_id.slug',
          'parent_snapshot_id.public_entity_id.canonical_name'
        ]
      })
    )

    return snapshots
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error fetching entity history:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch entity history'
    })
  }
}, {
  maxAge: 60 * 15, // Cache 15 minutes
  getKey: (event) => `entity:${getRouterParam(event, 'slug')}:history`
})
