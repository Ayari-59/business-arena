import type { FicheDeLaBoutique } from "./maille-et-co";
import { passantsDeJanvier } from "./vente-et-caisse";

/**
 * LE MONDE DU COURS : LA COMMUNICATION LOCALE DE MAILLE & CO (BTS MCO, bloc 2, chapitre « Communiquer
 * et animer en local »).
 *
 * Le budget est celui de la fiche : 1 500 € de publicité par mois (monde/maille-et-co.ts,
 * `CHARGES_DU_MOIS`). Les personnes qu'un support fait entrer achètent comme les passants de janvier,
 * avec le modèle de la campagne du bac pro (monde/vente-et-caisse.ts, `campagne`) : leurs ventes sont les
 * entrées × le taux de transformation des passants, à l'unité la plus proche, et chaque vente laisse la
 * marge d'une vente d'un passant (32,18 €). Un seul passant dans tout le cours.
 *
 * POUR CHAQUE SUPPORT (hypothèses du cours) : son coût, les contacts qu'il touche, son taux de retour
 * (la part des contacts qui entrent en boutique). On en tire le coût par contact, les entrées, les
 * ventes, la marge en plus, ce que l'action laisse une fois payée, et son retour sur investissement
 * (ce qu'elle laisse ÷ ce qu'elle coûte).
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export type CodeDeSupport = "tracts" | "sms" | "posts" | "vitrine" | "soiree";

export interface SupportDeCommunication {
  code: CodeDeSupport;
  nom: string;
  /** Ce qu'il coûte, hors taxes, pour le mois. */
  cout: number;
  /** Les personnes qu'il touche. */
  contacts: number;
  /** La part des contacts qui entrent en boutique. */
  tauxDeRetour: number;
  /** Faire connaître (cognitif), faire aimer (affectif) ou faire agir (conatif). */
  objectif: "cognitif" | "affectif" | "conatif";
}

/**
 * LES CINQ SUPPORTS ENVISAGÉS (hypothèses du cours) :
 *   · 5 000 tracts dans les boîtes aux lettres de la zone proche : 600 € (impression et distribution), 2 % de retour ;
 *   · un SMS géolocalisé à 2 000 numéros d'un fichier loué : 250 €, 4 % de retour ;
 *   · des publications sponsorisées sur les réseaux sociaux, à 5 km : 400 € pour 20 000 personnes, 0,6 % de retour ;
 *   · la vitrine refaite et la publicité sur le lieu de vente : 900 €, vues par 30 000 passants du mois, 1 % de retour ;
 *   · une soirée tricot en boutique : 350 € (fil, café, animatrice), 40 inscrites, qui viennent toutes.
 */
export const SUPPORTS: readonly SupportDeCommunication[] = [
  { code: "tracts", nom: "Tracts dans la zone proche", cout: 600, contacts: 5_000, tauxDeRetour: 0.02, objectif: "cognitif" },
  { code: "sms", nom: "SMS géolocalisé", cout: 250, contacts: 2_000, tauxDeRetour: 0.04, objectif: "conatif" },
  { code: "posts", nom: "Publications sponsorisées", cout: 400, contacts: 20_000, tauxDeRetour: 0.006, objectif: "cognitif" },
  { code: "vitrine", nom: "Vitrine et publicité sur le lieu de vente", cout: 900, contacts: 30_000, tauxDeRetour: 0.01, objectif: "conatif" },
  { code: "soiree", nom: "Soirée tricot en boutique", cout: 350, contacts: 40, tauxDeRetour: 1, objectif: "affectif" },
];

/** Le budget de communication du mois : la publicité de la fiche. */
export const budgetDuMois = (f: FicheDeLaBoutique) => f.charges.publicite;

/**
 * LES PUBLICATIONS SPONSORISÉES, EN DÉTAIL (hypothèse du cours) : la régie touche 50 personnes par euro,
 * jusqu'à toute l'audience des 5 km, 25 000 personnes ; au-delà, elle montre les mêmes publications
 * aux mêmes personnes, et le retour n'augmente plus.
 */
export const CONTACTS_PAR_EURO_DES_POSTS = 50;
export const AUDIENCE_DES_POSTS = 25_000;

/** Ce que les entrées font vendre et laisser : les ventes et la marge d'une vente des passants de janvier. */
export function rendementDesEntrees(f: FicheDeLaBoutique, entrees: number) {
  const p = passantsDeJanvier(f);
  const ventes = Math.round(entrees * p.tauxDeTransformation);
  return { entrees, ventes, marge: auCentime(ventes * p.margeDUneVente) };
}

/** Une action de communication : son coût par contact, ses entrées, ses ventes, sa marge, ce qu'elle laisse et son retour. */
export function actionDeCommunication(f: FicheDeLaBoutique, s: Pick<SupportDeCommunication, "cout" | "contacts" | "tauxDeRetour">) {
  const entrees = Math.round(s.contacts * s.tauxDeRetour);
  const r = rendementDesEntrees(f, entrees);
  const laisse = auCentime(r.marge - s.cout);
  return {
    cout: s.cout,
    contacts: s.contacts,
    coutParContact: s.cout / s.contacts,
    ...r,
    laisse,
    retourSurInvestissement: s.cout > 0 ? laisse / s.cout : 0,
  };
}

/** Chaque support, chiffré. */
export function supportsChiffres(f: FicheDeLaBoutique) {
  return SUPPORTS.map((s) => ({ ...s, ...actionDeCommunication(f, s) }));
}

/** Les publications sponsorisées pour un budget donné, plafonnées par l'audience. */
export function postsPour(f: FicheDeLaBoutique, budget: number) {
  const posts = SUPPORTS.find((s) => s.code === "posts")!;
  return actionDeCommunication(f, { cout: budget, contacts: Math.min(budget * CONTACTS_PAR_EURO_DES_POSTS, AUDIENCE_DES_POSTS), tauxDeRetour: posts.tauxDeRetour });
}

/** Un plan : la vitrine ou non, et un budget de publications ; ce qu'il coûte et ce qu'il laisse. */
export function planDeCommunication(f: FicheDeLaBoutique, avecLaVitrine: boolean, budgetDesPosts: number, budget: number = budgetDuMois(f)) {
  const vitrine = actionDeCommunication(f, SUPPORTS.find((s) => s.code === "vitrine")!);
  const posts = postsPour(f, budgetDesPosts);
  const cout = (avecLaVitrine ? vitrine.cout : 0) + budgetDesPosts;
  const laisse = auCentime((avecLaVitrine ? vitrine.laisse : 0) + posts.laisse);
  return { avecLaVitrine, budgetDesPosts, vitrine, posts, cout, laisse, dansLeBudget: cout <= budget };
}

/**
 * LE BUDGET COUPÉ (hypothèse du cas « Mille euros pour communiquer ») : la direction ramène la
 * publicité du mois de 1 500 € à 1 000 €.
 */
export const BUDGET_COUPE = 1_000;

/** Le meilleur plan dans un budget : la vitrine ou non, et des publications de 0 à 1 000 €, par 100 €. */
export function meilleurPlan(f: FicheDeLaBoutique, budget: number = budgetDuMois(f)) {
  const plans = [false, true].flatMap((v) => Array.from({ length: 11 }, (_, i) => planDeCommunication(f, v, i * 100, budget))).filter((x) => x.dansLeBudget);
  return plans.reduce((a, b) => (b.laisse > a.laisse ? b : a));
}

/** Les entrées qu'il faut à une action pour se payer : la plus petite qui laisse au moins son coût en marge. */
export function entreesQuiPaient(f: FicheDeLaBoutique, cout: number) {
  for (let e = 0; e <= 100_000; e++) if (rendementDesEntrees(f, e).marge >= cout) return e;
  throw new Error("Aucune affluence ne paie l'action");
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CADRE LÉGAL DE LA COMMUNICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA PROSPECTION PAR SMS (code des postes et des communications électroniques, art. L. 34-5) : envoyer
 * un message commercial à un particulier demande son consentement préalable, et chaque message
 * donne un moyen gratuit de refuser les suivants (« STOP SMS »). Le fichier loué n'a pas ce consentement.
 */
export const SMS_DU_FICHIER_LOUE_CONSENTI = false;

/**
 * LES INFLUENCEURS (loi du 9 juin 2023) : une publication faite contre rémunération ou avantage porte
 * la mention « Publicité » ou « Collaboration commerciale », lisible pendant toute sa durée.
 */
export const MENTION_DE_L_INFLUENCE = "Publicité";
