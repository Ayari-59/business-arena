import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";
import { compteDeResultat } from "./lire-le-compte-de-resultat";

/**
 * CHAPITRE : L'EFFECTIF ET LA MASSE SALARIALE (Bac STMG, ressources humaines, palier 1).
 *
 * Ce que coûte le personnel sur l'année, et ce qu'il pèse : dans les charges, dans le chiffre
 * d'affaires, et ce que chaque salarié fait vendre. Puis ce qu'une embauche retire au résultat
 * quand les ventes ne suivent pas : le personnel est une charge fixe.
 *
 * L'effectif est celui de l'entreprise au départ de la partie ; le coût d'un salarié par
 * trimestre (salaire brut et cotisations patronales) est celui du scénario de l'arène
 * (`hr.salaryPerEmployeePerRound`) ; les ventes et les charges sont celles de l'année jouée
 * (`compteDeResultat`). Aucune hypothèse n'est ajoutée. Défaut de l'arène, que le chapitre dit :
 * tous les salariés d'une entreprise y coûtent le même prix.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les trimestres d'une année de l'arène. */
const TRIMESTRES = 4;

/** L'effectif, le coût d'un salarié et ce que le personnel pèse sur l'année. */
export function masseSalariale(c: Cas) {
  const hr = scenarioByCode(c.code).scenario.hr!;
  const k = compteDeResultat(c);
  const effectif = c.personnel.effectif;
  const coutTrimestriel = hr.salaryPerEmployeePerRound;
  const coutAnnuel = auCentime(coutTrimestriel * TRIMESTRES);
  const masse = auCentime(coutAnnuel * effectif);
  // Ce que le salarié reçoit de ce qu'il coûte : son net, rapporté au coût employeur de la paie du cas.
  const netAnnuel = Math.round((coutAnnuel * c.personnel.net) / c.personnel.cout);
  return {
    effectif,
    coutTrimestriel,
    coutAnnuel,
    netAnnuel,
    masse,
    ventes: k.s.ventes,
    charges: k.charges,
    partDansLesCharges: auDixieme((masse / k.charges) * 100),
    tauxDeFraisDePersonnel: auDixieme((masse / k.s.ventes) * 100),
    caParSalarie: Math.round(k.s.ventes / effectif),
  };
}

export const EFFECTIF_ET_MASSE_SALARIALE: Chapitre = {
  code: "effectif-et-masse-salariale",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
    "BTS SAM Bloc 3 · Collaboration à la gestion des ressources humaines",
    "BUT GACO · Participer au pilotage RH de l'organisation",
  ],
  titre: "L'effectif et la masse salariale",
  accroche:
    "Ce que coûte le personnel sur une année, ce qu'il pèse dans les charges et dans les ventes, et ce qu'une embauche retire au résultat quand les ventes ne suivent pas.",
  objectifs: [
    "Calculer le coût annuel d'un salarié et la masse salariale",
    "Calculer la part du personnel dans les charges et le taux de frais de personnel",
    "Calculer le chiffre d'affaires par salarié",
    "Expliquer pourquoi le personnel est une charge fixe",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le personnel, une charge de chaque trimestre",
      notions: ["payroll"],
      texte: (c) => {
        const m = masseSalariale(c);
        return [
          `${c.entreprise} emploie ${m.effectif} salariés. Chacun lui coûte ${eur(m.coutTrimestriel)} par trimestre : son salaire brut, et les cotisations que l'entreprise paie en plus pour lui. Ce coût tombe chaque trimestre, que l'entreprise vende beaucoup ou peu.`,
          "Dans l'arène, tous les salariés d'une entreprise coûtent le même prix. Dans la réalité, les salaires diffèrent selon le poste, la qualification et l'ancienneté : on raisonne alors sur un coût moyen.",
        ];
      },
      tableau: (c) => {
        const m = masseSalariale(c);
        return {
          titre: `Le personnel et l'année ${dE(c.entreprise)}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Effectif", valeurs: [`${m.effectif} salariés`] },
            { libelle: "Coût d'un salarié par trimestre (brut et cotisations patronales)", valeurs: [eur(m.coutTrimestriel)] },
            { libelle: "Ventes de l'année", valeurs: [eur(m.ventes)] },
            { libelle: "Total des charges de l'année", valeurs: [eur(m.charges)] },
          ],
        };
      },
      repere: () => "Masse salariale = effectif × coût d'un salarié sur la période.",
    },
    {
      id: "masse",
      type: "montants",
      titre: "La masse salariale",
      notions: ["payroll"],
      question: (c) => `Calculez le coût annuel d'un salarié ${dE(c.entreprise)}, puis la masse salariale de l'année.`,
      champs: (c) => {
        const m = masseSalariale(c);
        return [
          { libelle: "Coût annuel d'un salarié", attendu: m.coutAnnuel, calcul: `${eur(m.coutTrimestriel)} × ${TRIMESTRES} trimestres = ${eur(m.coutAnnuel)}`, tolerance: 1 },
          { libelle: "Masse salariale de l'année", attendu: m.masse, calcul: `${eur(m.coutAnnuel)} × ${m.effectif} salariés = ${eur(m.masse)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = masseSalariale(c);
        return [
          `Sur l'année, le personnel coûte ${eur(m.masse)} à ${c.entreprise}. Un salarié lui coûte ${eur(m.coutAnnuel)}, alors qu'il en reçoit environ ${eur(m.netAnnuel)} en net : la différence, ce sont les cotisations, celles qu'il paie sur son brut et celles que l'entreprise paie en plus.`,
        ];
      },
    },
    {
      id: "poids",
      type: "montants",
      titre: "Ce que pèse le personnel",
      notions: ["payroll", "productivity"],
      question: () =>
        "Calculez la part de la masse salariale dans le total des charges, puis le taux de frais de personnel (masse salariale ÷ ventes × 100), en pourcentage au dixième. Calculez enfin le chiffre d'affaires par salarié, à l'euro.",
      champs: (c) => {
        const m = masseSalariale(c);
        return [
          { libelle: "Part dans les charges (%)", attendu: m.partDansLesCharges, calcul: `${eur(m.masse)} ÷ ${eur(m.charges)} × 100 = ${pct(m.partDansLesCharges)}`, tolerance: 0.1 },
          { libelle: "Taux de frais de personnel (%)", attendu: m.tauxDeFraisDePersonnel, calcul: `${eur(m.masse)} ÷ ${eur(m.ventes)} × 100 = ${pct(m.tauxDeFraisDePersonnel)}`, tolerance: 0.1 },
          { libelle: "Chiffre d'affaires par salarié", attendu: m.caParSalarie, calcul: `${eur(m.ventes)} ÷ ${m.effectif} = ${eur(m.caParSalarie)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const m = masseSalariale(c);
        return [
          `Sur 100 € de ventes, ${c.entreprise} en consacre ${pct(m.tauxDeFraisDePersonnel).replace(" %", " €")} à son personnel, et chaque salarié fait vendre ${eur(m.caParSalarie)} dans l'année.`,
          "Ces deux chiffres se lisent ensemble : un taux de frais de personnel qui monte dit que les ventes ne suivent pas l'effectif ; un chiffre d'affaires par salarié qui monte dit que l'équipe fait vendre davantage.",
        ];
      },
    },
    {
      id: "embauche",
      type: "choix",
      titre: "Un salarié de plus",
      notions: ["payroll", "fixed_costs"],
      question: (c) =>
        `Si ${c.entreprise} embauchait un salarié de plus pour toute l'année, sans vendre davantage, de combien baisserait son résultat ?`,
      options: (c) => {
        const m = masseSalariale(c);
        return [
          {
            texte: `De ${eur(m.coutAnnuel)} : le coût annuel d'un salarié`,
            juste: true,
            retour: `Oui : le salaire brut et les cotisations patronales sont des charges, que les ventes suivent ou non. Pour que l'embauche se paie, il faut qu'elle fasse vendre de quoi couvrir ${eur(m.coutAnnuel)}.`,
          },
          {
            texte: `De ${eur(m.netAnnuel)} : le salaire net qu'il recevrait`,
            juste: false,
            retour: `Non : le net est ce que le salarié reçoit, pas ce qu'il coûte. L'entreprise verse aussi les cotisations retenues sur son salaire, et paie les siennes : ${eur(m.coutAnnuel)} en tout.`,
          },
          {
            texte: "De rien : un salarié de plus fait toujours vendre davantage",
            juste: false,
            retour: "Non : un salarié de plus n'apporte des ventes que si le travail manquait, ou s'il trouve de nouveaux clients. Sinon, il ajoute une charge fixe sans rien ajouter aux ventes.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payroll"],
      texte: (c) => {
        const m = masseSalariale(c);
        return [
          `Avec ${m.effectif} salariés, ${c.entreprise} consacre ${eur(m.masse)} à son personnel sur l'année : ${pct(m.partDansLesCharges)} de ses charges et ${pct(m.tauxDeFraisDePersonnel)} de ses ventes.`,
          "La masse salariale est une charge fixe : elle ne baisse pas quand les ventes baissent. C'est pourquoi une embauche se décide sur ce qu'elle fera vendre, et pas seulement sur le travail qu'il y a à faire.",
        ];
      },
      repere: () => "Taux de frais de personnel = masse salariale ÷ chiffre d'affaires. Chiffre d'affaires par salarié = chiffre d'affaires ÷ effectif.",
    },
  ],
};
