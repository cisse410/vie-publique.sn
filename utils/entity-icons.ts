
/**
 * Mapping des codes de types d'entités vers des icônes emoji
 */
export const ENTITY_TYPE_ICONS: Record<string, string> = {
  // Niveaux supérieurs
  'presidence': '🏛️',
  'primature': '🏛️',
  'ministere': '🏛️',
  'secretariat_etat': '🏢',

  // Services administratifs
  'cabinet': '📋',
  'direction_generale': '🧭',
  'direction': '🧭',
  'service': '📁',
  'cellule': '📌',
  'bureau': '📄',
  'division': '📂',

  // Contrôle et inspection
  'inspection': '🔍',
  'controle': '✓',

  // Organismes
  'agence': '🏢',
  'etablissement_public': '🏫',
  'societe_nationale': '🏭',
  'societe_participation': '🏭',
  'autorite': '⚖️',
  'commission': '👥',
  'comite': '🤝',
  'conseil': '💼',
  'delegation': '📍',
  'observatoire': '🔭',
  'haut_conseil': '⚡',

  // Éducation et formation
  'centre': '🎯',
  'ecole': '🎓',
  'institut': '🏛️',
  'universite': '🎓',
  'centre_formation': '📚',

  // Autres
  'office': '🏢',
  'fonds': '💰',
  'fondation': '🏛️',
  'secretariat': '📝',
  'unite': '⚙️',
  'projet': '🚀',
  'programme': '📊',
  'autre': '📍'
}

/**
 * Obtient l'icône pour un type d'entité
 */
export function getEntityIcon(typeCode: string): string {
  return ENTITY_TYPE_ICONS[typeCode] || '📍'
}

/**
 * Mapping des types d'entités vers des couleurs Tailwind
 */
export const ENTITY_TYPE_COLORS: Record<string, string> = {
  'presidence': 'blue',
  'primature': 'blue',
  'ministere': 'blue',
  'secretariat_etat': 'indigo',
  'direction_generale': 'purple',
  'direction': 'violet',
  'agence': 'pink',
  'etablissement_public': 'rose',
  'societe_nationale': 'red',
  'societe_participation': 'orange',
  'autorite': 'amber',
  'commission': 'yellow',
  'comite': 'lime',
  'conseil': 'green',
  'centre': 'emerald',
  'ecole': 'teal',
  'institut': 'cyan',
  'office': 'sky',
  'fonds': 'indigo',
  'autre': 'gray'
}

/**
 * Obtient la couleur pour un type d'entité
 */
export function getEntityColor(typeCode: string): string {
  return ENTITY_TYPE_COLORS[typeCode] || 'gray'
}

/**
 * Obtient les classes Tailwind pour un badge de type
 */
export function getEntityBadgeClasses(typeCode: string, variant: 'solid' | 'outline' = 'solid'): string {
  const color = getEntityColor(typeCode)

  if (variant === 'outline') {
    return `border-${color}-500 text-${color}-700 bg-${color}-50`
  }

  return `bg-${color}-500 text-white`
}
