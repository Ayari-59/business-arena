import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";

/** Au centime, sans zéro négatif : −0,001 € s'écrit 0 €, pas « −0 € ». */
const centime = (x: number) => auCentime(x) || 0;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** « gagne 3 622 € » ou « perd 2 971 € » : un gain négatif se dit comme une perte. */
const gagne = (x: number) => (x >= 0 ? `gagne ${eur(x)}` : `perd ${eur(-x)}`);
/** Un taux déjà en pour cent : 25 donne « 25 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/**
 * Le cours calcule sur les résultats trimestriels arrondis au centime, l'arène sur ses montants
 * exacts : quand un total de l'arène s'en écarte d'un centime, le texte le dit.
 */
const aLArrondiPres = (arene: number, cours: number) =>
  Math.abs(arene - cours) >= 0.005 ? `, à ${eur(auCentime(Math.abs(arene - cours)))} d'arrondi près` : "";

/**
 * CHAPITRE : L'IMPÔT SUR LES SOCIÉTÉS, DU RÉSULTAT À L'IMPÔT (fiscalité de l'entreprise,
 * palier 3).
 *
 * L'année du cours (`anneeJouee`), ses quatre trimestres, telle que l'arène la joue aujourd'hui :
 * l'impôt sur l'exercice (`impotSurLExercice`). Le chapitre part des résultats avant impôt des
 * quatre trimestres, calcule l'impôt de l'exercice au taux du scénario, le résultat net et le
 * taux effectif, puis refait ce que le moteur fait chaque trimestre : l'acompte, l'impôt du
 * résultat cumulé depuis le début de l'exercice moins les acomptes déjà versés, qui devient un
 * remboursement quand un trimestre de perte fait baisser le cumul (src/engine/finance/statements.ts).
 *
 * CE QUE LE MOTEUR FAIT, ET RIEN DE PLUS. Un seul taux, celui du scénario (`finance.taxRate`), sur
 * tout le bénéfice : pas de taux réduit. Le bénéfice imposable est le résultat avant impôt, sans
 * réintégration ni déduction. L'acompte sort de la trésorerie dans le trimestre (le flux
 * « impot ») et le bilan ne porte aucune dette d'impôt : au 31 décembre, l'exercice est soldé.
 * Le chapitre le dit, et dit en quoi le droit diffère ; le taux réduit du droit n'est chiffré
 * que comme une hypothèse du cours (`TAUX_REDUIT_DU_DROIT`), pour mesurer la simplification.
 *
 * Ce n'est pas « La clôture », qui calcule l'impôt depuis la balance et le passe au journal (695
 * et 444) : ici, l'impôt se calcule depuis les trimestres, et le chapitre suit son paiement.
 *
 * LES ENTREPRISES. Tenue par le bon gestionnaire, l'année du cours finit en bénéfice dans toutes
 * les entreprises : le chapitre se joue partout, et ne restreint pas ses entreprises (la garde
 * recompte). « Le déficit reporté » fait perdre une année en bénéfice par une décision du chapitre
 * (`FACTEUR_DU_GRAND_ENTRETIEN`).
 *
 * CE QUI NE SE LIT PLUS. Dans cette année, aucun cumul n'est en perte à la fin du trimestre 3 et
 * aucun dernier acompte n'est rendu : l'explication des acomptes ne lit plus que sa branche « le
 * cumul était déjà en bénéfice ». Et toutes les entreprises gagnent plus que le plafond du taux
 * réduit : la branche « tout son bénéfice reste sous le plafond » ne se lit plus. Les branches
 * restent, justes, pour une autre année.
 */

/** Les entreprises où l'année du cours finit en bénéfice, celles où l'impôt se calcule : toutes. */
export const ENTREPRISES_IMPOSABLES = ["nova", "boutique", "hotel", "bistrot", "conseil", "ecommerce", "fitness", "batiment", "transport"] as const;

/** Le trimestre dont le chapitre fait calculer l'acompte : le dernier de l'exercice. */
export const TRIMESTRE_DE_L_ACOMPTE = 4;

/**
 * LE TAUX RÉDUIT DU DROIT, QUE L'ARÈNE N'APPLIQUE PAS : une hypothèse du cours, pour mesurer ce
 * que la simplification change. Article 219, I-b du code général des impôts, pour les exercices
 * ouverts depuis le 1er janvier 2023 : 15 % jusqu'à 42 500 € de bénéfice, le taux normal au-delà,
 * pour une PME dont le chiffre d'affaires hors taxes reste sous 10 millions d'euros et dont le
 * capital, entièrement libéré, est détenu pour 75 % au moins par des personnes physiques.
 */
export const TAUX_REDUIT_DU_DROIT = 0.15;
export const PLAFOND_DU_TAUX_REDUIT = 42_500;
export const CHIFFRE_D_AFFAIRES_MAXIMAL_DU_TAUX_REDUIT = 10_000_000;
export const PART_DES_PERSONNES_PHYSIQUES = 0.75;

/** L'impôt du droit, si l'entreprise avait droit au taux réduit : 15 % jusqu'au plafond, le taux normal au-delà. */
export function impotAuTauxReduit(benefice: number, tauxNormal: number) {
  const base = Math.max(0, benefice);
  const reduite = Math.min(base, PLAFOND_DU_TAUX_REDUIT);
  const normale = auCentime(base - reduite);
  const aTauxReduit = auCentime(reduite * TAUX_REDUIT_DU_DROIT);
  const aTauxNormal = auCentime(normale * tauxNormal);
  return { reduite, normale, aTauxReduit, aTauxNormal, impot: auCentime(aTauxReduit + aTauxNormal) };
}

/** Un trimestre de l'exercice, tel que le moteur le compte. */
export interface TrimestreFiscal {
  trimestre: number;
  avantImpot: number;
  /** Le résultat avant impôt cumulé depuis le premier trimestre de l'exercice. */
  cumul: number;
  /** L'impôt de ce cumul : ce que l'exercice doit à la fin du trimestre. */
  du: number;
  /** L'acompte du trimestre : l'impôt du cumul moins les acomptes déjà versés (négatif : rendu). */
  acompte: number;
  /** L'impôt que l'arène inscrit au trimestre. */
  arene: number;
}

/** Les trimestres d'un exercice, l'acompte de chacun recalculé comme le moteur le calcule. */
export function trimestresFiscaux(tours: readonly CompanyRoundResult[], taux: number, report = 0): TrimestreFiscal[] {
  let cumul = 0;
  let verse = 0;
  return tours.map((r, i) => {
    const avantImpot = centime(r.incomeStatement.pretaxIncome);
    cumul = centime(cumul + avantImpot);
    const du = centime(taux * Math.max(0, cumul - report));
    const acompte = centime(du - verse);
    verse = du;
    return { trimestre: i + 1, avantImpot, cumul, du, acompte, arene: centime(r.incomeStatement.tax) };
  });
}

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** L'impôt de l'année du cours : les trimestres, l'exercice, le taux effectif, et le taux réduit en hypothèse. */
export function impotDeLAnnee(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const taux = scenarioByCode(c.code).scenario.finance.taxRate;
  const tours = anneeJouee(c.code).partie.rounds.map((t) => t.results["joueur"]!);
  const trimestres = trimestresFiscaux(tours, taux);
  const dernier = trimestres.at(-1)!;
  const avantImpot = dernier.cumul;
  const impot = dernier.du;
  const resultatNet = auCentime(avantImpot - impot);
  const tauxEffectif = avantImpot > 0 ? auCentieme((impot / avantImpot) * 100) : 0;
  // Le trimestre de l'acompte et celui qui le précède.
  const acompte = trimestres[TRIMESTRE_DE_L_ACOMPTE - 1]!;
  const avant = trimestres[TRIMESTRE_DE_L_ACOMPTE - 2]!;
  // Le premier trimestre où l'arène rend une part des acomptes : un trimestre de perte après un bon.
  const rendu = trimestres.find((t) => t.acompte < 0) ?? null;
  const reduit = impotAuTauxReduit(avantImpot, taux);
  return {
    taux,
    tauxPct: auCentieme(taux * 100),
    trimestres,
    avantImpot,
    impot,
    resultatNet,
    tauxEffectif,
    acompte,
    avant,
    rendu,
    // Ce que l'arène a inscrit sur l'année, trimestre après trimestre.
    impotDeLArene: centime(tours.reduce((t, r) => t + r.incomeStatement.tax, 0)),
    // Ce que les acomptes ont fait sortir de la trésorerie sur l'année.
    impotDecaisse: auCentime(-tours.reduce((t, r) => t + r.cashFlow.items.filter((i) => i.label === "impot").reduce((s, i) => s + i.amount, 0), 0)),
    chiffreDAffaires: c.annee.ventes,
    reduit,
    tauxEffectifReduit: avantImpot > 0 ? auCentieme((reduit.impot / avantImpot) * 100) : 0,
    economieDuTauxReduit: auCentime(impot - reduit.impot),
  };
}

const T = TRIMESTRE_DE_L_ACOMPTE;

export const L_IMPOT_SUR_LES_SOCIETES: Chapitre = {
  code: "l-impot-sur-les-societes",
  parcours: "fiscalite",
  palier: 3,
  blocs: [
    "BTS CG P3 · Gestion des obligations fiscales",
    "DCG UE4 · Droit fiscal",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "L'impôt sur les sociétés : du résultat à l'impôt",
  accroche:
    "Quatre trimestres de résultats, un impôt pour l'exercice : le taux, le résultat net, le taux effectif, et les acomptes que l'arène prélève chaque trimestre, jusqu'à rendre ce qu'elle a pris en trop.",
  objectifs: [
    "Calculer l'impôt sur les sociétés d'un exercice, le résultat net et le taux effectif",
    "Calculer l'acompte d'un trimestre sur le résultat cumulé de l'exercice",
    "Expliquer pourquoi un trimestre de perte fait rendre une part des acomptes",
    "Dire en quoi l'arène simplifie le droit : un seul taux, des acomptes sur l'exercice en cours",
    "Mesurer ce que changerait le taux réduit d'une PME",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un impôt pour l'exercice",
      notions: ["income_statement"],
      texte: (c) => {
        const k = impotDeLAnnee(c);
        return [
          `L'impôt sur les sociétés se calcule sur le bénéfice d'un exercice, l'année entière, pas sur un trimestre. Voici les ${k.trimestres.length} trimestres ${dE(c.entreprise)} dans l'arène : le résultat avant impôt de chacun, ce que l'activité a laissé une fois toutes les charges payées, intérêts compris.`,
          `L'arène applique un seul taux, celui du scénario, ${pct(k.tauxPct)}, à tout le bénéfice de l'exercice, et prend pour bénéfice imposable le résultat avant impôt, tel quel. En droit, le résultat fiscal part du résultat comptable, puis réintègre les charges que la loi ne déduit pas et retire certains produits ; l'arène n'en fait rien. Elle simplifie, et ce chapitre dit où.`,
        ];
      },
      tableau: (c) => {
        const k = impotDeLAnnee(c);
        return {
          titre: `L'année ${dE(c.entreprise)}, trimestre par trimestre`,
          colonnes: ["Valeur"],
          lignes: [
            ...k.trimestres.map((t) => ({ libelle: `Résultat avant impôt, trimestre ${t.trimestre}`, valeurs: [eur(t.avantImpot)] })),
            { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(k.tauxPct)] },
          ],
        };
      },
      repere: () => "Résultat avant impôt de l'exercice × taux = impôt sur les sociétés ; résultat avant impôt − impôt = résultat net.",
    },
    {
      id: "impot-de-l-exercice",
      type: "montants",
      titre: "L'impôt de l'exercice",
      notions: ["income_statement"],
      question: (c) =>
        `Calculez le résultat avant impôt de l'exercice ${dE(c.entreprise)}, l'impôt sur les sociétés au taux de ${pct(impotDeLAnnee(c).tauxPct)}, le résultat net, puis le taux effectif : l'impôt rapporté au résultat avant impôt, en %.`,
      champs: (c) => {
        const k = impotDeLAnnee(c);
        return [
          {
            libelle: "Résultat avant impôt de l'exercice",
            attendu: k.avantImpot,
            calcul: `${k.trimestres.map((t, i) => (i === 0 ? eur(t.avantImpot) : `${t.avantImpot < 0 ? "−" : "+"} ${eur(Math.abs(t.avantImpot))}`)).join(" ")} = ${eur(k.avantImpot)}`,
          },
          { libelle: "Impôt sur les sociétés de l'exercice", attendu: k.impot, calcul: `${eur(k.avantImpot)} × ${pct(k.tauxPct)} = ${eur(k.impot)}`, tolerance: 1 },
          { libelle: "Résultat net de l'exercice", attendu: k.resultatNet, calcul: `${eur(k.avantImpot)} − ${eur(k.impot)} = ${eur(k.resultatNet)}`, tolerance: 1 },
          { libelle: "Taux effectif d'impôt (%)", attendu: k.tauxEffectif, calcul: `${eur(k.impot)} ÷ ${eur(k.avantImpot)} × 100 = ${pct(k.tauxEffectif)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = impotDeLAnnee(c);
        const pertes = k.trimestres.filter((t) => t.avantImpot < 0);
        return [
          pertes.length > 0
            ? `L'impôt porte sur l'exercice : ${pertes.length > 1 ? "les trimestres de perte" : `le trimestre ${pertes[0]!.trimestre}, en perte,`} ${pertes.length > 1 ? "viennent" : "vient"} en déduction des bons trimestres avant le calcul, et ${c.entreprise} paie ${eur(k.impot)} sur ${eur(k.avantImpot)} de bénéfice.`
            : `Les ${k.trimestres.length} trimestres sont en bénéfice : ${c.entreprise} paie ${eur(k.impot)} sur ${eur(k.avantImpot)} de bénéfice, et garde ${eur(k.resultatNet)}.`,
          `Le taux effectif est égal au taux du scénario, ${pct(k.tauxPct)} : l'arène applique un seul taux à tout le bénéfice, sans rien réintégrer ni déduire. Dans une vraie entreprise, il s'en écarte souvent : le taux réduit d'une PME le fait baisser, une charge que la loi ne déduit pas le fait monter.`,
        ];
      },
    },
    {
      id: "acomptes",
      type: "montants",
      titre: "L'acompte du trimestre",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const k = impotDeLAnnee(c);
        return `L'arène n'attend pas la fin de l'année : chaque trimestre, elle prélève un acompte, l'impôt du résultat cumulé depuis le début de l'exercice moins les acomptes déjà versés. Calculez le résultat cumulé à la fin du trimestre ${T - 1}, l'impôt de ce cumul (${pct(k.tauxPct)}, rien sur un cumul en perte), puis l'acompte du trimestre ${T} (négatif si l'arène rend).`;
      },
      champs: (c) => {
        const k = impotDeLAnnee(c);
        const a = k.avant;
        return [
          {
            libelle: `Résultat cumulé à la fin du trimestre ${T - 1}`,
            attendu: a.cumul,
            calcul: `${k.trimestres
              .slice(0, T - 1)
              .map((t, i) => (i === 0 ? eur(t.avantImpot) : `${t.avantImpot < 0 ? "−" : "+"} ${eur(Math.abs(t.avantImpot))}`))
              .join(" ")} = ${eur(a.cumul)}`,
          },
          {
            libelle: `Impôt du cumul à la fin du trimestre ${T - 1}`,
            attendu: a.du,
            calcul: a.cumul > 0 ? `${eur(a.cumul)} × ${pct(k.tauxPct)} = ${eur(a.du)}` : `un cumul en perte : pas d'impôt, ${eur(0)}`,
            tolerance: 1,
          },
          {
            libelle: `Acompte du trimestre ${T}`,
            attendu: k.acompte.acompte,
            calcul: `${eur(k.impot)} d'impôt de l'exercice − ${eur(a.du)} déjà versés = ${eur(k.acompte.acompte)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = impotDeLAnnee(c);
        const a = k.acompte;
        const quart = auCentime(a.avantImpot * k.taux);
        return [
          `Au trimestre ${T}, ${c.entreprise} ${gagne(a.avantImpot)} avant impôt. ${
            a.acompte < 0
              ? `Le cumul baisse : l'impôt dû aussi, et l'arène rend ${eur(-a.acompte)} d'acomptes versés en trop.`
              : Math.abs(a.acompte - quart) < 1
                ? `L'acompte vaut ${pct(k.tauxPct)} du résultat du trimestre, ${eur(a.acompte)}, parce que le cumul était déjà en bénéfice.`
                : `L'acompte, ${eur(a.acompte)}, n'est pas ${pct(k.tauxPct)} du résultat du trimestre (${eur(quart)}) : ${a.cumul - a.avantImpot < 0 ? "le cumul partait d'une perte, qui absorbe d'abord une part du bénéfice du trimestre" : "il porte sur le cumul de l'exercice"}.`
          }`,
          `L'arène a inscrit, trimestre après trimestre : ${k.trimestres.map((t) => `${eur(t.arene)}`).join(", ")}. Leur somme, ${eur(k.impotDeLArene)}, est l'impôt de l'exercice${aLArrondiPres(k.impotDeLArene, k.impot)} : les acomptes se corrigent l'un l'autre jusqu'au dernier.`,
        ];
      },
    },
    {
      id: "trimestre-de-perte",
      type: "choix",
      titre: "Un trimestre de perte",
      notions: ["income_statement"],
      si: (c) => impotDeLAnnee(c).rendu !== null,
      question: (c) => {
        const t = impotDeLAnnee(c).rendu!;
        return `Au trimestre ${t.trimestre}, ${c.entreprise} ${gagne(t.avantImpot)} avant impôt, et l'arène inscrit au compte de résultat ${eur(-t.arene)} d'« Impôt rendu (acomptes de l'exercice en trop) ». D'où vient ce montant ?`;
      },
      options: (c) => {
        const k = impotDeLAnnee(c);
        const t = k.rendu!;
        const quart = auCentime(-t.avantImpot * k.taux);
        const coincide = Math.abs(quart + t.acompte) < 1;
        return [
          {
            texte: "L'impôt dû porte sur le résultat cumulé de l'exercice : le cumul a baissé, et l'arène rend ce qui avait été versé en trop",
            juste: true,
            retour: `Oui : à la fin du trimestre ${t.trimestre - 1}, le cumul de l'exercice devait ${eur(t.du - t.acompte)} d'impôt ; à la fin du trimestre ${t.trimestre}, ${t.cumul > 0 ? `il n'en doit plus que ${eur(t.du)}` : "il est en perte et ne doit plus rien"}. L'arène rend la différence. En droit, l'excédent d'acomptes se rembourse après la clôture ; l'arène le rend dans le trimestre.`,
          },
          {
            texte: `L'État rembourse ${pct(k.tauxPct)} de chaque perte trimestrielle, quoi qu'il arrive à l'exercice`,
            juste: false,
            retour: coincide
              ? `Le chiffre tombe juste ici, parce que le cumul reste en bénéfice : la perte du trimestre fait baisser l'impôt de l'exercice de ${pct(k.tauxPct)} de son montant. Mais l'arène ne rend jamais plus que les acomptes déjà versés : rien ne se rembourse sur une perte en tant que telle.`
              : `${pct(k.tauxPct)} de la perte ferait ${eur(quart)} ; l'arène ne rend que ${eur(-t.acompte)}, les acomptes versés depuis le début de l'exercice, et pas plus. Une perte ne se rembourse pas en tant que telle.`,
          },
          {
            texte: "C'est le déficit reporté : la perte du trimestre vient en déduction de l'impôt de l'exercice suivant",
            juste: false,
            retour: "Non : dans l'exercice, une perte se compense avec les bons trimestres, avant le calcul de l'impôt. Le déficit ne se reporte qu'à la clôture, quand l'exercice entier finit en perte.",
          },
        ];
      },
    },
    {
      id: "au-31-decembre",
      type: "choix",
      titre: "Au 31 décembre",
      notions: ["cash_budget", "income_statement"],
      question: (c) => `Au 31 décembre, ${c.entreprise} a versé ses acomptes dans l'arène, trimestre après trimestre. Au titre de l'impôt de l'exercice, que doit-elle encore à l'État ?`,
      options: (c) => {
        const k = impotDeLAnnee(c);
        const dernier = k.trimestres.at(-1)!;
        return [
          {
            texte: `Rien : les acomptes de l'année ont payé l'impôt de l'exercice, ${eur(k.impot)}`,
            juste: true,
            retour: `Oui. Dans l'arène, chaque acompte sort de la trésorerie le trimestre même, à la ligne « Impôt sur les sociétés » du budget de trésorerie : ${eur(k.impotDecaisse)} sur l'année${aLArrondiPres(k.impotDecaisse, k.impot)}. Le bilan de l'arène ne porte aucune dette d'impôt. En droit, c'est autrement : les acomptes se calculent sur le bénéfice de l'exercice précédent, et le solde se paie après la clôture ; au 31 décembre, l'impôt de l'année se passe en charge, et ce qui n'est pas réglé reste dû à l'État, comme dans « La clôture ».`,
          },
          {
            texte: `Tout l'impôt de l'exercice, ${eur(k.impot)}, à payer l'année suivante`,
            juste: false,
            retour: `Non : l'arène a prélevé les acomptes chaque trimestre, ${eur(k.impotDecaisse)} sur l'année. Rien ne reste à payer : le payer encore, ce serait le payer deux fois.`,
          },
          {
            texte: `La moitié de l'impôt de l'exercice, ${eur(auCentime(k.impot / 2))}, au titre du solde`,
            juste: false,
            retour: `Non : dans l'arène, aucun solde ne reste dû, le dernier acompte (${eur(dernier.acompte)}) a ajusté le tout. En droit, un solde se paie bien après la clôture, mais c'est l'impôt de l'exercice moins les acomptes versés, sans proportion fixe.`,
          },
        ];
      },
    },
    {
      id: "taux-reduit",
      type: "montants",
      titre: "Ce que changerait le taux réduit",
      notions: ["income_statement"],
      question: (c) => {
        const k = impotDeLAnnee(c);
        return `L'arène applique ${pct(k.tauxPct)} à tout le bénéfice. Le droit prévoit, pour une PME dont le chiffre d'affaires hors taxes reste sous ${eur(CHIFFRE_D_AFFAIRES_MAXIMAL_DU_TAUX_REDUIT)} et dont le capital, entièrement libéré, est détenu pour ${pct(PART_DES_PERSONNES_PHYSIQUES * 100)} au moins par des personnes physiques, un taux réduit de ${pct(TAUX_REDUIT_DU_DROIT * 100)} jusqu'à ${eur(PLAFOND_DU_TAUX_REDUIT)} de bénéfice, puis le taux normal au-delà. Si ${c.entreprise} y avait droit, quel serait son impôt de l'exercice, et son taux effectif ?`;
      },
      champs: (c) => {
        const k = impotDeLAnnee(c);
        const r = k.reduit;
        return [
          {
            libelle: "Impôt de l'exercice au taux réduit",
            attendu: r.impot,
            calcul:
              r.normale > 0
                ? `${eur(r.reduite)} × ${pct(TAUX_REDUIT_DU_DROIT * 100)} + ${eur(r.normale)} × ${pct(k.tauxPct)} = ${eur(r.aTauxReduit)} + ${eur(r.aTauxNormal)} = ${eur(r.impot)}`
                : `${eur(r.reduite)} × ${pct(TAUX_REDUIT_DU_DROIT * 100)} = ${eur(r.impot)} : tout le bénéfice reste sous le plafond`,
            tolerance: 1,
          },
          {
            libelle: "Taux effectif au taux réduit (%)",
            attendu: k.tauxEffectifReduit,
            calcul: `${eur(r.impot)} ÷ ${eur(k.avantImpot)} × 100 = ${pct(k.tauxEffectifReduit)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = impotDeLAnnee(c);
        return [
          `Avec le taux réduit, ${c.entreprise} paierait ${eur(k.economieDuTauxReduit)} de moins, et son taux effectif tomberait de ${pct(k.tauxEffectif)} à ${pct(k.tauxEffectifReduit)}. ${
            k.reduit.normale > 0
              ? `L'économie est plafonnée : seuls les premiers ${eur(PLAFOND_DU_TAUX_REDUIT)} de bénéfice en profitent, et plus le bénéfice grandit, plus le taux effectif remonte vers ${pct(k.tauxPct)}.`
              : `Tout son bénéfice reste sous le plafond : il est taxé en entier au taux réduit.`
          }`,
          `Son chiffre d'affaires de l'année, ${eur(k.chiffreDAffaires)}, reste sous le plafond ; le reste des conditions dépend de qui détient son capital, ce que l'arène ne dit pas : elle s'en tient au taux normal.`,
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "cash_budget"],
      texte: (c) => {
        const k = impotDeLAnnee(c);
        return [
          `${c.entreprise} gagne ${eur(k.avantImpot)} avant impôt sur l'exercice, paie ${eur(k.impot)} d'impôt sur les sociétés, et garde ${eur(k.resultatNet)} : un taux effectif de ${pct(k.tauxEffectif)}.`,
          `Dans l'arène, l'impôt se paie au fil de l'exercice : chaque trimestre verse ce qui manque à l'impôt du résultat cumulé, et rend ce qui a été payé en trop. Il ne reste rien à payer au 31 décembre. Le droit fait autrement, avec des acomptes calculés sur l'exercice précédent et un solde après la clôture, mais l'impôt de l'année est le même : celui du bénéfice de l'exercice.`,
        ];
      },
      repere: () =>
        "L'impôt sur les sociétés porte sur le bénéfice de l'exercice entier. Taux effectif = impôt ÷ résultat avant impôt. Un trimestre de perte se compense avec les bons trimestres du même exercice.",
    },
  ],
};
