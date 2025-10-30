/**
 * Composable : useEtatTypes
 *
 * Récupère tous les types d'organisations disponibles
 * Pattern: Template → Composable → Server API → Directus SDK
 */

import type { TypesResponse } from "../../../types/etat"

export const useEtatTypes = () => {
  return useAsyncData<TypesResponse>(
    "etat-types",
    () => $fetch("/api/etat/types"),
    {
      server: true,
      lazy: false,
    }
  )
}
