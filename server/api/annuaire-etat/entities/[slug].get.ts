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
        filter: { slug: { _eq: slug } },
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
        message: `Entity ${slug} not found`
      })
    }

    return entities[0]
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
