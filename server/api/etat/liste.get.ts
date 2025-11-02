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

  // Récupérer le numero ou snapshot_id depuis les query params (backward compatibility)
  const snapshotNumero = query.decret as string | undefined || query.snapshot as string | undefined;
  const snapshotIdLegacy = query.snapshot_id as string | undefined;

  let snapshot: any;
  let snapshotId: string | undefined;

  try {
    // Stratégie 1: Chercher par numero (SEO-friendly)
    if (snapshotNumero) {
      console.log(`[Etat API Liste] Recherche du snapshot par numero: ${snapshotNumero}`);
      const snapshots = await cms.request(readItems(
        "org_snapshot",
        {
          filter: { numero: { _eq: snapshotNumero } },
          limit: 1,
          fields: ["id", "numero", "annee", "titre"],
        }
      ));

      if (!snapshots || snapshots.length === 0) {
        throw createError({
          statusCode: 404,
          message: `Snapshot ${snapshotNumero} non trouvé`,
        });
      }

      snapshot = snapshots[0];
      console.log(`[Etat API Liste] Snapshot trouvé: ${snapshot.numero} (${snapshot.id})`);
    }
    // Stratégie 2: Chercher par ID (backward compatibility)
    else if (snapshotIdLegacy) {
      console.log(`[Etat API Liste] Recherche du snapshot par ID (legacy): ${snapshotIdLegacy}`);
      snapshot = await cms.request(readItem(
        "org_snapshot",
        snapshotIdLegacy,
        {
          fields: ["id", "numero", "annee", "titre"],
        }
      ));
    }
    // Stratégie 3: Prendre le snapshot actif
    else {
      console.log("[Etat API Liste] Recherche du snapshot actif...");
      const activeSnapshot = await cms.request(readItems(
        "org_snapshot",
        {
          filter: { est_actif: { _eq: true } },
          limit: 1,
          fields: ["id", "numero", "annee", "titre"],
        }
      ));

      if (!activeSnapshot || activeSnapshot.length === 0) {
        console.error("[Etat API Liste] Aucun snapshot actif trouvé");
        throw createError({
          statusCode: 404,
          message: "Aucun snapshot actif trouvé. Exécutez 'npm run setup-etat'",
        });
      }

      snapshot = activeSnapshot[0];
      console.log(`[Etat API Liste] Snapshot actif: ${snapshot.numero} (${snapshot.id})`);
    }

    const snapshotId = snapshot.id;

    // Si typeFilter est fourni, on le convertit en ID
    // Supporte à la fois le code (SEO) et l'ID (backward compatibility)
    let typeId: string | undefined;
    if (typeFilter) {
      console.log(`[Etat API Liste] Recherche du type avec: ${typeFilter}`);

      // Essayer d'abord par code (SEO-friendly)
      const typesByCode = await cms.request(readItems(
        "org_type",
        {
          filter: { code: { _eq: typeFilter } },
          fields: ["id", "code"],
          limit: 1,
        }
      ));

      if (typesByCode && typesByCode.length > 0) {
        typeId = (typesByCode[0] as any).id;
        console.log(`[Etat API Liste] Type trouvé par code: ${(typesByCode[0] as any).code} → ID: ${typeId}`);
      } else {
        // Fallback: essayer par ID directement (backward compatibility)
        console.log(`[Etat API Liste] Aucun type trouvé avec le code "${typeFilter}", tentative avec ID...`);
        try {
          const typeById = await cms.request(readItems(
            "org_type",
            {
              filter: { id: { _eq: typeFilter } },
              fields: ["id", "code"],
              limit: 1,
            }
          ));

          if (typeById && typeById.length > 0) {
            typeId = (typeById[0] as any).id;
            console.log(`[Etat API Liste] Type trouvé par ID: ${typeId}`);
          } else {
            console.warn(`[Etat API Liste] Aucun type trouvé avec "${typeFilter}" (ni code, ni ID)`);
          }
        } catch (e) {
          console.warn(`[Etat API Liste] Erreur lors de la recherche par ID:`, e);
        }
      }
    }

    console.log(`[Etat API Liste] Recherche avec: search="${searchTerm}", type=${typeFilter} (ID: ${typeId}), page=${page}, snapshot=${snapshotId}`);

    // APPROCHE SIMPLIFIÉE: Récupérer d'abord les IDs des entités filtrées, puis les org_units
    let filteredEntityIds: string[] = [];

    if (searchTerm || typeId) {
      // Si on a des filtres, d'abord trouver les entités qui matchent
      console.log(`[Etat API Liste] Recherche des entités matchant les critères...`);

      const entityFilter: any = {};
      if (searchTerm) {
        entityFilter.nom_canonique = { _icontains: searchTerm };
      }
      if (typeId) {
        entityFilter.org_type_id = { _eq: typeId };
      }

      const matchingEntities = await cms.request(readItems(
        "public_entity",
        {
          filter: entityFilter,
          fields: ["id"],
          limit: -1,
        }
      ));

      filteredEntityIds = (matchingEntities as any[]).map(e => e.id);
      console.log(`[Etat API Liste] ${filteredEntityIds.length} entités matchent les critères`);

      if (filteredEntityIds.length === 0) {
        // Aucune entité ne matche les critères
        console.log(`[Etat API Liste] Aucune entité trouvée avec ces critères`);
        return {
          entities: [],
          total: 0,
          page,
          pageSize: PAGE_SIZE,
          snapshot: snapshot as OrgSnapshot,
        };
      }
    }

    // Construire le filtre pour les org_units
    const orgUnitFilter: any = {
      snapshot_id: { _eq: snapshotId }
    };

    // Si on a des entités filtrées, les ajouter au filtre
    if (filteredEntityIds.length > 0) {
      orgUnitFilter.public_entity_id = { _in: filteredEntityIds };
    }

    console.log(`[Etat API Liste] Récupération des org_units du snapshot...`);

    // CORRECTIF: Diviser la requête en lots pour éviter l'erreur 431 "Request Header Fields Too Large"
    let allOrgUnitsInSnapshot: any[] = [];

    if (filteredEntityIds.length > 0) {
      // Si on a des entités filtrées, diviser en lots de 100 IDs max
      const BATCH_SIZE = 100;
      const batches = Math.ceil(filteredEntityIds.length / BATCH_SIZE);
      console.log(`[Etat API Liste] Récupération en ${batches} lots de ${BATCH_SIZE} IDs max...`);

      for (let i = 0; i < filteredEntityIds.length; i += BATCH_SIZE) {
        const batch = filteredEntityIds.slice(i, i + BATCH_SIZE);
        const batchResults = await cms.request(readItems(
          "org_unit",
          {
            filter: {
              snapshot_id: { _eq: snapshotId },
              public_entity_id: { _in: batch }
            },
            fields: ["public_entity_id"],
            limit: -1,
          }
        ));
        allOrgUnitsInSnapshot.push(...(batchResults as any[]));
      }
      console.log(`[Etat API Liste] ${allOrgUnitsInSnapshot.length} org_units récupérés en ${batches} lots`);
    } else {
      // Pas de filtre, récupérer tous les org_units du snapshot
      const results = await cms.request(readItems(
        "org_unit",
        {
          filter: { snapshot_id: { _eq: snapshotId } },
          fields: ["public_entity_id"],
          limit: -1,
        }
      ));
      allOrgUnitsInSnapshot = results as any[];
    }

    // Extraire les IDs uniques des entités
    const uniqueEntityIds = [...new Set(allOrgUnitsInSnapshot.map(u => u.public_entity_id).filter(Boolean))];
    const total = uniqueEntityIds.length;
    console.log(`[Etat API Liste] ${total} entités uniques dans ce snapshot`);

    if (total === 0) {
      console.log(`[Etat API Liste] Aucune entité trouvée`);
      return {
        entities: [],
        total: 0,
        page,
        pageSize: PAGE_SIZE,
        snapshot: snapshot as OrgSnapshot,
      };
    }

    // Paginer les IDs
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const pageEntityIds = uniqueEntityIds.slice(startIndex, endIndex);

    console.log(`[Etat API Liste] Page ${page}: ${pageEntityIds.length} entités`);

    // Récupérer les entités complètes pour cette page
    const entities = await cms.request(readItems(
      "public_entity",
      {
        filter: { id: { _in: pageEntityIds } },
        fields: ["*"],
        sort: ["nom_canonique"],
      }
    ));

    console.log(`[Etat API Liste] ${(entities as any[]).length} entités récupérées pour la page`);

    // Récupérer les org_units pour ces entités dans ce snapshot
    const currentUnitMap = new Map();
    if (pageEntityIds.length > 0) {
      const pageOrgUnits = await cms.request(readItems(
        "org_unit",
        {
          filter: {
            public_entity_id: { _in: pageEntityIds },
            snapshot_id: { _eq: snapshotId }
          },
          fields: ["id", "public_entity_id", "intitule_officiel", "parent_id", "snapshot_id"],
        }
      ));

      // Garder seulement le premier org_unit par entité
      (pageOrgUnits as any[]).forEach(unit => {
        if (!currentUnitMap.has(unit.public_entity_id)) {
          currentUnitMap.set(unit.public_entity_id, unit);
        }
      });
    }

    // Récupérer les org_types séparément
    const orgTypeIds = [...new Set((entities as any[]).map(e => e.org_type_id).filter(Boolean))];
    const orgTypesMap = new Map();

    if (orgTypeIds.length > 0) {
      console.log(`[Etat API Liste] Récupération de ${orgTypeIds.length} types...`);
      const orgTypes = await cms.request(readItems(
        "org_type",
        {
          filter: { id: { _in: orgTypeIds } },
          fields: ["id", "code", "label", "ordre"],
        }
      ));
      orgTypes.forEach((type: any) => {
        orgTypesMap.set(type.id, type);
      });
    }

    // orgUnitsMap est maintenant currentUnitMap (renommer pour la compatibilité avec le reste du code)
    const orgUnitsMap = currentUnitMap;

    console.log(`[Etat API Liste] ${orgUnitsMap.size} org_units mappés pour cette page`);

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

    // Récupérer le snapshot précédent pour comparaison
    console.log(`[Etat API Liste] Recherche du snapshot précédent...`);
    const previousSnapshot = await cms.request(readItems(
      "org_snapshot",
      {
        filter: {
          annee: { _lt: snapshot.annee },
          status: { _eq: "published" },
        },
        sort: ["-annee"],
        limit: 1,
      }
    ));

    let previousUnits: any[] = [];
    if (previousSnapshot && previousSnapshot.length > 0) {
      console.log(`[Etat API Liste] Snapshot précédent trouvé: ${previousSnapshot[0].numero}`);
      previousUnits = await cms.request(readItems(
        "org_unit",
        {
          filter: { snapshot_id: { _eq: previousSnapshot[0].id } },
          fields: [
            "id",
            "public_entity_id",
            "parent_id",
            "intitule_officiel",
          ],
          limit: -1,
        }
      )) as any[];
    }

    // Comparer avec le snapshot précédent pour détecter les changements
    const currentUnitsForComparison = Array.from(orgUnitsMap.values());
    console.log(`[Etat API Liste] currentUnitsForComparison type:`, typeof currentUnitsForComparison, `isArray:`, Array.isArray(currentUnitsForComparison), `length:`, currentUnitsForComparison.length);
    console.log(`[Etat API Liste] previousUnits type:`, typeof previousUnits, `isArray:`, Array.isArray(previousUnits), `length:`, previousUnits?.length);

    const unitsWithChanges = compareSnapshots(currentUnitsForComparison as any[], previousUnits);

    console.log(`[Etat API Liste] unitsWithChanges type:`, typeof unitsWithChanges, `isArray:`, Array.isArray(unitsWithChanges), `value:`, unitsWithChanges);

    // Créer une map des changements par public_entity_id
    const changesMap = new Map(
      unitsWithChanges.map(u => [u.public_entity_id, { badge: u.badge, changeDetails: u.changeDetails }])
    );

    // Composer les entités finales
    const finalEntities = (entities as any[]).map((entity) => {
      const currentUnit = orgUnitsMap.get(entity.id);
      const orgType = orgTypesMap.get(entity.org_type_id);
      const changes = changesMap.get(entity.id);

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
        badge: changes?.badge,
        changeDetails: changes?.changeDetails,
      };
    });

    return {
      entities: finalEntities,
      total,
      page,
      pageSize: PAGE_SIZE,
      snapshot: snapshot as OrgSnapshot,
      previousSnapshot: previousSnapshot?.[0] as OrgSnapshot | undefined,
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
    // Générer une clé unique basée sur le numero (SEO) ou snapshot_id (legacy) ou 'active'
    const key = `etat-liste:${query.decret || query.snapshot || query.snapshot_id || 'active'}:${query.search || ''}:${query.type || 'all'}:${query.page || '1'}`;
    return key;
  }
});
