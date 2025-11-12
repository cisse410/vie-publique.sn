import { readItems } from '@directus/sdk'

/**
 * GET /api/decrees/active
 * Récupère le décret actif avec cache de 10 minutes
 */
export default defineCachedEventHandler(async (event) => {
  const client = getEtatCmsClient()

  try {
    const decrees = await client.request(
      readItems('decree', {
        filter: { status: { _eq: 'active' } },
        limit: 1,
        fields: ['*']
      })
    )

    if (!decrees || decrees.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'No active decree found'
      })
    }

    return decrees[0]
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error fetching active decree:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch active decree'
    })
  }
}, {
  maxAge: 60 * 10, // Cache 10 minutes
  getKey: () => 'decrees:active'
})
