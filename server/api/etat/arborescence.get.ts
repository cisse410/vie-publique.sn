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

    // Récupérer le snapshot_id depuis les query params
    let snapshotId = query.snapshot_id as string | undefined;

    try {
      // Si pas de snapshot_id, prendre le snapshot actif
      if (!snapshotId) {
        console.log("[Etat API] Recherche du snapshot actif...");
        const activeSnapshot = await cms.request(readItems(
          "org_snapshot",
          {
            filter: { est_actif: { _eq: true } },
            limit: 1,
          }
        ));

        if (!activeSnapshot || activeSnapshot.length === 0) {
          console.error("[Etat API] Aucun snapshot actif trouvé");
          throw createError({
            statusCode: 404,
            message: "Aucun snapshot actif trouvé. Exécutez 'npm run setup-etat'",
          });
        }

        snapshotId = activeSnapshot[0].id;
        console.log(`[Etat API] Snapshot actif: ${snapshotId}`);
      }

      // Récupérer le snapshot courant
      console.log(`[Etat API] Récupération snapshot ${snapshotId}...`);
      const snapshot = await cms.request(readItem(
        "org_snapshot",
        snapshotId as string, // Type assertion car on a vérifié que snapshotId existe
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
          fields: ["id", "code", "label", "icon"],
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
          }
        )) as any[];
      }

      // Ajouter les badges de comparaison
      const unitsWithBadges: OrgUnitWithComparison[] = (
        orgUnitsWithRelations as any[]
      ).map((unit: any) => {
        const prevUnit = previousUnits.find(
          (p) => p.public_entity_id === unit.public_entity_id
        );

        let badge: "Nouveau" | "Modifié" | null = null;

        if (!prevUnit) {
          badge = "Nouveau";
        } else if (
          prevUnit.intitule_officiel !== unit.intitule_officiel ||
          prevUnit.parent_id !== unit.parent_id
        ) {
          badge = "Modifié";
        }

        return { ...unit, badge };
      });

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
      // Générer une clé unique basée sur le snapshot_id
      const key = `etat-arborescence:${query.snapshot_id || 'active'}`;
      return key;
    }
  }
);
