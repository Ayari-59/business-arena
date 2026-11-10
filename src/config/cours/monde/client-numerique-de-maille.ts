import { clienteleDeJanvier } from "./fichier-de-maille";
import { MAILLE_ET_CO } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LE CLIENT À L'ÈRE NUMÉRIQUE, CHEZ MAILLE & CO (enseignement commun de terminale
 * STMG, question 2.2, lot C).
 *
 * CE QUI VIENT DES FICHES : la marge d'un passage en caisse d'une cliente fidèle en janvier
 * (fichier-de-maille.ts, sur la gamme et les achats de maille-et-co.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LE SITE : la boutique vend aussi en ligne, avec retrait en boutique. En un mois : 6 000 visites,
 *     360 paniers remplis, 120 commandes payées ;
 *   · LES PANIERS ABANDONNÉS DES CLIENTES INSCRITES : 90 par mois viennent de clientes qui ont la carte
 *     de fidélité et ont accepté les messages de la boutique. Un courriel de relance leur rappelle leur
 *     panier. Le premier (le lendemain) en fait revenir 18, le deuxième (3 jours après) 9 de plus, le
 *     troisième (une semaine après) 3 de plus. Un panier repris laisse la marge d'un passage en caisse
 *     d'une fidèle ;
 *   · LES DÉSINSCRIPTIONS : agacées, des clientes se désinscrivent : 1 au premier courriel, 2 de plus au
 *     deuxième, 6 de plus au troisième. Une cliente désinscrite fait perdre la marge de 2 passages en
 *     caisse dans l'année ;
 *   · LE CAS : MAILLE & CO envisage un service de discussion en ligne (un conseiller répond aux
 *     questions sur les tailles) pour 450 € par mois ; il ferait passer les commandes de 120 à 135.
 */

export const ENTREPRISES_DU_CLIENT_NUMERIQUE = [MAILLE_ET_CO.code] as const;

export const SITE_DE_MAILLE = { visites: 6_000, paniers: 360, commandes: 120 } as const;
export const RELANCES: readonly { quand: string; reprises: number; desinscriptions: number }[] = [
  { quand: "le lendemain", reprises: 18, desinscriptions: 1 },
  { quand: "3 jours après", reprises: 9, desinscriptions: 2 },
  { quand: "une semaine après", reprises: 3, desinscriptions: 6 },
];
export const PANIERS_ABANDONNES_DES_INSCRITES = 90;
export const PASSAGES_PERDUS_PAR_DESINSCRIPTION = 2;
export const DISCUSSION_EN_LIGNE = { coutParMois: 450, commandesApres: 135 } as const;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** La marge d'un panier repris : celle d'un passage en caisse d'une cliente fidèle. */
export const margeDUnPanier = () => clienteleDeJanvier("fideles").margeParTicket;

/** Le tunnel du site : le taux de transformation (commandes sur visites) et le taux d'abandon de panier. */
export function tunnelDuSite() {
  const s = SITE_DE_MAILLE;
  return { ...s, transformationPct: auDixieme((s.commandes / s.visites) * 100), abandons: s.paniers - s.commandes, abandonPct: auDixieme(((s.paniers - s.commandes) / s.paniers) * 100) };
}

/** Les k premières relances : paniers repris, désinscriptions, ce qu'elles rapportent et ce qu'elles coûtent. */
export function relances(k: number) {
  const r = RELANCES.slice(0, k);
  const reprises = r.reduce((t, x) => t + x.reprises, 0);
  const desinscriptions = r.reduce((t, x) => t + x.desinscriptions, 0);
  const m = margeDUnPanier();
  const marge = auCentime(reprises * m);
  const perte = auCentime(desinscriptions * PASSAGES_PERDUS_PAR_DESINSCRIPTION * m);
  return { k, reprises, desinscriptions, marge, perte, gain: auCentime(marge - perte) };
}

/** Le nombre de relances qui rapporte le plus. */
export function relancesQuiRapportentLePlus() {
  let meilleur = 0;
  for (let k = 1; k <= RELANCES.length; k++) if (relances(k).gain > relances(meilleur).gain) meilleur = k;
  return meilleur;
}

/** Le cas : la discussion en ligne. */
export function discussionEnLigne() {
  const d = DISCUSSION_EN_LIGNE;
  const enPlus = d.commandesApres - SITE_DE_MAILLE.commandes;
  const marge = auCentime(enPlus * margeDUnPanier());
  return { ...d, avant: SITE_DE_MAILLE.commandes, enPlus, marge, gain: auCentime(marge - d.coutParMois), transformationApresPct: auDixieme((d.commandesApres / SITE_DE_MAILLE.visites) * 100) };
}
