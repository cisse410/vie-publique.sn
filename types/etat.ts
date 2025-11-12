/**
 * Type pour les décrets de répartition des services de l'État
 */
export interface Decree {
  id: string // UUID
  numero: string
  date_publication: string
  status: 'active' | 'archived'
  document_url?: string
  pr?: string // Président de la République
  pm?: string // Premier Ministre
  date_created: string
  date_updated: string
}

export type DecreeStatus = 'active' | 'archived'


/**
 * Types d'entités publiques
 */
export interface EntityType {
  id: string // UUID
  code: string
  label: string
  can_have_children: boolean
  date_created: string
  date_updated: string
}

/**
 * Entité publique (structure administrative)
 */
export interface PublicEntity {
  id: string // UUID
  slug: string
  canonical_name: string
  entity_type_id: string | EntityType
  has_public_page: boolean
  first_appearance: string
  web_site?: string
  phone?: string
  email?: string
  reseaux_sociaux?: Record<string, string>
  date_created: string
  date_updated: string
}

/**
 * Type enrichi avec les relations
 */
export interface PublicEntityWithRelations extends PublicEntity {
  entity_type_id: EntityType
  current_snapshot?: EntitySnapshot
}

/**
 * Codes des types d'entités
 */
export type EntityTypeCode =
  | 'presidence'
  | 'primature'
  | 'ministere'
  | 'secretariat_etat'
  | 'cabinet'
  | 'direction_generale'
  | 'direction'
  | 'service'
  | 'cellule'
  | 'bureau'
  | 'inspection'
  | 'agence'
  | 'etablissement_public'
  | 'societe_nationale'
  | 'societe_participation'
  | 'autorite'
  | 'commission'
  | 'comite'
  | 'conseil'
  | 'delegation'
  | 'centre'
  | 'ecole'
  | 'institut'
  | 'office'
  | 'fonds'
  | 'autre'

/**
 * Types de changement entre deux snapshots
 */
export type ChangeType = 'new' | 'modified' | 'removed' | 'transferred' | 'renamed'

/**
 * Snapshot d'une entité à un moment donné (dans un décret)
 */
export interface EntitySnapshot {
  id: string // UUID
  public_entity_id: string | PublicEntity
  decree_id: string | Decree
  parent_snapshot_id?: string | EntitySnapshot | null
  official_label: string
  change_type?: ChangeType
  change_notes?: string
  date_created: string
  date_updated: string
}

/**
 * Snapshot enrichi avec relations
 */
export interface EntitySnapshotWithRelations extends EntitySnapshot {
  public_entity_id: PublicEntity
  decree_id: Decree
  parent_snapshot_id?: EntitySnapshot | null
  children?: EntitySnapshotWithRelations[]
}

/**
 * Résultat de comparaison entre deux snapshots
 */
export interface SnapshotComparison {
  entity_id: string // UUID
  change: 'new' | 'modified' | 'removed' | 'unchanged'
  changes_detail?: {
    label_changed?: boolean
    parent_changed?: boolean
    old_label?: string
    new_label?: string
    old_parent?: string
    new_parent?: string
  }
}

/**
 * Nœud de l'arborescence
 */
export interface TreeNode {
  snapshot: EntitySnapshotWithRelations
  entity: PublicEntity
  type: EntityType
  children: TreeNode[]
  level: number
  isNew?: boolean
  isModified?: boolean
  isRemoved?: boolean
  path?: string[] // Chemin depuis la racine (slugs)
}

/**
 * Options de construction de l'arbre
 */
export interface TreeBuildOptions {
  maxDepth?: number
  includeRemoved?: boolean
  sortBy?: 'alphabetical' | 'type' | 'order'
}

/**
 * Filtre pour l'arbre
 */
export interface TreeFilter {
  searchQuery?: string
  entityTypes?: string[]
  showOnlyChanges?: boolean
}

/**
 * Types utilitaires
 */
export interface PaginationParams {
  page: number
  perPage: number
  total: number
}

export interface FilterState {
  searchQuery: string
  selectedTypes: string[]
  selectedDecree: string | null // UUID
}

export interface ViewState {
  mode: 'tree' | 'list'
  expandedNodes: Set<string> // UUID
}
