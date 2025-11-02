/**
 * API : Vue arborescence
 * GET /api/etat/arborescence?snapshot_id=xxx
 *
 * Retourne l'arbre hiérarchique avec badges "Nouveau/Modifié"
 * Cache: 10 minutes (par snapshot_id)
 */

import { readItem, readItems } from "@directus/sdk"
import type {
  ArborescenceResponse,
  OrgSnapshot,
  OrgUnit,
  OrgUnitWithComparison,
} from "../../../types/etat"

export default defineCachedEventHandler(
  async (event): Promise<ArborescenceResponse> => {
    const cms = getEtatCmsClient()
    const query = getQuery(event)

    // Récupérer le numero ou snapshot_id depuis les query params (backward compatibility)
    const snapshotNumero = query.decret as string | undefined || query.snapshot as string | undefined;
    const snapshotIdLegacy = query.snapshot_id as string | undefined;

    let snapshot: any;
    let snapshotId: string | undefined;

    try {
      // Stratégie 1: Chercher par numero (SEO-friendly)
      if (snapshotNumero) {
        console.log(`[Etat API] Recherche du snapshot par numero: ${snapshotNumero}`);
        const snapshots = await cms.request(readItems(
          "org_snapshot",
          {
            filter: { numero: { _eq: snapshotNumero } },
            limit: 1,
            fields: [
              "id",
              "numero",
              "annee",
              "date_publication",
              "titre",
              "status",
              "est_actif",
            ],
          }
        ));

        if (!snapshots || snapshots.length === 0) {
          throw createError({
            statusCode: 404,
            message: `Snapshot ${snapshotNumero} non trouvé`,
          });
        }

        snapshot = snapshots[0];
        console.log(`[Etat API] Snapshot trouvé: ${snapshot.numero} (${snapshot.id})`);
      }
      // Stratégie 2: Chercher par ID (backward compatibility)
      else if (snapshotIdLegacy) {
        console.log(`[Etat API] Recherche du snapshot par ID (legacy): ${snapshotIdLegacy}`);
        snapshot = await cms.request(readItem(
          "org_snapshot",
          snapshotIdLegacy,
          {
            fields: [
              "id",
              "numero",
              "annee",
              "date_publication",
              "titre",
              "status",
              "est_actif",
            ],
          }
        ));
      }
      // Stratégie 3: Prendre le snapshot actif
      else {
        console.log("[Etat API] Recherche du snapshot actif...");
        const activeSnapshot = await cms.request(readItems(
          "org_snapshot",
          {
            filter: { est_actif: { _eq: true } },
            limit: 1,
            fields: [
              "id",
              "numero",
              "annee",
              "date_publication",
              "titre",
              "status",
              "est_actif",
            ],
          }
        ));

        if (!activeSnapshot || activeSnapshot.length === 0) {
          console.error("[Etat API] Aucun snapshot actif trouvé");
          throw createError({
            statusCode: 404,
            message: "Aucun snapshot actif trouvé. Exécutez 'npm run setup-etat'",
          });
        }

        snapshot = activeSnapshot[0];
        console.log(`[Etat API] Snapshot actif: ${snapshot.numero} (${snapshot.id})`);
      }

      const snapshotId = snapshot.id;

      // Récupérer toutes les org_units de ce snapshot
      console.log(`[Etat API] Récupération org_units...`);
      const orgUnits = await cms.request(readItems(
        "org_unit",
        {
          filter: { snapshot_id: { _eq: snapshotId } },
          fields: [
            "id",
            "snapshot_id",
            "public_entity_id",
            "parent_id",
            "intitule_officiel",
            "ordre",
            "notes",
          ],
          sort: ["ordre"],
          limit: -1,
        }
      ));

      console.log(`[Etat API] ${orgUnits.length} org_units trouvées`);

      // Récupérer tous les public_entity avec leurs org_type (requête séparée)
      // NOTE: Le filtre { id: { _in: entityIds } } ne fonctionne pas avec Directus
      // On récupère donc TOUTES les entities (seulement ~1000) et on filtre en mémoire
      console.log(`[Etat API] Récupération public_entity...`);
      const publicEntities = await cms.request(readItems(
        "public_entity",
        {
          fields: ["id", "nom_canonique", "slug", "org_type_id"],
          limit: -1,
        }
      ));

      // Récupérer tous les org_type (requête séparée)
      console.log(`[Etat API] Récupération org_types...`);
      const orgTypes = await cms.request(readItems(
        "org_type",
        {
          fields: ["id", "code", "label"],
          limit: -1,
        }
      ));

      console.log(`[Etat API] ${(orgTypes as any[])?.length || 0} org_types trouvés`);
      console.log(`[Etat API] ${(publicEntities as any[])?.length || 0} public_entity trouvées`);

      // Créer des maps pour jointure rapide
      const orgTypesArray = Array.isArray(orgTypes) ? orgTypes : [];
      const publicEntitiesArray = Array.isArray(publicEntities) ? publicEntities : [];

      const typesMap = new Map(orgTypesArray.map((t: any) => [t.id, t]));
      const entitiesMap = new Map(
        publicEntitiesArray.map((e: any) => [
          e.id,
          {
            ...e,
            org_type: typesMap.get(e.org_type_id)
          }
        ])
      );

      // Joindre les données en mémoire
      const orgUnitsArray = Array.isArray(orgUnits) ? orgUnits : [];
      const orgUnitsWithRelations = orgUnitsArray.map((unit: any) => ({
        ...unit,
        public_entity: entitiesMap.get(unit.public_entity_id)
      }));

      console.log(`[Etat API] Relations jointes pour ${orgUnitsWithRelations.length} org_units`);

      // Récupérer le snapshot précédent pour comparaison
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
            limit: -1,  // ✅ Récupérer TOUTES les entités
          }
        )) as any[];
      }

      // Ajouter les badges de comparaison avec la nouvelle logique
      const unitsWithBadges: OrgUnitWithComparison[] = compareSnapshots(
        orgUnitsWithRelations as any[],
        previousUnits
      ) as OrgUnitWithComparison[];

      // Récupérer les entités supprimées
      const deletedUnits = findDeletedUnits(
        orgUnitsWithRelations as any[],
        previousUnits
      ) as OrgUnitWithComparison[];

      console.log(`[Etat API] ${deletedUnits.length} entités supprimées détectées`);

      // Calculer les statistiques
      const stats = {
        total: unitsWithBadges.length,
        nouveaux: unitsWithBadges.filter((u) => u.badge === "Nouveau").length,
        renommes: unitsWithBadges.filter((u) => u.badge === "Renommé").length,
        transferes: unitsWithBadges.filter((u) => u.badge === "Transféré").length,
        supprimes: deletedUnits.length,
        inchanges: unitsWithBadges.filter((u) => u.badge === "Inchangé").length,
      };

      console.log(`[Etat API] Statistiques:`, stats);

      // Construire l'arbre hiérarchique
      function buildTree(units: OrgUnitWithComparison[], parentId: string | null = null): OrgUnitWithComparison[] {
        return units
          .filter((u) => u.parent_id === parentId)
          .map((u) => ({
            ...u,
            children: buildTree(units, u.id),
          }));
      }

      const tree = buildTree(unitsWithBadges);
      console.log(`[Etat API] Arbre construit: ${tree.length} racines`);

      return {
        snapshot: snapshot as OrgSnapshot,
        tree,
        previousSnapshot: previousSnapshot?.[0] as OrgSnapshot | undefined,
        deletedUnits,
        stats,
      };
    } catch (error: any) {
      console.error("[Etat API] ERREUR:", {
        message: error.message,
        errors: error.errors,
        snapshotId,
      });

      // Message d'erreur selon le type
      let errorMessage = "Impossible de récupérer l'arborescence";
      let statusCode = 500;

      if (error.message?.includes("permission") || error.errors?.[0]?.message?.includes("permission")) {
        errorMessage = "❌ Erreur permissions Directus sur org_unit.snapshot_id - Voir documentation de troubleshooting";
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
  },
  {
    maxAge: 60 * 10, // Cache 10 minutes
    getKey: (event) => {
      const query = getQuery(event);
      // Générer une clé unique basée sur le numero (SEO) ou snapshot_id (legacy) ou 'active'
      const key = `etat-arborescence:${query.decret || query.snapshot || query.snapshot_id || 'active'}`;
      return key;
    }
  }
);
