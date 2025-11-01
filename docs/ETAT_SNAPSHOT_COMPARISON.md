# Système de Comparaison de Snapshots - Organisation de l'État

## Vue d'ensemble

Le système de comparaison de snapshots détecte automatiquement les changements entre deux décrets de répartition des services de l'État. Il identifie 6 types de changements distincts.

## Types de changements détectés

### 1. **Nouveau** (Badge vert)
Une entité qui n'existait pas dans le décret précédent.

**Exemple** : Création d'une nouvelle direction ou d'un nouvel établissement public.

### 2. **Renommé** (Badge bleu)
Une entité qui conserve le même parent mais change de nom officiel.

**Exemple** :
- Avant : "Ministère de la Santé"
- Après : "Ministère de la Santé et de l'Action Sociale"

### 3. **Transféré** (Badge violet)
Une entité qui conserve le même nom mais change de rattachement hiérarchique.

**Exemple** :
- Avant : Direction rattachée au Ministère A
- Après : Même direction rattachée au Ministère B

### 4. **Renommé + Transféré** (Badge orange)
Une entité qui change à la fois de nom ET de rattachement.

**Exemple** :
- Avant : "Direction des Technologies" rattachée au Ministère A
- Après : "Direction du Numérique" rattachée au Ministère B

### 5. **Supprimé** (Badge rouge)
Une entité qui existait dans le décret précédent mais n'apparaît plus.

**Exemple** : Suppression d'une direction suite à une réorganisation.

### 6. **Inchangé** (Badge gris)
Une entité qui conserve exactement le même nom et le même rattachement.

## Architecture technique

### Fichiers principaux

#### `/server/utils/snapshot-comparison.ts`
Fonctions utilitaires pour la détection des changements :

- `detectChange()` : Analyse un changement individuel
- `compareSnapshots()` : Compare deux listes d'unités organisationnelles
- `findDeletedUnits()` : Trouve les entités supprimées

#### `/types/etat.ts`
Définitions TypeScript :

```typescript
export type ChangeType =
  | "Nouveau"
  | "Supprimé"
  | "Renommé"
  | "Transféré"
  | "Renommé + Transféré"
  | "Inchangé"
  | null;

export interface ChangeDetails {
  type: ChangeType;
  previousName?: string;
  previousParent?: string;
  previousParentName?: string;
  description?: string;
}
```

### APIs modifiées

#### `/server/api/etat/arborescence.get.ts`
- Retourne les statistiques de changements
- Inclut la liste des entités supprimées
- Ajoute les badges et détails de changement à chaque nœud

#### `/server/api/etat/liste.get.ts`
- Ajoute les badges de changement à chaque entité
- Inclut les détails de changement pour affichage

### Composants UI

#### `<EtatStats>`
Affiche un résumé visuel des changements par rapport au décret précédent.

#### `<EtatDeletedUnits>`
Composant collapsible affichant la liste des entités supprimées.

#### `<TreeNodeEtat>` et `<EtatListe>`
Affichent les badges de changement avec tooltips explicatifs.

## Logique de détection

### Algorithme

1. **Identification de l'entité** : Basé sur `public_entity_id` (identifiant canonique)

2. **Comparaison** :
   ```
   - Si public_entity_id absent du snapshot précédent → Nouveau
   - Si public_entity_id absent du snapshot actuel → Supprimé
   - Sinon :
     - Si nom différent ET parent différent → Renommé + Transféré
     - Si nom différent seulement → Renommé
     - Si parent différent seulement → Transféré
     - Sinon → Inchangé
   ```

3. **Génération des détails** : Création d'une description textuelle pour chaque changement

## Utilisation

### Dans le code

```typescript
// Les fonctions sont auto-importées
const unitsWithChanges = compareSnapshots(currentUnits, previousUnits);

// Chaque unité contient maintenant :
{
  ...unit,
  badge: "Renommé",
  changeDetails: {
    type: "Renommé",
    previousName: "Ancien nom",
    description: "Renommé de \"Ancien nom\""
  }
}
```

### Dans les composants

```vue
<UTooltip :text="node.changeDetails?.description">
  <UBadge :color="getBadgeColor(node.badge)">
    {{ node.badge }}
  </UBadge>
</UTooltip>
```

## Statistiques

L'API `/api/etat/arborescence` retourne des statistiques détaillées :

```json
{
  "stats": {
    "total": 150,
    "nouveaux": 12,
    "renommes": 8,
    "transferes": 5,
    "supprimes": 3,
    "inchanges": 122
  }
}
```

Ces statistiques sont affichées dans le composant `<EtatStats>`.

## Exemples concrets

### Cas d'usage 1 : Restructuration ministérielle

Décret 2024-940 → Décret 2025-1431

**Changements détectés** :
- 3 ministères renommés
- 15 directions transférées vers de nouveaux ministères
- 5 nouvelles agences créées
- 2 établissements publics supprimés

### Cas d'usage 2 : Fusion de structures

**Avant** :
- Direction A (Ministère X)
- Direction B (Ministère X)

**Après** :
- Direction Unifiée A+B (Ministère X) → Badge "Nouveau"
- Direction A → Badge "Supprimé"
- Direction B → Badge "Supprimé"

## Performance

- **Cache API** : 10 minutes pour `/api/etat/arborescence`
- **Complexité** : O(n) où n = nombre d'unités organisationnelles
- **Optimisation** : Utilisation de Maps pour accès O(1)

## Tests recommandés

1. Comparer deux snapshots avec des entités renommées
2. Vérifier la détection des transferts hiérarchiques
3. Tester avec des entités supprimées
4. Valider les descriptions générées
5. Vérifier les statistiques calculées

## Évolutions futures possibles

- [ ] Détecter les fusions d'entités
- [ ] Détecter les scissions d'entités
- [ ] Historique complet des changements sur plusieurs décrets
- [ ] Export des changements en CSV/Excel
- [ ] Notifications automatiques des changements majeurs
- [ ] Comparaison de deux snapshots arbitraires (pas seulement le précédent)
