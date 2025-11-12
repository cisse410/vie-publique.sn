import { readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities/types
 * Récupère tous les types d'entités
 */
export default defineCachedEventHandler(async (event) => {
  const client = getEtatCmsClient()

  try {
    const types = await client.request(
      readItems('entities_types', {
        sort: ['label'],
        fields: ['*']
      })
    )

    return types
  } catch (error: any) {
    console.error('Error fetching entity types:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch entity types'
    })
  }
}, {
  maxAge: 60 * 60, // Cache 1 heure (les types changent rarement)
  getKey: () => 'entities:types'
})
