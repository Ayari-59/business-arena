import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import {
  evolution,
  indicateursDeLAnnee,
  lectureDe,
  tableauDesQuatreTrimestres,
  type Lecture,
} from "../../chapitres/evaluer-son-activite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ÉVALUER SON ACTIVITÉ » : LE SECOND SEMESTRE A-T-IL ÉTÉ MEILLEUR ?
 * (seconde, management et gestion, palier 1).
 *
 * L'associée a entendu dire que la fin d'année s'était mieux passée que le début. Elle demande
 * de comparer les deux semestres : l'élève additionne les trimestres deux à deux, calcule les
 * évolutions du chiffre d'affaires et des ventes, compare les résultats, puis répond.
 *
 * Le cas est neuf par sa question : le chapitre comparait le premier et le dernier trimestre,
 * deux trimestres qu'une saison peut séparer ; ici, on compare deux moitiés d'année, ce qui
 * lisse un trimestre creux. Les chiffres sont ceux du chapitre (`indicateursDeLAnnee`) : l'année
 * du cours, trimestre par trimestre.
 */

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const signe = (t: number) => (t > 0 ? `+${pct(t)}` : pct(t));

/** Les deux semestres de l'année, leurs évolutions, et ce qu'ils disent ensemble. */
export function deuxSemestres(c: Cas) {
  const t = indicateursDeLAnnee(c.code);
  const semestre = (a: number, b: number) => ({
    chiffreDAffaires: t[a]!.chiffreDAffaires + t[b]!.chiffreDAffaires,
    ventes: t[a]!.ventes + t[b]!.ventes,
    resultat: t[a]!.resultat + t[b]!.resultat,
  });
  const premier = semestre(0, 1);
  const second = semestre(2, 3);
  return {
    premier,
    second,
    evolutionDuChiffre: evolution(premier.chiffreDAffaires, second.chiffreDAffaires),
    evolutionDesVentes: evolution(premier.ventes, second.ventes),
    ecartDeResultat: second.resultat - premier.resultat,
    lecture: lectureDe(second.chiffreDAffaires > premier.chiffreDAffaires, second.resultat > premier.resultat),
  };
}

export const LE_SECOND_SEMESTRE: Situation = {
  code: "le-second-semestre-a-t-il-ete-meilleur",
  parcours: "seconde-mg",
  palier: 1,
  blocs: [],
  reprend: ["evaluer-son-activite"],
  commanditaire: "L'associée",
  titre: "Le second semestre a-t-il été meilleur ?",
  accroche:
    "L'associée a entendu dire que la fin d'année s'était mieux passée que le début. Comparer les deux moitiés de l'année, indicateurs à l'appui, et lui répondre.",
  objectifs: [
    "Regrouper des trimestres en semestres",
    "Calculer une évolution en pourcentage",
    "Comparer deux résultats, même négatifs",
    "Répondre à l'associée, chiffres à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'associée",
      tableau: tableauDesQuatreTrimestres,
      texte: (c) => [
        `« On m'a dit qu'au second semestre, ${c.entreprise} avait mieux travaillé qu'au premier. Comparez-moi les deux moitiés de l'année : le chiffre d'affaires, les ventes, le résultat. Est-ce vrai ? »`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre. Le premier semestre, ce sont les deux premiers trimestres ; le second, les deux derniers.",
      ],
      repere: () => "À rendre : les évolutions du chiffre d'affaires et des ventes d'un semestre à l'autre, les deux résultats, et votre réponse.",
    },
    {
      id: "chiffre-et-ventes",
      type: "montants",
      titre: "Le chiffre d'affaires et les ventes des deux semestres",
      notions: ["revenue", "dashboard"],
      question: () =>
        "Additionnez les trimestres deux à deux. Calculez le chiffre d'affaires de chaque semestre, puis, en pourcentage et au dixième, l'évolution du chiffre d'affaires et celle des ventes du premier au second semestre.",
      champs: (c) => {
        const k = deuxSemestres(c);
        const t = indicateursDeLAnnee(c.code);
        return [
          {
            libelle: "Chiffre d'affaires du premier semestre",
            attendu: k.premier.chiffreDAffaires,
            calcul: `${eur(t[0]!.chiffreDAffaires)} + ${eur(t[1]!.chiffreDAffaires)} = ${eur(k.premier.chiffreDAffaires)}`,
            tolerance: 1,
          },
          {
            libelle: "Chiffre d'affaires du second semestre",
            attendu: k.second.chiffreDAffaires,
            calcul: `${eur(t[2]!.chiffreDAffaires)} + ${eur(t[3]!.chiffreDAffaires)} = ${eur(k.second.chiffreDAffaires)}`,
            tolerance: 1,
          },
          {
            libelle: "Évolution du chiffre d'affaires d'un semestre à l'autre (%)",
            attendu: k.evolutionDuChiffre,
            calcul: `(${eur(k.second.chiffreDAffaires)} − ${eur(k.premier.chiffreDAffaires)}) ÷ ${eur(k.premier.chiffreDAffaires)} × 100 = ${pct(k.evolutionDuChiffre)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Évolution des ventes d'un semestre à l'autre (%)",
            attendu: k.evolutionDesVentes,
            calcul: `(${qte(k.second.ventes)} − ${qte(k.premier.ventes)}) ÷ ${qte(k.premier.ventes)} × 100 = ${pct(k.evolutionDesVentes)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = deuxSemestres(c);
        return [`D'un semestre à l'autre, le chiffre d'affaires évolue de ${signe(k.evolutionDuChiffre)}, les ventes de ${signe(k.evolutionDesVentes)} (${qte(k.premier.ventes)} puis ${qte(k.second.ventes)} ${c.unites}).`];
      },
    },
    {
      id: "resultats",
      type: "montants",
      titre: "Le résultat des deux semestres",
      notions: ["income_statement"],
      question: () =>
        "Calculez le résultat de l'activité de chaque semestre, puis l'écart en euros du premier au second (un résultat peut être négatif : on compare alors en euros, pas en pourcentage).",
      champs: (c) => {
        const k = deuxSemestres(c);
        const t = indicateursDeLAnnee(c.code);
        return [
          {
            libelle: "Résultat de l'activité du premier semestre",
            attendu: k.premier.resultat,
            calcul: `${eur(t[0]!.resultat)} + ${retranche(t[1]!.resultat)} = ${eur(k.premier.resultat)}`,
            tolerance: 1,
          },
          {
            libelle: "Résultat de l'activité du second semestre",
            attendu: k.second.resultat,
            calcul: `${eur(t[2]!.resultat)} + ${retranche(t[3]!.resultat)} = ${eur(k.second.resultat)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de résultat, du premier au second semestre",
            attendu: k.ecartDeResultat,
            calcul: `${eur(k.second.resultat)} − ${retranche(k.premier.resultat)} = ${eur(k.ecartDeResultat)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const k = deuxSemestres(c);
        return [
          `Le résultat de l'activité passe de ${eur(k.premier.resultat)} au premier semestre à ${eur(k.second.resultat)} au second : il ${k.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(k.ecartDeResultat))}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associée",
      notions: ["dashboard"],
      question: () => "Quelle phrase envoyez-vous à l'associée ?",
      options: (c) => {
        const k = deuxSemestres(c);
        const chiffres = `Chiffre d'affaires ${signe(k.evolutionDuChiffre)}, ventes ${signe(k.evolutionDesVentes)}, résultat de l'activité de ${eur(k.premier.resultat)} à ${eur(k.second.resultat)}.`;
        const reponse = (l: Lecture, oui: string) => ({ juste: k.lecture === l, retour: k.lecture === l ? `Oui. ${chiffres} ${oui}` : `Non. ${chiffres}` });
        return [
          {
            texte: "Oui : chiffre d'affaires et résultat en hausse au second semestre",
            ...reponse("en-hausse", "Le second semestre a vendu davantage, avec un meilleur résultat : c'est vrai."),
          },
          {
            texte: "En partie : chiffre d'affaires en hausse, mais résultat en baisse",
            ...reponse("chiffre-en-hausse", "Le second semestre a vendu davantage, mais avec un moins bon résultat : ses charges ont augmenté plus que son chiffre d'affaires."),
          },
          {
            texte: "Non : chiffre d'affaires et résultat en baisse au second semestre",
            ...reponse("en-baisse", "Le second semestre a vendu moins, avec un moins bon résultat : ce qu'on vous a dit est faux."),
          },
          {
            texte: "En partie : chiffre d'affaires en baisse, mais résultat en hausse",
            ...reponse("resultat-en-hausse", "Le second semestre a vendu moins, mais avec un meilleur résultat : ses charges ont baissé plus que son chiffre d'affaires."),
          },
        ];
      },
    },
  ],
};
