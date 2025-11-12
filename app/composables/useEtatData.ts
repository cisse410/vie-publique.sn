// composables/useEtatDecrets.ts
export interface Decret {
  id: string
  numero: string
  date_publication: string
  status: string
  document_url?: string
  pr?: string
  pm?: string
  date_created: string
  date_updated: string
}

export interface Stats {
  ministeres: number
  directions: number
  services: number
  etablissements: number
  societes_nationales?: number
}

export interface EntityType {
  id?: string
  code: string
  label: string
  can_have_children?: boolean
}

export interface PublicEntity {
  id: string
  slug: string
  canonical_name: string
  entity_type_id: string
  entity_type?: EntityType
  has_public_page: boolean
  first_appearance?: string
  web_site?: string
  phone?: string
  email?: string
  reseaux_sociaux?: any
  children?: PublicEntity[]
  parent_snapshot_id?: string
  parent?: string
  ministre?: string
  directeur?: string
  supervised?: boolean
}

interface DecretResponse {
  success: boolean
  data: Decret | null
}

interface StatsResponse {
  success: boolean
  data: Stats
}

interface EntitiesResponse {
  success: boolean
  data: PublicEntity[]
}

/**
 * Composable pour récupérer les données de l'État
 */
export const useEtatData = () => {
  /**
   * Récupère le décret actuellement en vigueur
   */
  const fetchActiveDecret = async (): Promise<{ data: Decret | null; error: string | null }> => {
    try {
      const { data, error } = await useFetch<DecretResponse>('/api/etat/decrets')

      if (error.value) {
        console.error('Erreur fetch décret:', error.value)
        return { data: null, error: 'Erreur lors du chargement du décret' }
      }

      return { data: data.value?.data || null, error: null }
    } catch (error) {
      console.error('Erreur composable décret:', error)
      return { data: null, error: 'Erreur inattendue' }
    }
  }

  /**
   * Récupère les statistiques
   */
  const fetchStats = async (): Promise<{ data: Stats | null; error: string | null }> => {
    try {
      const { data, error } = await useFetch<StatsResponse>('/api/etat/statistiques')

      if (error.value) {
        console.error('Erreur fetch statistiques:', error.value)
        return { data: null, error: 'Erreur lors du chargement des statistiques' }
      }

      return { data: data.value?.data || null, error: null }
    } catch (error) {
      console.error('Erreur composable statistiques:', error)
      return { data: null, error: 'Erreur inattendue' }
    }
  }

  /**
   * Récupère toutes les entités publiques avec leur hiérarchie
   */
  const fetchPublicEntities = async (): Promise<{
    data: PublicEntity[] | null
    error: string | null
  }> => {
    try {
      const { data, error } = await useFetch<EntitiesResponse>('/api/etat/entities')

      if (error.value) {
        console.error('Erreur fetch entités:', error.value)
        return { data: null, error: 'Erreur lors du chargement des entités' }
      }

      return { data: data.value?.data || null, error: null }
    } catch (error) {
      console.error('Erreur composable entités:', error)
      return { data: null, error: 'Erreur inattendue' }
    }
  }

  /**
   * Récupère les entités aplaties pour la vue liste
   */
  const fetchFlattenedEntities = async (): Promise<{
    data: PublicEntity[] | null
    error: string | null
  }> => {
    try {
      const { data, error } = await useFetch<EntitiesResponse>('/api/etat/entities-flattened')

      if (error.value) {
        console.error('Erreur fetch entités aplaties:', error.value)
        return { data: null, error: 'Erreur lors du chargement des entités aplaties' }
      }

      return { data: data.value?.data || null, error: null }
    } catch (error) {
      console.error('Erreur composable entités aplaties:', error)
      return { data: null, error: 'Erreur inattendue' }
    }
  }

  return {
    fetchActiveDecret,
    fetchStats,
    fetchPublicEntities,
    fetchFlattenedEntities,
  }
}
