import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { accord, accordPluriel } from "../accords";
import type { Cas } from "../cas";
import { promotion } from "../chapitres/promotion-qui-paie";
import { stockDuPointDeVente } from "../chapitres/stock-du-point-de-vente";
import { COMMERCES } from "../chapitres/taux-de-marque";
import type { Situation } from "./types";

/**
 * MISE EN SITUATION : COMMANDER POUR LA PROMOTION (BTS MCO, palier 4).
 *
 * La direction commerciale a décidé une remise sur tout le trimestre. Avant de passer
 * les commandes, elle veut savoir ce que la remise retire à chaque vente, combien il
 * faudrait vendre pour garder la marge du trimestre, ce qu'il faut commander quand on
 * garde un stock, et si la promotion peut payer. L'élève rend ces chiffres, puis sa
 * réponse.
 *
 * Aucun cours : les calculs sont ceux des chapitres « Le stock du point de vente » et
 * « La promotion qui paie », appelés tels quels (`stockDuPointDeVente`, `promotion`).
 * La remise est celle que l'arène rejoue (`ECART_DE_PRIX`, par `promotion`), et la
 * demande attendue au prix remisé est celle du trimestre que l'arène a rejoué à ce prix :
 * les ventes faites, plus les ventes manquées. Le stock en réserve est le stock final du
 * trimestre que le chapitre « Le stock du point de vente » étudie.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100;

const estUnCommerce = (c: Cas) => (COMMERCES as readonly string[]).includes(c.code);
const gardeUnStock = (c: Cas) => estUnCommerce(c) && c.stock !== null;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function commandePourLaPromotion(c: Cas) {
  const p = promotion(c);
  // Ce que le marché demanderait au prix remisé : ce que l'arène a vendu à ce prix, plus
  // ce qu'elle a manqué faute de marchandise ou de place.
  const demande = p.quantitePromo + p.perduesPromo;
  // La marge du trimestre si toute cette demande est servie, au prix remisé.
  const margePrevue = Math.round(demande * p.mcvPromo);
  const ecart = margePrevue - p.margeNormale;
  // Le stock : la couverture du chapitre « Le stock du point de vente » (le stock divisé
  // par les ventes d'un jour), au rythme de la promotion cette fois.
  const st = c.stock ? stockDuPointDeVente(c) : null;
  const stock = st
    ? (() => {
        const enReserve = st.s.final.quantite;
        const parJour = auCentieme(demande / st.jours);
        return {
          enReserve,
          jours: st.jours,
          parJour,
          couverture: Math.round(enReserve / parJour),
          couvertureAvant: st.couverture,
          aCommander: Math.max(0, demande - enReserve),
        };
      })()
    : null;
  return { ...p, demande, margePrevue, ecart, paie: ecart >= 0, stock };
}

export const COMMANDER_POUR_LA_PROMOTION: Situation = {
  code: "commander-pour-la-promotion",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["stock-du-point-de-vente", "promotion-qui-paie"],
  commanditaire: "La direction commerciale",
  titre: "Commander pour la promotion",
  accroche:
    "Une remise sur tout le trimestre est décidée. Avant de passer les commandes, la direction veut savoir combien vendre, combien commander, et si la promotion paiera.",
  objectifs: [
    "Calculer ce qu'une remise retire à la marge d'une unité",
    "Calculer le volume qui garde la marge du trimestre",
    "Calculer la couverture du stock et la quantité à commander",
    "Comparer la marge attendue à la marge habituelle, et répondre à la direction",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "cette situation prépare la promotion d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La note de la direction",
      si: estUnCommerce,
      texte: (c) => {
        const r = commandePourLaPromotion(c);
        return [
          `« La remise de ${pct(r.remise)} sur tout le trimestre est décidée. Avant de passer les commandes, je veux savoir ce qu'elle retire à chaque vente, combien il faudrait vendre pour garder la marge d'un trimestre normal, ${r.stock ? "combien commander en plus du stock en réserve, " : ""}et si la promotion peut payer. » La direction commerciale`,
          r.stock
            ? "Vous avez les chiffres du point de vente et la demande attendue au prix remisé. Pas de cours cette fois : les calculs sont ceux que vous connaissez."
            : `${c.entreprise} ne garde pas de stock : ce qui est préparé se vend dans la journée. Pas de cours cette fois : les calculs sont ceux que vous connaissez.`,
        ];
      },
      tableau: (c) => {
        const r = commandePourLaPromotion(c);
        return {
          titre: `La promotion du trimestre · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Prix de vente habituel d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.cvu)] },
            { libelle: "Remise sur tout le trimestre", valeurs: [pct(r.remise)] },
            { libelle: `Ventes d'un trimestre au prix habituel (${c.unites})`, valeurs: [qte(r.quantite)] },
            { libelle: `Demande attendue au prix remisé, sur le trimestre (${c.unites})`, valeurs: [qte(r.demande)] },
            ...(r.stock
              ? [
                  { libelle: `Stock en réserve aujourd'hui (${c.unites})`, valeurs: [qte(r.stock.enReserve)] },
                  { libelle: "Durée du trimestre (jours)", valeurs: [qte(r.stock.jours)] },
                ]
              : []),
          ],
        };
      },
      repere: (c) =>
        gardeUnStock(c)
          ? "À rendre : la marge d'une unité avant et pendant la remise, le volume qui garde la marge, la couverture du stock et la quantité à commander, la marge attendue du trimestre, et votre réponse."
          : "À rendre : la marge d'une unité avant et pendant la remise, le volume qui garde la marge, la marge attendue du trimestre, et votre réponse.",
    },
    {
      id: "la-remise",
      type: "montants",
      titre: "Ce que la remise retire",
      notions: ["markdown", "contribution_margin"],
      si: estUnCommerce,
      question: () =>
        "Calculez le prix remisé, la marge d'une unité au prix habituel puis au prix remisé (le prix moins le coût variable), et la baisse de la marge d'une unité en pourcentage, au dixième.",
      champs: (c) => {
        const r = commandePourLaPromotion(c);
        return [
          { libelle: "Prix remisé", attendu: r.prixPromo, calcul: `${eur(r.prix)} × (1 − ${pct(r.remise)}) = ${eur(r.prixPromo)}` },
          { libelle: "Marge d'une unité au prix habituel", attendu: r.mcv, calcul: `${eur(r.prix)} − ${eur(r.cvu)} = ${eur(r.mcv)}` },
          { libelle: "Marge d'une unité au prix remisé", attendu: r.mcvPromo, calcul: `${eur(r.prixPromo)} − ${eur(r.cvu)} = ${eur(r.mcvPromo)}` },
          { libelle: "Baisse de la marge d'une unité (%)", attendu: r.baisseDeLaMarge, calcul: `(${eur(r.mcv)} − ${eur(r.mcvPromo)}) ÷ ${eur(r.mcv)} × 100 = ${pct(r.baisseDeLaMarge)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = commandePourLaPromotion(c);
        return [
          `${pct(r.remise)} de remise sur le prix, c'est ${pct(r.baisseDeLaMarge)} de marge en moins sur chaque ${c.unite} : le coût ne bouge pas, toute la remise se prend sur la marge.`,
        ];
      },
    },
    {
      id: "volume-necessaire",
      type: "montants",
      titre: "Le volume qui garde la marge",
      notions: ["markdown", "contribution_margin"],
      si: estUnCommerce,
      question: () =>
        "Calculez la marge d'un trimestre au prix habituel (à l'euro), le volume qu'il faudrait vendre au prix remisé pour la garder (arrondi à l'unité supérieure), puis la hausse des ventes que cela demande, en pourcentage, au dixième.",
      champs: (c) => {
        const r = commandePourLaPromotion(c);
        return [
          { libelle: "Marge d'un trimestre au prix habituel", attendu: r.margeNormale, calcul: `${qte(r.quantite)} × ${eur(r.mcv)} = ${eur(r.margeNormale)}`, tolerance: 1 },
          { libelle: "Volume qui garde cette marge", attendu: r.volumeNecessaire, calcul: `${eur(r.margeNormale)} ÷ ${eur(r.mcvPromo)} = ${qte(r.volumeNecessaire)} (arrondi au-dessus)` },
          { libelle: "Hausse des ventes nécessaire (%)", attendu: r.hausseNecessaire, calcul: `(${qte(r.volumeNecessaire)} ÷ ${qte(r.quantite)} − 1) × 100 = ${pct(r.hausseNecessaire)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = commandePourLaPromotion(c);
        return [
          `Pour une remise de ${pct(r.remise)}, il faudrait vendre ${pct(r.hausseNecessaire)} de plus, soit ${qte(r.volumeNecessaire)} ${c.unites} : la remise se paie sur chaque vente, même celles qui auraient eu lieu sans elle.`,
        ];
      },
    },
    {
      id: "commande",
      type: "montants",
      titre: "Combien commander",
      notions: ["stock", "stock_rotation"],
      si: gardeUnStock,
      question: () =>
        "Au rythme de la demande attendue, calculez les ventes d'un jour (au centième), le nombre de jours que couvre le stock en réserve (à l'unité), puis la quantité à commander pour servir toute la demande du trimestre.",
      champs: (c) => {
        const r = commandePourLaPromotion(c);
        const s = r.stock!;
        return [
          { libelle: "Ventes d'un jour en promotion", attendu: s.parJour, calcul: `${qte(r.demande)} ÷ ${qte(s.jours)} = ${qte(s.parJour)}`, tolerance: 0.01 },
          { libelle: "Couverture du stock en réserve (jours)", attendu: s.couverture, calcul: `${qte(s.enReserve)} ÷ ${qte(s.parJour)} = ${qte(s.couverture)} jours` },
          { libelle: "Quantité à commander", attendu: s.aCommander, calcul: `${qte(r.demande)} − ${qte(s.enReserve)} = ${qte(s.aCommander)}` },
        ];
      },
      explication: (c) => {
        const r = commandePourLaPromotion(c);
        const s = r.stock!;
        return [
          s.aCommander > 0
            ? `Le stock en réserve tiendrait ${qte(s.couvertureAvant)} jours au rythme habituel, mais ${qte(s.couverture)} seulement en promotion : sans commander ${qte(s.aCommander)} ${c.unites}, les clients venus pour la remise repartiraient les mains vides.`
            : `Le stock en réserve couvre toute la demande attendue : rien à commander pour la promotion.`,
        ];
      },
    },
    {
      id: "trimestre-en-promotion",
      type: "montants",
      titre: "La marge attendue du trimestre",
      notions: ["markdown", "price_elasticity"],
      si: estUnCommerce,
      question: () =>
        "Si toute la demande attendue est servie, quelle est la marge du trimestre au prix remisé (à l'euro) ? Quel écart avec la marge d'un trimestre au prix habituel (négatif si la promotion coûte) ?",
      champs: (c) => {
        const r = commandePourLaPromotion(c);
        return [
          { libelle: "Marge attendue du trimestre", attendu: r.margePrevue, calcul: `${qte(r.demande)} × ${eur(r.mcvPromo)} = ${eur(r.margePrevue)}`, tolerance: 1 },
          { libelle: "Écart avec la marge habituelle", attendu: r.ecart, calcul: `${eur(r.margePrevue)} − ${eur(r.margeNormale)} = ${eur(r.ecart)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = commandePourLaPromotion(c);
        return [
          r.paie
            ? `La demande attendue, ${qte(r.demande)} ${c.unites}, dépasse les ${qte(r.volumeNecessaire)} nécessaires : servie en entier, la promotion rapporterait ${eur(r.ecart)} de marge en plus.`
            : `La demande attendue, ${qte(r.demande)} ${c.unites}, reste sous les ${qte(r.volumeNecessaire)} nécessaires : même servie en entier, la promotion coûterait ${eur(-r.ecart)} de marge.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      si: estUnCommerce,
      question: () => "Que répondez-vous à la direction commerciale ?",
      options: (c) => {
        const r = commandePourLaPromotion(c);
        const servir = r.stock
          ? r.stock.aCommander > 0
            ? `, à condition d'avoir commandé ${qte(r.stock.aCommander)} ${c.unites}`
            : ", et le stock en réserve suffit"
          : ", si la salle et la cuisine suivent";
        return [
          {
            texte: "Elle paiera : la demande attendue dépasse le volume nécessaire",
            juste: r.paie,
            retour: r.paie
              ? `Oui : ${qte(r.demande)} ${c.unites} ${accordPluriel(c, "attendu")} contre ${qte(r.volumeNecessaire)} nécessaires, soit ${eur(r.ecart)} de marge en plus${servir}.`
              : `Non : ${qte(r.demande)} ${c.unites} ${accordPluriel(c, "attendu")}, moins que les ${qte(r.volumeNecessaire)} qui garderaient la marge.`,
          },
          {
            texte: "Elle ne paiera pas : la demande attendue reste sous ce volume",
            juste: !r.paie,
            retour: !r.paie
              ? `Oui : ${qte(r.demande)} ${c.unites} ${accordPluriel(c, "attendu")} contre ${qte(r.volumeNecessaire)} nécessaires. Même servie en entier, la promotion coûterait ${eur(-r.ecart)} de marge.`
              : `Non : ${qte(r.demande)} ${c.unites} ${accordPluriel(c, "attendu")}, au-delà des ${qte(r.volumeNecessaire)} nécessaires.`,
          },
          {
            texte: `Elle paiera : une remise de ${pct(r.remise)} ne retire que ${pct(r.remise)} de la marge`,
            juste: false,
            retour: `Non : le coût ne baisse pas, la remise se prend tout entière sur la marge. Elle retire ${pct(r.baisseDeLaMarge)} de la marge d'une unité, pas ${pct(r.remise)}.`,
          },
          {
            texte: `Elle paiera si les ventes montent de ${pct(r.remise)}, autant que la remise`,
            juste: false,
            retour: `Non : la marge d'une unité baisse de ${pct(r.baisseDeLaMarge)}, il faudrait vendre ${pct(r.hausseNecessaire)} de plus pour la garder.`,
          },
        ];
      },
    },
  ],
};
