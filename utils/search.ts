import type { TreeNode } from '~~/types/etat'

/**
 * Normalise une chaîne pour la recherche (supprime accents, met en minuscules)
 */
export function normalizeSearchString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Vérifie si une chaîne contient une autre (insensible à la casse et aux accents)
 */
export function containsIgnoreCase(text: string, search: string): boolean {
  return normalizeSearchString(text).includes(normalizeSearchString(search))
}

/**
 * Filtre les nœuds d'un arbre selon une requête de recherche
 */
export function searchInTree(
  nodes: TreeNode[],
  query: string,
  searchFields: string[] = ['official_label', 'canonical_name'],
): TreeNode[] {
  if (!query || query.trim() === '') {
    return nodes
  }

  const normalizedQuery = normalizeSearchString(query)
  const results: TreeNode[] = []

  const searchNode = (node: TreeNode): boolean => {
    // Vérifier si le nœud correspond à la recherche
    const matchesSearch = searchFields.some((field) => {
      let value = ''

      if (field === 'official_label') {
        value = node.snapshot.official_label
      } else if (field === 'canonical_name') {
        value = node.entity.canonical_name
      } else if (field === 'type') {
        value = node.type.label
      }

      return containsIgnoreCase(value, query)
    })

    // Rechercher récursivement dans les enfants
    const matchingChildren = node.children
      .map((child) => {
        const childMatches = searchNode(child)
        return childMatches ? child : null
      })
      .filter(Boolean) as TreeNode[]

    // Si le nœud ou un de ses enfants correspond, l'inclure
    if (matchesSearch || matchingChildren.length > 0) {
      results.push({
        ...node,
        children: matchingChildren,
      })
      return true
    }

    return false
  }

  nodes.forEach((node) => searchNode(node))
  return results
}

/**
 * Surligne les occurrences d'une recherche dans un texte
 */
export function highlightSearchTerm(text: string, search: string): string {
  if (!search || search.trim() === '') {
    return text
  }

  const regex = new RegExp(`(${search})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

/**
 * Calcule un score de pertinence pour un nœud par rapport à une requête
 */
export function calculateRelevanceScore(node: TreeNode, query: string): number {
  const normalizedQuery = normalizeSearchString(query)
  let score = 0

  // Correspondance exacte dans le label officiel
  if (normalizeSearchString(node.snapshot.official_label) === normalizedQuery) {
    score += 100
  }

  // Correspondance exacte dans le nom canonique
  if (normalizeSearchString(node.entity.canonical_name) === normalizedQuery) {
    score += 100
  }

  // Correspondance au début du label
  if (normalizeSearchString(node.snapshot.official_label).startsWith(normalizedQuery)) {
    score += 50
  }

  // Correspondance au début du nom canonique
  if (normalizeSearchString(node.entity.canonical_name).startsWith(normalizedQuery)) {
    score += 50
  }

  // Correspondance partielle dans le label
  if (containsIgnoreCase(node.snapshot.official_label, query)) {
    score += 20
  }

  // Correspondance partielle dans le nom canonique
  if (containsIgnoreCase(node.entity.canonical_name, query)) {
    score += 20
  }

  // Correspondance dans le type
  if (containsIgnoreCase(node.type.label, query)) {
    score += 10
  }

  return score
}

/**
 * Trie les nœuds par pertinence par rapport à une requête
 */
export function sortByRelevance(nodes: TreeNode[], query: string): TreeNode[] {
  return [...nodes].sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, query)
    const scoreB = calculateRelevanceScore(b, query)
    return scoreB - scoreA
  })
}
