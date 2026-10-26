import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { promotion } from "../../chapitres/promotion-qui-paie";
import { COMMERCES } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA PROMOTION QUI PAIE » : JUSQU'OÙ REMISER ? (BTS MCO,
 * palier 4).
 *
 * La responsable commerciale sait ce qu'une promotion bien annoncée apporte de ventes en
 * plus. Elle demande la remise la plus forte qu'elle peut accorder sans perdre de marge sur
 * le trimestre. L'élève refait seul le raisonnement du chapitre, à l'envers : la marge à
 * garder, le volume attendu, la marge d'une unité qu'il faut au minimum, le prix plancher,
 * puis la remise maximale.
 *
 * Le cas est neuf par sa question : le chapitre et la mise en situation « Commander pour la
 * promotion » partent d'une remise donnée pour trouver le volume qui la paie ; ici, le
 * volume est donné et l'on cherche la remise. Le piège : la remise ne se règle ni sur la
 * hausse des ventes, ni sur le chiffre d'affaires, mais sur la marge. Les prix, le coût
 * variable et les ventes du trimestre sont ceux du chapitre (`promotion`).
 */

/**
 * La hausse des ventes attendue de la promotion : 15 %. C'est l'ordre de grandeur de ce
 * qu'une opération bien annoncée (vitrine, affichage, message aux clients fidèles) apporte
 * en volume sur un trimestre, sans changer de clientèle.
 */
export const HAUSSE_ATTENDUE = 0.15;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function jusquOuRemiser(c: Cas) {
  const p = promotion(c);
  const volume = Math.round(p.quantite * (1 + HAUSSE_ATTENDUE));
  const margeMinimale = auCentime(p.margeNormale / volume);
  const prixPlancher = auCentime(p.cvu + margeMinimale);
  return {
    ...p,
    volume,
    margeMinimale,
    prixPlancher,
    remiseMax: auDixieme((1 - prixPlancher / p.prix) * 100),
    // L'erreur classique : la remise qui garde le chiffre d'affaires, et non la marge.
    remiseDuChiffre: auDixieme((1 - 1 / (1 + HAUSSE_ATTENDUE)) * 100),
  };
}

export const JUSQU_OU_REMISER: Situation = {
  code: "jusqu-ou-remiser",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["promotion-qui-paie"],
  commanditaire: "La responsable commerciale",
  titre: "Jusqu'où aller dans la remise ?",
  accroche:
    "La responsable commerciale sait combien de ventes une promotion lui apportera. Elle veut connaître la plus forte remise qu'elle peut accorder sans perdre de marge.",
  objectifs: [
    "Calculer la marge d'une unité et celle d'un trimestre sans promotion",
    "Calculer la marge d'une unité qu'il faut garder avec le volume attendu",
    "Calculer le prix plancher et la remise maximale",
    "Répondre en distinguant la marge, le chiffre d'affaires et le volume",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce cas suit une promotion de point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable commerciale",
      texte: (c) => [
        `« Pour le trimestre prochain, je prépare une promotion bien annoncée. D'expérience, elle nous apportera ${pct(HAUSSE_ATTENDUE * 100)} de ventes en plus. Je veux savoir quelle remise ${c.entreprise} peut accorder au plus, sur tout le trimestre, sans gagner moins qu'un trimestre normal. »`,
        "Pas de cours cette fois : vous avez les chiffres d'un trimestre sans promotion, et la méthode est celle du chapitre, prise dans l'autre sens. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = jusquOuRemiser(c);
        return {
          titre: `Un trimestre sans promotion · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Prix de vente habituel d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.cvu)] },
            { libelle: `Ventes du trimestre (${c.unites})`, valeurs: [qte(r.quantite)] },
            { libelle: "Hausse des ventes attendue de la promotion", valeurs: [pct(HAUSSE_ATTENDUE * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge d'un trimestre normal, le volume attendu, la marge d'une unité à garder, le prix plancher, la remise maximale, et votre réponse.",
    },
    {
      id: "la-marge-a-garder",
      type: "montants",
      titre: "La marge à garder",
      notions: ["contribution_margin", "markdown"],
      question: () =>
        `Calculez la marge sur coût variable d'une unité au prix habituel, la marge d'un trimestre sans promotion (à l'euro), puis le volume attendu avec ${pct(HAUSSE_ATTENDUE * 100)} de ventes en plus (à l'unité).`,
      champs: (c) => {
        const r = jusquOuRemiser(c);
        return [
          { libelle: "Marge d'une unité au prix habituel", attendu: r.mcv, calcul: `${eur(r.prix)} − ${eur(r.cvu)} = ${eur(r.mcv)}` },
          { libelle: "Marge d'un trimestre sans promotion", attendu: r.margeNormale, tolerance: 1, calcul: `${qte(r.quantite)} × ${eur(r.mcv)} = ${eur(r.margeNormale)}` },
          { libelle: "Volume attendu en promotion", attendu: r.volume, tolerance: 1, calcul: `${qte(r.quantite)} × ${(1 + HAUSSE_ATTENDUE).toLocaleString("fr-FR")} = ${qte(r.volume)}` },
        ];
      },
      explication: (c) => {
        const r = jusquOuRemiser(c);
        return [`La promotion ne doit pas laisser moins de ${eur(r.margeNormale)} à ${c.entreprise} sur le trimestre, et cette marge se partagera entre ${qte(r.volume)} ${c.unites} au lieu de ${qte(r.quantite)}.`];
      },
    },
    {
      id: "le-prix-plancher",
      type: "montants",
      titre: "Le prix plancher",
      notions: ["markdown", "price_floor"],
      question: () =>
        "Quelle marge d'une unité faut-il garder au minimum pour retrouver la marge du trimestre avec le volume attendu (au centime) ? À quel prix hors taxes cela correspond-il, et quelle remise maximale sur le prix habituel, en pourcentage, au dixième ?",
      champs: (c) => {
        const r = jusquOuRemiser(c);
        return [
          { libelle: "Marge d'une unité à garder", attendu: r.margeMinimale, tolerance: 0.01, calcul: `${eur(r.margeNormale)} ÷ ${qte(r.volume)} = ${eur(r.margeMinimale)}` },
          { libelle: "Prix plancher, hors taxes", attendu: r.prixPlancher, tolerance: 0.01, calcul: `${eur(r.cvu)} + ${eur(r.margeMinimale)} = ${eur(r.prixPlancher)}` },
          { libelle: "Remise maximale (%)", attendu: r.remiseMax, tolerance: 0.1, calcul: `(1 − ${eur(r.prixPlancher)} ÷ ${eur(r.prix)}) × 100 = ${pct(r.remiseMax)}` },
        ];
      },
      explication: (c) => {
        const r = jusquOuRemiser(c);
        return [
          `Sous ${eur(r.prixPlancher)}, soit plus de ${pct(r.remiseMax)} de remise, la promotion coûterait de la marge à ${c.entreprise}, même avec ${pct(HAUSSE_ATTENDUE * 100)} de ventes en plus. Le coût variable, ${eur(r.cvu)}, ne baisse pas avec le prix : toute la remise se prend sur la marge.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable commerciale",
      question: () => "Quelle phrase envoyez-vous à la responsable commerciale ?",
      options: (c) => {
        const r = jusquOuRemiser(c);
        return [
          {
            texte: `Pas plus de ${pct(r.remiseMax)} de remise, soit ${eur(r.prixPlancher)} au minimum`,
            juste: true,
            retour: `Oui : ${qte(r.volume)} ${c.unites} à ${eur(r.margeMinimale)} de marge redonnent les ${eur(r.margeNormale)} d'un trimestre normal. Au-delà, chaque point de remise retire de la marge que la hausse des ventes ne rend pas.`,
          },
          {
            texte: `Jusqu'à ${pct(HAUSSE_ATTENDUE * 100)} de remise, autant que la hausse des ventes attendue`,
            juste: false,
            retour: `Non : ${pct(HAUSSE_ATTENDUE * 100)} de remise ôtent ${eur(auCentime(r.prix * HAUSSE_ATTENDUE))} à chaque vente, soit ${pct(auDixieme(((r.prix * HAUSSE_ATTENDUE) / r.mcv) * 100))} des ${eur(r.mcv)} de marge d'une unité : la marge baisserait bien plus que les ventes ne montent. La remise maximale est de ${pct(r.remiseMax)}.`,
          },
          {
            texte: `Jusqu'à ${pct(r.remiseDuChiffre)} de remise, celle qui garde notre chiffre d'affaires`,
            juste: false,
            retour: `Non : à ${pct(r.remiseDuChiffre)}, le chiffre d'affaires ne bouge pas, mais les ${qte(r.volume - r.quantite)} ${c.unites} de plus coûtent ${accord(c, "chacun")} ${eur(r.cvu)} de coût variable. C'est la marge qu'il faut garder : ${pct(r.remiseMax)} au plus.`,
          },
        ];
      },
    },
  ],
};
