/**
 * Helpers pour le module État
 */

/**
 * Types d'entités qui ont une page de détail complète avec tabs
 * (Présidence, Primature, Ministères)
 */
export const TYPES_WITH_FULL_DETAIL = ['PRESIDENCE', 'PRIMATURE', 'MINISTERE'] as const

/**
 * Types d'entités qui ont une page de détail simplifiée (sans tabs)
 * (Pôles, Agences)
 */
export const TYPES_WITH_SIMPLE_DETAIL = ['POLE', 'AGENCE'] as const

/**
 * Types d'entités sans page de détail (non cliquables)
 */
export const TYPES_WITHOUT_DETAIL = [
  'CABINET',
  'SECRETARIAT',
  'DIRECTION',
  'SERVICE',
  'EP',
  'SN',
  'AUTRE'
] as const

/**
 * Vérifie si une entité a une page de détail (cliquable)
 */
export function hasDetailPage(typeCode?: string): boolean {
  if (!typeCode) return false
  return [
    ...TYPES_WITH_FULL_DETAIL,
    ...TYPES_WITH_SIMPLE_DETAIL
  ].includes(typeCode as any)
}

/**
 * Vérifie si une entité a une page de détail complète avec tabs
 */
export function hasFullDetailPage(typeCode?: string): boolean {
  if (!typeCode) return false
  return TYPES_WITH_FULL_DETAIL.includes(typeCode as any)
}

/**
 * Vérifie si une entité a une page de détail simplifiée
 */
export function hasSimpleDetailPage(typeCode?: string): boolean {
  if (!typeCode) return false
  return TYPES_WITH_SIMPLE_DETAIL.includes(typeCode as any)
}

/**
 * Grouper les entités enfants par type pour les tabs
 * Retourne: { cabinet: [], secretariats: [], directions: [], autres: [] }
 */
export function groupChildrenByType(children: any[]) {
  return {
    cabinet: children.filter(c => c.public_entity?.org_type?.code === 'CABINET'),
    secretariats: children.filter(c => c.public_entity?.org_type?.code === 'SECRETARIAT'),
    directions: children.filter(c => c.public_entity?.org_type?.code === 'DIRECTION'),
    autres: children.filter(c => {
      const code = c.public_entity?.org_type?.code
      return code && !['CABINET', 'SECRETARIAT', 'DIRECTION'].includes(code)
    })
  }
}
