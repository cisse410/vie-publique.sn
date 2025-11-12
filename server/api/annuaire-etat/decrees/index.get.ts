import { readItems } from '@directus/sdk'

/**
 * GET /api/decrees
 * Récupère tous les décrets avec cache de 5 minutes
 */
export default defineCachedEventHandler(async () => {
  const client = getEtatCmsClient()

  try {
    const decrees = await client.request(
      readItems('decree', {
        sort: ['-date_publication'],
        fields: ['*']
      })
    )

    return decrees
  } catch (error: any) {
    console.error('Error fetching decrees:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch decrees'
    })
  }
}, {
  maxAge: 60 * 5, // Cache 5 minutes
  getKey: () => 'decrees:all'
})
