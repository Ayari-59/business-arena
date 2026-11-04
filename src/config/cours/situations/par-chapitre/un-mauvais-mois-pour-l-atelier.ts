import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_ORGANISATION, ficheDe } from "../../chapitres/le-controle-de-gestion-dans-l-organisation";
import { coutDeLAtelierDuMois } from "../../monde/organisation-du-controle";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE CONTRÔLE DE GESTION DANS L'ORGANISATION » : UN MAUVAIS MOIS POUR
 * L'ATELIER ? (contrôle de gestion, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : l'atelier de NOVA, centre de coûts, et ses
 * charges de janvier et de février (monde/organisation-du-controle.ts, `coutDeLAtelierDuMois`, sur les
 * charges fixes de l'atelier de monde/centres-de-nova.ts). Février vend moins : le coût complet d'une
 * enceinte monte, alors que l'atelier n'a rien consommé de plus par enceinte.
 *
 * LA QUESTION DU DIRIGEANT (une hypothèse du cas : la prime du chef d'atelier n'est pas un fait de
 * l'exercice) : faut-il retirer sa prime au chef d'atelier ? L'élève sépare, sans cours, ce que le
 * volume fait au coût et ce que l'atelier maîtrise, et répond par le principe de contrôlabilité.
 */

/** Les deux mois que compare le cas : janvier, puis février, le mois court. */
export const MOIS_DU_CAS = { avant: 0, apres: 1 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Les chiffres du cas, calculés une fois de la fiche. */
export function moisDeLAtelier(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const a = coutDeLAtelierDuMois(f, MOIS_DU_CAS.avant);
  const b = coutDeLAtelierDuMois(f, MOIS_DU_CAS.apres);
  return {
    f,
    a,
    b,
    hausse: auCentime(b.reel - a.reel),
    hausseDesFixes: auCentime(b.fixesParEnceinte - a.fixesParEnceinte),
    hausseDuVariable: auCentime(b.variable - a.variable),
    fixes: auCentime(a.fixesParEnceinte * a.quantite),
  };
}

export const UN_MAUVAIS_MOIS_POUR_L_ATELIER: Situation = {
  code: "un-mauvais-mois-pour-l-atelier",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["le-controle-de-gestion-dans-l-organisation"],
  commanditaire: "Le dirigeant",
  titre: "Un mauvais mois pour l'atelier ?",
  accroche: "En février, le coût d'une enceinte monte. Le dirigeant veut retirer sa prime au chef d'atelier : a-t-il mal travaillé, ou le mois a-t-il moins vendu ?",
  objectifs: [
    "Décomposer le coût d'une enceinte en ce que l'atelier maîtrise et ce que le volume lui impose",
    "Mesurer ce que la baisse des ventes fait au coût complet d'une enceinte",
    "Rendre au dirigeant une réponse fondée sur le principe de contrôlabilité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ORGANISATION,
    pourquoi: "ce cas reprend le chapitre « Le contrôle de gestion dans l'organisation », qui se joue sur l'atelier de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: (c) => {
        const n = moisDeLAtelier(c);
        return [
          `« En ${n.b.nom}, une enceinte nous a coûté ${eur(n.b.reel)} à l'atelier, contre ${eur(n.a.reel)} en ${n.a.nom}. Le chef d'atelier a laissé filer ses coûts : je pense lui retirer sa prime du mois. Vous êtes d'accord ? »`,
          `Pas de cours cette fois. L'atelier est un centre de coûts. Ses charges fixes, ${eur(n.fixes)} par mois, sont les mêmes chaque mois ; chaque enceinte consomme ${eur(n.a.variable)} de composants, d'emballage et d'énergie. ${majuscule(n.b.nom)} est un mois court : ${n.f.entreprise} y vend moins.`,
        ];
      },
      tableau: (c) => {
        const n = moisDeLAtelier(c);
        return {
          titre: "L'atelier en janvier et en février",
          colonnes: [majuscule(n.a.nom), majuscule(n.b.nom)],
          lignes: [
            { libelle: "Enceintes fabriquées", valeurs: [qte(n.a.quantite), qte(n.b.quantite)] },
            { libelle: "Charges fixes de l'atelier", valeurs: [eur(n.fixes), eur(n.fixes)] },
            { libelle: "Coût d'une enceinte à l'atelier", valeurs: [eur(n.a.reel), eur(n.b.reel)] },
          ],
        };
      },
      repere: () => "À rendre : ce que chaque enceinte porte de charges fixes chaque mois, ce qu'elle consomme, d'où vient la hausse, et votre réponse au dirigeant.",
    },
    {
      id: "les-charges-fixes",
      type: "montants",
      titre: "Ce que porte chaque enceinte",
      notions: ["fixed_costs", "full_unit_cost"],
      question: (c) => {
        const n = moisDeLAtelier(c);
        return `Calculez les charges fixes de l'atelier que porte chaque enceinte en ${n.a.nom}, puis en ${n.b.nom}, et la hausse d'un mois à l'autre.`;
      },
      champs: (c) => {
        const n = moisDeLAtelier(c);
        return [
          { libelle: `Charges fixes par enceinte en ${n.a.nom}`, attendu: n.a.fixesParEnceinte, calcul: `${eur(n.fixes)} ÷ ${qte(n.a.quantite)} = ${eur(n.a.fixesParEnceinte)}` },
          { libelle: `Charges fixes par enceinte en ${n.b.nom}`, attendu: n.b.fixesParEnceinte, calcul: `${eur(n.fixes)} ÷ ${qte(n.b.quantite)} = ${eur(n.b.fixesParEnceinte)}` },
          { libelle: "Hausse des charges fixes par enceinte", attendu: n.hausseDesFixes, calcul: `${eur(n.b.fixesParEnceinte)} − ${eur(n.a.fixesParEnceinte)} = ${eur(n.hausseDesFixes)}` },
        ];
      },
      explication: (c) => {
        const n = moisDeLAtelier(c);
        return [`Les mêmes ${eur(n.fixes)} se partagent sur ${qte(n.a.quantite - n.b.quantite)} enceintes de moins : chacune en porte davantage.`];
      },
    },
    {
      id: "ce-que-l-atelier-maitrise",
      type: "montants",
      titre: "Ce que l'atelier maîtrise",
      notions: ["variable_costs", "full_unit_cost"],
      question: (c) => {
        const n = moisDeLAtelier(c);
        return `Calculez le coût variable d'une enceinte en ${n.b.nom}, ce que ce coût a bougé depuis ${n.a.nom}, puis la hausse du coût d'une enceinte à l'atelier.`;
      },
      champs: (c) => {
        const n = moisDeLAtelier(c);
        const cv = n.f.moisDeReference.coutVariable;
        return [
          { libelle: `Coût variable d'une enceinte en ${n.b.nom}`, attendu: n.b.variable, calcul: `${eur(cv.composants)} de composants + ${eur(cv.autres)} d'emballage, de transport et d'énergie = ${eur(n.b.variable)}` },
          { libelle: "Variation du coût variable", attendu: n.hausseDuVariable, calcul: `${eur(n.b.variable)} − ${eur(n.a.variable)} = ${eur(n.hausseDuVariable)}` },
          { libelle: "Hausse du coût d'une enceinte", attendu: n.hausse, calcul: `${eur(n.b.reel)} − ${eur(n.a.reel)} = ${eur(n.hausse)}, les charges fixes par enceinte, au centime près` },
        ];
      },
      explication: (c) => {
        const n = moisDeLAtelier(c);
        return [`Toute la hausse, ${eur(n.hausse)}, vient des charges fixes réparties sur moins d'enceintes. Ce que l'atelier consomme par enceinte n'a pas bougé.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["fixed_costs"],
      question: (c) => `Faut-il retirer sa prime de ${moisDeLAtelier(c).b.nom} au chef d'atelier ?`,
      options: (c) => {
        const n = moisDeLAtelier(c);
        return [
          {
            texte: "Non : la hausse vient du volume",
            juste: true,
            retour: `Oui. Le chef d'atelier ne fixe pas les ventes : elles viennent du marché et du service commercial. Ce qu'il maîtrise, ${eur(n.b.variable)} par enceinte, est resté au même niveau. Le juger sur le coût complet, ce serait le punir d'un mois court ; on le juge sur ses charges maîtrisables, face à leur budget.`,
          },
          {
            texte: `Oui : ${eur(n.hausse)} de plus par enceinte, c'est un dérapage de l'atelier`,
            juste: false,
            retour: "Non : l'atelier n'a rien consommé de plus par enceinte. La hausse vient des charges fixes, réparties sur moins d'enceintes.",
          },
          {
            texte: "Oui, et la retirer aussi à la responsable commerciale, qui a moins vendu",
            juste: false,
            retour: "Non : février est un mois court, prévu comme tel. Un écart se juge face à un budget, pas face au mois d'avant.",
          },
          {
            texte: "Peu importe : un centre de coûts ne se juge pas sur ses coûts",
            juste: false,
            retour: "Non : un centre de coûts se juge bien sur ses coûts, mais sur ceux qu'il maîtrise, face à leur budget.",
          },
        ];
      },
    },
  ],
};
