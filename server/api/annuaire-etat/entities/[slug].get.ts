import { readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities/:slug
 * Récupère une entité par son slug
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
    const entities = await client.request(
      readItems('public_entities', {
        filter: {
          slug: { _eq: slug },
          has_public_page: { _eq: true } // Only entities with public page
        },
        limit: 1,
        fields: [
          '*',
          'entity_type_id.id',
          'entity_type_id.code',
          'entity_type_id.label',
          'entity_type_id.can_have_children'
        ]
      })
    )

    if (!entities || entities.length === 0) {
      throw createError({
        statusCode: 404,
        message: `Entity ${slug} not found or does not have a public page`
      })
    }

    const entity = entities[0]

    // Fetch child entities (structures rattachées) from the active decree
    const activeDecree = await client.request(
      readItems('decree', {
        filter: { status: { _eq: 'active' } },
        limit: 1,
        fields: ['id']
      })
    )

    let childEntities = []
    if (activeDecree && activeDecree.length > 0) {
      const decreeId = activeDecree[0].id

      // First, find the current snapshot of this entity
      // Note: public_entity_id est l'ID direct, pas un objet avec .id
      const currentSnapshot = await client.request(
        readItems('entity_snapshots', {
          filter: {
            decree_id: { _eq: decreeId },
            public_entity_id: { _eq: entity.id }
          },
          limit: 1,
          fields: ['id']
        })
      )

      if (currentSnapshot && currentSnapshot.length > 0) {
        const snapshotId = currentSnapshot[0].id

        // Find snapshots where this snapshot is the parent
        // Note: parent_snapshot_id est l'ID direct, pas un objet avec .id
        const childSnapshots = await client.request(
          readItems('entity_snapshots', {
            filter: {
              decree_id: { _eq: decreeId },
              parent_snapshot_id: { _eq: snapshotId }
            },
            fields: [
              '*',
              'public_entity_id.*',
              'public_entity_id.entity_type_id.*'
            ],
            sort: ['public_entity_id.canonical_name']
          })
        )

        // For each child, if it's an entite_regroupement, fetch its children too
        childEntities = await Promise.all(
          childSnapshots.map(async (snapshot: any) => {
            const entity = {
              ...snapshot.public_entity_id,
              official_label: snapshot.official_label,
              child_entities: []
            }

            // If this is a regroupement entity, fetch its children
            if (typeof entity.entity_type_id === 'object' && entity.entity_type_id.code === 'entite_regroupement') {
              const grandchildSnapshots = await client.request(
                readItems('entity_snapshots', {
                  filter: {
                    decree_id: { _eq: decreeId },
                    parent_snapshot_id: { _eq: snapshot.id }
                  },
                  fields: [
                    '*',
                    'public_entity_id.*',
                    'public_entity_id.entity_type_id.*'
                  ],
                  sort: ['public_entity_id.canonical_name']
                })
              )

              entity.child_entities = grandchildSnapshots.map((grandchildSnapshot: any) => ({
                ...grandchildSnapshot.public_entity_id,
                official_label: grandchildSnapshot.official_label
              }))
            }

            return entity
          })
        )
      }
    }

    return {
      ...entity,
      child_entities: childEntities
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error fetching entity:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch entity'
    })
  }
}, {
  maxAge: 60 * 15, // Cache 15 minutes
  getKey: (event) => `entity:${getRouterParam(event, 'slug')}`
})
