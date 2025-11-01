/**
 * Utilitaires pour comparer deux snapshots et détecter les changements
 */

import type { ChangeType, ChangeDetails } from "../../types/etat";

interface OrgUnitBasic {
  id: string;
  public_entity_id: string;
  parent_id?: string | null;
  intitule_officiel: string;
}

/**
 * Compare deux unités organisationnelles et détermine le type de changement
 */
export function detectChange(
  currentUnit: OrgUnitBasic | undefined,
  previousUnit: OrgUnitBasic | undefined,
  previousUnitsMap: Map<string, OrgUnitBasic>
): { badge: ChangeType; changeDetails?: ChangeDetails } {
  // Cas 1: Nouvelle entité
  if (currentUnit && !previousUnit) {
    return {
      badge: "Nouveau",
      changeDetails: {
        type: "Nouveau",
        description: "Cette entité a été créée dans ce décret",
      },
    };
  }

  // Cas 2: Entité supprimée
  if (!currentUnit && previousUnit) {
    return {
      badge: "Supprimé",
      changeDetails: {
        type: "Supprimé",
        description: "Cette entité n'existe plus dans ce décret",
        previousName: previousUnit.intitule_officiel,
      },
    };
  }

  // Cas 3: Les deux existent, vérifier les changements
  if (currentUnit && previousUnit) {
    const nameChanged = currentUnit.intitule_officiel !== previousUnit.intitule_officiel;
    const parentChanged = currentUnit.parent_id !== previousUnit.parent_id;

    // Cas 3a: Renommé + Transféré
    if (nameChanged && parentChanged) {
      const previousParentName = previousUnit.parent_id
        ? previousUnitsMap.get(previousUnit.parent_id)?.intitule_officiel
        : undefined;

      return {
        badge: "Renommé + Transféré",
        changeDetails: {
          type: "Renommé + Transféré",
          previousName: previousUnit.intitule_officiel,
          previousParent: previousUnit.parent_id || undefined,
          previousParentName,
          description: `Renommé de "${previousUnit.intitule_officiel}" et transféré${previousParentName ? ` depuis "${previousParentName}"` : ""}`,
        },
      };
    }

    // Cas 3b: Seulement renommé
    if (nameChanged && !parentChanged) {
      return {
        badge: "Renommé",
        changeDetails: {
          type: "Renommé",
          previousName: previousUnit.intitule_officiel,
          description: `Renommé de "${previousUnit.intitule_officiel}"`,
        },
      };
    }

    // Cas 3c: Seulement transféré
    if (!nameChanged && parentChanged) {
      const previousParentName = previousUnit.parent_id
        ? previousUnitsMap.get(previousUnit.parent_id)?.intitule_officiel
        : undefined;

      const currentParentName = currentUnit.parent_id
        ? previousUnitsMap.get(currentUnit.parent_id)?.intitule_officiel
        : undefined;

      return {
        badge: "Transféré",
        changeDetails: {
          type: "Transféré",
          previousParent: previousUnit.parent_id || undefined,
          previousParentName,
          description: previousParentName
            ? `Transféré depuis "${previousParentName}"`
            : "Transféré vers une nouvelle structure",
        },
      };
    }

    // Cas 3d: Aucun changement
    return {
      badge: "Inchangé",
      changeDetails: {
        type: "Inchangé",
        description: "Aucun changement",
      },
    };
  }

  // Cas par défaut (ne devrait pas arriver)
  return {
    badge: null,
  };
}

/**
 * Compare deux listes d'unités organisationnelles
 * Retourne les unités actuelles avec leurs badges de changement
 */
export function compareSnapshots(
  currentUnits: OrgUnitBasic[],
  previousUnits: OrgUnitBasic[]
): Array<OrgUnitBasic & { badge: ChangeType; changeDetails?: ChangeDetails }> {
  // Créer des maps pour accès rapide
  const previousUnitsMap = new Map<string, OrgUnitBasic>();
  const previousByEntityId = new Map<string, OrgUnitBasic>();

  previousUnits.forEach((unit) => {
    previousUnitsMap.set(unit.id, unit);
    previousByEntityId.set(unit.public_entity_id, unit);
  });

  // Comparer les unités actuelles
  const unitsWithChanges = currentUnits.map((currentUnit) => {
    const previousUnit = previousByEntityId.get(currentUnit.public_entity_id);
    const { badge, changeDetails } = detectChange(
      currentUnit,
      previousUnit,
      previousUnitsMap
    );

    return {
      ...currentUnit,
      badge,
      changeDetails,
    };
  });

  return unitsWithChanges;
}

/**
 * Trouve les entités supprimées (présentes dans previous mais pas dans current)
 */
export function findDeletedUnits(
  currentUnits: OrgUnitBasic[],
  previousUnits: OrgUnitBasic[]
): Array<OrgUnitBasic & { badge: ChangeType; changeDetails?: ChangeDetails }> {
  const currentEntityIds = new Set(currentUnits.map((u) => u.public_entity_id));
  const previousUnitsMap = new Map(previousUnits.map((u) => [u.id, u]));

  const deletedUnits = previousUnits
    .filter((prevUnit) => !currentEntityIds.has(prevUnit.public_entity_id))
    .map((prevUnit) => {
      const { badge, changeDetails } = detectChange(
        undefined,
        prevUnit,
        previousUnitsMap
      );

      return {
        ...prevUnit,
        badge,
        changeDetails,
      };
    });

  return deletedUnits;
}
