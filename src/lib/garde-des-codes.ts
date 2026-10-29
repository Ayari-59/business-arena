import { headers } from "next/headers";
import { MAX_CODES_FAUX_PAR_ADRESSE } from "@/config/reprise";
import { garderLesTentatives, type GardeDeReprise } from "@/services/reprise.service";

/**
 * LES CODES SAISIS À LA MAIN, LIMITÉS PAR ADRESSE (audit, P2-2).
 *
 * Codes de partie, de classe du cours, de cohorte : six à huit caractères, et
 * rien n'empêchait un script de les essayer tous. Chaque code inconnu compte un
 * échec pour l'adresse d'origine. Un code juste ne remet PAS le compteur à zéro : sinon, un
 * seul code connu suffirait à essayer tous les autres.
 *
 * LA RÈGLE : UN CODE JUSTE PASSE TOUJOURS. Toute une classe sort souvent par la même adresse
 * (le réseau du lycée) ; quand la porte se fermait au-delà de `MAX_CODES_FAUX_PAR_ADRESSE`
 * échecs en quinze minutes, elle se fermait aussi pour l'élève qui tapait le bon code.
 * Désormais le code est TOUJOURS cherché d'abord : juste, il passe, plafond atteint ou non.
 * Faux, il compte (même au-delà du plafond) ; et au-delà du plafond la réponse attend
 * `RALENTI_DES_CODES_FAUX_MS` puis dit « réessayez dans N minutes » (`codeFaux`). Un script
 * qui énumère est donc ralenti à un essai par ralenti et par connexion, sans jamais
 * apprendre autre chose que « faux » ; la classe, elle, n'est jamais bloquée.
 */
export const MARQUEUR_CODES_SAISIS = "code-saisi";



export async function adresseDOrigine(): Promise<string | null> {
  const h = await headers();
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
}

/** Les minutes d'attente que dit le refus (« réessayez dans 12 minutes ») ; 15 si illisible. */
export function minutesDuRefus(refus: string): number {
  const m = /(\d+)\s*minute/.exec(refus);
  return m ? Number(m[1]) : 15;
}

/** L'attente imposée à chaque code faux au-delà du plafond. */
export const RALENTI_DES_CODES_FAUX_MS = 2_000;

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * UN CODE FAUX vient d'être saisi : il compte. Au-delà du plafond, la réponse est ralentie et
 * rend le refus « trop de tentatives » à afficher ; sous le plafond, null (le refus ordinaire
 * « code inconnu » s'applique). À n'appeler qu'APRÈS avoir cherché le code : un code juste
 * ne passe jamais par ici.
 */
export async function codeFaux(
  garde: GardeDeReprise,
  attendre: (ms: number) => Promise<void> = pause,
): Promise<string | null> {
  await garde.echec();
  if (!garde.refus) return null;
  await attendre(RALENTI_DES_CODES_FAUX_MS);
  return garde.refus;
}

export async function gardeDesCodes(): Promise<GardeDeReprise> {
  return garderLesTentatives({ marqueur: MARQUEUR_CODES_SAISIS, ip: await adresseDOrigine(), maxEchecs: MAX_CODES_FAUX_PAR_ADRESSE });
}
