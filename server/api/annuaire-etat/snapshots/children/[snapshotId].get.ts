import { readItems } from '@directus/sdk'

/**
 * GET /api/snapshots/children/:snapshotId
 * Récupère les snapshots enfants d'un snapshot
 */
export default defineCachedEventHandler(async (event) => {
  const snapshotId = getRouterParam(event, 'snapshotId')

  if (!snapshotId) {
    throw createError({
      statusCode: 400,
      message: 'Snapshot ID is required'
    })
  }

  const client = getEtatCmsClient()

  try {
    const children = await client.request(
      readItems('entity_snapshots', {
        filter: { parent_snapshot_id: { _eq: snapshotId } },
        fields: [
          '*',
          'public_entity_id.id',
          'public_entity_id.slug',
          'public_entity_id.canonical_name',
          'public_entity_id.entity_type_id.id',
          'public_entity_id.entity_type_id.code',
          'public_entity_id.entity_type_id.label'
        ]
      })
    )

    return children
  } catch (error: any) {
    console.error('Error fetching children snapshots:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch children snapshots'
    })
  }
}, {
  maxAge: 60 * 10, // Cache 10 minutes
  getKey: (event) => `snapshots:children:${getRouterParam(event, 'snapshotId')}`
})
