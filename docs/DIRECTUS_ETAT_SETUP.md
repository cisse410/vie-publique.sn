# Configuration Directus - Module État

## Collections à créer dans Directus

### 1. Collection `org_type` (Types d'organisations)

**Champs :**
- `id` : UUID (Primary Key) - Auto-généré
- `code` : String (Required, Unique) - Ex: "MINISTERE", "DIRECTION"
- `label` : String (Required) - Ex: "Ministère", "Direction"
- `ordre` : Integer - Pour le tri
- `icon` : String - Emoji ou classe CSS

**Pas de relations**

---

### 2. Collection `org_snapshot` (Décrets de répartition)

**Champs :**
- `id` : UUID (Primary Key) - Auto-généré
- `numero` : String (Required) - Ex: "2024-940"
- `annee` : Integer (Required) - Ex: 2024
- `date_publication` : Date (Required)
- `titre` : Text (Required)
- `status` : Dropdown (Required) - Options: "draft", "published"
- `est_actif` : Boolean (Default: false)
- `document_url` : String - URL du JO
- `date_created` : Timestamp (Auto)
- `date_updated` : Timestamp (Auto)

**Relations :**
- `org_units` : One-to-Many → `org_unit.snapshot_id`

---

### 3. Collection `public_entity` (Entités canoniques permanentes)

**Champs :**
- `id` : UUID (Primary Key) - Auto-généré
- `slug` : String (Required, Unique) - Ex: "ministere-sante"
- `nom_canonique` : String (Required) - Ex: "Ministère de la Santé"
- `description` : Text
- `site_web` : String
- `email` : String
- `telephone` : String
- `adresse` : Text
- `date_created` : Timestamp (Auto)
- `date_updated` : Timestamp (Auto)

**Relations :**
- `org_type_id` : Many-to-One → `org_type.id` (Required)
- `org_units` : One-to-Many → `org_unit.public_entity_id`
- `entity_aliases` : One-to-Many → `entity_alias.public_entity_id`

---

### 4. Collection `org_unit` (Occurrences dans les snapshots)

**Champs :**
- `id` : UUID (Primary Key) - Auto-généré
- `intitule_officiel` : String (Required) - Nom exact dans le décret
- `ordre` : Integer - Ordre d'affichage
- `notes` : Text
- `date_created` : Timestamp (Auto)
- `date_updated` : Timestamp (Auto)

**Relations :**
- `snapshot_id` : Many-to-One → `org_snapshot.id` (Required)
- `public_entity_id` : Many-to-One → `public_entity.id` (Required)
- `parent_id` : Many-to-One → `org_unit.id` (Self-reference, Nullable)
- `children` : One-to-Many → `org_unit.parent_id`

---

### 5. Collection `entity_alias` (Alias de recherche)

**Champs :**
- `id` : UUID (Primary Key) - Auto-généré
- `alias` : String (Required) - Ex: "MSAS", "Min Santé"
- `date_created` : Timestamp (Auto)

**Relations :**
- `public_entity_id` : Many-to-One → `public_entity.id` (Required)

---

## Configuration des relations dans Directus UI

### Relation 1 : `org_type` ← `public_entity`

1. Dans `public_entity`, créer un champ **"Type d'organisation"**
   - Type : **Many-to-One**
   - Related Collection : `org_type`
   - Field : `org_type_id`

### Relation 2 : `org_snapshot` ← `org_unit`

1. Dans `org_unit`, créer un champ **"Snapshot (Décret)"**
   - Type : **Many-to-One**
   - Related Collection : `org_snapshot`
   - Field : `snapshot_id`

### Relation 3 : `public_entity` ← `org_unit`

1. Dans `org_unit`, créer un champ **"Entité canonique"**
   - Type : **Many-to-One**
   - Related Collection : `public_entity`
   - Field : `public_entity_id`

### Relation 4 : `org_unit` (parent) ← `org_unit` (children)

1. Dans `org_unit`, créer un champ **"Parent"**
   - Type : **Many-to-One**
   - Related Collection : `org_unit` (self-reference)
   - Field : `parent_id`
   - Nullable : **true**

### Relation 5 : `public_entity` ← `entity_alias`

1. Dans `entity_alias`, créer un champ **"Entité"**
   - Type : **Many-to-One**
   - Related Collection : `public_entity`
   - Field : `public_entity_id`

---

## Données de test initiales

### org_type

```json
[
  { "code": "PRESIDENCE", "label": "Présidence", "ordre": 1, "icon": "🏛️" },
  { "code": "PRIMATURE", "label": "Primature", "ordre": 2, "icon": "🏛️" },
  { "code": "MINISTERE", "label": "Ministère", "ordre": 3, "icon": "🏛️" },
  { "code": "DIRECTION", "label": "Direction", "ordre": 4, "icon": "🧭" },
  { "code": "SERVICE", "label": "Service", "ordre": 5, "icon": "📋" },
  { "code": "EP", "label": "Établissement Public", "ordre": 6, "icon": "🏢" },
  { "code": "SN", "label": "Société Nationale", "ordre": 7, "icon": "🏭" },
  { "code": "AGENCE", "label": "Agence", "ordre": 8, "icon": "🏢" }
]
```

### org_snapshot

```json
{
  "numero": "2024-940",
  "annee": 2024,
  "date_publication": "2024-04-05",
  "titre": "Décret n° 2024-940 portant répartition des services de l'État et du contrôle des établissements publics...",
  "status": "published",
  "est_actif": true,
  "document_url": "https://primature.sn/publications/lois-et-reglements/decret-ndeg-2024-940-portant-repartition-des-services-de-letat-et"
}
```

---

## Commandes SQL pour vérifier les relations (optionnel)

```sql
-- Vérifier la structure
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Vérifier les foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## Prochaines étapes après configuration

1. ✅ Créer les 5 collections dans Directus
2. ✅ Configurer toutes les relations
3. ✅ Ajouter les types d'organisations
4. ✅ Créer le snapshot 2024-940
5. 🔄 Lancer le script de migration pour importer le JSON
