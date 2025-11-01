/**
 * Types pour le module État (organisation de l'État du Sénégal)
 * Basé sur les collections Directus
 */

/**
 * Type d'organisation (Ministère, Direction, EP, SN, etc.)
 */
export interface OrgType {
  id: string;
  code: string; // "MINISTERE", "DIRECTION", "EP", etc.
  label: string; // "Ministère", "Direction", etc.
  ordre: number;
  icon?: string; // Emoji ou classe CSS
}

/**
 * Snapshot = Décret de répartition (ex: 2024-940, 2025-1431)
 */
export interface OrgSnapshot {
  id: string;
  numero: string; // "2024-940"
  annee: number; // 2024
  date_publication: string; // ISO date
  titre: string;
  status: "draft" | "published";
  est_actif: boolean;
  document_url?: string;
  date_created?: string;
  date_updated?: string;

  // Relations
  org_units?: OrgUnit[];
}

/**
 * Entité canonique permanente (ex: "Ministère de la Santé")
 * Persiste à travers les différents snapshots
 */
export interface PublicEntity {
  id: string;
  slug: string; // "ministere-sante" (pour SEO)
  nom_canonique: string; // "Ministère de la Santé"
  org_type_id: string;
  description?: string;
  site_web?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  date_created?: string;
  date_updated?: string;

  // Relations
  org_type?: OrgType;
  org_units?: OrgUnit[];
  entity_aliases?: EntityAlias[];
}

/**
 * Occurrence d'une entité dans un snapshot spécifique
 * Ex: dans le décret 2024, l'entité s'appelait "Min. Santé et Action Sociale"
 */
export interface OrgUnit {
  id: string;
  snapshot_id: string;
  public_entity_id: string;
  parent_id?: string | null;
  intitule_officiel: string; // Nom exact dans le décret
  ordre: number;
  notes?: string;
  date_created?: string;
  date_updated?: string;

  // Relations
  snapshot?: OrgSnapshot;
  public_entity?: PublicEntity;
  parent?: OrgUnit;
  children?: OrgUnit[];
}

/**
 * Alias de recherche pour une entité
 * Ex: "MSAS", "Min Santé" pour "Ministère de la Santé"
 */
export interface EntityAlias {
  id: string;
  public_entity_id: string;
  alias: string;
  date_created?: string;

  // Relations
  public_entity?: PublicEntity;
}

/**
 * Types de changements détectables entre snapshots
 */
export type ChangeType =
  | "Nouveau"        // Nouvelle entité qui n'existait pas avant
  | "Supprimé"       // Entité qui existait avant mais n'existe plus
  | "Renommé"        // Même entité, même parent, mais nom différent
  | "Transféré"      // Même entité, même nom, mais parent différent
  | "Renommé + Transféré"  // Même entité, nom ET parent différents
  | "Inchangé"       // Aucun changement
  | null;

/**
 * Détails du changement pour affichage
 */
export interface ChangeDetails {
  type: ChangeType;
  previousName?: string;      // Nom dans le snapshot précédent
  previousParent?: string;    // ID du parent précédent
  previousParentName?: string; // Nom du parent précédent
  description?: string;        // Description textuelle du changement
}

/**
 * Types pour les réponses API
 */

export interface OrgUnitWithComparison extends OrgUnit {
  badge?: ChangeType;
  changeDetails?: ChangeDetails;
}

export interface ArborescenceResponse {
  snapshot: OrgSnapshot;
  tree: OrgUnitWithComparison[];
  previousSnapshot?: OrgSnapshot;
  deletedUnits?: OrgUnitWithComparison[];  // Entités supprimées dans ce snapshot
  stats?: {
    total: number;
    nouveaux: number;
    renommes: number;
    transferes: number;
    supprimes: number;
    inchanges: number;
  };
}

export interface ListeResponse {
  entities: (PublicEntity & {
    current_unit?: OrgUnit;
    parent_name?: string;
    parents?: string[]; // Chemin complet des parents
    badge?: ChangeType;
    changeDetails?: ChangeDetails;
  })[];
  total: number;
  page: number;
  pageSize: number;
  snapshot: OrgSnapshot;
  previousSnapshot?: OrgSnapshot;
}

export interface SnapshotsListResponse {
  snapshots: OrgSnapshot[];
  active?: OrgSnapshot;
}

export interface TypesResponse {
  types: OrgType[];
}

/**
 * Types pour les query params
 */
export interface EtatQueryParams {
  snapshot?: string; // ID du snapshot
  view?: "arborescence" | "liste";
  search?: string;
  type?: string; // ID du org_type
  page?: string;
}
