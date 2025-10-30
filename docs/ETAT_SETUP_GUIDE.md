# Guide de Setup Automatisé - Module État

## 🎯 Objectif

Configurer automatiquement Directus avec toutes les collections nécessaires et migrer les données du décret 2024-940 en **une seule commande**.

## 📋 Prérequis

1. **Directus local installé et démarré**
   ```bash
   # Directus doit être accessible sur http://localhost:8055
   # Ou configurer ETAT_CMS_API_URL avec votre URL
   ```

2. **Token d'authentification Directus**
   - Connectez-vous à Directus
   - Allez dans Settings → Access Tokens
   - Créez un nouveau token avec les permissions **Admin**
   - Copiez le token généré

3. **Node.js et npm installés**

## 🚀 Installation en 3 Étapes

### Étape 1 : Configurer les Variables d'Environnement

Créez ou modifiez le fichier `.env` à la racine du projet :

```bash
# URL de votre instance Directus (sans trailing slash)
ETAT_CMS_API_URL=http://localhost:8055

# Token d'authentification Directus (Admin)
ETAT_CMS_API_KEY=votre_token_ici
```

### Étape 2 : Installer les Dépendances

```bash
npm install
```

### Étape 3 : Lancer le Setup Automatisé

```bash
npx tsx scripts/setup-etat-directus.ts
```

## 📊 Ce que le Script Fait

Le script exécute automatiquement les opérations suivantes :

### Phase 1 : Création des Collections (avec schémas complets)

1. **`org_type`** - Types d'organisations
   - Champs : id (UUID), code, label, ordre, icon
   - Utilisé pour classifier les entités (Ministère, Direction, etc.)

2. **`org_snapshot`** - Snapshots des décrets
   - Champs : id (UUID), numero, annee, date_publication, titre, status, est_actif, document_url
   - Représente un décret de répartition à un moment donné

3. **`public_entity`** - Entités canoniques
   - Champs : id (UUID), slug, nom_canonique, description, site_web, email, telephone, adresse
   - **Relation** : `org_type_id` → `org_type.id` (Many-to-One)
   - Entités qui persistent à travers le temps

4. **`org_unit`** - Occurrences dans un snapshot
   - Champs : id (UUID), intitule_officiel, ordre, notes
   - **Relations** :
     - `snapshot_id` → `org_snapshot.id` (Many-to-One)
     - `public_entity_id` → `public_entity.id` (Many-to-One)
     - `parent_id` → `org_unit.id` (Many-to-One, self-reference, nullable)
   - Représente l'état d'une entité dans un snapshot spécifique avec sa position hiérarchique

5. **`entity_alias`** - Alias de recherche
   - Champs : id (UUID), alias
   - **Relation** : `public_entity_id` → `public_entity.id` (Many-to-One)
   - Permet la recherche par acronymes (ex: MSAS, MEFP)

### Phase 2 : Migration des Données

1. **Insertion des 12 types d'organisations**
   - PRESIDENCE, PRIMATURE, MINISTERE, CABINET, SECRETARIAT, DIRECTION, SERVICE, EP, SN, AGENCE, POLE, AUTRE

2. **Création du snapshot 2024-940**
   - Décret n° 2024-940 du 05 avril 2024

3. **Importation de ~200-300 entités**
   - Parse le JSON hiérarchique du décret
   - Crée les entités canoniques (`public_entity`)
   - Crée les occurrences dans le snapshot (`org_unit`)
   - Établit toutes les relations parent-enfant

## ✅ Vérification du Setup

Après l'exécution du script, connectez-vous à Directus (`http://localhost:8055`) et vérifiez :

```
📋 org_type          → 12 entrées
📅 org_snapshot      → 1 entrée (2024-940)
🏛️ public_entity     → ~200-300 entrées
🔗 org_unit          → ~200-300 entrées (avec hiérarchie)
🏷️ entity_alias      → 0 entrées (à ajouter manuellement si besoin)
```

### Test des Relations

Dans Directus, ouvrez une entrée de `org_unit` et vérifiez que vous pouvez voir :
- Le **snapshot** auquel elle appartient
- L'**entité canonique** associée (`public_entity`)
- Le **parent** dans la hiérarchie (si applicable)
- Les **enfants** (affichés automatiquement par Directus)

## 🔑 Avantages des UUIDs Auto-Générés

### Question : "Avec les IDs UUID auto-générés, c'est facile avec les relations ?"

**Réponse : OUI, c'est beaucoup plus simple !** Voici pourquoi :

### 1. Génération Automatique
```typescript
// Directus génère automatiquement l'UUID à la création
const entity = await client.request("createItem", "public_entity", {
  slug: "ministere-sante",
  nom_canonique: "Ministère de la Santé",
  org_type_id: orgTypeId  // On référence simplement l'UUID généré précédemment
});

// L'UUID est automatiquement disponible
const entityId = entity.id;  // Ex: "a3c5e7f9-1234-5678-90ab-cdef12345678"
```

### 2. Relations Simplifiées
```typescript
// Pas besoin de gérer les clés primaires manuellement
const orgUnit = await client.request("createItem", "org_unit", {
  snapshot_id: snapshotId,        // UUID du snapshot
  public_entity_id: entityId,     // UUID de l'entité canonique
  parent_id: parentUnitId,        // UUID du parent (ou null pour racine)
  intitule_officiel: "Ministère de la Santé"
});
```

### 3. Self-Reference Facile
```typescript
// La self-reference (parent_id) fonctionne naturellement
const parentUnit = await client.request("createItem", "org_unit", {
  snapshot_id: snapshotId,
  public_entity_id: parentEntityId,
  parent_id: null,  // Racine de la hiérarchie
  intitule_officiel: "Présidence"
});

const childUnit = await client.request("createItem", "org_unit", {
  snapshot_id: snapshotId,
  public_entity_id: childEntityId,
  parent_id: parentUnit.id,  // ✅ Référence automatique
  intitule_officiel: "Cabinet du Président"
});
```

### 4. Pas de Conflits d'IDs
- Les UUIDs sont **globalement uniques**
- Pas de risque de collision entre environnements
- Facilite la **réplication** entre dev/staging/prod
- Permet de **migrer** facilement les données

### 5. Relations Many-to-One Naturelles
```typescript
// Directus gère automatiquement la relation inverse (One-to-Many)
// Si org_unit a une relation M2O vers public_entity
// Alors public_entity.org_units est automatiquement disponible

const entity = await client.request("readItem", "public_entity", entityId, {
  fields: [
    "id",
    "nom_canonique",
    "org_units.id",           // ✅ Relation inverse automatique
    "org_units.intitule_officiel"
  ]
});
```

## 🐛 Dépannage

### Erreur : "Collection already exists"
Le script détecte automatiquement les collections existantes et les réutilise. Pas d'action nécessaire.

### Erreur : "unique constraint"
Si vous relancez le script, il réutilisera les données existantes grâce aux caches internes.

### Erreur : "Authentication failed"
Vérifiez que votre `ETAT_CMS_API_KEY` est correct et que le token a les permissions **Admin**.

### Erreur : "Cannot connect to Directus"
Assurez-vous que Directus est démarré et accessible sur l'URL configurée.

## 🔄 Nettoyage (Recommencer à Zéro)

Si vous voulez supprimer toutes les collections et recommencer :

1. Allez dans Directus → Settings → Data Model
2. Supprimez les collections dans cet ordre :
   - `entity_alias`
   - `org_unit` (a des relations vers d'autres collections)
   - `public_entity`
   - `org_snapshot`
   - `org_type`
3. Relancez le script : `npx tsx scripts/setup-etat-directus.ts`

## 📚 Prochaines Étapes

Après le setup, vous pouvez :

1. **Tester les APIs**
   ```bash
   # Démarrer le serveur Nuxt
   npm run dev

   # Tester les endpoints
   curl http://localhost:3000/api/etat/snapshots
   curl http://localhost:3000/api/etat/arborescence
   curl http://localhost:3000/api/etat/liste
   ```

2. **Créer les composants Vue** (à venir)
   - `<EtatSnapshotSelector>`
   - `<EtatArborescence>`
   - `<EtatListe>`

3. **Intégrer dans la page** `/app/pages/etat/index.vue`

4. **Ajouter des alias** manuellement dans Directus pour améliorer la recherche

## 📖 Documentation Complète

- [ETAT_MODULE_README.md](./ETAT_MODULE_README.md) - Documentation complète du module
- [DIRECTUS_ETAT_SETUP.md](./DIRECTUS_ETAT_SETUP.md) - Guide de setup manuel (alternatif)
