/**
 * Composable : useEtatArborescence
 *
 * Récupère l'arborescence hiérarchique pour un snapshot
 * Pattern: Template → Composable → Server API → Directus SDK
 */

import type { Ref } from 'vue'
import type { ArborescenceResponse } from "../../../types/etat"

export const useEtatArborescence = (snapshotId?: Ref<string | undefined>) => {
  const query = computed(() => {
    const params: Record<string, any> = {};
    if (snapshotId?.value) {
      params.snapshot_id = snapshotId.value;
    }
    return params;
  });

  return useAsyncData<ArborescenceResponse>(
    "etat-arborescence",
    () => $fetch("/api/etat/arborescence", {
      query: query.value
    }),
    {
      server: true,
      lazy: false,
      watch: [query],
    }
  );
};
