/**
 * API : Récupérer tous les types d'organisations
 * GET /api/etat/types
 *
 * Cache: 1 heure (les types changent rarement)
 */

import { readItems } from "@directus/sdk"
import type { OrgType } from "../../../types/etat"

export default defineCachedEventHandler(async (): Promise<{ types: OrgType[] }> => {
  const cms = getEtatCmsClient()

  try {
    console.log("[Etat API Types] Récupération des types d'organisations...")

    const types = await cms.request(readItems(
      "org_type",
      {
        fields: ["id", "code", "label", "ordre", "icon"],
        sort: ["ordre"],
        limit: -1, // Tous les types
      }
    ))

    console.log(`[Etat API Types] ${types.length} types récupérés`)

    return {
      types: types as OrgType[]
    }
  } catch (error: any) {
    console.error("[Etat API Types] ERREUR:", {
      message: error.message,
      errors: error.errors,
    })

    throw createError({
      statusCode: 500,
      message: "Impossible de récupérer les types d'organisations",
      data: { originalError: error.message },
    })
  }
}, {
  maxAge: 60 * 60, // Cache 1 heure
})
