/**
 * Composable : useEtatListe
 *
 * Récupère la liste paginée avec recherche et filtres
 * Pattern: Template → Composable → Server API → Directus SDK
 */

import type { Ref } from 'vue'
import type { ListeResponse } from "../../../types/etat"

interface UseEtatListeOptions {
  snapshotNumero?: Ref<string | undefined>
  search?: Ref<string | undefined>
  type?: Ref<string | undefined>
  page?: Ref<number>
}

export const useEtatListe = (options: UseEtatListeOptions = {}) => {
  const {
    snapshotNumero,
    search,
    type,
    page = ref(1),
  } = options;

  const query = computed(() => {
    const params: Record<string, any> = {
      page: page.value.toString(),
    };

    if (snapshotNumero?.value) {
      // Utiliser le param 'decret' pour le SEO
      params.decret = snapshotNumero.value;
    }

    if (search?.value) {
      params.search = search.value;
    }

    if (type?.value) {
      params.type = type.value;
    }

    return params;
  });

  return useAsyncData<ListeResponse>(
    "etat-liste",
    () => $fetch("/api/etat/liste", {
      query: query.value
    }),
    {
      server: true,
      lazy: false,
      watch: [query],
    }
  );
};
