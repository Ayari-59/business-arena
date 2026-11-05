import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_RESEAU, reseauDeLaBoutique } from "../../chapitres/le-reseau-de-vente-directe";
import { pourcentageDeLaMarraine } from "../../monde/reseau-de-vente-directe";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE RÉSEAU DE VENTE DIRECTE » : UN POURCENTAGE POUR LA MARRAINE (BTS NDRC,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, au réseau de conseillères de MAILLE & CO
 * (monde/reseau-de-vente-directe.ts), à partir de la prime retenue au chapitre (300 € par filleule).
 * Hypothèse du cas : une conseillère propose de remplacer la prime par un pourcentage du chiffre
 * d'affaires hors taxes de chaque réunion de la filleule, versé à la marraine pendant toute la vie de la
 * filleule dans le réseau ; il amènerait les mêmes recrues que la prime. L'élève refait seul le chemin du
 * chapitre : ce que coûte le pourcentage par filleule et sur l'année, le gain du parrainage, le
 * pourcentage le plus haut qui coûte moins que la prime (un curseur), et sa réponse.
 *
 * Le jugement : à 2 %, le pourcentage coûte moins que la prime, et il ne paie que des filleules qui
 * vendent. On le prend.
 */

/** Le pourcentage proposé (hypothèse du cas) : 2 % du chiffre d'affaires hors taxes des réunions de la filleule. */
export const POURCENTAGE_PROPOSE = 0.02;

/** Les bornes du curseur du pourcentage, en %. */
export const POURCENTAGE_DU_CURSEUR = { min: 0, max: 10 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;

/** Le pourcentage proposé, face à la prime du chapitre. */
export function marraine(c: Pick<Cas, "code">) {
  const x = reseauDeLaBoutique(c);
  const p = pourcentageDeLaMarraine(x.f, POURCENTAGE_PROPOSE);
  const parFilleule = (t: number) => (t / 100) * x.reunion.chiffreHt * x.conseillere.reunions;
  let plafond = POURCENTAGE_DU_CURSEUR.min;
  while (plafond < POURCENTAGE_DU_CURSEUR.max && parFilleule(plafond + 1) <= x.prime + 1e-9) plafond++;
  return { x, p, ecart: Math.round((p.gain - x.parrainageRetenu.gain) * 100) / 100, parFilleule, plafond };
}

export const UN_POURCENTAGE_POUR_LA_MARRAINE: Situation = {
  code: "un-pourcentage-pour-la-marraine",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["le-reseau-de-vente-directe"],
  commanditaire: "La responsable de la boutique",
  titre: "Un pourcentage pour la marraine",
  accroche:
    "Une conseillère propose de remplacer la prime de parrainage par un pourcentage des ventes de la filleule. La responsable de la boutique hésite : est-ce plus cher ?",
  objectifs: [
    "Chiffrer un parrainage payé au pourcentage, par filleule et sur l'année",
    "Comparer deux formes de parrainage par leur gain",
    "Trouver le pourcentage le plus haut qui coûte moins que la prime",
    "Rédiger une réponse chiffrée à la responsable",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_RESEAU,
    pourquoi:
      "ce cas se joue à la boutique MAILLE & CO, qui lance un réseau de vendeuses à domicile pour ses pulls : c'est là qu'une réunion, une conseillère et une prime de parrainage se chiffrent.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable",
      texte: (c) => {
        const m = marraine(c);
        return [
          `« Nous versons ${eur(m.x.prime)} à la marraine pour chaque filleule. Une conseillère propose autre chose : ${pct(POURCENTAGE_PROPOSE * 100)} du chiffre d'affaires hors taxes de chaque réunion de sa filleule, tant que celle-ci reste dans le réseau. Elle dit que cela motiverait les marraines à suivre leurs filleules. Est-ce plus cher ? »`,
          `La simulation suppose que le pourcentage amène les mêmes recrues que la prime, ${qte(m.x.parrainageRetenu.recrues)} par an, dont ${qte(m.x.parrainageRetenu.enPlus)} en plus. Une filleule tient les réunions d'une conseillère moyenne.`,
          "Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const m = marraine(c);
        return {
          titre: "Le réseau de conseillères · MAILLE & CO",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Chiffre d'affaires hors taxes d'une réunion", valeurs: [eur(m.x.reunion.chiffreHt)] },
            { libelle: "Réunions d'une conseillère sur sa vie", valeurs: [qte(m.x.conseillere.reunions)] },
            { libelle: "Valeur d'une conseillère", valeurs: [eur(m.x.conseillere.valeur)] },
            { libelle: "Prime de parrainage d'aujourd'hui", valeurs: [eur(m.x.prime)] },
            { libelle: "Recrues de l'année avec la prime", valeurs: [qte(m.x.parrainageRetenu.recrues)] },
            { libelle: "Gain du parrainage avec la prime", valeurs: [eur(m.x.parrainageRetenu.gain)] },
          ],
        };
      },
    },
    {
      id: "le-cout-par-filleule",
      objectifs: [0],
      type: "montants",
      titre: "Ce que coûte le pourcentage",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: () => "Calculez ce que le pourcentage verse à la marraine par réunion de la filleule, puis sur toute la vie de la filleule, puis sur toutes les filleules de l'année.",
      champs: (c) => {
        const m = marraine(c);
        return [
          { libelle: "Versé par réunion", attendu: m.p.parReunion, calcul: `${eur(m.x.reunion.chiffreHt)} × ${pct(POURCENTAGE_PROPOSE * 100)} = ${eur(m.p.parReunion)}` },
          { libelle: "Versé par filleule", attendu: m.p.parFilleule, calcul: `${eur(m.p.parReunion)} × ${qte(m.x.conseillere.reunions)} réunions = ${eur(m.p.parFilleule)}` },
          { libelle: "Versé sur l'année", attendu: m.p.deLAnnee, calcul: `${eur(m.p.parFilleule)} × ${qte(m.p.retenu.recrues)} filleules = ${eur(m.p.deLAnnee)}` },
        ];
      },
      explication: (c) => {
        const m = marraine(c);
        return [`Une filleule coûte ${eur(m.p.parFilleule)} au pourcentage, contre ${eur(m.x.prime)} de prime. Et ce coût ne tombe que si elle vend : une filleule qui part vite coûte presque rien.`];
      },
    },
    {
      id: "le-gain",
      objectifs: [1],
      type: "montants",
      titre: "Le gain des deux parrainages",
      notions: ["customer_acquisition_cost"],
      question: () => "Calculez le gain du parrainage au pourcentage, puis ce qu'il laisse de plus, ou de moins, que la prime.",
      champs: (c) => {
        const m = marraine(c);
        return [
          { libelle: "Gain avec le pourcentage", attendu: m.p.gain, calcul: `${eur(m.p.retenu.valeurDesRecruesEnPlus)} − ${eur(m.p.deLAnnee)} = ${eur(m.p.gain)}` },
          { libelle: "Écart avec la prime", attendu: m.ecart, calcul: `${eur(m.p.gain)} − ${eur(m.x.parrainageRetenu.gain)} = ${eur(m.ecart)}` },
        ];
      },
      explication: (c) => {
        const m = marraine(c);
        return [`Le pourcentage laisse ${eur(m.p.gain)}, ${eur(Math.abs(m.ecart))} ${m.ecart >= 0 ? "de plus" : "de moins"} que la prime. Les recrues en plus valent la même chose : seul change ce qu'on paie pour toutes.`];
      },
    },
    {
      id: "jusqu-ou",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où le pourcentage",
      notions: ["distribution_commission"],
      question: (c) => {
        const m = marraine(c);
        return `Faites varier le pourcentage versé à la marraine, de ${pct(POURCENTAGE_DU_CURSEUR.min)} à ${pct(POURCENTAGE_DU_CURSEUR.max)}. Une droite donne la prime d'aujourd'hui (${eur(m.x.prime)} par filleule), l'autre ce que coûte une filleule au pourcentage. Placez le curseur sur le plus haut pourcentage, au point entier, qui ne coûte pas plus que la prime, puis validez.`;
      },
      grandeur: () => ({ libelle: "Pourcentage versé à la marraine", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: marraine(c).plafond, min: POURCENTAGE_DU_CURSEUR.min, max: POURCENTAGE_DU_CURSEUR.max }),
      zones: ["Le pourcentage coûte moins que la prime", "La prime coûte moins"],
      rates: () => ({
        dessous: "Plus haut, le pourcentage coûte encore moins que la prime : cherchez le plus haut.",
        dessus: "À ce pourcentage, une filleule coûte plus que la prime.",
      }),
      montrer: "Montrer le pourcentage le plus haut",
      lecture: (c, t) => {
        const m = marraine(c);
        const cout = Math.round(m.parFilleule(t) * 100) / 100;
        return [
          { libelle: "Coût d'une filleule au pourcentage", montant: cout },
          { libelle: "Prime par filleule", montant: m.x.prime },
          { libelle: "Écart en faveur du pourcentage", montant: Math.round((m.x.prime - cout) * 100) / 100, fort: true },
        ];
      },
      droites: (c) => {
        const m = marraine(c);
        return { produit: () => m.x.prime, cout: (t) => m.parFilleule(t), libelles: ["Prime par filleule", "Coût d'une filleule au pourcentage"] };
      },
      explication: (c) => {
        const m = marraine(c);
        return [`Jusqu'à ${pct(m.plafond)}, une filleule coûte moins au pourcentage qu'à la prime : ${eur(Math.round(m.parFilleule(m.plafond) * 100) / 100)} contre ${eur(m.x.prime)}. Au point suivant, ${eur(Math.round(m.parFilleule(m.plafond + 1) * 100) / 100)}.`];
      },
    },
    {
      id: "reponse",
      objectifs: [3],
      type: "choix",
      titre: "Votre réponse à la responsable",
      notions: ["distribution_commission", "customer_lifetime_value"],
      question: () => "Quelle phrase envoyez-vous à la responsable de la boutique ?",
      options: (c) => {
        const m = marraine(c);
        const mieux = m.ecart > 0;
        return [
          {
            texte: mieux ? `Le prendre : il laisse ${eur(m.ecart)} de plus par an` : `Garder la prime : elle laisse ${eur(-m.ecart)} de plus par an`,
            juste: true,
            retour: `Oui : au pourcentage, une filleule coûte ${eur(m.p.parFilleule)} sur sa vie, contre ${eur(m.x.prime)} de prime, et le gain passe de ${eur(m.x.parrainageRetenu.gain)} à ${eur(m.p.gain)}. Il ne paie que des filleules qui vendent, ce que veut le code éthique.`,
          },
          {
            texte: `Le refuser : il se paie toute la vie de la filleule, pas une fois`,
            juste: false,
            retour: `Non : payé chaque réunion, il ne dépasse pas ${eur(m.p.parFilleule)} sur la vie d'une filleule moyenne. C'est la somme qui compte, pas le nombre de versements.`,
          },
          {
            texte: `Le prendre à ${pct(m.plafond + 1)} : les marraines suivraient mieux encore`,
            juste: false,
            retour: `Non : à ${pct(m.plafond + 1)}, une filleule coûterait ${eur(Math.round(m.parFilleule(m.plafond + 1) * 100) / 100)}, plus que la prime. Le pourcentage proposé suffit.`,
          },
        ];
      },
    },
  ],
};
