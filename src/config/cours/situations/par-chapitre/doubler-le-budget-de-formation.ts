import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { formation } from "../../chapitres/former";
import { MOIS_PAR_TRIMESTRE } from "../../monde/nova-capacite";
import { ENTREPRISES_DES_RESSOURCES_HUMAINES, MINUTES_GAGNEES_PAR_LE_STAGE } from "../../monde/ressources-humaines-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FORMER POUR ÊTRE PLUS EFFICACE » : DOUBLER LE BUDGET DE FORMATION
 * (Bac STMG, ressources humaines, palier 1).
 *
 * La direction a retenu du chapitre que le stage rapporte bien plus qu'il ne coûte. Elle propose de
 * doubler le budget : un stage deux fois plus poussé, deux fois plus de minutes gagnées sur chaque
 * enceinte. Deux fois plus de ventes ? L'élève refait les calculs du chapitre pour les deux stages
 * (la capacité de l'équipe, les ventes en plus, ce que chacun rapporte une fois payé), puis pour la
 * seconde moitié du budget seule, et répond.
 *
 * Le cas est neuf par sa question : le chapitre mesure ce que rapporte un stage, le cas ce que
 * rapporte un budget de plus. Les deux stages sont ceux du chapitre (`formation`, chez NOVA, le
 * cinquième poste installé), au même prix de la minute gagnée ; seul le multiple est posé ci-dessous.
 *
 * CE QUI A CHANGÉ. Le cas rejouait l'année de l'arène, dont le moteur tirait des rendements
 * décroissants ; il se joue chez NOVA, où la ligne borne le gain : la seconde moitié du budget,
 * 3 200 €, ne fait vendre aucune enceinte de plus.
 */

/** Le budget que propose la direction, en multiples de celui du chapitre : le double, deux fois plus de minutes gagnées. */
export const MULTIPLE_DU_BUDGET = 2;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export type Verdict = "doubler" | "garder" | "aucun";

/** Les deux stages, et la seconde moitié du budget. */
export function budgetDouble(_c?: Cas) {
  const f = formation();
  const d = formation(undefined, f.minutesDuDepart - MINUTES_GAGNEES_PAR_LE_STAGE * MULTIPLE_DU_BUDGET);
  const coutEnPlus = d.cout - f.cout;
  const enceintesEnPlus = d.enceintesEnPlus - f.enceintesEnPlus;
  const verdict: Verdict = d.gain > f.gain ? "doubler" : f.gain > 0 ? "garder" : "aucun";
  return { f, d, coutEnPlus, enceintesEnPlus, margeEnPlus: d.margeEnPlus - f.margeEnPlus, verdict };
}

export const DOUBLER_LE_BUDGET_DE_FORMATION: Situation = {
  code: "doubler-le-budget-de-formation",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["former"],
  commanditaire: "La direction",
  titre: "Doubler le budget de formation",
  accroche: "La direction veut doubler le budget de formation : deux fois plus de minutes gagnées, deux fois plus de ventes ? Ce que rapporte la seconde moitié du budget.",
  objectifs: [
    "Calculer la capacité qu'une formation fait gagner, pour deux budgets",
    "Calculer ce que rapporte un budget de formation en plus",
    "Relier le gain d'une formation à ce qui limite les ventes",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RESSOURCES_HUMAINES,
    pourquoi: "le cas reprend le stage du chapitre, dans l'atelier de NOVA et son année N + 1.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: () => {
        const k = budgetDouble();
        return [
          `« Le stage de ${eur(k.f.cout)} rapporte ${eur(k.f.gain)} dès la première année. Doublons-le : ${eur(k.d.cout)}, et nos opérateurs monteront une enceinte en ${qte(k.d.minutes)} minutes au lieu de ${qte(k.f.minutes)}. Deux fois plus de formation, c'est deux fois plus de ventes, non ? » La direction`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, pour deux stages au lieu d'un.",
        ];
      },
      tableau: () => {
        const k = budgetDouble();
        return {
          titre: "L'atelier en N + 1, avec le cinquième poste",
          colonnes: ["Stage du chapitre", "Stage doublé"],
          lignes: [
            { libelle: "Minutes pour monter une enceinte", valeurs: [qte(k.f.minutes), qte(k.d.minutes)] },
            { libelle: "Coût du stage", valeurs: [eur(k.f.cout), eur(k.d.cout)] },
            { libelle: "Capacité de la ligne par trimestre", valeurs: [qte(k.f.capaciteDeLOutil), qte(k.d.capaciteDeLOutil)] },
            { libelle: "Demande la plus forte d'un trimestre", valeurs: [qte(Math.max(...k.f.joue.trimestres.map((t) => t.demande))), qte(Math.max(...k.d.joue.trimestres.map((t) => t.demande)))] },
          ],
        };
      },
      repere: () => "À rendre : la capacité de l'équipe et les ventes en plus pour chaque stage, ce que rapporte chacun, ce qu'apporte la seconde moitié du budget, et votre réponse.",
    },
    {
      id: "chaque-stage",
      type: "montants",
      titre: "Ce que gagne chaque stage",
      notions: ["training", "productivity"],
      question: () => "Pour chaque stage, calculez la capacité de l'équipe par trimestre, puis les enceintes vendues de plus que sans stage.",
      champs: () => {
        const k = budgetDouble();
        return [
          { libelle: "Capacité de l'équipe, stage du chapitre", attendu: k.f.equipe, calcul: `${qte(k.f.parMois)} × ${k.f.operateurs} × ${MOIS_PAR_TRIMESTRE} = ${qte(k.f.equipe)}`, tolerance: 0 },
          { libelle: "Capacité de l'équipe, stage doublé", attendu: k.d.equipe, calcul: `${qte(k.d.parMois)} × ${k.d.operateurs} × ${MOIS_PAR_TRIMESTRE} = ${qte(k.d.equipe)}`, tolerance: 0 },
          { libelle: "Ventes en plus, stage du chapitre", attendu: k.f.enceintesEnPlus, calcul: `${qte(k.f.joue.production)} − ${qte(k.f.sansFormation.production)} = ${qte(k.f.enceintesEnPlus)}`, tolerance: 0 },
          { libelle: "Ventes en plus, stage doublé", attendu: k.d.enceintesEnPlus, calcul: `${qte(k.d.joue.production)} − ${qte(k.d.sansFormation.production)} = ${qte(k.d.enceintesEnPlus)}`, tolerance: 0 },
        ];
      },
      explication: () => {
        const k = budgetDouble();
        return [
          `Le stage doublé fait monter l'équipe à ${qte(k.d.equipe)} enceintes par trimestre, plus que la ligne ne peut en monter (${qte(k.d.capaciteDeLOutil)}) et plus que la demande ne le demande. Les ventes, elles, ne montent que de ${qte(k.d.enceintesEnPlus)} enceintes, comme avec le stage du chapitre.`,
        ];
      },
    },
    {
      id: "seconde-moitie",
      type: "montants",
      titre: "Ce que rapporte la seconde moitié",
      notions: ["training"],
      question: () => "Calculez ce que coûte la seconde moitié du budget, les enceintes qu'elle fait vendre en plus, puis ce que rapporte chaque stage une fois payé.",
      champs: () => {
        const k = budgetDouble();
        return [
          { libelle: "Coût de la seconde moitié", attendu: k.coutEnPlus, calcul: `${eur(k.d.cout)} − ${eur(k.f.cout)} = ${eur(k.coutEnPlus)}`, tolerance: 1 },
          { libelle: "Enceintes qu'elle fait vendre en plus", attendu: k.enceintesEnPlus, calcul: `${qte(k.d.enceintesEnPlus)} − ${qte(k.f.enceintesEnPlus)} = ${qte(k.enceintesEnPlus)}`, tolerance: 0 },
          { libelle: "Ce que rapporte le stage du chapitre", attendu: k.f.gain, calcul: `${eur(k.f.margeEnPlus)} − ${eur(k.f.cout)} = ${eur(k.f.gain)}`, tolerance: 1 },
          { libelle: "Ce que rapporte le stage doublé", attendu: k.d.gain, calcul: `${eur(k.d.margeEnPlus)} − ${eur(k.d.cout)} = ${eur(k.d.gain)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = budgetDouble();
        return [
          k.enceintesEnPlus > 0
            ? `La seconde moitié fait vendre ${qte(k.enceintesEnPlus)} enceintes de plus, pour ${eur(k.coutEnPlus)}.`
            : `La seconde moitié coûte ${eur(k.coutEnPlus)} et ne fait vendre aucune enceinte de plus : une fois toute la demande servie, une minute gagnée ne trouve plus de client.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Que répondez-vous à la direction ?",
      options: () => {
        const k = budgetDouble();
        return [
          {
            texte: `Garder le stage du chapitre : le doubler ferait perdre ${eur(k.f.gain - k.d.gain)}`,
            juste: k.verdict === "garder",
            retour:
              k.verdict === "garder"
                ? `Oui : le stage du chapitre rapporte ${eur(k.f.gain)}, le stage doublé ${eur(k.d.gain)}. Les deux font vendre autant ; le second coûte ${eur(k.coutEnPlus)} de plus pour rien.`
                : `Non : le stage doublé rapporte ${eur(k.d.gain)}, le stage du chapitre ${eur(k.f.gain)}.`,
          },
          {
            texte: "Doubler : deux fois plus de minutes gagnées, c'est deux fois plus d'enceintes montées et vendues",
            juste: k.verdict === "doubler",
            retour:
              k.verdict === "doubler"
                ? `Oui : le stage doublé rapporte ${eur(k.d.gain)}.`
                : `Non : l'équipe monterait davantage, mais la ligne et la demande ne suivent pas. Les ventes ne montent que de ${qte(k.d.enceintesEnPlus)} enceintes, comme avec le stage du chapitre.`,
          },
          {
            texte: "Ne former personne : la formation coûte et ne rapporte rien cette année",
            juste: k.verdict === "aucun",
            retour: k.verdict === "aucun" ? "Oui : aucun des deux stages ne se paie dans l'année." : `Non : le stage du chapitre rapporte ${eur(k.f.gain)} dès la première année.`,
          },
        ];
      },
    },
  ],
};
