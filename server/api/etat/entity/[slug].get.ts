/**
 * API : Détails d'une entité publique
 * GET /api/etat/entity/:slug
 *
 * Retourne les informations complètes d'une entité publique
 * Cache: 15 minutes
 */

import { readItems } from "@directus/sdk"
import type { PublicEntity, OrgSnapshot } from "../../../../types/etat"

export default defineCachedEventHandler(
  async (event) => {
    const cms = getEtatCmsClient()
    const slug = getRouterParam(event, "slug")
    const query = getQuery(event)

    // Récupérer le numero du snapshot (optionnel, sinon snapshot actif)
    const snapshotNumero = query.decret as string | undefined || query.snapshot as string | undefined

    if (!slug) {
      throw createError({
        statusCode: 400,
        message: "Le slug de l'entité est requis",
      })
    }

    try {
      // 1. Récupérer l'entité publique par slug
      console.log(`[Etat API Entity] Recherche de l'entité: ${slug}`)
      const entities = await cms.request(readItems(
        "public_entity",
        {
          filter: { slug: { _eq: slug } },
          limit: 1,
          fields: [
            "id",
            "slug",
            "nom_canonique",
            "description",
            "site_web",
            "email",
            "telephone",
            "adresse",
            // "reseaux_sociaux", // TODO: Ajouter ce champ dans Directus (type JSON)
            "date_created",
            "date_updated",
            "org_type_id",
          ],
        }
      ))

      if (!entities || entities.length === 0) {
        throw createError({
          statusCode: 404,
          message: `Entité "${slug}" non trouvée`,
        })
      }

      const entity = entities[0] as any

      // 2. Récupérer le org_type
      let orgType: any = null
      if (entity.org_type_id) {
        const orgTypes = await cms.request(readItems(
          "org_type",
          {
            filter: { id: { _eq: entity.org_type_id } },
            limit: 1,
            fields: ["id", "code", "label", "ordre"],
          }
        ))
        orgType = orgTypes?.[0] || null
      }

      // 3. Récupérer le snapshot (actif ou spécifié)
      let snapshot: any
      if (snapshotNumero) {
        const snapshots = await cms.request(readItems(
          "org_snapshot",
          {
            filter: { numero: { _eq: snapshotNumero } },
            limit: 1,
            fields: ["id", "numero", "annee", "titre", "date_publication"],
          }
        ))
        snapshot = snapshots?.[0]
      } else {
        const activeSnapshots = await cms.request(readItems(
          "org_snapshot",
          {
            filter: { est_actif: { _eq: true } },
            limit: 1,
            fields: ["id", "numero", "annee", "titre", "date_publication"],
          }
        ))
        snapshot = activeSnapshots?.[0]
      }

      if (!snapshot) {
        throw createError({
          statusCode: 404,
          message: "Aucun snapshot trouvé",
        })
      }

      // 4. Récupérer les org_units de cette entité dans ce snapshot
      const currentUnits = await cms.request(readItems(
        "org_unit",
        {
          filter: {
            public_entity_id: { _eq: entity.id },
            snapshot_id: { _eq: snapshot.id },
          },
          fields: [
            "id",
            "snapshot_id",
            "public_entity_id",
            "parent_id",
            "intitule_officiel",
            "notes",
            "ordre",
          ],
          sort: ["ordre"],
        }
      ))

      // 5. Pour chaque org_unit, récupérer le parent
      const parentIds = Array.from(new Set(
        (currentUnits as any[])
          .map(u => u.parent_id)
          .filter(Boolean)
      ))

      let parents: any[] = []
      if (parentIds.length > 0) {
        parents = await cms.request(readItems(
          "org_unit",
          {
            filter: { id: { _in: parentIds } },
            fields: [
              "id",
              "intitule_officiel",
              "public_entity_id",
            ],
            limit: -1,
          }
        )) as any[]
      }

      // Créer une map des parents
      const parentsMap = new Map(parents.map(p => [p.id, p]))

      // 6. Enrichir les org_units avec les infos du parent
      const enrichedUnits = (currentUnits as any[]).map(unit => ({
        ...unit,
        parent: unit.parent_id ? parentsMap.get(unit.parent_id) : null,
      }))

      // 7. Récupérer les entités qui ont cette entité comme parent (services rattachés)
      const childUnits = await cms.request(readItems(
        "org_unit",
        {
          filter: {
            parent_id: { _in: (currentUnits as any[]).map(u => u.id) },
            snapshot_id: { _eq: snapshot.id },
          },
          fields: [
            "id",
            "public_entity_id",
            "parent_id",
            "intitule_officiel",
            "ordre",
          ],
          sort: ["ordre"],
          limit: -1,
        }
      ))

      // Récupérer les public_entity des enfants
      const childEntityIds = Array.from(new Set(
        (childUnits as any[]).map(u => u.public_entity_id).filter(Boolean)
      ))

      let childEntities: any[] = []
      if (childEntityIds.length > 0) {
        childEntities = await cms.request(readItems(
          "public_entity",
          {
            filter: { id: { _in: childEntityIds } },
            fields: ["id", "slug", "nom_canonique", "org_type_id"],
          }
        )) as any[]

        // Récupérer les org_types des enfants
        const childOrgTypeIds = Array.from(new Set(
          childEntities.map(e => e.org_type_id).filter(Boolean)
        ))

        let childOrgTypes: any[] = []
        if (childOrgTypeIds.length > 0) {
          childOrgTypes = await cms.request(readItems(
            "org_type",
            {
              filter: { id: { _in: childOrgTypeIds } },
              fields: ["id", "code", "label", "ordre"],
            }
          )) as any[]
        }

        const childOrgTypesMap = new Map(childOrgTypes.map(t => [t.id, t]))

        // Enrichir les childEntities avec leur org_type
        childEntities = childEntities.map(e => ({
          ...e,
          org_type: childOrgTypesMap.get(e.org_type_id)
        }))
      }

      // Créer une map des entités enfants
      const childEntitiesMap = new Map(childEntities.map(e => [e.id, e]))

      // 8. Enrichir les child_units avec les public_entity
      const enrichedChildUnits = (childUnits as any[]).map(unit => ({
        ...unit,
        public_entity: childEntitiesMap.get(unit.public_entity_id),
      }))

      // 9. Récupérer l'historique de cette entité dans les autres snapshots
      const allSnapshots = await cms.request(readItems(
        "org_snapshot",
        {
          filter: { status: { _eq: "published" } },
          fields: ["id", "numero", "annee", "titre", "date_publication"],
          sort: ["-annee"],
        }
      ))

      const historyUnits = await cms.request(readItems(
        "org_unit",
        {
          filter: { public_entity_id: { _eq: entity.id } },
          fields: [
            "id",
            "snapshot_id",
            "parent_id",
            "intitule_officiel",
          ],
          limit: -1,
        }
      ))

      // Grouper par snapshot
      const historyBySnapshot = (historyUnits as any[]).reduce((acc, unit) => {
        if (!acc[unit.snapshot_id]) {
          acc[unit.snapshot_id] = []
        }
        acc[unit.snapshot_id].push(unit)
        return acc
      }, {} as Record<string, any[]>)

      const history = (allSnapshots as any[]).map(snap => ({
        snapshot: snap,
        units: historyBySnapshot[snap.id] || [],
        present: !!historyBySnapshot[snap.id],
      }))

      return {
        entity: {
          ...entity,
          org_type: orgType,
        } as PublicEntity,
        snapshot: snapshot as OrgSnapshot,
        currentUnits: enrichedUnits,
        childUnits: enrichedChildUnits,
        history,
      }
    } catch (error: any) {
      console.error("[Etat API Entity] ERREUR:", {
        message: error.message,
        errors: error.errors,
        slug,
      })

      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || "Impossible de récupérer l'entité",
      })
    }
  },
  {
    maxAge: 60 * 15, // Cache 15 minutes
    getKey: (event) => {
      const slug = getRouterParam(event, "slug")
      const query = getQuery(event)
      return `etat-entity:${slug}:${query.decret || query.snapshot || 'active'}`
    },
  }
)
