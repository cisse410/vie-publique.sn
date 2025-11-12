import type { Decree } from '~~/types/etat'

/**
 * Composable pour gérer les décrets
 * Utilise $fetch pour appeler les API routes serveur
 */
export const useDecrees = () => {
  // State avec préfixe pour éviter les conflits
  const decrees = useState<Decree[]>('etat:decrees', () => [])
  const activeDecree = useState<Decree | null>('etat:activeDecree', () => null)
  const selectedDecree = useState<Decree | null>('etat:selectedDecree', () => null)
  const loading = useState<boolean>('etat:decreesLoading', () => false)

  /**
   * Charger tous les décrets
   */
  const fetchDecrees = async () => {
    if (decrees.value.length > 0) return // Déjà chargé

    loading.value = true
    try {
      const [allDecrees, active] = await Promise.all([
        $fetch<Decree[]>('/api/annuaire-etat/decrees'),
        $fetch<Decree>('/api/annuaire-etat/decrees/active').catch(() => null)
      ])

      decrees.value = allDecrees
      activeDecree.value = active
      selectedDecree.value = active
    } catch (error) {
      console.error('Error fetching decrees:', error)
      decrees.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Sélectionner un décret
   */
  const selectDecree = (decree: Decree) => {
    selectedDecree.value = decree
  }

  /**
   * Récupérer un décret par son numéro
   */
  const getDecreeByNumero = async (numero: string): Promise<Decree | null> => {
    // Chercher dans le cache
    const cached = decrees.value.find(d => d.numero === numero)
    if (cached) return cached

    // Sinon charger depuis l'API
    try {
      return await $fetch<Decree>(`/api/annuaire-etat/decrees/${numero}`)
    } catch {
      return null
    }
  }

  /**
   * Obtenir le décret précédent
   */
  const getPreviousDecree = (currentDecree: Decree): Decree | null => {
    const index = decrees.value.findIndex(d => d.id === currentDecree.id)
    return index < decrees.value.length - 1 ? decrees.value[index + 1] : null
  }

  /**
   * Obtenir le décret suivant
   */
  const getNextDecree = (currentDecree: Decree): Decree | null => {
    const index = decrees.value.findIndex(d => d.id === currentDecree.id)
    return index > 0 ? decrees.value[index - 1] : null
  }

  return {
    decrees: decrees,
    activeDecree: activeDecree,
    selectedDecree,
    loading: loading,
    fetchDecrees,
    selectDecree,
    getDecreeByNumero,
    getPreviousDecree,
    getNextDecree
  }
}
