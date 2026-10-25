import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { campagnesRejouees, type Campagne } from "../campagne";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE COÛT D'ACQUISITION ET LA RENTABILITÉ D'UNE CAMPAGNE (BTS NDRC, palier 3).
 *
 * Ce que coûte un nouveau client, ce qu'il laisse une fois sa conquête payée, puis ce que la
 * campagne rapporte en tout et euro par euro. L'arène rejoue le premier trimestre à cinq
 * budgets (`campagne.ts`) : sans campagne, la campagne entière se mesure ; d'un palier à
 * l'autre, le coût d'acquisition du client en plus monte, et la campagne finit par coûter plus
 * qu'elle ne rapporte.
 *
 * PIXEL & CO est l'entreprise de l'arène qui distingue ses nouveaux clients (le trafic payant)
 * de ses clients fidèles : le chapitre s'y joue. Les chiffres sont ceux du trimestre de l'arène
 * et de ses budgets rejoués ; les paliers de budget sont posés et justifiés dans `campagne.ts`.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Ce qu'apporte le passage d'un budget au suivant. */
function supplement(de: Campagne, a: Campagne) {
  const budget = a.budget - de.budget;
  const nouveaux = a.nouveaux - de.nouveaux;
  const marge = a.marge - de.marge;
  return { budget, nouveaux, marge, cacMarginal: auCentime(budget / nouveaux), gain: marge - budget };
}

/** La campagne du trimestre, ses budgets rejoués, et ce que vaut chaque palier. */
export function campagne(c: Cas) {
  const v = campagnesRejouees(c.code);
  const i = v.findIndex((x) => x.facteur === 1);
  const sans = v[0]!;
  const jouee = v[i]!;
  const plus = v[i + 1]!;
  const encorePlus = v[i + 2]!;
  const prix = c.gestion.prixMoyen;
  const margeParCommande = auCentime(prix - c.gestion.coutVariableUnitaire);
  const cac = auCentime(jouee.budget / jouee.nouveaux);
  const apportDeLaCampagne = jouee.marge - sans.marge;
  const meilleur = v.reduce((a, b) => (b.resultat > a.resultat ? b : a));
  return {
    budgets: v,
    sans,
    jouee,
    plus,
    encorePlus,
    fidelesEtAutres: jouee.commandes - jouee.nouveaux,
    prix,
    coutVariable: c.gestion.coutVariableUnitaire,
    margeParCommande,
    cac,
    margeApresAcquisition: auCentime(margeParCommande - cac),
    apportDeLaCampagne,
    gainDeLaCampagne: apportDeLaCampagne - jouee.budget,
    roi: auDixieme(((apportDeLaCampagne - jouee.budget) / jouee.budget) * 100),
    premierPalier: supplement(jouee, plus),
    secondPalier: supplement(plus, encorePlus),
    meilleur,
  };
}

export const COUT_D_ACQUISITION: Chapitre = {
  code: "cout-d-acquisition",
  parcours: "ndrc",
  palier: 3,
  blocs: [
    "BTS NDRC Bloc 2 · Relation client à distance et digitalisation",
    "Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale",
    "BUT TC · Gérer une activité digitale",
  ],
  titre: "Le coût d'acquisition et la rentabilité d'une campagne",
  accroche:
    "Une campagne amène des clients. Combien coûte chacun, que laisse-t-il une fois payé, et jusqu'où vaut-il la peine de dépenser plus ?",
  objectifs: [
    "Calculer le coût d'acquisition d'un nouveau client",
    "Calculer la marge après acquisition",
    "Mesurer la rentabilité d'une campagne et son retour sur investissement",
    "Distinguer le coût d'acquisition moyen et celui du client en plus",
    "Choisir un budget sur ce que rapporte le dernier euro",
  ],
  libre: false,
  entreprises: {
    codes: ["ecommerce"],
    pourquoi: "ce chapitre suit les nouveaux clients d'une campagne, et PIXEL & CO est l'entreprise de l'arène qui les distingue de ses clients fidèles.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qu'amène une campagne",
      notions: ["customer_acquisition_cost"],
      texte: (c) => {
        const k = campagne(c);
        return [
          `Au premier trimestre de l'arène, ${c.entreprise} dépense ${eur(k.jouee.budget)} en publicité et en trafic payant. Elle expédie ${qte(k.jouee.commandes)} commandes : ${qte(k.jouee.nouveaux)} viennent de nouveaux clients amenés par la campagne, ${qte(k.fidelesEtAutres)} de clients fidèles et des places de marché.`,
          `Chaque commande se vend ${eur(k.prix)} et coûte ${eur(k.coutVariable)} à acheter, préparer et livrer. Le commercial veut savoir ce que coûte un nouveau client, et si la campagne rapporte plus qu'elle ne coûte.`,
        ];
      },
      repere: () => "Coût d'acquisition = budget de la campagne ÷ nouveaux clients gagnés. Marge après acquisition = marge par commande − coût d'acquisition.",
    },
    {
      id: "cac",
      type: "montants",
      titre: "Le coût d'un nouveau client",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = campagne(c);
        return `Calculez le coût d'acquisition d'un nouveau client (${eur(k.jouee.budget)} pour ${qte(k.jouee.nouveaux)} commandes de nouveaux clients), la marge d'une commande (${eur(k.prix)} − ${eur(k.coutVariable)}), puis la marge qui reste sur la première commande d'un nouveau client.`;
      },
      champs: (c) => {
        const k = campagne(c);
        return [
          { libelle: "Coût d'acquisition", attendu: k.cac, calcul: `${eur(k.jouee.budget)} ÷ ${qte(k.jouee.nouveaux)} = ${eur(k.cac)}` },
          { libelle: "Marge par commande", attendu: k.margeParCommande, calcul: `${eur(k.prix)} − ${eur(k.coutVariable)} = ${eur(k.margeParCommande)}` },
          { libelle: "Marge après acquisition", attendu: k.margeApresAcquisition, calcul: `${eur(k.margeParCommande)} − ${eur(k.cac)} = ${eur(k.margeApresAcquisition)}` },
        ];
      },
      explication: (c) => {
        const k = campagne(c);
        return [
          k.margeApresAcquisition > 0
            ? `La première commande d'un nouveau client paie sa conquête et laisse encore ${eur(k.margeApresAcquisition)}. Chaque commande qu'il passera ensuite, sans campagne, laissera la marge entière : ${eur(k.margeParCommande)}.`
            : `La première commande d'un nouveau client ne paie pas sa conquête : il lui manque ${eur(-k.margeApresAcquisition)}. Le client ne devient rentable qu'en revenant.`,
          "L'arène affiche ce coût d'acquisition dans les indicateurs du métier, sous le même calcul.",
        ];
      },
    },
    {
      id: "roi",
      type: "montants",
      titre: "Ce que rapporte la campagne",
      notions: ["customer_acquisition_cost"],
      tableau: (c) => {
        const k = campagne(c);
        return {
          titre: "Le premier trimestre, rejoué sans campagne",
          colonnes: ["Sans campagne", "Budget du trimestre"],
          lignes: [
            { libelle: "Budget de la campagne", valeurs: [eur(k.sans.budget), eur(k.jouee.budget)] },
            { libelle: "Commandes de nouveaux clients", valeurs: [qte(k.sans.nouveaux), qte(k.jouee.nouveaux)] },
            { libelle: "Commandes en tout", valeurs: [qte(k.sans.commandes), qte(k.jouee.commandes)] },
            { libelle: "Marge sur les ventes", valeurs: [eur(k.sans.marge), eur(k.jouee.marge)] },
          ],
        };
      },
      question: () =>
        `L'arène a rejoué le trimestre sans campagne. Calculez la marge que la campagne a apportée, ce qu'elle a rapporté une fois son budget payé, puis son retour sur investissement (gain ÷ budget × 100), au dixième.`,
      champs: (c) => {
        const k = campagne(c);
        return [
          { libelle: "Marge apportée par la campagne", attendu: k.apportDeLaCampagne, calcul: `${eur(k.jouee.marge)} − ${eur(k.sans.marge)} = ${eur(k.apportDeLaCampagne)}` },
          { libelle: "Gain de la campagne", attendu: k.gainDeLaCampagne, calcul: `${eur(k.apportDeLaCampagne)} − ${eur(k.jouee.budget)} = ${eur(k.gainDeLaCampagne)}` },
          { libelle: "Retour sur investissement (%)", attendu: k.roi, calcul: `${eur(k.gainDeLaCampagne)} ÷ ${eur(k.jouee.budget)} × 100 = ${pct(k.roi)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = campagne(c);
        return [
          `Sans campagne, ${c.entreprise} ne garde presque que ses clients fidèles et ses places de marché. La campagne apporte ${eur(k.apportDeLaCampagne)} de marge pour ${eur(k.jouee.budget)} dépensés : chaque euro investi revient avec ${pct(k.roi)} de gain.`,
          "La mesure compare le trimestre avec et sans campagne, tout le reste égal : c'est ce que l'arène permet, et qu'une entreprise réelle approche en testant une campagne sur une partie de ses clients seulement.",
        ];
      },
    },
    {
      id: "paliers",
      type: "lecture",
      titre: "Cinq budgets pour un même trimestre",
      notions: ["customer_acquisition_cost"],
      texte: (c) => [
        `L'arène a rejoué le même trimestre de ${c.entreprise} à cinq budgets, de zéro au double du budget joué. Seul le budget change : le prix, le stock et les concurrents restent les mêmes.`,
        "Regardez ce qu'apporte chaque palier : les nouveaux clients continuent d'arriver, mais de moins en moins vite.",
      ],
      tableau: (c) => {
        const k = campagne(c);
        return {
          titre: "Le premier trimestre, rejoué à cinq budgets",
          colonnes: k.budgets.map((b) => eur(b.budget)),
          lignes: [
            { libelle: "Commandes de nouveaux clients", valeurs: k.budgets.map((b) => qte(b.nouveaux)) },
            { libelle: "Commandes en tout", valeurs: k.budgets.map((b) => qte(b.commandes)) },
            { libelle: "Marge sur les ventes", valeurs: k.budgets.map((b) => eur(b.marge)) },
            { libelle: "Résultat d'exploitation", valeurs: k.budgets.map((b) => eur(b.resultat)) },
          ],
        };
      },
    },
    {
      id: "client-en-plus",
      type: "montants",
      titre: "Le coût du client en plus",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const k = campagne(c);
        const p = k.premierPalier;
        return `Passer de ${eur(k.jouee.budget)} à ${eur(k.plus.budget)} coûte ${eur(p.budget)} de plus. Calculez les nouveaux clients que ce supplément amène, ce que coûte chacun de ces clients en plus, puis ce que le supplément rapporte une fois payé (marge en plus − budget en plus).`;
      },
      champs: (c) => {
        const k = campagne(c);
        const p = k.premierPalier;
        return [
          { libelle: "Nouveaux clients en plus", attendu: p.nouveaux, calcul: `${qte(k.plus.nouveaux)} − ${qte(k.jouee.nouveaux)} = ${qte(p.nouveaux)}` },
          { libelle: "Coût d'acquisition du client en plus", attendu: p.cacMarginal, calcul: `${eur(p.budget)} ÷ ${qte(p.nouveaux)} = ${eur(p.cacMarginal)}` },
          { libelle: "Gain du supplément", attendu: p.gain, calcul: `(${eur(k.plus.marge)} − ${eur(k.jouee.marge)}) − ${eur(p.budget)} = ${eur(p.gain)}` },
        ];
      },
      explication: (c) => {
        const k = campagne(c);
        const p = k.premierPalier;
        return [
          `En moyenne, un nouveau client coûte ${eur(k.cac)} ; celui que le supplément amène en coûte ${eur(p.cacMarginal)}. La campagne touche d'abord les clients les plus faciles à convaincre ; chaque euro de plus va chercher des clients plus lointains, et plus chers.`,
        ];
      },
    },
    {
      id: "jusqu-ou",
      type: "choix",
      titre: "Jusqu'où dépenser",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const k = campagne(c);
        const s = k.secondPalier;
        return `Passer encore de ${eur(k.plus.budget)} à ${eur(k.encorePlus.budget)} coûterait ${eur(s.budget)} de plus, pour ${qte(s.nouveaux)} nouveaux clients et ${eur(s.marge)} de marge en plus. Ce dernier palier vaut-il la dépense ?`;
      },
      options: (c) => {
        const k = campagne(c);
        const s = k.secondPalier;
        const vaut = s.gain > 0;
        return [
          {
            texte: "Oui : la marge en plus dépasse encore le budget en plus",
            juste: vaut,
            retour: vaut
              ? `Oui : ${eur(s.marge)} de marge pour ${eur(s.budget)} dépensés, soit ${eur(s.gain)} de gain. Mais le client en plus coûte maintenant ${eur(s.cacMarginal)} : chaque palier rapporte moins que le précédent, et un palier de plus finira par coûter plus qu'il ne rapporte.`
              : `Non : ${eur(s.marge)} de marge ne paient pas les ${eur(s.budget)} du palier.`,
          },
          {
            texte: "Non : le dernier palier coûte plus qu'il ne rapporte",
            juste: !vaut,
            retour: vaut
              ? `Non : il rapporte encore ${eur(s.gain)} une fois payé. Le gain baisse d'un palier à l'autre, mais il reste positif.`
              : `Oui : ${eur(s.marge)} de marge pour ${eur(s.budget)} dépensés, soit ${eur(-s.gain)} de perte. Le client en plus coûte ${eur(s.cacMarginal)} : plus que ce qu'il laisse.`,
          },
          {
            texte: "On ne peut pas le dire : il faut regarder le coût d'acquisition moyen",
            juste: false,
            retour: `Non : le coût moyen mélange les premiers clients, bon marché, et les derniers, chers. Pour décider d'un euro de plus, seul compte ce que rapporte cet euro-là : ${eur(s.marge)} de marge pour ${eur(s.budget)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      texte: (c) => {
        const k = campagne(c);
        return [
          `Chez ${c.entreprise}, un nouveau client coûte ${eur(k.cac)} en moyenne, et la campagne rapporte un gain égal à ${pct(k.roi)} de son budget. Mais le client en plus coûte davantage à chaque palier : ${eur(k.premierPalier.cacMarginal)}, puis ${eur(k.secondPalier.cacMarginal)}.`,
          `Parmi les cinq budgets rejoués, le meilleur résultat est celui à ${eur(k.meilleur.budget)}. Un budget se décide sur ce que rapporte le dernier euro, pas sur la moyenne, et un client qui revient vaut bien plus que sa première commande : c'est sa valeur vie qui dit ce qu'on peut dépenser pour le gagner.`,
          "L'arène ne compte ni les impressions ni les clics : le coût par contact et le taux de clic, que suit une vraie campagne, n'y existent pas.",
        ];
      },
      repere: () => "Retour sur investissement = (marge apportée − budget) ÷ budget. Coût du client en plus = budget en plus ÷ nouveaux clients en plus.",
    },
  ],
};
