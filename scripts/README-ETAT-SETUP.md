# Setup du Module État - Instructions Rapides

## 🎯 Script JavaScript Automatisé

Ce script crée automatiquement toutes les collections Directus et migre les données du décret 2024-940.

## 📋 Prérequis

1. **Directus local démarré** sur `http://localhost:8055` (ou votre URL configurée)
2. **Token d'authentification Directus Admin**
3. **Node.js installé**

## 🚀 Installation en 3 Étapes

### Étape 1 : Obtenir le Token Directus

1. Ouvrez Directus dans votre navigateur : `http://localhost:8055`
2. Connectez-vous avec vos identifiants Admin
3. Allez dans **Settings → Access Tokens**
4. Cliquez sur **Create Token**
5. Donnez un nom (ex: "Etat Module Setup")
6. Sélectionnez les permissions **Admin** ou **All Access**
7. Copiez le token généré (vous ne pourrez plus le voir après)

### Étape 2 : Configurer les Variables d'Environnement

Créez ou modifiez le fichier `.env` à la racine du projet :

```bash
# URL de votre Directus (sans trailing slash)
ETAT_CMS_API_URL=http://localhost:8055

# Token d'authentification (celui que vous venez de créer)
ETAT_CMS_API_KEY=votre_token_ici
```

**Exemple :**
```bash
ETAT_CMS_API_URL=http://localhost:8055
ETAT_CMS_API_KEY=abcd1234efgh5678ijkl9012mnop3456
```

### Étape 3 : Lancer le Script

```bash
# Installer les dépendances (si pas déjà fait)
npm install

# Lancer le script de setup
node scripts/setup-etat-directus.js
```

## 📊 Ce que le Script Fait

Le script s'exécute en 2 phases :

### Phase 1 : Création des Collections (5 collections)

1. **`org_type`** - Types d'organisations (Ministère, Direction, Cabinet, etc.)
2. **`org_snapshot`** - Snapshots des décrets (versioning historique)
3. **`public_entity`** - Entités canoniques avec relation vers `org_type`
4. **`org_unit`** - Occurrences dans un snapshot avec hiérarchie (self-reference)
5. **`entity_alias`** - Alias pour la recherche (MSAS, MEFP, etc.)

### Phase 2 : Migration des Données

1. Insertion des 12 types d'organisations
2. Création du snapshot 2024-940
3. Importation de ~200-300 entités du décret avec leur hiérarchie complète

## ✅ Vérification

Après l'exécution, vous devriez voir :

```
============================================================
✅ SETUP TERMINÉ AVEC SUCCÈS !
============================================================

📊 Statistiques:
  - Collections créées: 5
  - Types d'organisations: 12
  - Entités canoniques: ~200-300
  - Snapshot: 2024-940

🌐 Accédez à Directus: http://localhost:8055
```

Dans Directus, vérifiez que vous avez bien :

- ✅ `org_type` : 12 entrées (Présidence, Ministère, Direction, etc.)
- ✅ `org_snapshot` : 1 entrée (2024-940)
- ✅ `public_entity` : ~200-300 entrées
- ✅ `org_unit` : ~200-300 entrées avec hiérarchie
- ✅ `entity_alias` : 0 entrées (à ajouter manuellement si besoin)

## 🐛 Dépannage

### Erreur : "ETAT_CMS_API_KEY n'est pas défini"

**Solution :** Vérifiez que votre fichier `.env` contient bien `ETAT_CMS_API_KEY=...`

### Erreur : "Authentication failed"

**Solution :** Votre token est invalide ou expiré. Créez-en un nouveau dans Directus.

### Erreur : "Cannot connect to Directus"

**Solution :**
- Vérifiez que Directus est bien démarré
- Vérifiez l'URL dans `ETAT_CMS_API_URL`
- Essayez d'ouvrir `http://localhost:8055` dans votre navigateur

### Message : "Collection already exists"

**Pas de problème !** Le script détecte les collections existantes et les réutilise.

### Le script s'arrête au milieu

**Solution :** Relancez simplement le script. Il réutilisera les données déjà créées grâce aux caches.

## 🔄 Recommencer à Zéro

Si vous voulez tout supprimer et recommencer :

1. Dans Directus, allez dans **Settings → Data Model**
2. Supprimez les collections dans cet ordre (important pour les relations) :
   - `entity_alias`
   - `org_unit`
   - `public_entity`
   - `org_snapshot`
   - `org_type`
3. Relancez le script : `node scripts/setup-etat-directus.js`

## 🧪 Tester les APIs

Après le setup, démarrez le serveur Nuxt pour tester les APIs :

```bash
npm run dev
```

Puis testez dans votre navigateur ou avec curl :

```bash
# Liste des snapshots
http://localhost:3000/api/etat/snapshots

# Vue arborescence
http://localhost:3000/api/etat/arborescence

# Vue liste avec recherche
http://localhost:3000/api/etat/liste?search=santé
http://localhost:3000/api/etat/liste?page=2
```

## 📚 Documentation Complète

- [ETAT_MODULE_README.md](../docs/ETAT_MODULE_README.md) - Documentation complète du module
- [ETAT_SETUP_GUIDE.md](../docs/ETAT_SETUP_GUIDE.md) - Guide détaillé avec explications techniques
- [DIRECTUS_ETAT_SETUP.md](../docs/DIRECTUS_ETAT_SETUP.md) - Guide de setup manuel (si vous préférez créer les collections manuellement)

## 🎨 Prochaines Étapes

Après le setup automatisé, vous pouvez :

1. ✅ Tester les APIs (voir ci-dessus)
2. ⏳ Créer les composants Vue (à venir)
3. ⏳ Intégrer dans la page `/app/pages/etat/index.vue`
4. ⏳ Ajouter des alias dans Directus pour améliorer la recherche

## 💡 Avantages des UUIDs

Le script utilise les UUIDs auto-générés par Directus, ce qui facilite :

- ✅ Pas de gestion manuelle des IDs
- ✅ Relations simplifiées (on référence juste l'UUID généré)
- ✅ Self-reference facile pour la hiérarchie (`parent_id`)
- ✅ Pas de conflits entre environnements
- ✅ Migration facile entre dev/staging/prod

## 📞 Support

En cas de problème :
1. Vérifiez que Directus est bien démarré
2. Vérifiez votre fichier `.env`
3. Consultez les logs dans le terminal
4. Relancez le script (il est idempotent)
