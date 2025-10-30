/**
 * API : Vue liste avec recherche, filtres et pagination
 * GET /api/etat/liste?search=xxx&type=xxx&page=1&snapshot_id=xxx
 *
 * Query params :
 * - search : terme de recherche (nom canonique)
 * - type : ID du org_type (optionnel)
 * - page : numéro de page (défaut: 1)
 * - snapshot_id : ID du snapshot (défaut: snapshot actif)
 * Cache: 5 minutes (par combinaison de paramètres)
 */

import { readItem, readItems } from "@directus/sdk"
import type { ListeResponse, OrgSnapshot } from "../../../types/etat"

const PAGE_SIZE = 20

export default defineCachedEventHandler(async (event): Promise<ListeResponse> => {
  const cms = getEtatCmsClient()
  const query = getQuery(event)

  // Parser les query params
  const searchTerm = (query.search as string) || "";
  const typeFilter = query.type as string | undefined;
  const page = parseInt((query.page as string) || "1", 10);
  let snapshotId = query.snapshot_id as string | undefined;

  try {
    // Si pas de snapshot_id, prendre le snapshot actif
    if (!snapshotId) {
      console.log("[Etat API Liste] Recherche du snapshot actif...");
      const activeSnapshot = await cms.request(readItems(
        "org_snapshot",
        {
          filter: { est_actif: { _eq: true } },
          limit: 1,
        }
      ));

      if (!activeSnapshot || activeSnapshot.length === 0) {
        console.error("[Etat API Liste] Aucun snapshot actif trouvé");
        throw createError({
          statusCode: 404,
          message: "Aucun snapshot actif trouvé. Exécutez 'npm run setup-etat'",
        });
      }

      snapshotId = activeSnapshot[0].id;
      console.log(`[Etat API Liste] Snapshot actif: ${snapshotId}`);
    }

    // Récupérer le snapshot
    console.log(`[Etat API Liste] Récupération snapshot ${snapshotId}...`);
    const snapshot = await cms.request(readItem("org_snapshot",
      snapshotId as string, // Type assertion car on a vérifié que snapshotId existe
      {
        fields: ["id", "numero", "annee", "titre"],
      }
    ));

    // Construire le filtre pour la recherche
    const searchFilter: any = {};

    if (searchTerm) {
      searchFilter.nom_canonique = { _icontains: searchTerm };
    }

    if (typeFilter) {
      searchFilter.org_type_id = { _eq: typeFilter };
    }

    console.log(`[Etat API Liste] Recherche avec: search="${searchTerm}", type=${typeFilter}, page=${page}`);

    // Récupérer le nombre total d'entités correspondantes
    const totalResponse = await cms.request(readItems(
      "public_entity",
      {
        filter: searchFilter,
        aggregate: { count: "id" },
      }
    ));

    const total = totalResponse[0]?.count?.id || 0;

    // Récupérer les entités paginées
    const entities = await cms.request(readItems(
      "public_entity",
      {
        filter: searchFilter,
        fields: ["*"],
        sort: ["nom_canonique"],
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }
    ));

    console.log(`[Etat API Liste] ${entities.length} entités trouvées (total: ${total})`);

    // Récupérer les org_types séparément
    const orgTypeIds = [...new Set((entities as any[]).map(e => e.org_type_id).filter(Boolean))];
    const orgTypesMap = new Map();

    if (orgTypeIds.length > 0) {
      console.log(`[Etat API Liste] Récupération de ${orgTypeIds.length} types...`);
      const orgTypes = await cms.request(readItems(
        "org_type",
        {
          filter: { id: { _in: orgTypeIds } },
          fields: ["id", "code", "label", "ordre", "icon"],
        }
      ));
      orgTypes.forEach((type: any) => {
        orgTypesMap.set(type.id, type);
      });
    }

    // Récupérer les org_units pour ces entités dans le snapshot actif
    const entityIds = (entities as any[]).map(e => e.id);
    const orgUnitsMap = new Map<string, any>();

    if (entityIds.length > 0) {
      console.log(`[Etat API Liste] Récupération des org_units pour ${entityIds.length} entités...`);
      const orgUnits = await cms.request(readItems(
        "org_unit",
        {
          filter: {
            public_entity_id: { _in: entityIds },
            snapshot_id: { _eq: snapshotId }
          },
          fields: ["id", "public_entity_id", "intitule_officiel", "parent_id", "snapshot_id"],
        }
      ));

      (orgUnits as any[]).forEach((unit) => {
        orgUnitsMap.set(unit.public_entity_id, unit);
      });
    }

    // Récupérer TOUS les org_units pour construire le chemin (1 seule requête)
    console.log(`[Etat API Liste] Récupération de tous les org_units du snapshot...`);
    const allOrgUnits = await cms.request(readItems(
      "org_unit",
      {
        filter: {
          snapshot_id: { _eq: snapshotId }
        },
        fields: ["id", "intitule_officiel", "parent_id"],
        limit: -1,
      }
    ));

    // Créer une map pour accès O(1)
    const allUnitsMap = new Map<string, any>();
    (allOrgUnits as any[]).forEach((u) => {
      allUnitsMap.set(u.id, u);
    });

    // Fonction pour construire le chemin des parents (en mémoire, pas de requête)
    const buildParentPath = (unitId: string): string[] => {
      const path: string[] = [];
      let current = allUnitsMap.get(unitId);
      const maxDepth = 10;
      let depth = 0;

      while (current?.parent_id && depth < maxDepth) {
        const parent = allUnitsMap.get(current.parent_id);
        if (parent) {
          path.unshift(parent.intitule_officiel);
          current = parent;
        } else {
          break;
        }
        depth++;
      }

      return path;
    };

    // Composer les entités finales
    const finalEntities = (entities as any[]).map((entity) => {
      const currentUnit = orgUnitsMap.get(entity.id);
      const orgType = orgTypesMap.get(entity.org_type_id);

      // Construire le chemin complet des parents
      const parentPath = currentUnit?.id ? buildParentPath(currentUnit.id) : [];
      const parentName = currentUnit?.parent_id ? allUnitsMap.get(currentUnit.parent_id)?.intitule_officiel : undefined;

      return {
        id: entity.id,
        slug: entity.slug,
        nom_canonique: entity.nom_canonique,
        org_type_id: entity.org_type_id,
        description: entity.description,
        site_web: entity.site_web,
        email: entity.email,
        telephone: entity.telephone,
        adresse: entity.adresse,
        date_created: entity.date_created,
        date_updated: entity.date_updated,
        org_type: orgType,
        current_unit: currentUnit,
        parent_name: parentName,
        parents: parentPath,
      };
    });

    return {
      entities: finalEntities,
      total,
      page,
      pageSize: PAGE_SIZE,
      snapshot: snapshot as OrgSnapshot,
    };
  } catch (error: any) {
    console.error("[Etat API Liste] ERREUR:", {
      message: error.message,
      errors: error.errors,
      snapshotId,
      search: searchTerm,
      type: typeFilter,
    });

    // Message d'erreur selon le type
    let errorMessage = "Impossible de récupérer la liste des entités";
    let statusCode = 500;

    if (error.message?.includes("permission") || error.errors?.[0]?.message?.includes("permission")) {
      errorMessage = "❌ Erreur permissions Directus - Voir documentation de troubleshooting";
      statusCode = 403;
    } else if (error.message?.includes("does not exist")) {
      errorMessage = "Collection non trouvée. Exécutez: npm run reset-etat && npm run setup-etat";
      statusCode = 404;
    }

    throw createError({
      statusCode,
      message: errorMessage,
      data: { originalError: error.message, snapshotId },
    });
  }
}, {
  maxAge: 60 * 5, // Cache 5 minutes
  getKey: (event) => {
    const query = getQuery(event);
    // Générer une clé unique basée sur tous les query params
    const key = `etat-liste:${query.snapshot_id || 'active'}:${query.search || ''}:${query.type || 'all'}:${query.page || '1'}`;
    return key;
  }
});
