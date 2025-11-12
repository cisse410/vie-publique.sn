import { readItems } from '@directus/sdk'

/**
 * GET /api/decrees/:numero
 * Récupère un décret par son numéro
 */
export default defineCachedEventHandler(async (event) => {
  const numero = getRouterParam(event, 'numero')

  if (!numero) {
    throw createError({
      statusCode: 400,
      message: 'Decree numero is required'
    })
  }

  const client = getEtatCmsClient()

  try {
    const decrees = await client.request(
      readItems('decree', {
        filter: { numero: { _eq: numero } },
        limit: 1,
        fields: ['*']
      })
    )

    if (!decrees || decrees.length === 0) {
      throw createError({
        statusCode: 404,
        message: `Decree ${numero} not found`
      })
    }

    return decrees[0]
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Error fetching decree:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch decree'
    })
  }
}, {
  maxAge: 60 * 30, // Cache 30 minutes
  getKey: (event) => `decree:${getRouterParam(event, 'numero')}`
})
