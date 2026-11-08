import { createHmac, timingSafeEqual } from "node:crypto";
import { authSecret } from "../../lib/auth-secret";
import { cleDerivee } from "../../lib/cles";

/**
 * LES ESSAIS D'UN LABORATOIRE, COMPTÉS AU SERVEUR (décision du propriétaire, novembre 2026).
 *
 * « Montrer une solution » ne se rend qu'après deux essais validés. Le serveur ne garde aucune
 * progression pour l'élève hors classe : chaque validation lui rend donc un jeton signé qui dit
 * combien de positions ont été validées dans CE laboratoire (chapitre, entreprise, étape), et la
 * validation suivante le renvoie pour qu'il augmente. Le navigateur ne peut pas l'écrire : la
 * signature est faite d'une clé dérivée d'AUTH_SECRET, propre à cet usage (lib/cles.ts). Il peut
 * le garder, et le rejouer pour ce même laboratoire : il a bien validé deux positions.
 *
 * Le jeton : « essais.signature », la signature portant aussi le laboratoire, pour qu'un jeton
 * gagné ailleurs ne vaille rien ici.
 */

export const ESSAIS_AVANT_LA_SOLUTION = 2;
/** Au-delà, le compte ne sert plus à rien : il plafonne. */
const PLAFOND = 99;

export interface LaboratoireVise {
  chapitre: string;
  entreprise: string;
  etape: string;
}

const signature = (lieu: LaboratoireVise, essais: number, racine: string) =>
  createHmac("sha256", cleDerivee("laboratoire", racine))
    .update(JSON.stringify([lieu.chapitre, lieu.entreprise, lieu.etape, essais]))
    .digest("hex")
    .slice(0, 32);

/** Le jeton qui dit `essais` validations dans ce laboratoire. */
export function signerLesEssais(lieu: LaboratoireVise, essais: number, racine: string = authSecret()): string {
  const n = Math.max(0, Math.min(PLAFOND, Math.floor(essais)));
  return `${n}.${signature(lieu, n, racine)}`;
}

/** Les essais que dit un jeton reçu du navigateur, lu comme inconnu : 0 s'il est absent, faux ou d'un autre laboratoire. */
export function essaisDuJeton(jeton: unknown, lieu: LaboratoireVise, racine: string = authSecret()): number {
  if (typeof jeton !== "string" || jeton.length > 64) return 0;
  const m = /^(\d{1,2})\.([0-9a-f]{32})$/.exec(jeton);
  if (!m) return 0;
  const n = Number(m[1]);
  const attendue = Buffer.from(signature(lieu, n, racine));
  const recue = Buffer.from(m[2]!);
  return attendue.length === recue.length && timingSafeEqual(attendue, recue) ? n : 0;
}
