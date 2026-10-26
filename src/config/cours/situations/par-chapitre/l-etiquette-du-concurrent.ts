import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord, accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { COMMERCES, tauxDeMarque } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « TAUX DE MARQUE, TAUX DE MARGE, COEFFICIENT » : L'ÉTIQUETTE
 * DU CONCURRENT (BTS MCO, palier 2).
 *
 * Un concurrent affiche la même chose moins cher, toutes taxes comprises. La gérante veut
 * savoir ce que coûterait de s'aligner, et à quel prix il faudrait acheter pour garder le
 * taux de marque du rayon. L'élève refait seul le chemin du chapitre, à l'envers : du prix
 * affiché TTC au prix hors taxes, puis au taux de marque, et enfin au prix d'achat qu'il
 * faudrait négocier.
 *
 * Le cas est neuf par sa question : le chapitre part du prix d'achat pour trouver le prix
 * de vente ; ici, le prix de vente est imposé par le concurrent, et c'est le prix d'achat
 * qu'on cherche. Les autres chiffres sont ceux du mois du cas (`tauxDeMarque`).
 */

/**
 * L'écart de prix du concurrent : 8 % de moins sur l'étiquette TTC. C'est l'ordre de
 * grandeur d'un prix d'appel qui se remarque sans être une promotion : assez pour qu'un
 * client compare, pas assez pour qu'il pense à une fin de série.
 */
export const ECART_DU_CONCURRENT = 0.08;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function etiquetteDuConcurrent(c: Cas) {
  const m = tauxDeMarque(c);
  const ttcConcurrent = auCentime(m.venteTtc * (1 - ECART_DU_CONCURRENT));
  const htConcurrent = auCentime(ttcConcurrent / (1 + m.tauxTva));
  const margeAlignee = auCentime(htConcurrent - m.achat);
  const tMarqueAligne = auDixieme((margeAlignee / htConcurrent) * 100);
  const margeDuMoisAlignee = auCentime(margeAlignee * m.quantite);
  // Le prix d'achat qui garde le taux de marque d'aujourd'hui (au dixième, celui que
  // l'élève a calculé) au prix du concurrent : prix de vente × (1 − taux de marque).
  const achatMax = auCentime(htConcurrent * (1 - m.tMarque / 100));
  return {
    ...m,
    ttcConcurrent,
    htConcurrent,
    margeAlignee,
    tMarqueAligne,
    margeDuMoisAlignee,
    perteDuMois: auCentime(m.margeDuMois - margeDuMoisAlignee),
    achatMax,
    baisseDAchat: auDixieme(((m.achat - achatMax) / m.achat) * 100),
    // Les erreurs classiques : le taux de marque pris pour un taux de marge (diviser par
    // 1 + taux), et la marge calculée sur le prix TTC.
    achatSurLeTauxDeMarge: auCentime(htConcurrent / (1 + m.tMarque / 100)),
    achatSurLeTtc: auCentime(ttcConcurrent * (1 - m.tMarque / 100)),
  };
}

export const L_ETIQUETTE_DU_CONCURRENT: Situation = {
  code: "l-etiquette-du-concurrent",
  parcours: "mco",
  palier: 2,
  blocs: [],
  reprend: ["taux-de-marque-et-coefficient"],
  commanditaire: "La gérante",
  titre: "L'étiquette du concurrent",
  accroche:
    "Un concurrent affiche la même chose moins cher. Avant de s'aligner, la gérante veut savoir ce que cela coûterait, et à quel prix il faudrait acheter pour garder sa marque.",
  objectifs: [
    "Passer d'un prix affiché TTC au prix hors taxes",
    "Calculer un taux de marque à un prix de vente imposé",
    "Chiffrer la marge du mois perdue par un alignement",
    "Calculer le prix d'achat qui garde le taux de marque, et répondre à la gérante",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi:
      "ce cas calcule un taux de marque sur ce que l'entreprise achète pour le revendre ou le cuisiner, et elle ne fait ni l'un ni l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la gérante",
      texte: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          `« Un concurrent affiche la même chose que nous à ${eur(r.ttcConcurrent)} TTC, ${pct(ECART_DU_CONCURRENT * 100)} sous notre étiquette. Avant de décider si ${c.entreprise} s'aligne, je veux savoir quel taux de marque il nous resterait, ce que nous perdrions de marge sur un mois, et à quel prix il faudrait acheter pour garder notre taux de marque d'aujourd'hui. »`,
          "Pas de cours cette fois : vous avez les prix et les ventes du mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = etiquetteDuConcurrent(c);
        return {
          titre: `Les prix et les ventes du mois · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Notre prix de vente d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(r.vente)] },
            { libelle: "Notre étiquette, toutes taxes comprises", valeurs: [eur(r.venteTtc)] },
            { libelle: "Taux de TVA sur les ventes", valeurs: [pct(r.tauxTva * 100)] },
            { libelle: `Prix d'achat hors taxes chez « ${r.fournisseurs.reference.name} »`, valeurs: [eur(r.achat)] },
            { libelle: `${c.unites.charAt(0).toUpperCase()}${c.unites.slice(1)} ${accordPluriel(c, "vendu")} dans le mois`, valeurs: [qte(r.quantite)] },
            { libelle: "Étiquette du concurrent, toutes taxes comprises", valeurs: [eur(r.ttcConcurrent)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le taux de marque d'aujourd'hui et au prix du concurrent, la marge du mois perdue par l'alignement, le prix d'achat qui garde la marque, et votre réponse.",
    },
    {
      id: "au-prix-du-concurrent",
      type: "montants",
      titre: "Le taux de marque au prix du concurrent",
      notions: ["margin_rates", "vat_payable"],
      question: () =>
        "Calculez votre taux de marque d'aujourd'hui, au dixième. Puis le prix hors taxes qui correspond à l'étiquette du concurrent, et le taux de marque qu'il vous laisserait si vous vous aligniez, au dixième.",
      champs: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          { libelle: "Taux de marque aujourd'hui (%)", attendu: r.tMarque, tolerance: 0.1, calcul: `(${eur(r.vente)} − ${eur(r.achat)}) ÷ ${eur(r.vente)} × 100 = ${pct(r.tMarque)}` },
          { libelle: "Prix du concurrent, hors taxes", attendu: r.htConcurrent, calcul: `${eur(r.ttcConcurrent)} ÷ ${(1 + r.tauxTva).toLocaleString("fr-FR")} = ${eur(r.htConcurrent)}` },
          { libelle: "Taux de marque au prix du concurrent (%)", attendu: r.tMarqueAligne, tolerance: 0.1, calcul: `(${eur(r.htConcurrent)} − ${eur(r.achat)}) ÷ ${eur(r.htConcurrent)} × 100 = ${pct(r.tMarqueAligne)}` },
        ];
      },
      explication: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          `Le taux de marque se calcule hors taxes : on retire d'abord la TVA de l'étiquette. Au prix du concurrent, ${c.entreprise} passerait de ${pct(r.tMarque)} à ${pct(r.tMarqueAligne)} de marque, sans rien changer à ce qu'elle paie au fournisseur.`,
        ];
      },
    },
    {
      id: "ce-que-coute-l-alignement",
      type: "montants",
      titre: "Ce que l'alignement coûterait",
      notions: ["margin_rates"],
      question: (c) =>
        `À ventes égales, calculez la marge commerciale du mois au prix d'aujourd'hui, puis au prix du concurrent, et la marge perdue chaque mois si ${c.entreprise} s'alignait sans rien négocier.`,
      champs: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          { libelle: "Marge du mois au prix d'aujourd'hui", attendu: r.margeDuMois, calcul: `(${eur(r.vente)} − ${eur(r.achat)}) × ${qte(r.quantite)} = ${eur(r.margeDuMois)}` },
          { libelle: "Marge du mois au prix du concurrent", attendu: r.margeDuMoisAlignee, calcul: `(${eur(r.htConcurrent)} − ${eur(r.achat)}) × ${qte(r.quantite)} = ${eur(r.margeDuMoisAlignee)}` },
          { libelle: "Marge perdue chaque mois", attendu: r.perteDuMois, calcul: `${eur(r.margeDuMois)} − ${eur(r.margeDuMoisAlignee)} = ${eur(r.perteDuMois)}` },
        ];
      },
      explication: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          `S'aligner coûterait ${eur(r.perteDuMois)} de marge par mois à ${c.entreprise}, si les ventes ne bougent pas. Toute la baisse du prix hors taxes se prend sur la marge : le prix d'achat, lui, reste à ${eur(r.achat)}.`,
        ];
      },
    },
    {
      id: "le-prix-d-achat",
      type: "montants",
      titre: "Le prix d'achat à négocier",
      notions: ["margin_rates", "markup_coefficient"],
      question: (c) => {
        const r = etiquetteDuConcurrent(c);
        return `Pour s'aligner sans perdre de marque, ${c.entreprise} devrait garder ${pct(r.tMarque)} de taux de marque au prix du concurrent. À quel prix d'achat hors taxes, au plus, faudrait-il acheter ? De combien ce prix est-il plus bas que celui d'aujourd'hui, en pourcentage, au dixième ?`;
      },
      champs: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          // Le taux de marque arrondi au dixième que l'élève a gardé déplace le prix d'un centime.
          { libelle: "Prix d'achat maximal, hors taxes", attendu: r.achatMax, tolerance: 0.02, calcul: `${eur(r.htConcurrent)} × (1 − ${pct(r.tMarque)}) = ${eur(r.achatMax)}` },
          { libelle: "Baisse du prix d'achat à obtenir (%)", attendu: r.baisseDAchat, tolerance: 0.1, calcul: `(${eur(r.achat)} − ${eur(r.achatMax)}) ÷ ${eur(r.achat)} × 100 = ${pct(r.baisseDAchat)}` },
        ];
      },
      explication: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          `Pour garder le même taux de marque, le prix d'achat doit baisser dans la même proportion que le prix de vente, ${pct(ECART_DU_CONCURRENT * 100)} aux arrondis près : ici ${pct(r.baisseDAchat)}. C'est ce que ${c.entreprise} devrait obtenir de « ${r.fournisseurs.reference.name} » avant de s'aligner.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: (c) => {
        const r = etiquetteDuConcurrent(c);
        return [
          {
            texte: `Il faudrait acheter ${eur(r.achatMax)} au plus, ${pct(r.baisseDAchat)} de moins`,
            juste: true,
            retour: `Oui : au prix du concurrent, ${eur(r.htConcurrent)} hors taxes, garder ${pct(r.tMarque)} de marque laisse ${eur(r.achatMax)} pour l'achat, au lieu de ${eur(r.achat)}. Sans cette baisse, l'alignement coûterait ${eur(r.perteDuMois)} de marge par mois.`,
          },
          {
            texte: `Il faudrait acheter ${eur(r.achatSurLeTauxDeMarge)} au plus : le prix aligné divisé par (1 + ${pct(r.tMarque)})`,
            juste: false,
            retour: `Non : diviser par (1 + taux) suppose un taux de marge, rapporté au prix d'achat. ${pct(r.tMarque)} est un taux de marque, rapporté au prix de vente : il faut multiplier le prix de vente par (1 − ${pct(r.tMarque)}), ce qui donne ${eur(r.achatMax)}.`,
          },
          {
            texte: `Il faudrait acheter ${eur(r.achatSurLeTtc)} au plus : ${pct(r.tMarque)} de marque calculés sur l'étiquette TTC`,
            juste: false,
            retour: `Non : la TVA n'appartient pas à ${c.entreprise}, elle la reverse à l'État. Le taux de marque se calcule sur le prix hors taxes, ${eur(r.htConcurrent)}, ce qui donne ${eur(r.achatMax)}.`,
          },
        ];
      },
    },
  ],
};
