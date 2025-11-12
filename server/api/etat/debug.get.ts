import { readItems } from "@directus/sdk";

// server/api/etat/debug.get.ts
export default defineEventHandler(async (event) => {
  try {
    const client = getEtatCmsClient();

    // Récupérer tous les types d'entités avec leurs IDs
    const entityTypes = await client.request(
      readItems('entities_types', {
        fields: ['id', 'code', 'label']
      })
    );

    // Récupérer quelques entités pour voir la structure
    const sampleEntities = await client.request(
      readItems('public_entities', {
        fields: ['id', 'canonical_name', 'entity_type_id'],
        limit: 5
      })
    );

    return {
      success: true,
      data: {
        entityTypes,
        sampleEntities
      }
    };
  } catch (error) {
    console.error('Erreur debug:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur debug'
    });
  }
});
