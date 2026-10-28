import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTRETENIR_L_OUTIL, entretienDeLOutil } from "../../chapitres/entretenir-l-outil";
import { defautsEnPlusDeLEntretien, entretienAuSeuil as entretienAuSeuilDuModele } from "../../monde/capacite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ENTRETENIR L'OUTIL » : ENTRETENIR AU SEUIL (BTS GPME, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : la ligne de montage de NOVA en N + 1
 * (monde/nova-capacite.ts, monde/capacite.ts, `entretienAuSeuil`). Le gérant a retenu du chapitre
 * que la ligne ne s'use que sous 3 000 € : il propose d'entretenir au seuil chaque trimestre. La
 * ligne tient, aucune vente ne se perd par l'outil, 6 000 € s'économisent ; mais une ligne
 * entretenue sous la référence monte plus de défauts, et ils coûtent plus que toute l'économie.
 * L'élève chiffre l'économie, puis les défauts, cherche au curseur le budget où l'économie paierait
 * les défauts, et retrouve à rebours combien de défauts l'économie pourrait payer.
 *
 * Ce qui a changé depuis l'arène : l'année rejouée par le moteur ne faisait jouer les rebuts qu'au
 * bistrot ; chez NOVA, le cas validait « l'économie passe entière » (la capacité perdue valait 0).
 * Sur la simulation du cours, les défauts jouent chez NOVA, et « l'économie passe entière » devient
 * le distracteur : c'est ce qu'on trouve en oubliant les défauts.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(Math.round(t * 1000) / 10)} %`;

export type Verdict = "l-economie-passe-entiere" | "les-defauts-en-reprennent" | "les-defauts-coutent-plus" | "la-ligne-s-use";

/** L'année au seuil : l'économie, les défauts, et le budget où l'économie paierait les défauts. */
export function entretienAuSeuil(c: Pick<Cas, "code">) {
  const e = entretienDeLOutil(c);
  const f = e.f;
  const s = entretienAuSeuilDuModele(f);
  const budget = s.budgets[0]!;
  const trimestres = s.budgets.length;
  const economieParTrimestre = auCentime(e.reference - budget);
  const volume = e.plan.production;
  // Un défaut en plus coûte sa retouche ou son retour, et la marge des ventes que la qualité perçue fait perdre.
  const coutDUnDefautVentesComprises = auCentime(e.coutMoyen + (1 - e.detection) * e.ventesParDefautLivre * e.marge);
  const coutDesDefauts = auCentime(s.coutDesDefautsEnPlus + s.margePerdueParLaQualite);
  const defautsQueLEconomiePaie = auCentime(s.economie / coutDUnDefautVentesComprises);
  const parEuroCoupe = auCentime(coutDesDefauts / s.economie);
  const verdict: Verdict =
    s.ventesPerdues > 0 ? "la-ligne-s-use" : s.ecartDeResultat >= s.economie - 0.5 ? "l-economie-passe-entiere" : s.ecartDeResultat > 0 ? "les-defauts-en-reprennent" : "les-defauts-coutent-plus";
  return {
    e,
    f,
    s,
    budget,
    trimestres,
    economieParTrimestre,
    volume,
    pointsEnPlus: defautsEnPlusDeLEntretien(f, budget),
    defautsEnPlus: auCentime(s.defautsEnPlus),
    ventesPerduesParLaQualite: auCentime(s.ventesPerduesParLaQualite),
    coutDUnDefautVentesComprises,
    coutDesDefauts,
    defautsQueLEconomiePaie,
    parEuroCoupe,
    verdict,
  };
}

export const ENTRETENIR_AU_SEUIL: Situation = {
  code: "entretenir-au-seuil",
  parcours: "gpme",
  palier: 3,
  blocs: [],
  reprend: [ENTRETENIR_L_OUTIL.code],
  commanditaire: "Le gérant",
  titre: "Entretenir au seuil",
  accroche:
    "Le gérant veut entretenir la ligne juste au seuil sous lequel elle s'use, toute l'année, au lieu du budget de référence. La ligne tient ; reste à savoir ce que cette économie coûte en défauts.",
  objectifs: [
    "Calculer le seuil d'entretien et l'économie d'une année au seuil",
    "Chiffrer les défauts qu'un entretien sous la référence ajoute, ventes perdues comprises",
    "Retrouver à rebours combien de défauts une économie peut payer",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  entreprises: ENTRETENIR_L_OUTIL.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du gérant",
      texte: (c) => {
        const r = entretienAuSeuil(c);
        return [
          `« Le chapitre l'a montré : sous ${eur(r.e.seuil)} par trimestre, la ligne s'use ; à ce budget, elle tient. Pourquoi payer ${eur(r.e.reference)} ? Je propose d'entretenir au seuil chaque trimestre de N + 1 : la ligne reste à 100 %, nous ne perdons aucune vente, et nous économisons. Dites-moi combien, et si vous êtes d'accord. »`,
          `Pas de cours cette fois : la ligne de ${r.f.entreprise} est celle du chapitre, sur l'année N + 1 prévue, ${qte(r.volume)} ${r.f.unites} au plan. Les défauts qu'un entretien bas ajoute sont des défauts attendus, en moyenne.`,
        ];
      },
      tableau: (c) => {
        const r = entretienAuSeuil(c);
        const f = r.f;
        return {
          titre: `L'entretien et la qualité de ${f.entreprise} en N + 1`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Budget de référence, par trimestre", valeurs: [eur(r.e.reference)] },
            { libelle: "Usure d'un trimestre sans entretien", valeurs: [`${qte(r.e.usure * 100)} points de disponibilité`] },
            { libelle: "Réparation au budget de référence", valeurs: [`${qte(r.e.reparation * 100)} points de disponibilité`] },
            { libelle: "Défauts en plus d'un trimestre sans entretien", valeurs: [`${qte(f.entretien.defautsEnPlusSansEntretien * 100)} points de taux de défaut`] },
            { libelle: "Enceintes au plan de N + 1", valeurs: [qte(r.volume)] },
            { libelle: "Part des défauts trouvés au contrôle", valeurs: [pct(r.e.detection)] },
            { libelle: "Coût d'un défaut retouché", valeurs: [eur(f.qualite.coutDUnDefautDetecte)] },
            { libelle: "Coût d'un défaut revenu du client", valeurs: [eur(f.qualite.coutDUnDefautLivre)] },
            { libelle: "Ventes perdues par défaut livré", valeurs: [qte(r.e.ventesParDefautLivre)] },
            { libelle: "Marge sur coût variable d'une enceinte", valeurs: [eur(r.e.marge)] },
          ],
        };
      },
      repere: () => "À rendre : l'économie de l'année, les défauts qu'elle coûte, le budget où l'économie les paierait, et votre réponse.",
    },
    {
      id: "economie",
      type: "montants",
      titre: "Ce que le seuil fait économiser",
      notions: ["capacity", "fixed_costs"],
      question: () => "Calculez le seuil d'entretien (le budget où la réparation égale l'usure), puis ce qu'il économise par trimestre face à la référence, et sur l'année.",
      champs: (c) => {
        const r = entretienAuSeuil(c);
        return [
          { libelle: "Seuil d'entretien", attendu: r.budget, calcul: `${eur(r.e.reference)} × ${qte(r.e.usure * 100)} ÷ ${qte(r.e.reparation * 100)} = ${eur(r.budget)}` },
          { libelle: "Économie par trimestre", attendu: r.economieParTrimestre, calcul: `${eur(r.e.reference)} − ${eur(r.budget)} = ${eur(r.economieParTrimestre)}` },
          { libelle: "Économie sur l'année", attendu: r.s.economie, calcul: `${eur(r.economieParTrimestre)} × ${qte(r.trimestres)} = ${eur(r.s.economie)}` },
        ];
      },
      explication: (c) => {
        const r = entretienAuSeuil(c);
        return [
          `Au seuil, la ligne ne s'use plus : partie à 100 %, elle y reste toute l'année, et aucune vente ne se perd par l'outil, pas même aux trimestres où il est le goulot. ${r.f.entreprise} économiserait ${eur(r.s.economie)}. Le gérant a raison sur la ligne. Reste la qualité.`,
        ];
      },
    },
    {
      id: "les-defauts-au-seuil",
      type: "montants",
      titre: "Les défauts au seuil",
      notions: ["variable_costs", "contribution_margin"],
      question: (c) => {
        const r = entretienAuSeuil(c);
        return `Sous la référence, la ligne monte plus de défauts, en proportion de ce qui manque au budget. Calculez les points de taux de défaut en plus à chaque trimestre au seuil, les défauts en plus sur les ${qte(r.volume)} ${r.f.unites} de l'année, ce qu'ils coûtent au coût moyen d'un défaut, puis les ventes que les défauts livrés font perdre.`;
      },
      champs: (c) => {
        const r = entretienAuSeuil(c);
        const e = r.e;
        const sans = r.f.entretien.defautsEnPlusSansEntretien;
        return [
          {
            libelle: "Points de taux de défaut en plus",
            attendu: auCentime(r.pointsEnPlus * 100),
            calcul: `${qte(sans * 100)} × (1 − ${eur(r.budget)} ÷ ${eur(e.reference)}) = ${qte(auCentime(r.pointsEnPlus * 100))}`,
            tolerance: 0.01,
          },
          { libelle: "Défauts en plus sur l'année", attendu: r.defautsEnPlus, calcul: `${qte(r.volume)} × ${pct(r.pointsEnPlus)} = ${qte(r.defautsEnPlus)}`, tolerance: 0.1 },
          {
            libelle: "Coût des défauts en plus",
            attendu: r.s.coutDesDefautsEnPlus,
            calcul: `${qte(r.defautsEnPlus)} × ${eur(e.coutMoyen)} (${pct(e.detection)} × ${eur(r.f.qualite.coutDUnDefautDetecte)} + ${pct(1 - e.detection)} × ${eur(r.f.qualite.coutDUnDefautLivre)}) = ${eur(r.s.coutDesDefautsEnPlus)}`,
          },
          {
            libelle: "Ventes perdues par la qualité",
            attendu: r.ventesPerduesParLaQualite,
            calcul: `${qte(r.defautsEnPlus)} × ${pct(1 - e.detection)} livrés × ${qte(e.ventesParDefautLivre)} = ${qte(r.ventesPerduesParLaQualite)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const r = entretienAuSeuil(c);
        return [
          `Au seuil, ${qte(r.defautsEnPlus)} défauts de plus coûtent ${eur(r.s.coutDesDefautsEnPlus)} de retouches et de retours, et ${qte(r.ventesPerduesParLaQualite)} ventes perdues emportent ${eur(r.s.margePerdueParLaQualite)} de marge : ${eur(r.coutDesDefauts)} en tout, pour ${eur(r.s.economie)} économisés.`,
        ];
      },
    },
    {
      id: "le-budget-qui-paie",
      type: "curseur",
      titre: "Le budget où l'économie paie les défauts",
      notions: ["variable_costs", "fixed_costs"],
      question: (c) => {
        const r = entretienAuSeuil(c);
        return `Faites varier le budget d'entretien de chaque trimestre, du seuil (${eur(r.budget)}) à la référence (${eur(r.e.reference)}). Une droite donne l'entretien économisé sur l'année, l'autre ce que coûtent les défauts en plus, ventes perdues comprises. Placez le curseur sur le plus petit budget où l'économie paie les défauts, puis validez.`;
      },
      grandeur: () => ({ libelle: "Budget d'entretien de chaque trimestre", unite: "€" }),
      cible: (c) => {
        const r = entretienAuSeuil(c);
        const economie = (b: number) => (r.e.reference - b) * r.trimestres;
        const defauts = (b: number) => r.volume * defautsEnPlusDeLEntretien(r.f, b) * r.coutDUnDefautVentesComprises;
        let attendu = r.budget;
        while (attendu < r.e.reference && economie(attendu) < defauts(attendu) - 1e-9) attendu++;
        return { attendu, min: r.budget, max: r.e.reference };
      },
      zones: ["L'économie paie les défauts", "Les défauts coûtent plus que l'économie"],
      rates: () => ({
        dessous: "À ce budget, les défauts en plus coûtent encore plus que l'économie.",
        dessus: "Plus bas, l'économie paie encore les défauts : cherchez le plus petit budget.",
      }),
      montrer: "Montrer le budget",
      lecture: (c, b) => {
        const r = entretienAuSeuil(c);
        const defauts = r.volume * defautsEnPlusDeLEntretien(r.f, b);
        const economie = auCentime((r.e.reference - b) * r.trimestres);
        const coutDesDefauts = auCentime(defauts * r.e.coutMoyen);
        const ventes = auCentime(defauts * (1 - r.e.detection) * r.e.ventesParDefautLivre * r.e.marge);
        return [
          { libelle: "Entretien économisé sur l'année", montant: economie },
          { libelle: "Coût des défauts en plus", montant: coutDesDefauts },
          { libelle: "Marge des ventes perdues par la qualité", montant: ventes },
          { libelle: "Effet sur le résultat de l'année", montant: auCentime(economie - coutDesDefauts - ventes), fort: true },
        ];
      },
      droites: (c) => {
        const r = entretienAuSeuil(c);
        return {
          produit: (b) => (r.e.reference - b) * r.trimestres,
          cout: (b) => r.volume * defautsEnPlusDeLEntretien(r.f, b) * r.coutDUnDefautVentesComprises,
          libelles: ["Entretien économisé sur l'année", "Coût des défauts en plus, ventes comprises"],
        };
      },
      explication: (c) => {
        const r = entretienAuSeuil(c);
        return [
          `Les deux droites ne se rejoignent qu'à la référence, où l'économie et les défauts en plus tombent à 0 €. Partout ailleurs, chaque euro coupé sous ${eur(r.e.reference)} fait perdre ${eur(r.parEuroCoupe)} en défauts : il n'existe pas de budget sous la référence où l'économie paie les défauts.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Ce que l'économie pourrait payer",
      notions: ["variable_costs", "contribution_margin"],
      question: () =>
        "À rebours : calculez ce que coûte un défaut en plus, ventes perdues comprises, combien de défauts l'économie de l'année pourrait payer, l'effet de l'entretien au seuil sur le résultat de l'année, puis ce que coûte, en défauts, chaque euro coupé sous la référence.",
      champs: (c) => {
        const r = entretienAuSeuil(c);
        const e = r.e;
        return [
          {
            libelle: "Coût d'un défaut en plus, ventes perdues comprises",
            attendu: r.coutDUnDefautVentesComprises,
            calcul: `${eur(e.coutMoyen)} + ${pct(1 - e.detection)} × ${qte(e.ventesParDefautLivre)} × ${eur(e.marge)} = ${eur(r.coutDUnDefautVentesComprises)}`,
          },
          { libelle: "Défauts que l'économie pourrait payer", attendu: r.defautsQueLEconomiePaie, calcul: `${eur(r.s.economie)} ÷ ${eur(r.coutDUnDefautVentesComprises)} = ${qte(r.defautsQueLEconomiePaie)}`, tolerance: 0.1 },
          {
            libelle: "Effet de l'entretien au seuil sur le résultat",
            attendu: r.s.ecartDeResultat,
            calcul: `${eur(r.s.economie)} − ${qte(r.defautsEnPlus)} × ${eur(r.coutDUnDefautVentesComprises)} = ${eur(r.s.ecartDeResultat)}`,
          },
          { libelle: "Défauts coûtés par euro coupé", attendu: r.parEuroCoupe, calcul: `${eur(r.coutDesDefauts)} ÷ ${eur(r.s.economie)} = ${eur(r.parEuroCoupe)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const r = entretienAuSeuil(c);
        return [
          `L'économie paierait ${qte(r.defautsQueLEconomiePaie)} défauts ; le seuil en ajoute ${qte(r.defautsEnPlus)}, plus du double. L'entretien au seuil fait baisser le résultat de ${eur(-r.s.ecartDeResultat)}. Sans compter les défauts, on trouverait ${eur(r.s.ecartParLaDisponibilite)} : c'est le calcul du gérant, juste sur la ligne, faux sur l'année.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = entretienAuSeuil(c);
        const v = r.verdict;
        return [
          {
            texte: "Refusons : au seuil, les défauts coûtent plus que l'économie",
            juste: v === "les-defauts-coutent-plus",
            retour:
              v === "les-defauts-coutent-plus"
                ? `Oui : la ligne tient, mais ${qte(r.defautsEnPlus)} défauts de plus coûtent ${eur(r.coutDesDefauts)}, ventes perdues comprises, pour ${eur(r.s.economie)} économisés : ${eur(r.s.ecartDeResultat)} sur l'année. Le seuil garde la capacité, pas la qualité ; la référence reste le meilleur budget.`
                : `Non : ici, les défauts coûtent moins que l'économie.`,
          },
          {
            texte: "D'accord : au seuil, la ligne tient, et l'économie passe au résultat",
            juste: v === "l-economie-passe-entiere",
            retour:
              v === "l-economie-passe-entiere"
                ? "Oui : l'économie passe entière au résultat."
                : `Non : c'est vrai de la ligne, qui reste à 100 %, mais pas du résultat. L'économie de ${eur(r.s.economie)} ne passe entière que si l'on oublie les défauts : ils font baisser le résultat de ${eur(-r.s.ecartDeResultat)}.`,
          },
          {
            texte: "D'accord, mais les défauts reprendront une part de l'économie",
            juste: v === "les-defauts-en-reprennent",
            retour:
              v === "les-defauts-en-reprennent"
                ? "Oui : les défauts reprennent une part de l'économie, sans l'effacer."
                : `Non : ils n'en reprennent pas une part, ils la dépassent : ${eur(r.coutDesDefauts)} de défauts pour ${eur(r.s.economie)} d'économie.`,
          },
          {
            texte: "Refusons : sous la référence, la ligne s'use dès le trimestre suivant",
            juste: v === "la-ligne-s-use",
            retour:
              v === "la-ligne-s-use"
                ? "Oui : au seuil, la ligne perd déjà des ventes."
                : `Non : la ligne ne s'use que sous le seuil, pas sous la référence. Au seuil, elle reste à 100 % toute l'année, et aucune vente ne se perd par l'outil : c'est par la qualité que le seuil coûte.`,
          },
        ];
      },
    },
  ],
};
