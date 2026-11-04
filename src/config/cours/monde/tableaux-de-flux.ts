import { auCentime } from "./amortissement";
import { cloture, sommeDesComptes, type LeviersDeLaCloture } from "./cloture";
import { SECONDE_LIGNE } from "./comptabilite-approfondie";
import type { FicheDeLExercice } from "./exercice-de-nova";
import { TAUX_DE_TVA } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LE TABLEAU DE FINANCEMENT ET LE TABLEAU DES FLUX DE TRÉSORERIE DE NOVA.
 *
 * Les chapitres « Le tableau de financement » et « Le tableau des flux de trésorerie » le lisent,
 * avec leurs cas. Tout part de la clôture du premier exercice (monde/cloture.ts, `cloture`), celle
 * du chapitre « Bilan fonctionnel et BFR » : mêmes soldes, même capacité d'autofinancement, même
 * bilan fonctionnel (une seule NOVA).
 *
 * LE BILAN D'OUVERTURE EST VIDE : NOVA est créée le 2 janvier (l'apport des associés), son premier
 * exercice n'a pas d'exercice précédent. Le tableau d'un premier exercice compare donc la clôture à
 * des masses nulles : chaque variation vaut le poste du 31 décembre, et les flux de l'année
 * expliquent tout le bilan. C'est la colonne « N − 1 » vide du modèle du plan comptable.
 *
 *   1. LE TABLEAU DE FINANCEMENT (PCG, modèle en deux parties) :
 *      · partie I, les emplois et les ressources stables de l'exercice : acquisitions
 *        d'immobilisations (hors taxes), remboursements d'emprunts, dividendes ; capacité
 *        d'autofinancement, cessions, augmentation de capital, nouveaux emprunts ; la variation du
 *        fonds de roulement net global en est le solde ;
 *      · partie II, l'emploi de cette variation : la variation du besoin d'exploitation (stocks,
 *        créances et dettes d'exploitation, EN VALEURS BRUTES, puisque la CAF a déjà rendu les
 *        dépréciations), du besoin hors exploitation, et de la trésorerie nette.
 *   2. LE TABLEAU DES FLUX DE TRÉSORERIE (modèle de l'Ordre des experts-comptables, méthode
 *      indirecte) : les flux de l'activité (le résultat net, plus les amortissements et les
 *      provisions SAUF les dépréciations de l'actif circulant, soit la marge brute
 *      d'autofinancement, moins la variation du besoin en fonds de roulement lié à l'activité, EN
 *      VALEURS NETTES, impôt et intérêts compris), d'investissement et de financement. Leur somme
 *      est la variation de la trésorerie, la même que celle de la partie II.
 *
 * LA TRÉSORERIE est celle du bilan fonctionnel : la banque, le compte à terme et ses intérêts courus
 * (un placement d'un an au plus). Le chapitre des flux discute ce choix : un placement bloqué un an
 * ne serait pas un « équivalent de trésorerie » au sens strict (moins de trois mois).
 */

/**
 * LE REMBOURSEMENT ANTICIPÉ DU LABORATOIRE (hypothèse du cours) : NOVA rembourserait le 31 décembre,
 * en plus des échéances, une part du capital restant dû, sans indemnité ; les intérêts courus jusqu'à
 * cette date restent dus et se paient le 3 janvier avec l'échéance. Le résultat ne bouge pas : seuls
 * l'emprunt et la banque baissent, d'autant.
 */
export const REMBOURSEMENT_ANTICIPE = { max: 68_000, pas: 4_000 } as const;

/**
 * LA SECONDE LIGNE PAYÉE EN DÉCEMBRE (hypothèse du cas « La seconde ligne payée en décembre ») : la
 * seconde ligne de N + 1 (monde/comptabilite-approfondie.ts, 60 000 € hors taxes, mise en service le
 * 2 janvier N + 1) serait facturée et payée comptant le 31 décembre, TVA comprise. Elle ne s'amortit
 * pas en N (elle n'est pas en service) : le résultat ne bouge pas. Sa TVA, déductible sur la
 * déclaration de janvier, est une créance hors exploitation au 31 décembre.
 */
export const SECONDE_LIGNE_PAYEE_EN_DECEMBRE = { ht: SECONDE_LIGNE.ht, tva: auCentime(SECONDE_LIGNE.ht * TAUX_DE_TVA) } as const;

/** Ce qu'une variante ajoute à la clôture de la fiche, sans toucher au résultat. */
export interface VarianteDesFlux {
  /** Le capital remboursé par anticipation le 31 décembre (REMBOURSEMENT_ANTICIPE). */
  remboursementAnticipe?: number;
  /** Une immobilisation achetée et payée le 31 décembre, hors taxes et TVA (SECONDE_LIGNE_PAYEE_EN_DECEMBRE). */
  investissementDeDecembre?: { ht: number; tva: number };
}

const CLOTURES = new Map<string, ReturnType<typeof cloture>>();

/** La clôture à des leviers donnés, mise de côté : les laboratoires la relisent souvent. */
export function clotureDesFlux(f: FicheDeLExercice, leviers: Partial<LeviersDeLaCloture> = {}) {
  const cle = `${f.code}|${JSON.stringify(Object.entries(leviers).sort())}`;
  let k = CLOTURES.get(cle);
  if (!k) {
    k = cloture(f, leviers);
    CLOTURES.set(cle, k);
  }
  return k;
}

/**
 * LE TABLEAU DE FINANCEMENT DE L'EXERCICE, ses deux parties, à partir d'un bilan d'ouverture vide.
 * Les postes se lisent sur les soldes de la clôture et sur le bilan fonctionnel du modèle.
 */
export function tableauDeFinancement(f: FicheDeLExercice, leviers: Partial<LeviersDeLaCloture> = {}, v: VarianteDesFlux = {}) {
  const k = clotureDesFlux(f, leviers);
  const s = k.soldes;
  const fo = k.fonctionnel;
  const anticipe = v.remboursementAnticipe ?? 0;
  const inv = v.investissementDeDecembre ?? { ht: 0, tva: 0 };
  const credit = (prefixes: readonly string[], sauf: readonly string[] = []) => auCentime(-sommeDesComptes(s, prefixes, sauf));

  // PARTIE I : les emplois et les ressources stables de l'exercice.
  const empruntRestant = auCentime(credit(["16"], ["1688"]) - anticipe);
  const emplois = {
    dividendes: 0,
    acquisitions: auCentime(fo.emploisStables + inv.ht),
    remboursements: auCentime(f.pret.capital - empruntRestant),
  };
  const ressources = {
    caf: k.caf.additive,
    cessions: 0,
    augmentationDeCapital: credit(["101"]),
    nouveauxEmprunts: f.pret.capital,
  };
  const totalDesEmplois = auCentime(emplois.dividendes + emplois.acquisitions + emplois.remboursements);
  const totalDesRessources = auCentime(ressources.caf + ressources.cessions + ressources.augmentationDeCapital + ressources.nouveauxEmprunts);
  const variationDuFondsDeRoulement = auCentime(totalDesRessources - totalDesEmplois);

  // PARTIE II : l'emploi de la variation, en valeurs brutes (ouverture vide : chaque variation vaut le poste).
  const stocks = sommeDesComptes(s, ["3"], ["39"]);
  const creancesDExploitation = auCentime(fo.actifDExploitation - stocks);
  const dettesDExploitation = fo.passifDExploitation;
  const variationDExploitation = auCentime(stocks + creancesDExploitation - dettesDExploitation);
  const autresDebiteurs = auCentime(fo.actifHorsExploitation + inv.tva);
  const autresCrediteurs = fo.passifHorsExploitation;
  const variationHorsExploitation = auCentime(autresDebiteurs - autresCrediteurs);
  const variationDuBesoin = auCentime(variationDExploitation + variationHorsExploitation);
  const disponibilites = auCentime(fo.tresorerieActive - anticipe - inv.ht - inv.tva);
  const concoursBancaires = fo.tresoreriePassive;
  const variationDeTresorerie = auCentime(disponibilites - concoursBancaires);

  return {
    k,
    emplois,
    ressources,
    totalDesEmplois,
    totalDesRessources,
    variationDuFondsDeRoulement,
    /** Le fonds de roulement du 31 décembre, lu au bilan fonctionnel : la vérification de la partie I. */
    fondsDeRoulementDeCloture: auCentime(fo.fondsDeRoulement - anticipe - inv.ht),
    empruntRestant,
    partie2: {
      stocks,
      creancesDExploitation,
      dettesDExploitation,
      variationDExploitation,
      autresDebiteurs,
      autresCrediteurs,
      variationHorsExploitation,
      variationDuBesoin,
      disponibilites,
      concoursBancaires,
      variationDeTresorerie,
      /** Le total A + B + C, qui retombe sur la variation du fonds de roulement. */
      total: auCentime(variationDuBesoin + variationDeTresorerie),
    },
    /** Le compte courant du 31 décembre, hors compte à terme. */
    compteCourant: auCentime((s["512"] ?? 0) - anticipe - inv.ht - inv.tva),
  };
}

export type TableauDeFinancement = ReturnType<typeof tableauDeFinancement>;

/**
 * LE TABLEAU DES FLUX DE TRÉSORERIE DE L'EXERCICE (modèle de l'Ordre des experts-comptables, méthode
 * indirecte), à partir d'un bilan d'ouverture vide.
 */
export function tableauDesFlux(f: FicheDeLExercice, leviers: Partial<LeviersDeLaCloture> = {}, v: VarianteDesFlux = {}) {
  const t = tableauDeFinancement(f, leviers, v);
  const k = t.k;
  const s = k.soldes;
  const fo = k.fonctionnel;
  const resultatNet = k.resultatNet;
  // Les dotations, poste par poste : aux amortissements, aux provisions pour risques, aux dépréciations de l'actif circulant.
  const amortissements = sommeDesComptes(s, ["6811", "6871"]);
  const provisions = sommeDesComptes(s, ["6815", "6865", "6875"]);
  const depreciationsDeLActifCirculant = sommeDesComptes(s, ["6817", "6866"]);
  const reprises = k.caf.reprises;
  const margeBruteDAutofinancement = auCentime(resultatNet + amortissements + provisions - reprises);
  // Le besoin lié à l'activité, en valeurs nettes : le besoin du bilan fonctionnel, moins les dépréciations des stocks et des créances.
  const depreciationsAuBilan = auCentime(-sommeDesComptes(s, ["39", "49"]));
  const besoinNetDeLActivite = auCentime(t.partie2.variationDuBesoin - depreciationsAuBilan);
  const fluxDeLActivite = auCentime(margeBruteDAutofinancement - besoinNetDeLActivite);
  const fluxDInvestissement = auCentime(-t.emplois.acquisitions + t.ressources.cessions);
  const fluxDeFinancement = auCentime(t.ressources.augmentationDeCapital - t.emplois.dividendes + t.ressources.nouveauxEmprunts - t.emplois.remboursements);
  const variationDeTresorerie = auCentime(fluxDeLActivite + fluxDInvestissement + fluxDeFinancement);
  // L'excédent de trésorerie d'exploitation : l'EBE moins la variation du besoin d'exploitation (en brut).
  const excedentDeTresorerieDExploitation = auCentime(k.sig.excedentBrutDExploitation - fo.besoinDExploitation);
  return {
    t,
    k,
    resultatNet,
    amortissements,
    provisions,
    depreciationsDeLActifCirculant,
    reprises,
    margeBruteDAutofinancement,
    caf: k.caf.additive,
    depreciationsAuBilan,
    besoinBrut: t.partie2.variationDuBesoin,
    besoinNetDeLActivite,
    fluxDeLActivite,
    fluxDInvestissement,
    fluxDeFinancement,
    variationDeTresorerie,
    tresorerieDOuverture: 0,
    tresorerieDeCloture: t.partie2.variationDeTresorerie,
    excedentDeTresorerieDExploitation,
    /** Le flux disponible : ce que l'activité laisse une fois l'investissement payé. */
    fluxDisponible: auCentime(fluxDeLActivite + fluxDInvestissement),
    /** Ce qui reste du flux disponible une fois l'emprunt remboursé, avant tout dividende. */
    fluxApresRemboursement: auCentime(fluxDeLActivite + fluxDInvestissement - t.emplois.remboursements),
  };
}

export type TableauDesFlux = ReturnType<typeof tableauDesFlux>;
