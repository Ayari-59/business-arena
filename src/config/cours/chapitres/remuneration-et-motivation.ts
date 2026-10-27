import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { ECART_D_INDICE, rejouerLAnnee, vendues } from "../ressources-humaines";
import type { Chapitre } from "../types";


/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : RÉMUNÉRATION ET MOTIVATION (Bac STMG, ressources humaines, palier 1).
 *
 * Baisser les salaires fait une économie certaine, tout de suite. Ce qu'elle coûte vient
 * ensuite : une équipe moins motivée travaille moins bien, et sous un certain salaire, les
 * salariés partent. L'arène rejoue l'année avec des salaires 10 % plus bas : l'économie, la
 * capacité perdue, les démissions trimestre après trimestre, et ce qu'il en reste au résultat.
 *
 * La sensibilité de la motivation au salaire et le seuil de démission sont ceux du scénario
 * (`hr.moraleSensitivity`, `hr.attritionThreshold`), et le moteur les joue (src/engine/hr) ;
 * l'écart de salaire rejoué est posé dans ressources-humaines.ts (ECART_D_INDICE). Défaut de
 * l'arène, que le chapitre dit : elle ne fait payer ni le remplacement des salariés partis, ni le
 * savoir-faire qu'ils emportent, ni l'image d'un employeur qui paie mal.
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

/**
 * L'ANNÉE AUX SALAIRES CHANGÉS : l'indice de salaire posé à chaque trimestre, les embauches de
 * l'année du cours gardées telles quelles. Une décision de ressources humaines rejouée remplace
 * toute celle du trimestre (`rejouerLAnnee`) : sans cela, les embauches que le bon gestionnaire a
 * faites dans l'année jouée (au conseil, faute de bras) disparaîtraient avec le changement de
 * salaire, et la comparaison mêlerait deux décisions. Seule la rémunération change.
 */
export function anneeAuxSalaires(code: string, cle: string, indice: number) {
  const base = rejouerLAnnee(code, "base", () => undefined);
  return rejouerLAnnee(code, `${cle}:embauches-de-l-annee`, (t) => ({ salaryIndex: indice, hire: base[t - 1]?.hr?.hired ?? 0 }));
}

/** Les salaires baissés toute l'année : l'économie, la motivation, les départs, le résultat. */
export function remuneration(c: Cas) {
  const hr = scenarioByCode(c.code).scenario.hr!;
  const indice = 1 - ECART_D_INDICE;
  const base = rejouerLAnnee(c.code, "base", () => undefined);
  const baisse = anneeAuxSalaires(c.code, "salaires-baisses", indice);
  const effectif = c.personnel.effectif;
  const economieDuTrimestre = Math.round(effectif * hr.salaryPerEmployeePerRound * ECART_D_INDICE);
  const capaciteAvant = Math.round(base[0]!.production.laborCapacity);
  const capaciteApres = Math.round(baisse[0]!.production.laborCapacity);
  const baisseDeProductivite = Math.round((1 - capaciteApres / capaciteAvant) * 1000) / 10;
  const effectifs = baisse.map((r) => r.hr!.headcount);
  // Sans décision RH, le moteur ne rend pas de compte RH : l'effectif reste celui de départ.
  const effectifsHabituels = base.map((r) => r.hr?.headcount ?? effectif);
  const departs = somme(baisse.map((r) => r.hr!.departed));
  // Les embauches de l'année jouée, gardées aux salaires baissés.
  const embauches = somme(baisse.map((r) => r.hr!.hired));
  const masseAvant = Math.round(somme(effectifsHabituels.map((n) => n * hr.salaryPerEmployeePerRound)));
  const masseApres = Math.round(somme(effectifs.map((n) => n * hr.salaryPerEmployeePerRound * indice)));
  const venduesAvant = Math.round(somme(base.map(vendues)));
  const venduesApres = Math.round(somme(baisse.map(vendues)));
  const resultatAvant = Math.round(somme(base.map((r) => r.incomeStatement.operatingIncome)));
  const resultatApres = Math.round(somme(baisse.map((r) => r.incomeStatement.operatingIncome)));
  return {
    effectif,
    salaireTrimestriel: hr.salaryPerEmployeePerRound,
    ecart: Math.round(ECART_D_INDICE * 100),
    seuil: Math.round(hr.attritionThreshold * 100),
    economieDuTrimestre,
    capaciteAvant,
    capaciteApres,
    baisseDeProductivite,
    effectifs,
    effectifsHabituels,
    effectifFinal: baisse.at(-1)!.hr!.nextHeadcount,
    effectifFinalHabituel: base.at(-1)!.hr?.nextHeadcount ?? effectif,
    departs,
    embauches,
    masseAvant,
    masseApres,
    economieDeLAnnee: masseAvant - masseApres,
    venduesAvant,
    venduesApres,
    venduesPerdues: venduesAvant - venduesApres,
    resultatAvant,
    resultatApres,
    ecartDeResultat: resultatApres - resultatAvant,
  };
}

export const REMUNERATION_ET_MOTIVATION: Chapitre = {
  code: "remuneration-et-motivation",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
  ],
  titre: "Rémunération et motivation",
  accroche:
    "Baisser les salaires fait une économie certaine et immédiate. Ce qu'elle coûte vient ensuite : une équipe moins motivée, puis des salariés qui partent. L'arène rejoue l'année.",
  objectifs: [
    "Calculer l'économie d'une baisse de salaire",
    "Mesurer l'effet de la motivation sur la capacité de l'équipe",
    "Suivre les démissions et l'effectif sur l'année",
    "Juger une politique de rémunération sur toute l'année, et pas sur un trimestre",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Payer moins, pour gagner plus ?",
      notions: ["pay_and_motivation"],
      texte: (c) => {
        const r = remuneration(c);
        return [
          `${c.entreprise} paie ses ${r.effectif} salariés ${eur(r.salaireTrimestriel)} par trimestre chacun. La direction envisage de baisser tous les salaires de ${r.ecart} %, toute l'année.`,
          `L'économie est certaine. Mais dans l'arène comme dans la réalité, un salaire jugé trop bas pèse sur la motivation : l'équipe travaille moins bien. Et sous ${r.seuil} % du salaire habituel, un salarié démissionne chaque trimestre, tant qu'il en reste plus d'un, et ne revient pas.`,
        ];
      },
      repere: () => "Une économie de salaire se juge sur toute l'année : ce qu'elle fait gagner, et ce que coûtent la motivation perdue et les départs.",
    },
    {
      id: "economie",
      type: "montants",
      titre: "L'économie, et la motivation",
      notions: ["payroll", "pay_and_motivation"],
      question: (c) => {
        const r = remuneration(c);
        return `Calculez l'économie de masse salariale du premier trimestre (${r.effectif} salariés × ${eur(r.salaireTrimestriel)} × ${r.ecart} %). L'arène a joué ce trimestre : l'équipe pouvait produire ${qte(r.capaciteAvant)} ${c.unites}, et n'en peut plus que ${qte(r.capaciteApres)}. Calculez la baisse de productivité, en pourcentage au dixième.`;
      },
      champs: (c) => {
        const r = remuneration(c);
        return [
          { libelle: "Économie du premier trimestre", attendu: r.economieDuTrimestre, calcul: `${r.effectif} × ${eur(r.salaireTrimestriel)} × ${r.ecart} % = ${eur(r.economieDuTrimestre)}`, tolerance: 1 },
          { libelle: "Baisse de productivité (%)", attendu: r.baisseDeProductivite, calcul: `(${qte(r.capaciteAvant)} − ${qte(r.capaciteApres)}) ÷ ${qte(r.capaciteAvant)} × 100 = ${pct(r.baisseDeProductivite)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = remuneration(c);
        return [
          `Dès le premier trimestre, ${c.entreprise} économise ${eur(r.economieDuTrimestre)}, et son équipe perd ${pct(r.baisseDeProductivite)} de sa capacité : des salariés moins motivés font moins dans le même temps.`,
        ];
      },
    },
    {
      id: "annee",
      type: "montants",
      titre: "Les départs, trimestre après trimestre",
      notions: ["pay_and_motivation", "staff_turnover"],
      tableau: (c) => {
        const r = remuneration(c);
        return {
          titre: "L'année jouée, salaires habituels et salaires baissés",
          colonnes: ["Habituels", "Baissés"],
          lignes: [
            ...r.effectifs.map((n, i) => ({ libelle: `Effectif au trimestre ${i + 1}`, valeurs: [String(r.effectifsHabituels[i]), String(n)] })),
            { libelle: "Masse salariale de l'année", valeurs: [eur(r.masseAvant), eur(r.masseApres)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(r.venduesAvant), qte(r.venduesApres)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(r.resultatAvant), eur(r.resultatApres)] },
          ],
        };
      },
      question: (c) => `Calculez l'économie de masse salariale sur l'année, les ventes perdues (en ${c.unites}), et l'écart de résultat de l'activité.`,
      champs: (c) => {
        const r = remuneration(c);
        return [
          { libelle: "Économie sur l'année", attendu: r.economieDeLAnnee, calcul: `${eur(r.masseAvant)} − ${retranche(r.masseApres)} = ${eur(r.economieDeLAnnee)}`, tolerance: 1 },
          { libelle: `Ventes en moins (${c.unites})`, attendu: r.venduesPerdues, calcul: `${qte(r.venduesAvant)} − ${qte(r.venduesApres)} = ${qte(r.venduesPerdues)}`, tolerance: 1 },
          { libelle: "Écart de résultat", attendu: r.ecartDeResultat, calcul: `${eur(r.resultatApres)} − ${retranche(r.resultatAvant)} = ${eur(r.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = remuneration(c);
        return [
          `En un an, ${r.departs} salariés sont partis${r.embauches > 0 ? `, malgré les ${r.embauches} embauches de l'année jouée, gardées aux salaires baissés` : ""} : l'équipe ${dE(c.entreprise)} commence l'année suivante à ${r.effectifFinal}, contre ${r.effectifFinalHabituel} aux salaires habituels. Chaque départ fait une économie de plus, mais retire aussi des heures de travail : ${r.venduesPerdues > 0 ? `${qte(r.venduesPerdues)} ${c.unites} n'ont pas pu être vendues, faute de bras.` : "ici, l'équipe avait assez de marge pour que les ventes n'en souffrent pas encore."}`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "Une bonne affaire ?",
      notions: ["pay_and_motivation", "staff_turnover"],
      question: (c) => {
        const r = remuneration(c);
        return `Avec des salaires ${r.ecart} % plus bas toute l'année, le résultat de l'activité ${dE(c.entreprise)} passe de ${eur(r.resultatAvant)} à ${eur(r.resultatApres)}, et l'effectif de ${r.effectif} à ${r.effectifFinal}. Que retenir ?`;
      },
      options: (c) => {
        const r = remuneration(c);
        const monte = r.ecartDeResultat > 0;
        return [
          {
            texte: "Le résultat monte cette année, mais sur une équipe qui fond : ce n'est pas tenable",
            juste: monte,
            retour: monte
              ? `Oui : l'économie l'emporte cette année, parce que l'équipe avait de la marge. Mais ${r.departs} salariés sont partis, et à ce rythme l'entreprise n'aura bientôt plus assez de monde pour servir ses clients. L'arène ne compte pas tout : remplacer un salarié parti coûte un recrutement, et le savoir-faire qu'il emporte ne se rachète pas.`
              : `Non : le résultat baisse de ${eur(-r.ecartDeResultat)} dès cette année.`,
          },
          {
            texte: "Le résultat baisse : les ventes perdues coûtent plus que l'économie",
            juste: !monte,
            retour: !monte
              ? `Oui : l'économie de ${eur(r.economieDeLAnnee)} ne couvre pas la marge des ${qte(r.venduesPerdues)} ${c.unites} perdues. Ici, chaque heure de travail comptait : moins motivée puis moins nombreuse, l'équipe ne peut plus servir les clients.`
              : `Non : cette année, le résultat monte de ${eur(r.ecartDeResultat)}. C'est la suite qui pose problème.`,
          },
          {
            texte: "Rien ne bouge : les salariés ne réagissent pas au salaire",
            juste: false,
            retour: `Non : la capacité de l'équipe baisse de ${pct(r.baisseDeProductivite)} dès le premier trimestre, et ${r.departs} salariés partent dans l'année.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["pay_and_motivation"],
      texte: (c) => {
        const r = remuneration(c);
        return [
          `Chez ${c.entreprise}, des salaires ${r.ecart} % plus bas font économiser ${eur(r.economieDeLAnnee)} sur l'année, mais coûtent ${pct(r.baisseDeProductivite)} de productivité et ${r.departs} départs.`,
          "La rémunération n'est pas qu'une charge : elle tient la motivation et retient les salariés. Une économie de salaire se juge sur plusieurs périodes, en comptant ce qu'elle fait perdre, et ce que l'arène ne compte pas : les recrutements pour remplacer ceux qui partent, et le savoir-faire qu'ils emportent.",
        ];
      },
      repere: () => "Un salaire trop bas fait une économie immédiate et des pertes différées : motivation, démissions, ventes manquées.",
    },
  ],
};
