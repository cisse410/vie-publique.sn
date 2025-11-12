import { createDirectus, rest, readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities
 * Récupère toutes les entités avec filtres optionnels
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const client = getEtatCmsClient()

  try {
    // Construire les filtres
    const filter: any = {}

    if (query.search) {
      filter._or = [
        { canonical_name: { _icontains: query.search } },
        { slug: { _icontains: query.search } }
      ]
    }

    if (query.types) {
      const types = Array.isArray(query.types) ? query.types : [query.types]
      filter.entity_type_id = {
        code: { _in: types }
      }
    }

    const entities = await client.request(
      readItems('public_entities', {
        filter,
        fields: ['*', 'entity_type_id.*'],
        limit: query.limit ? parseInt(query.limit as string) : 100,
        sort: query.sort ? [query.sort as string] : ['canonical_name']
      })
    )

    return {
      success: true,
      data: entities
    }
  } catch (error) {
    console.error('Error fetching entities:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch entities'
    })
  }
})
