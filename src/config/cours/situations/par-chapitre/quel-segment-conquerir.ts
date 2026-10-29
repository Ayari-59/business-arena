import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord, accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { SEGMENTER_ET_CIBLER, segmentation } from "../../chapitres/segmenter-et-cibler";
import { coutVariable as coutVariableDe, prixDeNova } from "../../monde/economie-et-marketing";
import { mercatiqueDe } from "../../monde/mercatique-de-nova";
import type { Situation } from "../types";

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

/**
 * CAS PRATIQUE DU CHAPITRE « SEGMENTER ET CIBLER » : QUEL SEGMENT CONQUÉRIR ?
 * (Bac STMG, mercatique, palier 1).
 *
 * La direction commerciale prépare une action ciblée : une offre et une campagne pour un
 * seul segment, avec pour objectif d'y gagner quelques points de part de marché. Elle
 * demande où cet objectif rapporterait le plus. L'élève lit les segments du premier
 * trimestre et refait seul les calculs du chapitre : la part de marché dans chaque segment,
 * les ventes que l'objectif apporterait dans chacun, puis le chiffre d'affaires et la marge
 * du meilleur, et la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre choisit une cible selon l'offre (haut de
 * gamme, promotion), le cas chiffre ce que rapporterait un même objectif dans chaque
 * segment. Les segments sont ceux du chapitre (`segmentation`) ; le prix et le coût variable
 * d'une unité, ceux du mois du cas (`cas.ts`).
 */

/**
 * L'objectif de l'action ciblée : 5 points de part de marché gagnés dans le segment visé en
 * un trimestre, ce qu'une offre dédiée et sa campagne peuvent raisonnablement prendre aux
 * concurrents sans guerre des prix.
 */
export const POINTS_A_GAGNER = 5;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`.replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** Les chiffres de la réponse, calculés une fois du cas. */
export function segmentAConquerir(c: Cas) {
  const g = segmentation(c);
  const prix = prixDeNova(mercatiqueDe(c));
  const coutVariable = coutVariableDe(mercatiqueDe(c));
  const margeUnitaire = auCentime(prix - coutVariable);
  const segments = g.clienteles.map((k) => ({
    ...k,
    // Des points de part de marché se comptent sur la taille du segment, pas sur nos ventes.
    ventesEnPlus: Math.round((k.taille * POINTS_A_GAGNER) / 100),
  }));
  const meilleur = segments.reduce((a, b) => (b.ventesEnPlus > a.ventesEnPlus ? b : a));
  // L'autre erreur classique : viser le segment où l'on est déjà le plus fort.
  const plusForte = segments.reduce((a, b) => (b.part > a.part ? b : a));
  const caEnPlus = auCentime(meilleur.ventesEnPlus * prix);
  const margeEnPlus = auCentime(meilleur.ventesEnPlus * margeUnitaire);
  // L'erreur classique : prendre 5 % de nos ventes dans le segment au lieu de 5 points du segment.
  const ventesSurNosVentes = Math.round((meilleur.demande * POINTS_A_GAGNER) / 100);
  return {
    prix,
    coutVariable,
    margeUnitaire,
    segments,
    meilleur,
    caEnPlus,
    margeEnPlus,
    ventesSurNosVentes,
    margeSurNosVentes: auCentime(ventesSurNosVentes * margeUnitaire),
    plusForte,
    margeDeLaPlusForte: auCentime(plusForte.ventesEnPlus * margeUnitaire),
  };
}

export const QUEL_SEGMENT_CONQUERIR: Situation = {
  code: "quel-segment-conquerir",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["segmenter-et-cibler"],
  commanditaire: "La direction commerciale",
  titre: "Quel segment conquérir ?",
  accroche:
    "La direction commerciale veut gagner 5 points de part de marché dans un seul segment. Lequel rapporterait le plus, et combien ?",
  objectifs: [
    "Calculer la part de marché de l'entreprise dans chaque segment",
    "Traduire un objectif en points de part de marché en ventes supplémentaires",
    "Chiffrer le chiffre d'affaires et la marge qu'apporterait un segment",
    "Rédiger une recommandation chiffrée à la direction commerciale",
  ],
  libre: false,
  entreprises: SEGMENTER_ET_CIBLER.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction commerciale",
      texte: (c) => [
        `« Nous préparons une action ciblée pour le prochain trimestre : une offre et une campagne pour un seul segment, avec un objectif de ${qte(POINTS_A_GAGNER)} points de part de marché gagnés dans ce segment. Avant de choisir, dites-moi où ces ${qte(POINTS_A_GAGNER)} points rapporteraient le plus à ${c.entreprise}, en ventes et en marge. »`,
        "Pas de cours cette fois : vous avez les segments du premier trimestre, et les calculs sont ceux du chapitre. À vous de les enchaîner.",
      ],
      tableau: (c) => {
        const r = segmentAConquerir(c);
        return {
          titre: `Les segments au premier trimestre · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            ...r.segments.flatMap((k) => [
              { libelle: `Taille du segment « ${k.nom} » (${c.unites})`, valeurs: [qte(k.taille)] },
              { libelle: `Demande reçue par ${c.entreprise} dans « ${k.nom} »`, valeurs: [qte(k.demande)] },
            ]),
            { libelle: `Prix moyen d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.coutVariable)] },
            { libelle: "Objectif de l'action ciblée", valeurs: [`${qte(POINTS_A_GAGNER)} points de part de marché`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la part de marché dans chaque segment, les ventes que l'objectif apporterait dans chacun, le chiffre d'affaires et la marge du meilleur, et votre recommandation.",
    },
    {
      id: "parts",
      type: "montants",
      titre: "La part de marché dans chaque segment",
      notions: ["segmentation", "demand_market_share"],
      question: () =>
        "Calculez la part de marché que l'entreprise tient dans chaque segment (ventes ÷ taille du segment × 100), en pourcentage au dixième.",
      champs: (c) =>
        segmentAConquerir(c).segments.map((k) => ({
          libelle: `Part de marché dans « ${k.nom} » (%)`,
          attendu: k.part,
          tolerance: 0.1,
          calcul: `${qte(k.demande)} ÷ ${qte(k.taille)} × 100 = ${pct(k.part)}`,
        })),
      explication: (c) => {
        const r = segmentAConquerir(c);
        const parts = r.segments.map((k) => k.part);
        const ecart = Math.round((Math.max(...parts) - Math.min(...parts)) * 10) / 10;
        return [
          ecart < 5
            ? `${c.entreprise} tient une part voisine dans chaque segment : à peine ${qte(ecart)} point${ecart >= 2 ? "s" : ""} d'écart. Ce n'est donc pas la part déjà tenue qui départagera les segments, c'est leur taille.`
            : `Les parts de marché diffèrent nettement d'un segment à l'autre, de ${pct(Math.min(...parts))} à ${pct(Math.max(...parts))}. Mais un objectif en points se compte sur la taille du segment : c'est elle qui dira où il rapporte le plus.`,
        ];
      },
    },
    {
      id: "ventes-en-plus",
      type: "montants",
      titre: "Ce que valent les points dans chaque segment",
      notions: ["segmentation", "demand_market_share"],
      question: () =>
        `Si l'entreprise gagnait ${qte(POINTS_A_GAGNER)} points de part de marché dans un segment, combien de ventes en plus ferait-elle dans le trimestre ? Calculez-le pour chaque segment, à l'unité.`,
      champs: (c) =>
        segmentAConquerir(c).segments.map((k) => ({
          libelle: `Ventes en plus dans « ${k.nom} » (${c.unites})`,
          attendu: k.ventesEnPlus,
          tolerance: 1,
          calcul: `${qte(k.taille)} × ${qte(POINTS_A_GAGNER)} % = ${qte(k.ventesEnPlus)}`,
        })),
      explication: (c) => {
        const r = segmentAConquerir(c);
        return [
          `Les mêmes ${qte(POINTS_A_GAGNER)} points ne valent pas la même chose partout : dans « ${r.meilleur.nom} », le plus grand segment, ils font ${qte(r.meilleur.ventesEnPlus)} ${c.unites} de plus par trimestre. Un point de part de marché pèse ce que pèse le segment.`,
        ];
      },
    },
    {
      id: "ce-que-rapporte-le-segment",
      type: "montants",
      titre: "Ce que rapporterait le meilleur segment",
      notions: ["segmentation", "contribution_margin"],
      question: (c) => {
        const r = segmentAConquerir(c);
        return `Pour le segment « ${r.meilleur.nom} », calculez le chiffre d'affaires en plus au prix moyen, la marge que laisse ${accord(c, "un")} ${c.unite} (prix moins coût variable), puis la marge en plus sur le trimestre.`;
      },
      champs: (c) => {
        const r = segmentAConquerir(c);
        return [
          { libelle: "Chiffre d'affaires en plus", attendu: r.caEnPlus, tolerance: 1, calcul: `${qte(r.meilleur.ventesEnPlus)} × ${eur(r.prix)} = ${eur(r.caEnPlus)}` },
          { libelle: `Marge d'${accord(c, "un")} ${c.unite}`, attendu: r.margeUnitaire, calcul: `${eur(r.prix)} − ${eur(r.coutVariable)} = ${eur(r.margeUnitaire)}` },
          { libelle: "Marge en plus", attendu: r.margeEnPlus, tolerance: 1, calcul: `${qte(r.meilleur.ventesEnPlus)} × ${eur(r.margeUnitaire)} = ${eur(r.margeEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = segmentAConquerir(c);
        return [
          `Les ${qte(r.meilleur.ventesEnPlus)} ${c.unites} ${accordPluriel(c, "gagné")} dans « ${r.meilleur.nom} » feraient ${eur(r.caEnPlus)} de chiffre d'affaires, mais c'est la marge, ${eur(r.margeEnPlus)}, qui dit ce que l'action peut coûter au plus : une offre et une campagne plus chères que cette marge feraient perdre de l'argent.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction commerciale",
      question: () => "Quelle phrase envoyez-vous à la direction commerciale ?",
      options: (c) => {
        const r = segmentAConquerir(c);
        const k = r.meilleur;
        return [
          {
            texte: `Visons « ${k.nom} » : ${eur(r.margeEnPlus)} de marge en plus par trimestre`,
            juste: true,
            retour: `Oui : ${qte(POINTS_A_GAGNER)} points de ${qte(k.taille)} ${c.unites} font ${qte(k.ventesEnPlus)} ${c.unites} en plus, et ${accord(c, "chacun")} laisse ${eur(r.margeUnitaire)} de marge. C'est le plus grand segment, celui où les points valent le plus.`,
          },
          {
            texte: `Visons « ${k.nom} » : ${eur(r.margeSurNosVentes)} de marge en plus par trimestre`,
            juste: false,
            retour: `Non : c'est prendre ${qte(POINTS_A_GAGNER)} % de nos ventes dans le segment (${qte(k.demande)}), au lieu de ${qte(POINTS_A_GAGNER)} points du segment entier (${qte(k.taille)}). Une part de marché se calcule sur la taille du segment : ${qte(k.ventesEnPlus)} ${c.unites} en plus, ${eur(r.margeEnPlus)} de marge.`,
          },
          ...(r.plusForte.code !== k.code
            ? [
                {
                  texte: `Visons « ${r.plusForte.nom} », où notre part est déjà la plus forte : ${eur(r.margeDeLaPlusForte)} de marge en plus`,
                  juste: false,
                  retour: `Non : une part déjà forte ne dit pas où les points rapportent. ${qte(POINTS_A_GAGNER)} points de « ${r.plusForte.nom} » font ${qte(r.plusForte.ventesEnPlus)} ${c.unites}, contre ${qte(k.ventesEnPlus)} dans « ${k.nom} », le plus grand segment.`,
                },
              ]
            : []),
          {
            texte: `Visons « ${k.nom} » : ${eur(r.caEnPlus)} de marge en plus par trimestre`,
            juste: false,
            retour: `Non : ${eur(r.caEnPlus)} est le chiffre d'affaires en plus. Chaque vente coûte d'abord ${eur(r.coutVariable)} ; la marge en plus est de ${eur(r.margeEnPlus)}.`,
          },
        ];
      },
    },
  ],
};
