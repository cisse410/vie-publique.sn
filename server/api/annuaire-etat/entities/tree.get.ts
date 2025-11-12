import { readItems } from '@directus/sdk'

/**
 * GET /api/annuaire-etat/entities/tree
 * Récupère l'arborescence complète pour un décret
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const decreeId = query.decree_id

  if (!decreeId) {
    throw createError({
      statusCode: 400,
      message: 'decree_id query parameter is required'
    })
  }

  const client = getEtatCmsClient()

  try {
    // Récupérer tous les snapshots pour ce décret
    const snapshots = await client.request(
      readItems('entity_snapshots', {
        filter: { decree_id: { _eq: decreeId as string } },
        fields: [
          '*',
          'public_entity_id.*',
          'public_entity_id.entity_type_id.*',
          'parent_snapshot_id.*',
          'parent_snapshot_id.public_entity_id.*',
          'parent_snapshot_id.public_entity_id.entity_type_id.*'  // ← AJOUT CRUCIAL !
        ],
        limit: -1  // Récupérer tous les items
      })
    )

    // Construire l'arbre (la logique de construction sera côté client via utils)
    // Ici on retourne juste les snapshots

    return {
      success: true,
      data: snapshots
    }
  } catch (error) {
    console.error('Error fetching tree:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch entity tree'
    })
  }
})
