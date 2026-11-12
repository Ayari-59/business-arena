import { eur, nombreAuCentieme, quotient2 } from "../../../pedagogy/cours/deux-decimales";
import { auCentime } from "./amortissement";

/**
 * LE MODÈLE DE LA PAIE DU COURS : du brut au net, du net au brut, le coût employeur.
 *
 * Des fonctions pures : le brut, les taux et l'acompte sont des paramètres (un laboratoire change
 * la prime, le taux patronal ou le taux du prélèvement à la source). La paie de NOVA est dans
 * monde/exercice-de-nova.ts.
 *
 *   · COTISATIONS SALARIALES : brut × taux (URSSAF, retraite complémentaire), chacune au centime ;
 *     net avant impôt = brut − cotisations salariales.
 *   · NET IMPOSABLE : le net avant impôt plus la CSG et la CRDS non déductibles, retenues sur le
 *     salaire mais que l'impôt ne déduit pas : brut × assiette de la CSG × leur taux.
 *   · PRÉLÈVEMENT À LA SOURCE : net imposable × le taux transmis par l'administration ; net à payer
 *     = net avant impôt − prélèvement − acompte déjà versé.
 *   · COTISATIONS PATRONALES : brut × taux ; coût employeur = brut + cotisations patronales.
 *   · DU NET AU BRUT : le net à payer est affine en brut, net = brut × k − acompte, avec
 *     k = (1 − ts) − tPAS × ((1 − ts) + tCSG × assiette) ; le brut est (net + acompte) ÷ k, puis le
 *     plus petit brut au centime dont le bulletin, arrondis compris, verse le net promis.
 */

export interface TauxDeLaPaie {
  salarialUrssaf: number;
  salarialRetraite: number;
  patronalUrssaf: number;
  patronalRetraite: number;
  /** La CSG et la CRDS non déductibles (2,4 % + 0,5 %), comprises dans la part salariale URSSAF. */
  csgCrdsNonDeductible: number;
  /** L'assiette de la CSG et de la CRDS : le brut après l'abattement pour frais professionnels. */
  assietteDeLaCsg: number;
  /** Le taux moyen du prélèvement à la source transmis par l'administration. */
  prelevementALaSource: number;
}

/** Le bulletin (ou le récapitulatif des bulletins) d'un mois. */
export function bulletinDePaie(brut: number, t: TauxDeLaPaie, acompte = 0) {
  const salarialUrssaf = auCentime(brut * t.salarialUrssaf);
  const salarialRetraite = auCentime(brut * t.salarialRetraite);
  const cotisationsSalariales = auCentime(salarialUrssaf + salarialRetraite);
  const netAvantImpot = auCentime(brut - cotisationsSalariales);
  const csgCrdsNonDeductible = auCentime(brut * t.assietteDeLaCsg * t.csgCrdsNonDeductible);
  const netImposable = auCentime(netAvantImpot + csgCrdsNonDeductible);
  const prelevementALaSource = auCentime(netImposable * t.prelevementALaSource);
  const netAPayer = auCentime(netAvantImpot - prelevementALaSource - acompte);
  const patronalUrssaf = auCentime(brut * t.patronalUrssaf);
  const patronalRetraite = auCentime(brut * t.patronalRetraite);
  const cotisationsPatronales = auCentime(patronalUrssaf + patronalRetraite);
  return {
    brut,
    cotisationsSalariales: { urssaf: salarialUrssaf, retraite: salarialRetraite, total: cotisationsSalariales },
    netAvantImpot,
    csgCrdsNonDeductible,
    netImposable,
    prelevementALaSource,
    acompte,
    netAPayer,
    /** Ce que les salariés reçoivent dans le mois, acompte compris. */
    verseAuxSalaries: auCentime(netAPayer + acompte),
    cotisationsPatronales: { urssaf: patronalUrssaf, retraite: patronalRetraite, total: cotisationsPatronales },
    coutEmployeur: auCentime(brut + cotisationsPatronales),
    /** Ce qui se paie le mois suivant : à l'URSSAF, à la caisse de retraite, à l'État. */
    aVerser: {
      urssaf: auCentime(salarialUrssaf + patronalUrssaf),
      retraite: auCentime(salarialRetraite + patronalRetraite),
      etat: prelevementALaSource,
      total: auCentime(salarialUrssaf + patronalUrssaf + salarialRetraite + patronalRetraite + prelevementALaSource),
    },
  };
}

/** Le coefficient qui mène du brut au net à payer (avant acompte) : net = brut × k. */
export function coefficientDuBrutAuNet(t: TauxDeLaPaie) {
  const ts = t.salarialUrssaf + t.salarialRetraite;
  return 1 - ts - t.prelevementALaSource * (1 - ts + t.csgCrdsNonDeductible * t.assietteDeLaCsg);
}

/**
 * Le plus petit brut, au centime, dont le bulletin verse au moins le net à payer donné : la droite
 * donne l'estimation, les arrondis du bulletin l'ajustent d'un centime ou deux.
 */
export function brutPourUnNetAPayer(netAPayer: number, t: TauxDeLaPaie, acompte = 0) {
  let brut = Math.ceil(((netAPayer + acompte) / coefficientDuBrutAuNet(t)) * 100 - 1e-6) / 100;
  while (bulletinDePaie(auCentime(brut - 0.01), t, acompte).netAPayer >= netAPayer) brut = auCentime(brut - 0.01);
  while (bulletinDePaie(brut, t, acompte).netAPayer < netAPayer) brut = auCentime(brut + 0.01);
  return brut;
}

/**
 * Le chemin de l'élève, du net promis au plus petit brut au centime (deux-decimales.ts : chaque ligne
 * arrondie, le corrigé suit la copie). Il part d'un brut calculé (le net ÷ le net pour 100 € bruts),
 * lit le bulletin, puis descend (ou monte) d'un centime tant qu'il le faut : les bruts essayés, avec le
 * net que chacun verse, jusqu'au premier qui ne suffit plus.
 */
export function duNetAuBrutPasAPas(netAPayer: number, t: TauxDeLaPaie, depart: number) {
  const essai = (brut: number) => ({ brut, net: bulletinDePaie(brut, t).netAPayer });
  const essais = [essai(depart)];
  if (essais[0]!.net >= netAPayer) {
    while (essais[essais.length - 1]!.net >= netAPayer) essais.push(essai(auCentime(essais[essais.length - 1]!.brut - 0.01)));
    return { essais, brut: essais[essais.length - 2]!.brut };
  }
  while (essais[essais.length - 1]!.net < netAPayer) essais.push(essai(auCentime(essais[essais.length - 1]!.brut + 0.01)));
  return { essais, brut: essais[essais.length - 1]!.brut };
}

/** Le même chemin, écrit pour le corrigé : « 500 € ÷ 76,38 % = 654,62 €, dont le bulletin verse 500,02 €. Un centime de moins à chaque essai… ». */
export function cheminDuNetAuBrut(netAPayer: number, t: TauxDeLaPaie, netPour100: number) {
  const depart = quotient2(netAPayer * 100, netPour100);
  const { essais, brut } = duNetAuBrutPasAPas(netAPayer, t, depart);
  const [premier, ...suivants] = essais;
  const verse = (e: { brut: number; net: number }) => `${eur(e.brut)} (${eur(e.net)})`;
  const debut = `${eur(netAPayer)} ÷ ${nombreAuCentieme(netPour100)} % = ${eur(depart)}, dont le bulletin verse ${eur(premier!.net)}`;
  if (suivants.length === 0) return { brut, calcul: debut, depart };
  const dernier = suivants[suivants.length - 1]!;
  const descend = dernier.brut < premier!.brut;
  const milieu = suivants.slice(0, -1).map(verse);
  const fin = descend ? `${eur(dernier.brut)} (${eur(dernier.net)}, trop peu)` : verse(dernier);
  // Une phrase par étape, pour rester court : le calcul, les essais au centime, la conclusion.
  const calcul = `${debut}. ${descend ? "Un centime de moins à chaque essai" : "Un centime de plus à chaque essai"} : ${[...milieu, fin].join(", ")}. Le plus petit brut qui verse ${eur(netAPayer)} : ${eur(brut)}`;
  return { brut, calcul, depart };
}

/** Le brut qu'il faut pour un net avant impôt donné (au centime supérieur). */
export function brutPourUnNetAvantImpot(net: number, t: TauxDeLaPaie) {
  return Math.ceil((net / (1 - t.salarialUrssaf - t.salarialRetraite)) * 100 - 1e-6) / 100;
}

/** Le brut le plus élevé pour un coût employeur donné (au centime inférieur). */
export function brutPourUnCoutEmployeur(cout: number, t: TauxDeLaPaie) {
  return Math.floor((cout / (1 + t.patronalUrssaf + t.patronalRetraite)) * 100 + 1e-6) / 100;
}
