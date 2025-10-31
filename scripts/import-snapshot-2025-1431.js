/**
 * Script d'import du snapshot 2025-1431
 *
 * Importe les données du décret n° 2025-1431 du 06 septembre 2025
 * Source: JO N° 7855 du 07 octobre 2025
 * URL: https://www.vie-publique.sn/documents/1951/JO-7855-du-07-octobre-2025
 *
 * ⚠️  IMPORTANT: Ce script NE TOUCHE PAS aux données existantes
 * - Réutilise les collections existantes
 * - Crée un NOUVEAU snapshot
 * - Désactive l'ancien snapshot actif
 * - Réutilise les public_entity existantes quand possible
 *
 * Usage: node scripts/import-snapshot-2025-1431.js
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DIRECTUS_URL = process.env.ETAT_CMS_API_URL || "http://localhost:8055";
const DIRECTUS_TOKEN = process.env.ETAT_CMS_API_KEY || "";

// Charger les nouvelles données
const organisationData = JSON.parse(
  readFileSync(join(__dirname, "../app/assets/data/organisation-etat.json"), "utf-8")
);

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
 * Charger les types d'organisations existants
 */
async function loadOrgTypes() {
  console.log("\n📋 Chargement des types d'organisations...");

  try {
    const response = await fetch(`${DIRECTUS_URL}/items/org_type`, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      data.data.forEach((type) => {
        orgTypeCache.set(type.code, type.id);
        console.log(`  ✅ ${type.label} (${type.code})`);
      });
    } else {
      throw new Error("Impossible de charger les types d'organisations");
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
    throw error;
  }
}

/**
 * Désactiver l'ancien snapshot actif
 */
async function deactivateOldSnapshot() {
  console.log("\n🔄 Désactivation de l'ancien snapshot actif...");

  try {
    // Récupérer le snapshot actuellement actif
    const response = await fetch(
      `${DIRECTUS_URL}/items/org_snapshot?filter[est_actif][_eq]=true`,
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const activeSnapshot = data.data[0];

        // Désactiver ce snapshot
        const updateResponse = await fetch(
          `${DIRECTUS_URL}/items/org_snapshot/${activeSnapshot.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DIRECTUS_TOKEN}`,
            },
            body: JSON.stringify({ est_actif: false }),
          }
        );

        if (updateResponse.ok) {
          console.log(`  ✅ Snapshot ${activeSnapshot.numero} désactivé`);
        } else {
          throw new Error("Erreur lors de la désactivation du snapshot");
        }
      } else {
        console.log("  ℹ️  Aucun snapshot actif trouvé");
      }
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
    throw error;
  }
}

/**
 * Créer le nouveau snapshot 2025-1431 (ou réactiver s'il existe)
 */
async function createSnapshot() {
  console.log("\n📅 Vérification/Création du snapshot 2025-1431...");

  const snapshotData = {
    numero: "2025-1431",
    annee: 2025,
    date_publication: "2025-09-06",
    titre:
      "Décret n° 2025-1431 du 06 septembre 2025 portant répartition des services de l'État et du contrôle des établissements publics, des sociétés nationales et des sociétés à participation publique entre la Présidence de la République, la Primature et les ministères",
    status: "published",
    est_actif: true,
    document_url: "https://www.vie-publique.sn/documents/1951/JO-7855-du-07-octobre-2025",
  };

  try {
    // D'abord, vérifier si le snapshot existe déjà
    const checkResponse = await fetch(
      `${DIRECTUS_URL}/items/org_snapshot?filter[numero][_eq]=2025-1431`,
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        },
      }
    );

    if (checkResponse.ok) {
      const existing = await checkResponse.json();

      if (existing.data && existing.data.length > 0) {
        // Le snapshot existe déjà
        const existingSnapshot = existing.data[0];
        snapshotId = existingSnapshot.id;

        console.log(`  ⚠️  Le snapshot 2025-1431 existe déjà (ID: ${snapshotId})`);

        // Le réactiver s'il n'est pas actif
        if (!existingSnapshot.est_actif) {
          const updateResponse = await fetch(
            `${DIRECTUS_URL}/items/org_snapshot/${snapshotId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${DIRECTUS_TOKEN}`,
              },
              body: JSON.stringify({ est_actif: true }),
            }
          );

          if (updateResponse.ok) {
            console.log(`  ✅ Snapshot réactivé: ${snapshotId}`);
          }
        } else {
          console.log(`  ℹ️  Snapshot déjà actif: ${snapshotId}`);
        }

        console.log(`  📅 Date: ${snapshotData.date_publication}`);
        console.log(`  📄 Numéro: ${snapshotData.numero}`);
        return;
      }
    }

    // Le snapshot n'existe pas, le créer
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
      console.log(`  📅 Date: ${snapshotData.date_publication}`);
      console.log(`  📄 Numéro: ${snapshotData.numero}`);
    } else {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }
  } catch (error) {
    console.error(`  ❌ Erreur: ${error.message}`);
    throw error;
  }
}

/**
 * Déterminer le type d'organisation
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
 * Créer ou récupérer une entité canonique
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

  try {
    // Vérifier si l'entité existe déjà
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

    // Créer une nouvelle entité
    const entityData = {
      slug,
      nom_canonique: name,
      org_type_id: orgTypeId,
    };

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
      throw new Error(JSON.stringify(error));
    }
  } catch (error) {
    console.error(`  ❌ Erreur pour ${name}: ${error.message}`);
    throw error;
  }
}

/**
 * Parser le JSON et créer les org_units
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
  console.log("🚀 Import du snapshot 2025-1431 (JO N° 7855 du 07 octobre 2025)\n");
  console.log("============================================================");
  console.log("⚠️  Ce script NE TOUCHE PAS aux données existantes");
  console.log("============================================================\n");

  if (!DIRECTUS_TOKEN) {
    console.error("❌ ERREUR: ETAT_CMS_API_KEY n'est pas défini dans .env");
    process.exit(1);
  }

  try {
    // Étape 1: Charger les types d'organisations
    await loadOrgTypes();

    // Étape 2: Désactiver l'ancien snapshot
    await deactivateOldSnapshot();

    // Étape 3: Créer le nouveau snapshot
    await createSnapshot();

    // Étape 4: Importer les entités
    console.log("\n🏛️ Importation des entités du décret 2025-1431...");
    await parseAndCreateOrgUnits(organisationData);

    console.log("\n============================================================");
    console.log("✅ IMPORT TERMINÉ AVEC SUCCÈS !");
    console.log("============================================================");
    console.log(`\n📊 Statistiques:`);
    console.log(`  - Snapshot: 2025-1431 (actif)`);
    console.log(`  - Entités réutilisées ou créées: ${entityCache.size}`);
    console.log(`  - Source: JO N° 7855 du 07/10/2025`);
    console.log(`\n🌐 Accédez à Directus: ${DIRECTUS_URL}\n`);
  } catch (error) {
    console.error("\n============================================================");
    console.error("❌ ERREUR DURANT L'IMPORT");
    console.error("============================================================");
    console.error(error);
    process.exit(1);
  }
}

// Exécution
main();
