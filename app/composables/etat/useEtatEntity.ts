/**
 * Composable : useEtatEntity
 *
 * Récupère les détails d'une entité publique
 * Pattern: Template → Composable → Server API → Directus SDK
 */

import type { Ref } from 'vue'
import type { EntityDetailResponse } from "../../../types/etat"

export const useEtatEntity = (
  slug: Ref<string>,
  snapshotNumero?: Ref<string | undefined>
) => {
  const query = computed(() => {
    const params: Record<string, any> = {};
    if (snapshotNumero?.value) {
      params.decret = snapshotNumero.value;
    }
    return params;
  });

  return useAsyncData<EntityDetailResponse>(
    `etat-entity-${slug.value}`,
    () => $fetch(`/api/etat/entity/${slug.value}`, {
      query: query.value
    }),
    {
      server: true,
      lazy: false,
      watch: [slug, query],
    }
  );
};
