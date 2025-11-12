import { readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities/:slug/current-snapshot
 * Récupère le snapshot actuel d'une entité
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

    // 2. Récupérer le décret actif
    const activeDecrees = await client.request(
      readItems('decree', {
        filter: { status: { _eq: 'active' } },
        limit: 1,
        fields: ['id']
      })
    )

    if (!activeDecrees || activeDecrees.length === 0) {
      return null
    }

    const activeDecreeId = activeDecrees[0].id

    // 3. Récupérer le snapshot
    const snapshots = await client.request(
      readItems('entity_snapshots', {
        filter: {
          public_entity_id: { _eq: entityId },
          decree_id: { _eq: activeDecreeId }
        },
        limit: 1,
        fields: [
          '*',
          'decree_id.id',
          'decree_id.numero',
          'decree_id.date_publication',
          'parent_snapshot_id.id',
          'parent_snapshot_id.official_label',
          'parent_snapshot_id.public_entity_id.id',
          'parent_snapshot_id.public_entity_id.slug',
          'parent_snapshot_id.public_entity_id.canonical_name'
        ]
      })
    )

    return snapshots[0] || null
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error fetching current snapshot:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch current snapshot'
    })
  }
}, {
  maxAge: 60 * 10, // Cache 10 minutes
  getKey: (event) => `entity:${getRouterParam(event, 'slug')}:current-snapshot`
})
