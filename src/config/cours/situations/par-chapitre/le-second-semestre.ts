import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { POURQUOI_EVALUER, evolution, indicateursDuSemestre, lectureDe, tableauDuSemestre, type Lecture } from "../../chapitres/evaluer-son-activite";
import { ENTREPRISES_DE_LA_GESTION_DE_BASE } from "../../monde/gestion-et-information";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ÉVALUER SON ACTIVITÉ » : LE DEUXIÈME TRIMESTRE A-T-IL ÉTÉ MEILLEUR ?
 * (seconde, management et gestion, palier 1).
 *
 * L'associée a entendu dire que le printemps s'était mieux passé que l'hiver. Elle demande de
 * comparer les deux trimestres du semestre : l'élève additionne les mois trois par trois, calcule
 * les évolutions du chiffre d'affaires et des ventes, compare les résultats, puis répond.
 *
 * Le cas est neuf par sa question : le chapitre comparait le premier et le dernier mois, deux mois
 * qu'un mois court peut fausser ; ici, on compare deux trimestres, ce qui lisse un mois creux.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, chez NOVA seule : les six mois du chapitre
 * (indicateursDuSemestre). Son code garde le mot « semestre » de sa première version, où il
 * comparait deux semestres de l'année de l'arène ; il compare maintenant deux trimestres de NOVA.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const signe = (t: number) => (t > 0 ? `+${pct(t)}` : pct(t));

/** Les deux trimestres du semestre, leurs évolutions, et ce qu'ils disent ensemble. */
export function deuxTrimestres() {
  const t = indicateursDuSemestre();
  const trimestre = (debut: number) => {
    const m = t.slice(debut, debut + 3);
    return {
      mois: m,
      chiffreDAffaires: auCentime(m.reduce((s, x) => s + x.chiffreDAffaires, 0)),
      ventes: m.reduce((s, x) => s + x.ventes, 0),
      resultat: auCentime(m.reduce((s, x) => s + x.resultat, 0)),
    };
  };
  const premier = trimestre(0);
  const second = trimestre(3);
  return {
    premier,
    second,
    evolutionDuChiffre: evolution(premier.chiffreDAffaires, second.chiffreDAffaires),
    evolutionDesVentes: evolution(premier.ventes, second.ventes),
    ecartDeResultat: auCentime(second.resultat - premier.resultat),
    lecture: lectureDe(second.chiffreDAffaires > premier.chiffreDAffaires, second.resultat > premier.resultat),
  };
}

const somme = (xs: readonly number[], f: (x: number) => string) => xs.map(f).join(" + ");

export const LE_SECOND_SEMESTRE: Situation = {
  code: "le-second-semestre-a-t-il-ete-meilleur",
  parcours: "seconde-mg",
  palier: 1,
  blocs: [],
  reprend: ["evaluer-son-activite"],
  commanditaire: "L'associée",
  titre: "Le deuxième trimestre a-t-il été meilleur ?",
  accroche: "L'associée a entendu dire que le printemps s'était mieux passé que l'hiver. Comparer le premier et le deuxième trimestre, indicateurs à l'appui, et lui répondre.",
  objectifs: ["Regrouper des mois en trimestres", "Calculer une évolution en pourcentage", "Comparer deux résultats, même quand un mois est en perte", "Répondre à l'associée, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_EVALUER },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'associée",
      tableau: (c: Cas) => tableauDuSemestre(c),
      texte: (c) => [
        `« On m'a dit qu'au printemps, ${c.entreprise} avait mieux travaillé qu'en hiver. Comparez-moi l'hiver et le printemps : le chiffre d'affaires, les ventes, le résultat. Est-ce vrai ? »`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre. Le premier trimestre, ce sont janvier, février et mars ; le deuxième, avril, mai et juin.",
      ],
      repere: () => "À rendre : les évolutions du chiffre d'affaires et des ventes d'un trimestre à l'autre, le résultat de chacun, et votre réponse.",
    },
    {
      id: "chiffre-et-ventes",
      type: "montants",
      titre: "Le chiffre d'affaires et les ventes de chaque trimestre",
      notions: ["revenue", "dashboard"],
      question: () =>
        "Additionnez les mois de chaque trimestre. Calculez le chiffre d'affaires de chaque trimestre, puis, en pourcentage et au dixième, l'évolution du chiffre d'affaires et celle des ventes du premier au deuxième trimestre.",
      champs: () => {
        const k = deuxTrimestres();
        return [
          { libelle: "Chiffre d'affaires du premier trimestre", attendu: k.premier.chiffreDAffaires, calcul: `${somme(k.premier.mois.map((x) => x.chiffreDAffaires), eur)} = ${eur(k.premier.chiffreDAffaires)}` },
          { libelle: "Chiffre d'affaires du deuxième trimestre", attendu: k.second.chiffreDAffaires, calcul: `${somme(k.second.mois.map((x) => x.chiffreDAffaires), eur)} = ${eur(k.second.chiffreDAffaires)}` },
          { libelle: "Évolution du chiffre d'affaires d'un trimestre à l'autre (%)", attendu: k.evolutionDuChiffre, calcul: `(${eur(k.second.chiffreDAffaires)} − ${eur(k.premier.chiffreDAffaires)}) ÷ ${eur(k.premier.chiffreDAffaires)} × 100 = ${pct(k.evolutionDuChiffre)}`, tolerance: 0.1 },
          { libelle: "Évolution des ventes d'un trimestre à l'autre (%)", attendu: k.evolutionDesVentes, calcul: `(${qte(k.second.ventes)} − ${qte(k.premier.ventes)}) ÷ ${qte(k.premier.ventes)} × 100 = ${pct(k.evolutionDesVentes)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = deuxTrimestres();
        return [`D'un trimestre à l'autre, le chiffre d'affaires évolue de ${signe(k.evolutionDuChiffre)}, les ventes de ${signe(k.evolutionDesVentes)} (${qte(k.premier.ventes)} puis ${qte(k.second.ventes)} ${c.unites}).`];
      },
    },
    {
      id: "resultats",
      type: "montants",
      titre: "Le résultat de chaque trimestre",
      notions: ["income_statement"],
      question: () =>
        "Calculez le résultat de l'activité de chaque trimestre (la somme de ses mois, avant les intérêts de l'emprunt), puis l'écart en euros du premier au deuxième (un mois en perte compte avec son signe : on compare alors en euros, pas en pourcentage).",
      champs: () => {
        const k = deuxTrimestres();
        return [
          { libelle: "Résultat de l'activité du premier trimestre", attendu: k.premier.resultat, calcul: `${somme(k.premier.mois.map((x) => x.resultat), retranche)} = ${eur(k.premier.resultat)}` },
          { libelle: "Résultat de l'activité du deuxième trimestre", attendu: k.second.resultat, calcul: `${somme(k.second.mois.map((x) => x.resultat), retranche)} = ${eur(k.second.resultat)}` },
          { libelle: "Écart de résultat, du premier au deuxième trimestre", attendu: k.ecartDeResultat, calcul: `${eur(k.second.resultat)} − ${retranche(k.premier.resultat)} = ${eur(k.ecartDeResultat)}` },
        ];
      },
      explication: () => {
        const k = deuxTrimestres();
        return [`Le résultat passe de ${eur(k.premier.resultat)} au premier trimestre à ${eur(k.second.resultat)} au deuxième : il ${k.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(k.ecartDeResultat))}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associée",
      notions: ["dashboard"],
      question: () => "Quelle phrase envoyez-vous à l'associée ?",
      options: () => {
        const k = deuxTrimestres();
        const chiffres = `Chiffre d'affaires ${signe(k.evolutionDuChiffre)}, ventes ${signe(k.evolutionDesVentes)}, résultat de ${eur(k.premier.resultat)} à ${eur(k.second.resultat)}.`;
        const reponse = (l: Lecture, oui: string) => ({ juste: k.lecture === l, retour: k.lecture === l ? `Oui. ${chiffres} ${oui}` : `Non. ${chiffres}` });
        return [
          { texte: "Oui : chiffre d'affaires et résultat en hausse au deuxième trimestre", ...reponse("en-hausse", "Le printemps a vendu davantage, avec un meilleur résultat : c'est vrai. Les charges fixes n'ont pas bougé : chaque enceinte vendue en plus a ajouté sa marge.") },
          { texte: "En partie : chiffre d'affaires en hausse, mais résultat en baisse", ...reponse("chiffre-en-hausse", "Le printemps a vendu davantage, mais avec un moins bon résultat.") },
          { texte: "Non : chiffre d'affaires et résultat en baisse au deuxième trimestre", ...reponse("en-baisse", "Le printemps a vendu moins, avec un moins bon résultat : ce qu'on vous a dit est faux.") },
          { texte: "En partie : chiffre d'affaires en baisse, mais résultat en hausse", ...reponse("resultat-en-hausse", "Le printemps a vendu moins, mais avec un meilleur résultat.") },
        ];
      },
    },
  ],
};
