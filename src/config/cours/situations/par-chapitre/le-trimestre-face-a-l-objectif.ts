import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord, accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { deuxTrimestres } from "../../chapitres/tableau-de-bord-du-manager";
import { COMMERCES } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DE BORD DU MANAGER » : LE TRIMESTRE FACE À
 * L'OBJECTIF (BTS MCO, palier 4).
 *
 * La direction régionale avait fixé au point de vente un objectif de chiffre d'affaires pour
 * le deuxième trimestre. Elle demande au manager la ligne de son tableau de bord : l'écart
 * à l'objectif, le taux de réalisation, et ce qui l'explique, le volume ou le prix moyen.
 * L'élève refait seul les évolutions du chapitre, et les compare à un objectif.
 *
 * Le cas est neuf par sa question : le chapitre compare le trimestre 2 au trimestre 1 pour
 * trouver le voyant rouge ; ici, il le compare à un objectif, et l'on sépare l'effet du
 * volume de celui du prix moyen. Le piège : rapporter le réalisé au trimestre précédent, ou
 * l'objectif au réalisé. Les deux trimestres sont ceux du chapitre (`deuxTrimestres`).
 */

/**
 * L'objectif de progression fixé pour le trimestre 2 : 5 % de chiffre d'affaires de plus
 * qu'au trimestre 1. C'est l'ordre de grandeur d'un objectif trimestriel de progression
 * dans le commerce de détail : atteignable, sans être acquis.
 */
export const OBJECTIF_DU_TRIMESTRE = 0.05;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
// « + 0 » : un arrondi à zéro ne s'écrit pas « -0 ».
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function trimestreFaceALObjectif(c: Cas) {
  const d = deuxTrimestres(c);
  const objectif = Math.round(d.t1.ca * (1 + OBJECTIF_DU_TRIMESTRE));
  const realisation = auDixieme((d.t2.ca / objectif) * 100);
  const prix1 = auCentime(d.t1.ca / d.t1.ventes);
  const prix2 = auCentime(d.t2.ca / d.t2.ventes);
  return {
    ...d,
    objectif,
    ecart: d.t2.ca - objectif,
    realisation,
    atteint: d.t2.ca >= objectif,
    prix1,
    prix2,
    evolutionPrix: auDixieme((prix2 / prix1 - 1) * 100),
    // Les erreurs classiques : rapporter le réalisé au trimestre 1, ou l'objectif au réalisé.
    surLeTrimestre1: auDixieme((d.t2.ca / d.t1.ca) * 100),
    inverse: auDixieme((objectif / d.t2.ca) * 100),
  };
}

const statut = (taux: number) => (taux >= 100 ? "dépassé" : "manqué");

export const LE_TRIMESTRE_FACE_A_L_OBJECTIF: Situation = {
  code: "le-trimestre-face-a-l-objectif",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["tableau-de-bord-du-manager"],
  commanditaire: "La direction régionale",
  titre: "Le trimestre face à l'objectif",
  accroche:
    "La direction régionale avait fixé un objectif de chiffre d'affaires au deuxième trimestre. Elle attend la ligne du tableau de bord : l'écart, le taux de réalisation, et ce qui l'explique.",
  objectifs: [
    "Calculer un objectif de chiffre d'affaires à partir d'un taux de progression",
    "Calculer l'écart à l'objectif et le taux de réalisation",
    "Séparer l'évolution des ventes de celle du prix moyen",
    "Répondre à la direction avec le bon indicateur",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce cas suit le tableau de bord d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction régionale",
      texte: (c) => [
        `« Pour le trimestre 2, nous avions demandé à ${c.entreprise} ${pct(OBJECTIF_DU_TRIMESTRE * 100)} de chiffre d'affaires de plus qu'au trimestre 1. Envoyez-moi la ligne de votre tableau de bord : l'objectif, l'écart, le taux de réalisation, et ce qui l'explique, le nombre de ventes ou le prix moyen. »`,
        "Pas de cours cette fois : vous avez les deux trimestres de l'arène, ramenés à un mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = trimestreFaceALObjectif(c);
        return {
          titre: `${c.entreprise} · deux trimestres de l'arène, ramenés à un mois`,
          colonnes: ["Trimestre 1", "Trimestre 2"],
          lignes: [
            { libelle: "Chiffre d'affaires HT", valeurs: [eur(r.t1.ca), eur(r.t2.ca)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} ${accordPluriel(c, "vendu")} ou ${accordPluriel(c, "servi")}`, valeurs: [qte(r.t1.ventes), qte(r.t2.ventes)] },
          ],
        };
      },
      repere: () =>
        "À rendre : l'objectif du trimestre 2, l'écart et le taux de réalisation, l'évolution des ventes et du prix moyen, et votre réponse.",
    },
    {
      id: "l-objectif",
      type: "montants",
      titre: "L'objectif et le réalisé",
      notions: ["dashboard", "revenue"],
      question: () =>
        `Calculez l'objectif de chiffre d'affaires du trimestre 2, ramené à un mois (à l'euro), l'écart entre le réalisé et l'objectif (négatif s'il est manqué), puis le taux de réalisation de l'objectif, en pourcentage, au dixième.`,
      champs: (c) => {
        const r = trimestreFaceALObjectif(c);
        return [
          { libelle: "Objectif du trimestre 2", attendu: r.objectif, tolerance: 1, calcul: `${eur(r.t1.ca)} × ${(1 + OBJECTIF_DU_TRIMESTRE).toLocaleString("fr-FR")} = ${eur(r.objectif)}` },
          { libelle: "Écart à l'objectif", attendu: r.ecart, tolerance: 1, calcul: `${eur(r.t2.ca)} − ${eur(r.objectif)} = ${eur(r.ecart)}` },
          { libelle: "Taux de réalisation (%)", attendu: r.realisation, tolerance: 0.1, calcul: `${eur(r.t2.ca)} ÷ ${eur(r.objectif)} × 100 = ${pct(r.realisation)}` },
        ];
      },
      explication: (c) => {
        const r = trimestreFaceALObjectif(c);
        return [
          r.atteint
            ? `${c.entreprise} a réalisé ${pct(r.realisation)} de son objectif : ${eur(r.ecart)} de plus que demandé, chaque mois du trimestre.`
            : `${c.entreprise} n'a réalisé que ${pct(r.realisation)} de son objectif : il lui a manqué ${eur(-r.ecart)} chaque mois du trimestre.`,
        ];
      },
    },
    {
      id: "volume-ou-prix",
      type: "montants",
      titre: "Le volume ou le prix ?",
      notions: ["dashboard", "average_basket"],
      question: (c) =>
        `Le chiffre d'affaires, c'est des ventes multipliées par un prix moyen. Calculez le prix moyen d'${accord(c, "un")} ${c.unite} à chaque trimestre (au centime), puis l'évolution des ventes et celle du prix moyen du trimestre 1 au trimestre 2, en pourcentage, au dixième.`,
      champs: (c) => {
        const r = trimestreFaceALObjectif(c);
        return [
          { libelle: "Prix moyen du trimestre 1", attendu: r.prix1, calcul: `${eur(r.t1.ca)} ÷ ${qte(r.t1.ventes)} = ${eur(r.prix1)}` },
          { libelle: "Prix moyen du trimestre 2", attendu: r.prix2, calcul: `${eur(r.t2.ca)} ÷ ${qte(r.t2.ventes)} = ${eur(r.prix2)}` },
          { libelle: "Évolution des ventes (%)", attendu: r.evolutionVentes, tolerance: 0.1, calcul: `(${qte(r.t2.ventes)} ÷ ${qte(r.t1.ventes)} − 1) × 100 = ${pct(r.evolutionVentes)}` },
          { libelle: "Évolution du prix moyen (%)", attendu: r.evolutionPrix, tolerance: 0.1, calcul: `(${eur(r.prix2)} ÷ ${eur(r.prix1)} − 1) × 100 = ${pct(r.evolutionPrix)}` },
        ];
      },
      explication: (c) => {
        const r = trimestreFaceALObjectif(c);
        const deux = `Chez ${c.entreprise}, les ventes évoluent de ${pct(r.evolutionVentes)} et le prix moyen de ${pct(r.evolutionPrix)}.`;
        const volume = "Le manager regardera la demande, le stock et la capacité.";
        const prix = "Le manager regardera ce qui se vend, et les remises accordées.";
        if (r.atteint) {
          return [`${deux} ${r.evolutionVentes >= r.evolutionPrix ? "C'est le nombre de ventes qui porte la progression." : "C'est le prix moyen qui porte la progression."}`];
        }
        if (r.evolutionVentes < 0 && r.evolutionPrix < 0) return [`${deux} Les deux reculent : il manque des ventes, et chacune rapporte moins. ${volume}`];
        if (r.evolutionVentes < 0) return [`${deux} C'est le nombre de ventes qui manque à l'objectif. ${volume}`];
        if (r.evolutionPrix < 0) return [`${deux} C'est le prix moyen qui manque à l'objectif. ${prix}`];
        return [`${deux} Les deux progressent, mais ensemble moins que les ${pct(OBJECTIF_DU_TRIMESTRE * 100)} demandés.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction régionale",
      question: () => "Quelle ligne envoyez-vous à la direction régionale ?",
      options: (c) => {
        const r = trimestreFaceALObjectif(c);
        return [
          {
            texte: `Objectif ${statut(r.realisation)} : ${pct(r.realisation)} de réalisation`,
            juste: true,
            retour: `Oui : ${eur(r.t2.ca)} réalisés pour ${eur(r.objectif)} demandés, soit un écart de ${eur(r.ecart)} par mois. Le taux de réalisation rapporte toujours le réalisé à l'objectif.`,
          },
          {
            texte: `Objectif ${statut(r.surLeTrimestre1)} : ${pct(r.surLeTrimestre1)} de réalisation, rapporté au trimestre 1`,
            juste: false,
            retour: `Non : ${pct(r.surLeTrimestre1)} compare le trimestre 2 au trimestre 1, pas à l'objectif. L'objectif était de ${eur(r.objectif)}, ${pct(OBJECTIF_DU_TRIMESTRE * 100)} au-dessus du trimestre 1 : le taux de réalisation est de ${pct(r.realisation)}.`,
          },
          {
            texte: `Objectif ${statut(r.inverse)} : ${pct(r.inverse)} de réalisation, l'objectif divisé par le réalisé`,
            juste: false,
            retour: `Non : le rapport est inversé. On divise ce qui a été fait par ce qui était demandé : ${eur(r.t2.ca)} ÷ ${eur(r.objectif)} = ${pct(r.realisation)}.`,
          },
        ];
      },
    },
  ],
};
