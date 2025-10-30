/**
 * Script automatisé : Création des collections Directus + Migration des données
 *
 * Ce script va :
 * 1. Créer les 5 collections nécessaires (org_type, org_snapshot, public_entity, org_unit, entity_alias)
 * 2. Configurer tous les champs avec les bons types
 * 3. Établir toutes les relations (M2O, O2M, self-reference)
 * 4. Migrer les données du décret 2024-940
 *
 * Usage: node scripts/setup-etat-directus.js
 */

import { createDirectus, rest, staticToken, createCollection, createField, createItem, readItems } from "@directus/sdk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DIRECTUS_URL = process.env.ETAT_CMS_API_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.ETAT_CMS_API_KEY || "";

// Charger les données JSON
const organisationData = JSON.parse(
  readFileSync(join(__dirname, "../app/assets/data/etat-organisation.json"), "utf-8")
);

// Types d'organisations
const ORG_TYPES = [
  { code: "PRESIDENCE", label: "Présidence", ordre: 1, icon: "🏛️" },
  { code: "PRIMATURE", label: "Primature", ordre: 2, icon: "🏛️" },
  { code: "MINISTERE", label: "Ministère", ordre: 3, icon: "🏛️" },
  { code: "CABINET", label: "Cabinet", ordre: 4, icon: "📋" },
  { code: "SECRETARIAT", label: "Secrétariat", ordre: 5, icon: "📋" },
  { code: "DIRECTION", label: "Direction", ordre: 6, icon: "🧭" },
  { code: "SERVICE", label: "Service", ordre: 7, icon: "📋" },
  { code: "EP", label: "Établissement Public", ordre: 8, icon: "🏢" },
  { code: "SN", label: "Société Nationale", ordre: 9, icon: "🏭" },
  { code: "AGENCE", label: "Agence", ordre: 10, icon: "🏢" },
  { code: "POLE", label: "Pôle", ordre: 11, icon: "📌" },
  { code: "AUTRE", label: "Autre", ordre: 99, icon: "📄" },
];

// Mapping pour détecter les types
const PARENT_TO_TYPE_MAP = {
  "Présidence de la République": "PRESIDENCE",
  "Primature": "PRIMATURE",
  "Ministères": "MINISTERE",
  "Cabinet": "CABINET",
  "Secrétariat général": "SECRETARIAT",
  "Directions": "DIRECTION",
  "Services": "SERVICE",
  "Établissements publics": "EP",
  "Sociétés nationales et à participation publique": "SN",
  "Autres administrations": "AGENCE",
};

// Caches
const entityCache = new Map();
const orgTypeCache = new Map();
let snapshotId;

/**
 * Étape 1 : Créer la collection org_type
 */
async function createOrgTypeCollection() {
  console.log("\n📋 Création de la collection org_type...");

  try {
    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify({
        collection: "org_type",
        meta: {
          collection: "org_type",
          icon: null,
          note: "Types d'organisations (Ministère, Direction, etc.)",
          display_template: "{{label}}",
          hidden: false,
          singleton: false,
          sort_field: "ordre",
        },
        schema: {
          name: "org_type",
        },
        fields: [
          {
            field: "id",
            type: "uuid",
            meta: {
              hidden: true,
              readonly: true,
              interface: "input",
              special: ["uuid"],
            },
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
          },
          {
            field: "code",
            type: "string",
            meta: {
              interface: "input",
              required: true,
              note: "Code unique (ex: MINISTERE, DIRECTION)",
            },
            schema: {
              is_unique: true,
              is_nullable: false,
            },
          },
          {
            field: "label",
            type: "string",
            meta: {
              interface: "input",
              required: true,
              note: "Libellé affiché (ex: Ministère)",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "ordre",
            type: "integer",
            meta: {
              interface: "input",
              note: "Ordre d'affichage",
            },
          },
          {
            field: "icon",
            type: "string",
            meta: {
              interface: "input",
              note: "Emoji ou icône",
            },
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("  ✅ Collection org_type créée");
    } else {
      const error = await response.json();
      if (error.errors?.[0]?.message?.includes("already exists")) {
        console.log("  ⚠️  Collection org_type existe déjà");
      } else {
        throw new Error(JSON.stringify(error));
      }
    }
  } catch (error) {
    console.error("  ❌ Erreur:", error.message);
  }
}

/**
 * Étape 2 : Créer la collection org_snapshot
 */
async function createOrgSnapshotCollection() {
  console.log("\n📅 Création de la collection org_snapshot...");

  try {
    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify({
        collection: "org_snapshot",
        meta: {
          collection: "org_snapshot",
          icon: null,
          note: "Snapshots des décrets de répartition",
          display_template: "{{numero}} - {{titre}}",
        },
        schema: {
          name: "org_snapshot",
        },
        fields: [
          {
            field: "id",
            type: "uuid",
            meta: {
              hidden: true,
              readonly: true,
              interface: "input",
              special: ["uuid"],
            },
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
          },
          {
            field: "numero",
            type: "string",
            meta: {
              interface: "input",
              required: true,
              note: "Numéro du décret (ex: 2024-940)",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "annee",
            type: "integer",
            meta: {
              interface: "input",
              required: true,
              note: "Année du décret",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "date_publication",
            type: "date",
            meta: {
              interface: "datetime",
              required: true,
              note: "Date de publication",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "titre",
            type: "text",
            meta: {
              interface: "input-multiline",
              required: true,
              note: "Titre complet du décret",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "status",
            type: "string",
            meta: {
              interface: "select-dropdown",
              options: {
                choices: [
                  { text: "Brouillon", value: "draft" },
                  { text: "Publié", value: "published" },
                ],
              },
              note: "Statut de publication",
            },
            schema: {
              default_value: "draft",
            },
          },
          {
            field: "est_actif",
            type: "boolean",
            meta: {
              interface: "boolean",
              note: "Snapshot actuellement actif",
            },
            schema: {
              default_value: false,
            },
          },
          {
            field: "document_url",
            type: "string",
            meta: {
              interface: "input",
              note: "URL du document officiel",
            },
          },
          {
            field: "date_created",
            type: "timestamp",
            meta: {
              interface: "datetime",
              readonly: true,
              special: ["date-created"],
            },
          },
          {
            field: "date_updated",
            type: "timestamp",
            meta: {
              interface: "datetime",
              readonly: true,
              special: ["date-updated"],
            },
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("  ✅ Collection org_snapshot créée");
    } else {
      const error = await response.json();
      if (error.errors?.[0]?.message?.includes("already exists")) {
        console.log("  ⚠️  Collection org_snapshot existe déjà");
      } else {
        throw new Error(JSON.stringify(error));
      }
    }
  } catch (error) {
    console.error("  ❌ Erreur:", error.message);
  }
}

/**
 * Étape 3 : Créer la collection public_entity avec relation org_type_id
 */
async function createPublicEntityCollection() {
  console.log("\n🏛️ Création de la collection public_entity...");

  try {
    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify({
        collection: "public_entity",
        meta: {
          collection: "public_entity",
          icon: null,
          note: "Entités publiques canoniques (persistent across snapshots)",
          display_template: "{{nom_canonique}}",
        },
        schema: {
          name: "public_entity",
        },
        fields: [
          {
            field: "id",
            type: "uuid",
            meta: {
              hidden: true,
              readonly: true,
              interface: "input",
              special: ["uuid"],
            },
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
          },
          {
            field: "slug",
            type: "string",
            meta: {
              interface: "input",
              required: true,
              note: "Slug pour URL SEO-friendly",
            },
            schema: {
              is_unique: true,
              is_nullable: false,
            },
          },
          {
            field: "nom_canonique",
            type: "string",
            meta: {
              interface: "input",
              required: true,
              note: "Nom canonique de l'entité",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "description",
            type: "text",
            meta: {
              interface: "input-multiline",
              note: "Description de l'entité",
            },
          },
          {
            field: "site_web",
            type: "string",
            meta: {
              interface: "input",
              note: "Site web officiel",
            },
          },
          {
            field: "email",
            type: "string",
            meta: {
              interface: "input",
              note: "Email de contact",
            },
          },
          {
            field: "telephone",
            type: "string",
            meta: {
              interface: "input",
              note: "Numéro de téléphone",
            },
          },
          {
            field: "adresse",
            type: "text",
            meta: {
              interface: "input-multiline",
              note: "Adresse physique",
            },
          },
          {
            field: "date_created",
            type: "timestamp",
            meta: {
              interface: "datetime",
              readonly: true,
              special: ["date-created"],
            },
          },
          {
            field: "date_updated",
            type: "timestamp",
            meta: {
              interface: "datetime",
              readonly: true,
              special: ["date-updated"],
            },
          },
          {
            field: "org_type_id",
            type: "uuid",
            meta: {
              interface: "list-m2o",
              special: ['m2o'],
              display: "related-values",
              display_options: {
                template: "{{label}}",
              },
              required: true,
              note: "Type d'organisation",
            },
            schema: {
              is_nullable: false,
              foreign_key_table: "org_type",
              foreign_key_column: "id",
            },
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("  ✅ Collection public_entity créée");
    } else {
      const error = await response.json();
      if (error.errors?.[0]?.message?.includes("already exists")) {
        console.log("  ⚠️  Collection public_entity existe déjà");
      } else {
        throw new Error(JSON.stringify(error));
      }
    }
  } catch (error) {
    console.error("  ❌ Erreur:", error.message);
  }
}

/**
 * Étape 4 : Créer la collection org_unit avec toutes les relations
 */
async function createOrgUnitCollection() {
  console.log("\n🔗 Création de la collection org_unit...");

  try {
    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify({
        collection: "org_unit",
        meta: {
          collection: "org_unit",
          icon: null,
          note: "Occurrences d'entités dans un snapshot (avec hiérarchie)",
          display_template: "{{intitule_officiel}}",
          sort_field: "ordre",
        },
        schema: {
          name: "org_unit",
        },
        fields: [
          {
            field: "id",
            type: "uuid",
            meta: {
              hidden: true,
              readonly: true,
              interface: "input",
              special: ["uuid"],
            },
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
          },
          {
            field: "intitule_officiel",
            type: "string",
            meta: {
              interface: "input",
              required: true,
              note: "Intitulé officiel dans ce snapshot",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "ordre",
            type: "integer",
            meta: {
              interface: "input",
              note: "Ordre d'affichage",
            },
          },
          {
            field: "notes",
            type: "text",
            meta: {
              interface: "input-multiline",
              note: "Notes ou remarques",
            },
          },
          {
            field: "snapshot_id",
            type: "uuid",
            meta: {
              interface: "list-m2o",
              special: ['m2o'],
              display: "related-values",
              display_options: {
                template: "{{numero}}",
              },
              required: true,
              note: "Snapshot auquel appartient cette unité",
            },
            schema: {
              is_nullable: false,
              foreign_key_table: "org_snapshot",
              foreign_key_column: "id",
            },
          },
          {
            field: "public_entity_id",
            type: "uuid",
            meta: {
              interface: "list-m2o",
              special: ['m2o'],
              display: "related-values",
              display_options: {
                template: "{{nom_canonique}}",
              },
              required: true,
              note: "Entité canonique référencée",
            },
            schema: {
              is_nullable: false,
              foreign_key_table: "public_entity",
              foreign_key_column: "id",
            },
          },
          {
            field: "parent_id",
            type: "uuid",
            meta: {
              interface: "list-m2o",
              special: ['m2o'],
              display: "related-values",
              display_options: {
                template: "{{intitule_officiel}}",
              },
              note: "Parent dans la hiérarchie (nullable pour racine)",
            },
            schema: {
              is_nullable: true,
              foreign_key_table: "org_unit",
              foreign_key_column: "id",
            },
          },
          {
            field: "date_created",
            type: "timestamp",
            meta: {
              interface: "datetime",
              readonly: true,
              special: ["date-created"],
            },
          },
          {
            field: "date_updated",
            type: "timestamp",
            meta: {
              interface: "datetime",
              readonly: true,
              special: ["date-updated"],
            },
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("  ✅ Collection org_unit créée avec toutes les relations");
    } else {
      const error = await response.json();
      if (error.errors?.[0]?.message?.includes("already exists")) {
        console.log("  ⚠️  Collection org_unit existe déjà");
      } else {
        throw new Error(JSON.stringify(error));
      }
    }
  } catch (error) {
    console.error("  ❌ Erreur:", error.message);
  }
}

/**
 * Étape 5 : Créer la collection entity_alias
 */
async function createEntityAliasCollection() {
  console.log("\n🏷️ Création de la collection entity_alias...");

  try {
    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify({
        collection: "entity_alias",
        meta: {
          collection: "entity_alias",
          icon: null,
          note: "Alias pour la recherche (ex: MSAS, MEFP)",
          display_template: "{{alias}}",
        },
        schema: {
          name: "entity_alias",
        },
        fields: [
          {
            field: "id",
            type: "uuid",
            meta: {
              hidden: true,
              readonly: true,
              interface: "input",
              special: ["uuid"],
            },
            schema: {
              is_primary_key: true,
              has_auto_increment: false,
            },
          },
          {
            field: "alias",
            type: "string",
            meta: {
              interface: "input",
              required: true,
              note: "Alias de recherche (ex: MSAS)",
            },
            schema: {
              is_nullable: false,
            },
          },
          {
            field: "public_entity_id",
            type: "uuid",
            meta: {
              interface: "list-m2o",
              special: ['m2o'],
              display: "related-values",
              display_options: {
                template: "{{nom_canonique}}",
              },
              required: true,
              note: "Entité associée",
            },
            schema: {
              is_nullable: false,
              foreign_key_table: "public_entity",
              foreign_key_column: "id",
            },
          },
          {
            field: "date_created",
            type: "timestamp",
            meta: {
              interface: "datetime",
              readonly: true,
              special: ["date-created"],
            },
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("  ✅ Collection entity_alias créée");
    } else {
      const error = await response.json();
      if (error.errors?.[0]?.message?.includes("already exists")) {
        console.log("  ⚠️  Collection entity_alias existe déjà");
      } else {
        throw new Error(JSON.stringify(error));
      }
    }
  } catch (error) {
    console.error("  ❌ Erreur:", error.message);
  }
}

/**
 * Étape 6 : Insérer les données - Types d'organisations
 */
async function insertOrgTypes() {
  console.log("\n📋 Insertion des types d'organisations...");

  for (const orgType of ORG_TYPES) {
    try {
      const response = await fetch(`${DIRECTUS_URL}/items/org_type`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },
        body: JSON.stringify(orgType),
      });

      if (response.ok) {
        const created = await response.json();
        orgTypeCache.set(orgType.code, created.data.id);
        console.log(`  ✅ ${orgType.label} (${orgType.code})`);
      } else {
        const error = await response.json();
        if (error.errors?.[0]?.message?.includes("unique")) {
          // Récupérer l'existant
          const getResponse = await fetch(
            `${DIRECTUS_URL}/items/org_type?filter[code][_eq]=${orgType.code}`,
            {
              headers: {
                Authorization: `Bearer ${DIRECTUS_TOKEN}`,
              },
            }
          );
          const existing = await getResponse.json();
          if (existing.data?.[0]) {
            orgTypeCache.set(orgType.code, existing.data[0].id);
            console.log(`  ⚠️  ${orgType.label} existe déjà`);
          }
        } else {
          console.error(`  ❌ Erreur: ${JSON.stringify(error)}`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Erreur: ${error.message}`);
    }
  }
}

/**
 * Étape 7 : Créer le snapshot 2024-940
 */
async function createSnapshot() {
  console.log("\n📅 Création du snapshot 2024-940...");

  const snapshotData = {
    numero: "2024-940",
    annee: 2024,
    date_publication: "2024-04-05",
    titre:
      "Décret n° 2024-940 portant répartition des services de l'État et du contrôle des établissements publics, des sociétés nationales et des sociétés à participation publique entre la Présidence de la République, la Primature et les ministères",
    status: "published",
    est_actif: true,
    document_url:
      "https://primature.sn/publications/lois-et-reglements/decret-ndeg-2024-940-portant-repartition-des-services-de-letat-et",
  };

  try {
    const response = await fetch(`${DIRECTUS_URL}/items/org_snapshot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify(snapshotData),
    });

    if (response.ok) {
      const created = await response.json();
      snapshotId = created.data.id;
      console.log(`  ✅ Snapshot créé: ${snapshotId}`);
    } else {
      const error = await response.json();
      if (error.errors?.[0]?.message?.includes("unique")) {
        const getResponse = await fetch(
          `${DIRECTUS_URL}/items/org_snapshot?filter[numero][_eq]=2024-940`,
          {
            headers: {
              Authorization: `Bearer ${DIRECTUS_TOKEN}`,
            },
          }
        );
        const existing = await getResponse.json();
        if (existing.data?.[0]) {
          snapshotId = existing.data[0].id;
          console.log(`  ⚠️  Snapshot existe déjà: ${snapshotId}`);
        }
      } else {
        throw new Error(JSON.stringify(error));
      }
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
    throw error;
  }
}

/**
 * Étape 8 : Déterminer le type d'organisation
 */
function determineOrgType(parentPath) {
  for (const parent of parentPath) {
    if (PARENT_TO_TYPE_MAP[parent]) {
      return orgTypeCache.get(PARENT_TO_TYPE_MAP[parent]);
    }
  }

  const lastParent = parentPath[parentPath.length - 1] || "";

  if (lastParent.includes("Cabinet")) return orgTypeCache.get("CABINET");
  if (lastParent.includes("Secrétariat")) return orgTypeCache.get("SECRETARIAT");
  if (lastParent.includes("Direction")) return orgTypeCache.get("DIRECTION");
  if (lastParent.includes("Service")) return orgTypeCache.get("SERVICE");
  if (lastParent.includes("Pôle")) return orgTypeCache.get("POLE");

  return orgTypeCache.get("AUTRE");
}

/**
 * Étape 9 : Créer ou récupérer une entité canonique
 */
async function createOrGetPublicEntity(name, orgTypeId) {
  if (entityCache.has(name)) {
    return entityCache.get(name);
  }

  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const entityData = {
    slug,
    nom_canonique: name,
    org_type_id: orgTypeId,
  };

  try {
    const response = await fetch(`${DIRECTUS_URL}/items/public_entity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
      body: JSON.stringify(entityData),
    });

    if (response.ok) {
      const created = await response.json();
      entityCache.set(name, created.data.id);
      return created.data.id;
    } else {
      const error = await response.json();
      if (error.errors?.[0]?.message?.includes("unique")) {
        const getResponse = await fetch(
          `${DIRECTUS_URL}/items/public_entity?filter[slug][_eq]=${slug}`,
          {
            headers: {
              Authorization: `Bearer ${DIRECTUS_TOKEN}`,
            },
          }
        );
        const existing = await getResponse.json();
        if (existing.data?.[0]) {
          entityCache.set(name, existing.data[0].id);
          return existing.data[0].id;
        }
      }
      throw new Error(JSON.stringify(error));
    }
  } catch (error) {
    console.error(`  ❌ Erreur pour ${name}: ${error.message}`);
    throw error;
  }
}

/**
 * Étape 10 : Parser le JSON et créer les org_units
 */
async function parseAndCreateOrgUnits(data, parentPath = [], parentUnitId = null, ordre = 0) {
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const currentPath = [...parentPath, item.name];

    const orgTypeId = determineOrgType(parentPath);
    const publicEntityId = await createOrGetPublicEntity(item.name, orgTypeId);

    const orgUnitData = {
      snapshot_id: snapshotId,
      public_entity_id: publicEntityId,
      parent_id: parentUnitId,
      intitule_officiel: item.name,
      ordre: ordre + i,
    };

    try {
      const response = await fetch(`${DIRECTUS_URL}/items/org_unit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },
        body: JSON.stringify(orgUnitData),
      });

      if (response.ok) {
        const createdUnit = await response.json();
        console.log(`  ✅ ${currentPath.join(" > ")}`);

        if (item.children && item.children.length > 0) {
          await parseAndCreateOrgUnits(item.children, currentPath, createdUnit.data.id, 0);
        }
      } else {
        const error = await response.json();
        console.error(`  ❌ Erreur pour ${item.name}: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error(`  ❌ Erreur pour ${item.name}: ${error.message}`);
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log("🚀 Démarrage du setup automatisé Directus + Migration...\n");
  console.log("============================================================");

  if (!DIRECTUS_TOKEN) {
    console.error("❌ ERREUR: ETAT_CMS_API_KEY n'est pas défini dans .env");
    process.exit(1);
  }

  try {
    // Phase 1 : Création des collections
    console.log("\n🏗️  PHASE 1 : CRÉATION DES COLLECTIONS");
    console.log("============================================================");

    await createOrgTypeCollection();
    await createOrgSnapshotCollection();
    await createPublicEntityCollection();
    await createOrgUnitCollection();
    await createEntityAliasCollection();

    console.log("\n✅ Toutes les collections ont été créées avec succès!");

    // Phase 2 : Migration des données
    console.log("\n📦 PHASE 2 : MIGRATION DES DONNÉES");
    console.log("============================================================");

    await insertOrgTypes();
    await createSnapshot();

    console.log("\n🏛️ Importation des entités du décret 2024-940...");
    await parseAndCreateOrgUnits(organisationData);

    console.log("\n============================================================");
    console.log("✅ SETUP TERMINÉ AVEC SUCCÈS !");
    console.log("============================================================");
    console.log(`\n📊 Statistiques:`);
    console.log(`  - Collections créées: 5`);
    console.log(`  - Types d'organisations: ${orgTypeCache.size}`);
    console.log(`  - Entités canoniques: ${entityCache.size}`);
    console.log(`  - Snapshot: 2024-940`);
    console.log(`\n🌐 Accédez à Directus: ${DIRECTUS_URL}\n`);
  } catch (error) {
    console.error("\n============================================================");
    console.error("❌ ERREUR DURANT LE SETUP");
    console.error("============================================================");
    console.error(error);
    process.exit(1);
  }
}

// Exécution
main();
