/**
 * Composable : useEtatSnapshots
 *
 * Récupère la liste des snapshots (décrets) disponibles
 * Pattern: Template → Composable → Server API → Directus SDK
 */

import type { SnapshotsListResponse } from "../../../types/etat";

export const useEtatSnapshots = () => {
  return useAsyncData<SnapshotsListResponse>(
    "etat-snapshots",
    () => $fetch("/api/etat/snapshots"),
    {
      server: true,
      lazy: false,
    }
  );
};
