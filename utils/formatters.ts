/**
 * Formate une date au format français
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'long') {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Formate un numéro de décret
 */
export function formatDecreeNumber(numero: string): string {
  return `Décret n° ${numero}`
}

/**
 * Génère un slug à partir d'un texte
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '') // Supprimer les tirets en début et fin
}

/**
 * Tronque un texte avec des points de suspension
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Met en majuscule la première lettre
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Formate un label de changement pour l'affichage
 */
export function formatChangeType(changeType: string): string {
  const labels: Record<string, string> = {
    creation: 'Créé',
    modification: 'Modifié',
    suppression: 'Supprimé',
    transfert: 'Transféré',
    renommage: 'Renommé',
    new: 'Nouveau',
    modified: 'Modifié',
    removed: 'Supprimé',
    unchanged: 'Inchangé',
  }

  return labels[changeType] || changeType
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhone(phone: string): string {
  // Format sénégalais : +221 XX XXX XX XX
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('221')) {
    const number = cleaned.substring(3)
    return `+221 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7)}`
  }

  return phone
}

/**
 * Formate une URL pour l'affichage
 */
export function formatUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * Pluralise un mot selon un nombre
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count <= 1) return singular
  return plural || `${singular}s`
}
