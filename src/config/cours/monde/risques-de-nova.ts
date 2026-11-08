import { compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { PRIX_DU_JEU } from "./approvisionnement-de-nova";

/**
 * LE MONDE DU COURS : LES RISQUES DE LA PERFORMANCE DE NOVA (le chapitre « Les risques de la
 * performance », SGN de première T4.2).
 *
 * CE QUI VIENT DES FICHES : l'année N de NOVA (comptes-du-lycee.ts) : ses enceintes vendues, ses ventes,
 * les charges de son activité et son résultat d'activité ; le prix d'un jeu de composants chez
 * Électro-Composants Lyon, son seul fournisseur (22 €, approvisionnement-de-nova.ts) ; le prix et le coût
 * variable d'une enceinte (59 € et 38 €).
 *
 * LES RÈGLES DU CHAPITRE : un risque se chiffre sur l'année N rejouée, toutes choses égales par ailleurs.
 * Un euro de plus sur un jeu coûte un euro par enceinte vendue ; une enceinte qui ne se vend pas fait
 * perdre sa marge sur coût variable (le prix moins le coût variable) ; un mois sans composants fait
 * perdre un douzième des ventes de l'année (les ventes sont supposées régulières).
 *
 * LES HYPOTHÈSES DU COURS, dites ici : les trois risques chiffrés (une hausse de 10 % du jeu, une baisse
 * de 15 % de la demande, un mois de rupture) ; un second fournisseur qui vend le jeu 1 € de plus, et qui
 * peut livrer la part des jeux qu'on lui confie, pas davantage.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

export const RISQUES_CHIFFRES = { hausseDuJeu: 0.1, baisseDeLaDemande: 0.15, moisDeRupture: 1 } as const;

export const SECOND_FOURNISSEUR = { surcoutParJeu: 1 } as const;

/** Les parts des jeux qu'on peut confier au second fournisseur, dans le laboratoire. */
export const PARTS_DU_SECOND = [0, 0.25, 0.5, 0.75, 1] as const;

let annee: ReturnType<typeof calculer> | undefined;

function calculer() {
  const f = exerciceDe("nova");
  const k = compteDuLycee(f);
  const margeUnitaire = auCentime(f.prixDeLEnceinte - (f.fournisseur.prixDuJeu + f.autresCoutsDeLEnceinte));
  return { quantite: k.quantite, ventes: k.ventes, activite: auCentime(k.ventes - k.resultatDActivite), resultat: k.resultatDActivite, margeUnitaire };
}

/** L'année N de NOVA, telle que les risques la rejouent (calculée une fois). */
export const anneeDesRisques = () => (annee ??= calculer());

/** Le résultat d'activité si le jeu de composants coûtait le prix donné. */
export function resultatAuPrixDuJeu(prix: number) {
  const a = anneeDesRisques();
  const surcout = auCentime((prix - PRIX_DU_JEU) * a.quantite);
  return { surcout, charges: auCentime(a.activite + surcout), resultat: auCentime(a.resultat - surcout) };
}

/** Ce que chacun des trois risques retire au résultat d'activité de l'année. */
export function troisRisques() {
  const a = anneeDesRisques();
  const r = RISQUES_CHIFFRES;
  const hausse = auCentime(PRIX_DU_JEU * r.hausseDuJeu * a.quantite);
  const baisse = auCentime(a.quantite * r.baisseDeLaDemande * a.margeUnitaire);
  const rupture = auCentime(((a.quantite * r.moisDeRupture) / 12) * a.margeUnitaire);
  return { hausse, baisse, rupture, resultat: a.resultat };
}

/** Le plus haut prix du jeu, à l'euro, qui laisse le résultat d'activité positif. */
export const PRIX_DU_JEU_LE_PLUS_HAUT = Math.floor(PRIX_DU_JEU + anneeDesRisques().resultat / anneeDesRisques().quantite + 1e-9);

/**
 * DIVERSIFIER : une part des jeux achetée au second fournisseur. Le surcoût se paie toute l'année ; si
 * l'un des deux fournisseurs s'arrête pendant les mois de rupture, NOVA perd la part qu'il livrait. Le
 * pire des cas est la plus grosse perte des deux arrêts possibles.
 */
export function diversifier(partDuSecond: number, moisDeRupture: number = RISQUES_CHIFFRES.moisDeRupture) {
  const a = anneeDesRisques();
  const surcout = auCentime(partDuSecond * a.quantite * SECOND_FOURNISSEUR.surcoutParJeu);
  const perteSiUnFournisseurSArrete = auCentime(Math.max(partDuSecond, 1 - partDuSecond) * ((a.quantite * moisDeRupture) / 12) * a.margeUnitaire);
  return {
    surcout,
    perteSiUnFournisseurSArrete,
    sansRupture: auCentime(a.resultat - surcout),
    pireDesCas: auCentime(a.resultat - surcout - perteSiUnFournisseurSArrete),
  };
}

/** La part confiée au second fournisseur qui donne le meilleur résultat dans le pire des cas. */
export const PART_LA_PLUS_SURE = PARTS_DU_SECOND.reduce((m, p) => (diversifier(p).pireDesCas > diversifier(m).pireDesCas ? p : m));
