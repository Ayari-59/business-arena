import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { ecartsDuTrimestre } from "../../ecarts";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'ANALYSE DES ÉCARTS » : L'OBJECTIF DU COMMERCIAL
 * (contrôle de gestion, palier 4).
 *
 * La direction avait fixé au commercial un objectif pour le deuxième trimestre : vendre
 * plus qu'au premier, au même prix et à la même marge par unité. Avant son entretien
 * annuel, elle veut savoir ce que l'écart avec cet objectif a fait au résultat, et la part
 * qui revient aux quantités. L'élève refait seul le chemin du chapitre face à l'objectif :
 * l'écart sur chiffre d'affaires et sa décomposition, l'écart sur marge et ses deux
 * effets, l'écart sur résultat, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le prévu n'est plus le premier trimestre reconduit,
 * c'est l'objectif, plus haut. Le réalisé est celui du chapitre, le deuxième trimestre
 * joué par l'arène (`ecartsDuTrimestre`). Convention du chapitre : un écart est le
 * réalisé moins le prévu.
 */

/**
 * L'objectif de ventes donné au commercial : 5 % d'unités de plus qu'au premier
 * trimestre, l'ordre de grandeur d'un objectif de croissance annuel d'une petite
 * entreprise sur son marché.
 */
export const OBJECTIF_DE_CROISSANCE = 0.05;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const entreParentheses = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const signe = (x: number) => (x > 0 ? "favorable" : x < 0 ? "défavorable" : "nul");

/** Les chiffres de la réponse, calculés une fois du cas. */
export function objectifDuCommercial(c: Cas) {
  const e = ecartsDuTrimestre(c.code);
  const t1 = e.prevu;
  const r = e.realise;
  const quantite = Math.round(t1.quantite * (1 + OBJECTIF_DE_CROISSANCE));
  const objectif = {
    quantite,
    prix: t1.prix,
    margeUnitaire: t1.margeUnitaire,
    chiffreDAffaires: auCentime(quantite * t1.prix),
    marge: auCentime(quantite * t1.margeUnitaire),
    chargesFixes: t1.chargesFixes,
  };
  const dq = r.quantite - objectif.quantite;
  const chiffreDAffaires = {
    total: auCentime(r.chiffreDAffaires - objectif.chiffreDAffaires),
    volume: auCentime(dq * objectif.prix),
    prix: auCentime((r.prix - objectif.prix) * r.quantite),
  };
  const marge = {
    total: auCentime(r.marge - objectif.marge),
    volume: auCentime(dq * objectif.margeUnitaire),
    unitaire: auCentime((r.margeUnitaire - objectif.margeUnitaire) * r.quantite),
  };
  const chargesFixes = r.chargesFixes - objectif.chargesFixes;
  return { t1, objectif, realise: r, dq, chiffreDAffaires, marge, chargesFixes, resultat: auCentime(marge.total - chargesFixes) };
}

export const L_OBJECTIF_DU_COMMERCIAL: Situation = {
  code: "l-objectif-du-commercial",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["analyse-des-ecarts"],
  commanditaire: "La direction",
  titre: "L'objectif du commercial",
  accroche:
    "Le commercial avait un objectif de ventes pour le printemps. Avant son entretien, la direction veut savoir ce que l'écart avec l'objectif a fait au résultat, et ce qui revient aux quantités.",
  objectifs: [
    "Bâtir le prévu d'un objectif de ventes et calculer l'écart sur chiffre d'affaires",
    "Décomposer l'écart en écart sur quantités et écart sur prix",
    "Décomposer l'écart sur marge en effet volume et effet de marge unitaire",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« Pour le deuxième trimestre, nous avions donné un objectif au commercial de ${c.entreprise} : vendre ${pct(OBJECTIF_DE_CROISSANCE)} d'unités de plus qu'au premier trimestre, au même prix moyen et à la même marge par unité. Je le reçois pour son entretien annuel. Que nous a fait l'écart avec cet objectif sur le résultat, et quelle part en revient aux quantités ? »`,
        "Pas de cours cette fois : vous avez les chiffres des deux trimestres, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const o = objectifDuCommercial(c);
        return {
          titre: `Les deux trimestres · ${c.entreprise}`,
          colonnes: ["Premier trimestre", "Deuxième trimestre"],
          lignes: [
            { libelle: `Unités vendues (${c.unites})`, valeurs: [qte(o.t1.quantite), qte(o.realise.quantite)] },
            { libelle: "Prix moyen, hors taxes", valeurs: [eur(o.t1.prix), eur(o.realise.prix)] },
            { libelle: "Marge sur coût variable par unité", valeurs: [eur(o.t1.margeUnitaire), eur(o.realise.margeUnitaire)] },
            { libelle: "Charges fixes", valeurs: [eur(o.t1.chargesFixes), eur(o.realise.chargesFixes)] },
            { libelle: "Objectif du deuxième trimestre : unités en plus", valeurs: ["", pct(OBJECTIF_DE_CROISSANCE)] },
          ],
        };
      },
      repere: () =>
        "À rendre : l'écart sur chiffre d'affaires et ses deux parts, l'écart sur marge et ses deux effets, l'écart sur résultat, et votre réponse. Un écart, c'est le réalisé moins le prévu.",
    },
    {
      id: "chiffre-d-affaires",
      type: "montants",
      titre: "L'écart sur chiffre d'affaires",
      notions: ["volume_price_variance"],
      question: () =>
        "Le prévu, c'est l'objectif. Calculez la quantité de l'objectif (à l'unité), l'écart sur chiffre d'affaires, puis ses deux parts : l'écart sur quantités (au prix prévu) et l'écart sur prix (sur les quantités réelles). Négatif pour un écart défavorable.",
      champs: (c) => {
        const o = objectifDuCommercial(c);
        const p = o.objectif;
        const r = o.realise;
        return [
          { libelle: "Quantité de l'objectif", attendu: p.quantite, tolerance: 1, calcul: `${qte(o.t1.quantite)} × (1 + ${pct(OBJECTIF_DE_CROISSANCE)}) ≈ ${qte(p.quantite)}` },
          {
            libelle: "Écart sur chiffre d'affaires",
            attendu: o.chiffreDAffaires.total,
            tolerance: Math.max(0.05, p.prix + 0.01),
            calcul: `${qte(r.quantite)} × ${eur(r.prix)} − ${qte(p.quantite)} × ${eur(p.prix)} = ${eur(r.chiffreDAffaires)} − ${eur(p.chiffreDAffaires)} = ${eur(o.chiffreDAffaires.total)}`,
          },
          {
            libelle: "Écart sur quantités",
            attendu: o.chiffreDAffaires.volume,
            tolerance: Math.max(0.05, p.prix + 0.01),
            calcul: `(${qte(r.quantite)} − ${qte(p.quantite)}) × ${eur(p.prix)} = ${eur(o.chiffreDAffaires.volume)}`,
          },
          {
            libelle: "Écart sur prix",
            attendu: o.chiffreDAffaires.prix,
            tolerance: 0.05,
            calcul: `(${eur(r.prix)} − ${eur(p.prix)}) × ${qte(r.quantite)} = ${eur(o.chiffreDAffaires.prix)}`,
          },
        ];
      },
      explication: (c) => {
        const o = objectifDuCommercial(c);
        return [
          `${o.dq >= 0 ? `Le commercial a dépassé l'objectif de ${qte(o.dq)} ${c.unites}` : `Le commercial a manqué l'objectif de ${qte(-o.dq)} ${c.unites}`} : écart sur quantités ${signe(o.chiffreDAffaires.volume)}, écart sur prix ${signe(o.chiffreDAffaires.prix)}. À eux deux, ils font l'écart sur chiffre d'affaires, ${eur(o.chiffreDAffaires.total)}.`,
        ];
      },
    },
    {
      id: "marge-et-resultat",
      type: "montants",
      titre: "L'écart sur marge et sur résultat",
      notions: ["contribution_margin", "volume_price_variance"],
      question: () =>
        "Faites de même avec la marge sur coût variable : l'effet du volume (à la marge unitaire prévue), l'effet de la marge unitaire (sur les quantités réelles). Puis l'écart sur le résultat d'exploitation, une fois comparées les charges fixes.",
      champs: (c) => {
        const o = objectifDuCommercial(c);
        const p = o.objectif;
        const r = o.realise;
        return [
          {
            libelle: "Effet du volume sur la marge",
            attendu: o.marge.volume,
            tolerance: Math.max(0.05, p.margeUnitaire + 0.01),
            calcul: `(${qte(r.quantite)} − ${qte(p.quantite)}) × ${eur(p.margeUnitaire)} = ${eur(o.marge.volume)}`,
          },
          {
            libelle: "Effet de la marge unitaire",
            attendu: o.marge.unitaire,
            tolerance: 0.05,
            calcul: `(${eur(r.margeUnitaire)} − ${eur(p.margeUnitaire)}) × ${qte(r.quantite)} = ${eur(o.marge.unitaire)}`,
          },
          {
            libelle: "Écart sur résultat d'exploitation",
            attendu: o.resultat,
            tolerance: Math.max(0.05, p.margeUnitaire + 0.01),
            calcul: `${eur(o.marge.volume)} + ${entreParentheses(o.marge.unitaire)} − ${entreParentheses(o.chargesFixes)} d'écart sur charges fixes = ${eur(o.resultat)}`,
          },
        ];
      },
      explication: (c) => {
        const o = objectifDuCommercial(c);
        return [
          `Le volume pèse ${eur(o.chiffreDAffaires.volume)} sur le chiffre d'affaires, mais ${eur(o.marge.volume)} sur la marge : une unité vendue ou manquée emporte son coût variable avec elle. ${
            o.chargesFixes === 0 ? "Les charges fixes sont celles prévues : l'écart sur résultat est l'écart sur marge." : `Les charges fixes s'écartent de ${eur(o.chargesFixes)}.`
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const o = objectifDuCommercial(c);
        const gagne = o.marge.volume >= 0;
        const verbe = gagne ? "rapporté" : "coûté";
        const contraire = gagne ? "coûté" : "rapporté";
        return [
          {
            texte: `Face à l'objectif, les quantités ont ${verbe} ${eur(Math.abs(o.marge.volume))} au résultat`,
            juste: true,
            retour: `Oui : ${qte(Math.abs(o.dq))} ${c.unites} ${gagne ? "de plus" : "de moins"} que l'objectif, à ${eur(o.objectif.margeUnitaire)} de marge ${accord(c, "chacun")}, font ${eur(o.marge.volume)}. ${o.resultat === o.marge.volume ? "C'est tout l'écart sur résultat : la marge unitaire et les charges fixes sont celles prévues." : `Sur l'écart total de ${eur(o.resultat)}, le reste vient de la marge unitaire${o.chargesFixes ? " et des charges fixes" : ""}.`}`,
          },
          {
            texte: `Face à l'objectif, les quantités ont ${verbe} ${eur(Math.abs(o.chiffreDAffaires.volume))} au résultat : c'est l'écart sur quantités`,
            juste: false,
            retour: `Non : ${eur(o.chiffreDAffaires.volume)}, c'est l'effet sur le chiffre d'affaires. Une unité de ${gagne ? "plus" : "moins"} change le résultat de sa marge, ${eur(o.objectif.margeUnitaire)}, pas de son prix, ${eur(o.objectif.prix)} : son coût variable part avec elle.`,
          },
          {
            texte: `Face à l'objectif, les quantités ont ${contraire} ${eur(Math.abs(o.marge.volume))} au résultat`,
            juste: false,
            retour: `Non : c'est lire l'écart à l'envers. Un écart est le réalisé moins le prévu ; sur une marge, ${gagne ? "positif, il est favorable" : "négatif, il est défavorable"}. Ici, ${eur(o.marge.volume)}.`,
          },
        ];
      },
    },
  ],
};
