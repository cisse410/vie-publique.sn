import { readItems } from '@directus/sdk'

/**
 * GET /api/snapshots/:decreeId
 * Récupère tous les snapshots d'un décret avec cache
 */
export default defineCachedEventHandler(async (event) => {
  const decreeId = getRouterParam(event, 'decreeId')

  if (!decreeId) {
    throw createError({
      statusCode: 400,
      message: 'Decree ID is required'
    })
  }

  const client = getEtatCmsClient()

  try {
    const snapshots = await client.request(
      readItems('entity_snapshots', {
        filter: { decree_id: { _eq: decreeId } },
        fields: [
          '*',
          'public_entity_id.id',
          'public_entity_id.slug',
          'public_entity_id.canonical_name',
          'public_entity_id.entity_type_id.id',
          'public_entity_id.entity_type_id.code',
          'public_entity_id.entity_type_id.label',
          'public_entity_id.entity_type_id.can_have_children',
          'parent_snapshot_id.id',
          'parent_snapshot_id.official_label',
          'parent_snapshot_id.public_entity_id.id',
          'parent_snapshot_id.public_entity_id.slug'
        ]
      })
    )

    return snapshots
  } catch (error: any) {
    console.error('Error fetching snapshots:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch snapshots'
    })
  }
}, {
  maxAge: 60 * 10, // Cache 10 minutes
  getKey: (event) => `snapshots:decree:${getRouterParam(event, 'decreeId')}`
})
