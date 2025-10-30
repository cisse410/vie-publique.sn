import { createDirectus, rest, staticToken } from "@directus/sdk";
import type { DirectusClient, RestClient } from "@directus/sdk";

let etatCmsClient: DirectusClient<any> & RestClient<any>;

/**
 * Client Directus spécifique pour le module État
 * Utilise ETAT_CMS_API_URL et ETAT_CMS_API_KEY
 */
export const getEtatCmsClient = () => {
  const config = useRuntimeConfig();

  if (!etatCmsClient) {
    etatCmsClient = createDirectus(config.etatCmsApiUrl)
      .with(rest())
      .with(staticToken(config.etatCmsApiKey));
  }

  return etatCmsClient;
};
