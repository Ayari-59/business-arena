import { headers } from "next/headers";
import { MAX_CODES_FAUX_PAR_ADRESSE } from "@/config/reprise";
import { garderLesTentatives, type GardeDeReprise } from "@/services/reprise.service";

/**
 * LES CODES SAISIS À LA MAIN, LIMITÉS PAR ADRESSE (audit, P2-2).
 *
 * Codes de partie, de classe du cours, de cohorte : six à huit caractères, et
 * rien n'empêchait un script de les essayer tous. Chaque code inconnu compte un
 * échec pour l'adresse d'origine ; au-delà de `MAX_CODES_FAUX_PAR_ADRESSE` échecs en quinze minutes, la porte se
 * ferme le temps de la fenêtre. Un code juste ne remet PAS le compteur à zéro : sinon, un seul code
 * connu suffirait à essayer tous les autres.
 */
export const MARQUEUR_CODES_SAISIS = "code-saisi";



export async function adresseDOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

export async function gardeDesCodes(): Promise<GardeDeReprise> {
  return garderLesTentatives({ marqueur: MARQUEUR_CODES_SAISIS, ip: await adresseDOrigine(), maxEchecs: MAX_CODES_FAUX_PAR_ADRESSE });
}
