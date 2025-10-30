/**
 * API : Liste des snapshots (décrets)
 * GET /api/etat/snapshots
 *
 * Retourne tous les snapshots disponibles + le snapshot actif
 * Cache: 5 minutes
 */

import { readItems } from "@directus/sdk"
import type { SnapshotsListResponse, OrgSnapshot } from "../../../types/etat"

export default defineCachedEventHandler(async (): Promise<SnapshotsListResponse> => {
  const cms = getEtatCmsClient()

  try {
    // Récupérer tous les snapshots publiés, triés par année décroissante
    const snapshots = await cms.request(
      readItems("org_snapshot", {
        filter: {
          status: { _eq: "published" },
        },
        sort: ["-annee", "-date_publication"],
        fields: [
          "id",
          "numero",
          "annee",
          "date_publication",
          "titre",
          "status",
          "est_actif",
          "document_url",
        ],
      })
    );

    // Trouver le snapshot actif
    const active = (snapshots as OrgSnapshot[]).find((s) => s.est_actif);

    return {
      snapshots: snapshots as OrgSnapshot[],
      active,
    };
  } catch (error: any) {
    console.error("Erreur lors de la récupération des snapshots:", error);
    throw createError({
      statusCode: 500,
      message: "Impossible de récupérer les snapshots",
    });
  }
}, {
  maxAge: 60 * 5, // Cache 5 minutes
});
