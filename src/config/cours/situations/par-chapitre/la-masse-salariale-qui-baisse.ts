import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { indicateursSociaux } from "../../chapitres/indicateurs-sociaux";
import { remuneration } from "../../chapitres/remuneration-et-motivation";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES INDICATEURS SOCIAUX » : LA MASSE SALARIALE QUI BAISSE (Bac STMG,
 * ressources humaines, palier 1).
 *
 * Le directeur financier lit le tableau de bord social de l'année aux salaires baissés, celle du
 * chapitre, et s'arrête sur une ligne : la masse salariale baisse trimestre après trimestre. Il
 * veut la présenter comme une réussite de gestion. L'élève calcule l'évolution de la masse
 * salariale et celle de l'effectif, ce que coûte un salarié au premier et au dernier trimestre,
 * puis le taux de rotation, comme au chapitre, pour dire d'où vient la baisse.
 *
 * Le cas est neuf par sa question : le chapitre se méfie du chiffre d'affaires par salarié, le cas
 * se méfie de la masse salariale. Le tableau de bord est celui du chapitre (`indicateursSociaux`),
 * sans rien y ajouter.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const evolution = (debut: number, fin: number) => auDixieme(((fin - debut) / debut) * 100);

/** Le tableau de bord du chapitre, et ce que la masse salariale en dit. */
export function masseQuiBaisse(c: Cas) {
  const s = indicateursSociaux(c);
  const premier = s.trimestres[0]!;
  const dernier = s.trimestres.at(-1)!;
  const coutParSalarieDebut = Math.round(premier.masse / premier.effectif);
  const coutParSalarieFin = Math.round(dernier.masse / dernier.effectif);
  return {
    s,
    premier,
    dernier,
    evolutionDeLaMasse: evolution(premier.masse, dernier.masse),
    evolutionDeLEffectif: evolution(premier.effectif, dernier.effectif),
    evolutionDesVentes: evolution(premier.ventes, dernier.ventes),
    coutParSalarieDebut,
    coutParSalarieFin,
    /** La masse salariale baisse d'un trimestre à l'autre, chaque fois. */
    baisseChaqueTrimestre: s.trimestres.every((t, i) => i === 0 || t.masse < s.trimestres[i - 1]!.masse),
    /** Les embauches de l'année jouée, gardées aux salaires baissés : elles compensent une part des départs. */
    embauches: remuneration(c).embauches,
  };
}

export const LA_MASSE_SALARIALE_QUI_BAISSE: Situation = {
  code: "la-masse-salariale-qui-baisse",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["indicateurs-sociaux"],
  commanditaire: "Le directeur financier",
  titre: "La masse salariale qui baisse",
  accroche:
    "Le directeur financier veut présenter la baisse de la masse salariale comme une réussite. D'où vient-elle : de salariés qui coûtent moins, ou d'une équipe qui part ?",
  objectifs: [
    "Calculer l'évolution de la masse salariale et celle de l'effectif",
    "Calculer ce que coûte un salarié d'un trimestre à l'autre",
    "Calculer un taux de rotation du personnel",
    "Répondre au directeur financier, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      texte: (c) => {
        const m = masseQuiBaisse(c);
        return [
          `« Regardez notre tableau de bord social : la masse salariale ${dE(c.entreprise)} ${m.baisseChaqueTrimestre ? "baisse à chaque trimestre" : "a baissé sur l'année"}. Je veux présenter cette baisse au conseil comme une réussite de gestion. Vérifiez-la, dites-moi d'où elle vient, et ce que je peux en dire. »`,
          "Pas de cours cette fois : vous avez le tableau de bord de l'année, celle où les salaires ont été baissés au premier trimestre, et les calculs sont ceux du chapitre.",
        ];
      },
      tableau: (c) => {
        const m = masseQuiBaisse(c);
        return {
          titre: `Le tableau de bord social ${dE(c.entreprise)}`,
          colonnes: m.s.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Effectif", valeurs: m.s.trimestres.map((t) => String(t.effectif)) },
            { libelle: "Départs", valeurs: m.s.trimestres.map((t) => String(t.departs)) },
            { libelle: "Masse salariale", valeurs: m.s.trimestres.map((t) => eur(t.masse)) },
            { libelle: "Chiffre d'affaires", valeurs: m.s.trimestres.map((t) => eur(t.ventes)) },
          ],
        };
      },
      repere: () =>
        "À rendre : l'évolution de la masse salariale et de l'effectif, le coût d'un salarié au premier et au dernier trimestre, le taux de rotation, et votre réponse.",
    },
    {
      id: "evolutions",
      type: "montants",
      titre: "La masse salariale et l'effectif",
      notions: ["payroll", "staff_turnover"],
      question: () =>
        "Calculez l'évolution de la masse salariale du premier au dernier trimestre, puis celle de l'effectif, en pourcentage au dixième ((dernier − premier) ÷ premier × 100).",
      champs: (c) => {
        const m = masseQuiBaisse(c);
        return [
          { libelle: "Évolution de la masse salariale (%)", attendu: m.evolutionDeLaMasse, tolerance: 0.2, calcul: `(${eur(m.dernier.masse)} − ${eur(m.premier.masse)}) ÷ ${eur(m.premier.masse)} × 100 = ${pct(m.evolutionDeLaMasse)}` },
          { libelle: "Évolution de l'effectif (%)", attendu: m.evolutionDeLEffectif, tolerance: 0.2, calcul: `(${m.dernier.effectif} − ${m.premier.effectif}) ÷ ${m.premier.effectif} × 100 = ${pct(m.evolutionDeLEffectif)}` },
        ];
      },
      explication: (c) => {
        const m = masseQuiBaisse(c);
        return [
          `La masse salariale ${dE(c.entreprise)} évolue de ${pct(m.evolutionDeLaMasse)}, l'effectif de ${pct(m.evolutionDeLEffectif)} : les deux baissent du même pourcentage, ou presque. Ce n'est pas un hasard, et l'étape suivante dit pourquoi.`,
        ];
      },
    },
    {
      id: "cout-d-un-salarie",
      type: "montants",
      titre: "Ce que coûte un salarié",
      notions: ["payroll"],
      question: () =>
        "Calculez la masse salariale par salarié au premier trimestre, puis au dernier (masse salariale ÷ effectif, à l'euro).",
      champs: (c) => {
        const m = masseQuiBaisse(c);
        return [
          { libelle: "Masse salariale par salarié au premier trimestre", attendu: m.coutParSalarieDebut, tolerance: 1, calcul: `${eur(m.premier.masse)} ÷ ${m.premier.effectif} = ${eur(m.coutParSalarieDebut)}` },
          { libelle: "Masse salariale par salarié au dernier trimestre", attendu: m.coutParSalarieFin, tolerance: 1, calcul: `${eur(m.dernier.masse)} ÷ ${m.dernier.effectif} = ${eur(m.coutParSalarieFin)}` },
        ];
      },
      explication: (c) => {
        const m = masseQuiBaisse(c);
        return [
          m.coutParSalarieFin === m.coutParSalarieDebut
            ? `Chaque salarié coûte ${eur(m.coutParSalarieFin)} par trimestre, au premier comme au dernier : la baisse des salaires a eu lieu une fois, au premier trimestre, et ne se répète pas. Si la masse salariale baisse ensuite, c'est qu'il y a moins de salariés à payer.`
            : `Un salarié coûte ${eur(m.coutParSalarieDebut)} au premier trimestre, ${eur(m.coutParSalarieFin)} au dernier : son coût bouge peu, l'effectif beaucoup.`,
        ];
      },
    },
    {
      id: "rotation",
      type: "montants",
      titre: "Le taux de rotation",
      notions: ["staff_turnover"],
      question: () =>
        "Calculez les départs de l'année, l'effectif moyen (la moyenne des trimestres, au dixième), puis le taux de rotation du personnel sur l'année, en pourcentage au dixième.",
      champs: (c) => {
        const { s } = masseQuiBaisse(c);
        return [
          { libelle: "Départs de l'année", attendu: s.departs, tolerance: 0, calcul: `${s.trimestres.map((t) => t.departs).join(" + ")} = ${s.departs}` },
          { libelle: "Effectif moyen", attendu: s.effectifMoyen, tolerance: 0.1, calcul: `(${s.trimestres.map((t) => t.effectif).join(" + ")}) ÷ ${s.trimestres.length} = ${qte(s.effectifMoyen)}` },
          { libelle: "Taux de rotation (%)", attendu: s.rotation, tolerance: 0.2, calcul: `${s.departs} ÷ ${qte(s.effectifMoyen)} × 100 = ${pct(s.rotation)}` },
        ];
      },
      explication: (c) => {
        const m = masseQuiBaisse(c);
        const s = m.s;
        return [
          `En une année, ${s.departs} salariés sont partis, ${pct(s.rotation)} de l'effectif moyen. C'est d'eux que vient la baisse de la masse salariale${m.embauches > 0 ? `, les ${m.embauches} embauches de l'année n'en compensant qu'une part` : ""} : chaque départ est un salaire de moins à payer, et un poste de moins pour servir les clients.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Quelle phrase envoyez-vous au directeur financier ?",
      options: (c) => {
        const m = masseQuiBaisse(c);
        const { s } = m;
        return [
          {
            texte: "La masse baisse parce que l'équipe part : ce n'est pas une réussite",
            juste: true,
            retour: `Oui : ${m.coutParSalarieFin === m.coutParSalarieDebut ? "chaque salarié coûte autant au dernier trimestre qu'au premier" : `un salarié coûte ${eur(m.coutParSalarieFin)} au dernier trimestre, ${eur(m.coutParSalarieDebut)} au premier`}, et l'effectif passe de ${m.premier.effectif} à ${m.dernier.effectif}. ${s.departs} départs en un an, un taux de rotation de ${pct(s.rotation)} : c'est une équipe qui s'en va, pas une gestion qui s'améliore.`,
          },
          {
            texte: "La masse baisse parce que chaque salarié coûte moins cher à chaque trimestre",
            juste: false,
            retour: `Non : la masse salariale par salarié est de ${eur(m.coutParSalarieDebut)} au premier trimestre et de ${eur(m.coutParSalarieFin)} au dernier. Les salaires ont baissé une fois ; ce qui baisse ensuite, c'est l'effectif.`,
          },
          {
            texte: "La masse baisse parce qu'elle suit le chiffre d'affaires du trimestre",
            juste: false,
            retour: `Non : la masse salariale dépend des salariés payés, pas des ventes. Le chiffre d'affaires évolue de ${pct(m.evolutionDesVentes)} du premier au dernier trimestre, la masse salariale de ${pct(m.evolutionDeLaMasse)}, comme l'effectif.`,
          },
          {
            texte: "C'est une réussite : nous payons moins pour faire le même travail",
            juste: false,
            retour: `Non : l'équipe n'est plus la même, ${s.departs} salariés sont partis dans l'année. Une masse salariale se lit avec l'effectif et les départs, jamais seule.`,
          },
        ];
      },
    },
  ],
};
