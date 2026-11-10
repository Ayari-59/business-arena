import { compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { HAUT_VERDASSE_HANDBALL } from "./haut-verdasse-handball";

/**
 * LE MONDE DU COURS : UNE OFFRE POUR UN BESOIN, CHEZ NOVA (management, sciences de gestion et numérique
 * de terminale STMG, enseignement commun, question 1.1, lot C du chantier STMG).
 *
 * CE QUI VIENT DES FICHES : la valeur ajoutée de l'année N de NOVA (comptes-du-lycee.ts, sur la clôture
 * du 31 décembre : les ventes moins les consommations venues des fournisseurs) ; le club de handball du
 * territoire (haut-verdasse-handball.ts), l'un des clubs qui ont dit leur besoin.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LE BESOIN : les clubs et les associations sportives veulent sonoriser une salle pour un match ou
 *     une fête sans technicien ni table de mixage. NOVA l'a lu dans les avis de ses clients et dans la
 *     veille de ses concurrents : aucune offre simple n'existe ;
 *   · L'ÉTUDE DE MARCHÉ : 320 clubs et associations sportives dans les départements que NOVA livre ;
 *     un questionnaire envoyé à 80 d'entre eux, 60 réponses, dont 15 se disent prêts à acheter un pack ;
 *   · LE PACK « NOVA Salle » : 4 enceintes One appairées et un pied, vendus 450 € hors taxes ; les
 *     consommations venues des fournisseurs (composants, pied, emballage, transport) font 210 € par pack.
 *     Le compte prévisionnel compte 80 packs la première année ;
 *   · L'APPLICATION « NOVA Live », qui règle les enceintes depuis un téléphone : gratuite pour tous,
 *     9 000 utilisateurs actifs attendus, et une formule premium (plusieurs salles, des réglages
 *     enregistrés) à 3 € par mois. Elle coûte 18 000 € par an (hébergement, mises à jour, assistance).
 */

export const ENTREPRISES_DE_L_OFFRE = ENTREPRISES_DE_LA_DIRECTION;

export const ETUDE_DES_CLUBS = { clubsDeLaZone: 320, interroges: 80, reponses: 60, interesses: 15 } as const;
export const PACK_SALLE = { nom: "NOVA Salle", prix: 450, consommations: 210, packsPrevus: 80 } as const;
export const APPLICATION = { nom: "NOVA Live", utilisateurs: 9_000, premiumParMois: 3, coutAnnuel: 18_000 } as const;
/** Les taux de conversion à la formule premium que le laboratoire essaie, en points de pourcentage. */
export const CONVERSIONS_ESSAYEES = { min: 0, max: 15, pas: 1 } as const;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Ce que l'étude dit du marché : le taux d'intérêt des répondants, le marché potentiel et son chiffre d'affaires. */
export function marchePotentiel(prix: number = PACK_SALLE.prix) {
  const e = ETUDE_DES_CLUBS;
  const taux = e.interesses / e.reponses;
  const clubs = Math.round(e.clubsDeLaZone * taux);
  return { ...e, tauxPct: auDixieme(taux * 100), clubs, chiffreDAffaires: clubs * prix, tauxDeReponsePct: auDixieme((e.reponses / e.interroges) * 100) };
}

/** La valeur ajoutée de l'année N de NOVA : ce que l'entreprise a ajouté à ce qu'elle a acheté. */
export function valeurAjouteeDeN() {
  const c = compteDuLycee(exerciceDe("nova"));
  return { ventes: c.ventes, consommations: c.consommations, valeurAjoutee: c.valeurAjoutee, tauxPct: auDixieme((c.valeurAjoutee / c.ventes) * 100) };
}

/** Le compte prévisionnel du pack : chiffre d'affaires, consommations, valeur ajoutée (le personnel et la ligne existent déjà). */
export function packPrevisionnel(packs: number = PACK_SALLE.packsPrevus, prix: number = PACK_SALLE.prix) {
  const chiffreDAffaires = packs * prix;
  const consommations = packs * PACK_SALLE.consommations;
  return { packs, prix, chiffreDAffaires, consommations, valeurAjoutee: chiffreDAffaires - consommations, parPack: prix - PACK_SALLE.consommations };
}

/** L'application en freemium, à un taux de conversion donné (en points) : ce qu'elle rapporte et ce qu'elle laisse. */
export function freemium(conversionPct: number) {
  const a = APPLICATION;
  const abonnes = Math.round((a.utilisateurs * conversionPct) / 100);
  const recettes = abonnes * a.premiumParMois * 12;
  return { conversionPct, abonnes, recettes, cout: a.coutAnnuel, solde: auCentime(recettes - a.coutAnnuel), gratuits: a.utilisateurs - abonnes };
}

/** Le plus petit taux de conversion, de point en point, pour lequel l'application paie son coût. */
export function conversionQuiPaie() {
  let t = CONVERSIONS_ESSAYEES.min;
  while (t < CONVERSIONS_ESSAYEES.max && freemium(t).solde < 0) t += CONVERSIONS_ESSAYEES.pas;
  return t;
}

/** Le club du territoire, l'un des répondants. */
export const CLUB_REPONDANT = HAUT_VERDASSE_HANDBALL;

/**
 * LE CAS DU CHAPITRE (hypothèse du cours) : la même étude demandait aussi le prix de 390 € ; à ce prix,
 * 21 répondants sur 60 se disent prêts à acheter. Les consommations d'un pack ne changent pas.
 */
export const PRIX_REDUIT = { prix: 390, interesses: 21 } as const;

/** Le pack à un prix et à la part des répondants qui l'achèteraient : clubs, chiffre d'affaires, valeur ajoutée. */
export function packAuPrix(prix: number, interesses: number) {
  const e = ETUDE_DES_CLUBS;
  const clubs = Math.round((e.clubsDeLaZone * interesses) / e.reponses);
  const p = packPrevisionnel(clubs, prix);
  return { ...p, clubs };
}
