import { createDirectus, rest, staticToken } from "@directus/sdk";
import type { DirectusClient, RestClient } from "@directus/sdk";

let etatCmsClient: DirectusClient<any> & RestClient<any>;

/**
 * Récupère le client Directus pour l'État du Sénégal
 * Utilise une instance Directus séparée (locale ou dédiée)
 */
export const getEtatCmsClient = () => {
  const config = useRuntimeConfig();

  if (!etatCmsClient) {
    // Utiliser la config spécifique pour l'État si disponible, sinon fallback sur la config principale
    const apiUrl = config.etatCmsApiUrl || config.cmsApiUrl;
    const apiKey = config.etatCmsApiKey || config.cmsApiKey;

    if (!apiUrl || !apiKey) {
      throw new Error('Configuration Directus manquante pour l\'État. Vérifiez ETAT_CMS_API_URL et ETAT_CMS_API_KEY dans .env');
    }

    etatCmsClient = createDirectus(apiUrl)
      .with(rest())
      .with(staticToken(apiKey));
  }

  return etatCmsClient;
};
