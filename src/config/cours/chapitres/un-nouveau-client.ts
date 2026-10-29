import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  CAMPAGNE_DU_CHAPITRE,
  OFFRES_DE_CAMPAGNE,
  PART_DES_GAGNES_QUI_PRENNENT_LA_CARTE,
  campagne,
  carteDeFidelite,
  meilleureCampagne,
  passantsDeJanvier,
  ventesPourPayer,
} from "../monde/vente-et-caisse";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VENTE } from "./le-panier-moyen";

/**
 * CHAPITRE : CE QUE RAPPORTE UN NOUVEAU CLIENT (Bac pro Métiers du commerce et de la vente,
 * terminale, palier 2).
 *
 * La vendeuse propose une campagne pour faire entrer des passants. Le chapitre compte les ventes
 * gagnées, ce qu'a coûté chacune, la marge qu'elle rapporte, et dit si la campagne paie ; puis ce
 * qu'elle rapporte encore ensuite, quand une partie des clients gagnés prend la carte. Puis
 * l'expérience : un curseur (combien de ventes gagnées paient la campagne ?) et un laboratoire
 * (quelle offre de l'agence laisse le plus, une fois payée ?).
 *
 * Il ne double pas « Le coût d'acquisition et la rentabilité d'une campagne » (BTS NDRC, palier
 * 3 : cinq budgets, le coût du client en plus, le retour sur investissement), ni « Ce que rapporte
 * la communication » (bac STMG). Ici, une campagne d'un mois et des divisions simples.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les passants de MAILLE & CO en janvier (monde/maille-et-co.ts :
 * 3 160 entrées, 600 passages en caisse, leurs articles et leur marge) et la carte de fidélité du
 * chapitre « Le client qui revient ». Les calculs sont dans monde/vente-et-caisse.ts.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : les offres de l'agence (300 entrées en plus pour 1 000 €,
 * 500 pour 2 000 €, 650 pour 4 000 €) ; la campagne du chapitre à 2 000 € ; les passants gagnés
 * achètent comme ceux de janvier ; un client gagné sur cinq prend la carte.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait dans l'arène l'année avec la publicité du premier trimestre
 * doublée, chez six entreprises (à la boutique : 126 ventes gagnées, une campagne qui coûtait
 * 1 537 € de plus qu'elle ne rapportait). Il se joue maintenant chez MAILLE & CO seule : 95 ventes
 * gagnées, 21,05 € par vente, 3 057,10 € de marge, une campagne qui laisse 1 057,10 €.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/** Ce qu'une campagne laisse une fois payée, ou ce qu'il lui manque, en mots. */
export const bilanDeLaCampagne = (x: number) =>
  x > 0 ? `laisse ${eur(x)} une fois payée` : x < 0 ? `coûte ${eur(-x)} de plus qu'elle ne rapporte` : "se paie tout juste";

/** La campagne du chapitre, et les passants de janvier sur lesquels elle se calcule. */
export function campagneDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  return { ...campagne(f, CAMPAGNE_DU_CHAPITRE), passants: passantsDeJanvier(f), tauxEnPourcentage: auDixieme(passantsDeJanvier(f).tauxDeTransformation * 100) };
}

export function tableauDesPassants(c: Cas): TableauDeDonnees {
  const p = passantsDeJanvier(ficheDe(c));
  return {
    titre: `Les passants ${dE(c.entreprise)} en janvier`,
    colonnes: ["Janvier"],
    lignes: [
      { libelle: "Entrées en boutique", valeurs: [qte(p.entrees)] },
      { libelle: "Passages en caisse", valeurs: [qte(p.tickets)] },
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(p.chiffreDAffaires)] },
      { libelle: "Coût des articles vendus", valeurs: [eur(p.coutDesVentes)] },
    ],
  };
}

export const UN_NOUVEAU_CLIENT: Chapitre = {
  code: "un-nouveau-client",
  parcours: "vente",
  palier: 2,
  blocs: ["Bac pro MCV Bloc 4B · Prospecter et valoriser l'offre commerciale"],
  titre: "Ce que rapporte un nouveau client",
  accroche: "Une campagne fait entrer des passants. Combien deviennent des clients, combien a coûté chacun, que rapporte sa vente, et la campagne paie-t-elle ?",
  objectifs: [
    "Calculer les ventes qu'une campagne fait gagner",
    "Calculer le coût d'une vente gagnée",
    "Comparer la marge gagnée au coût de la campagne",
    "Voir ce qu'un client gagné rapporte encore ensuite",
    "Choisir la campagne qui laisse le plus",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VENTE,
    pourquoi: "ce chapitre suit les passants de la boutique du cours, MAILLE & CO, de l'entrée à la caisse.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une campagne pour gagner des clients",
      notions: ["customer_acquisition_cost"],
      tableau: tableauDesPassants,
      texte: (c) => {
        const k = campagneDuChapitre(c);
        return [
          `En janvier, ${qte(k.passants.entrees)} passants sont entrés chez ${c.entreprise}, et ${qte(k.passants.tickets)} sont passés en caisse. La vendeuse propose une campagne d'affiches et de réseaux sociaux à ${eur(k.budget)} : l'agence promet ${qte(k.entrees)} entrées de plus dans le mois.`,
          "Une entrée n'est pas une vente : il faut que le passant achète. Le cours suppose que les passants gagnés achètent comme ceux de janvier.",
        ];
      },
      repere: () => "Ventes gagnées = entrées en plus × taux de transformation. Coût d'une vente gagnée = budget ÷ ventes gagnées.",
    },
    {
      id: "les-ventes",
      objectifs: [0],
      type: "montants",
      titre: "Les ventes gagnées",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `Calculez le taux de transformation des passants de janvier (${qte(k.passants.tickets)} passages ÷ ${qte(k.passants.entrees)} entrées × 100, au dixième), puis les ventes que gagnent les ${qte(k.entrees)} entrées de la campagne, à l'unité.`;
      },
      champs: (c) => {
        const k = campagneDuChapitre(c);
        return [
          { libelle: "Taux de transformation (%)", attendu: k.tauxEnPourcentage, calcul: `${qte(k.passants.tickets)} ÷ ${qte(k.passants.entrees)} × 100 = ${pct(k.tauxEnPourcentage)}`, tolerance: 0.1 },
          { libelle: "Ventes gagnées", attendu: k.ventes, calcul: `${qte(k.entrees)} × ${qte(k.passants.tickets)} ÷ ${qte(k.passants.entrees)} = ${qte(k.ventes)}, à l'unité`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = campagneDuChapitre(c);
        return [`Sur ${qte(k.entrees)} passants de plus, ${qte(k.ventes)} achètent. Les autres regardent et repartent : c'est le cas de la plupart des passants.`];
      },
    },
    {
      id: "le-cout",
      objectifs: [1],
      type: "montants",
      titre: "Ce que coûte une vente gagnée",
      notions: ["customer_acquisition_cost"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `La campagne coûte ${eur(k.budget)} et gagne ${qte(k.ventes)} ventes. Calculez ce que coûte une vente gagnée, au centime.`;
      },
      champs: (c) => {
        const k = campagneDuChapitre(c);
        return [{ libelle: "Coût d'une vente gagnée", attendu: k.coutDUneVente, calcul: `${eur(k.budget)} ÷ ${qte(k.ventes)} = ${eur(k.coutDUneVente)}` }];
      },
      explication: (c) => [`Chaque vente gagnée a coûté ${eur(campagneDuChapitre(c).coutDUneVente)} de campagne. Reste à savoir ce qu'elle rapporte.`],
    },
    {
      id: "la-marge",
      objectifs: [2],
      type: "montants",
      titre: "La marge gagnée",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `En janvier, les passants ont laissé ${eur(k.passants.marge)} de marge pour ${qte(k.passants.tickets)} passages en caisse. Calculez la marge d'une vente de passant (au centime), la marge des ${qte(k.ventes)} ventes gagnées, puis ce que la campagne laisse une fois payée.`;
      },
      champs: (c) => {
        const k = campagneDuChapitre(c);
        return [
          { libelle: "Marge d'une vente de passant", attendu: k.passants.margeDUneVente, calcul: `${eur(k.passants.marge)} ÷ ${qte(k.passants.tickets)} = ${eur(k.passants.margeDUneVente)}` },
          { libelle: "Marge des ventes gagnées", attendu: k.marge, calcul: `${qte(k.ventes)} × ${eur(k.passants.margeDUneVente)} = ${eur(k.marge)}` },
          { libelle: "Ce que la campagne laisse", attendu: k.laisse, calcul: `${eur(k.marge)} − ${eur(k.budget)} = ${eur(k.laisse)}` },
        ];
      },
      explication: (c) => {
        const k = campagneDuChapitre(c);
        return [`Les ventes gagnées rapportent ${eur(k.marge)} de marge, pour ${eur(k.budget)} de campagne : la campagne ${bilanDeLaCampagne(k.laisse)}.`];
      },
    },
    {
      id: "paie-t-elle",
      objectifs: [2],
      type: "choix",
      titre: "La campagne paie-t-elle ?",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `Une vente gagnée coûte ${eur(k.coutDUneVente)} de campagne et rapporte ${eur(k.passants.margeDUneVente)} de marge. Que dire de la campagne ?`;
      },
      options: (c) => {
        const k = campagneDuChapitre(c);
        const paie = k.laisse > 0;
        return [
          {
            texte: "Elle paie : chaque vente gagnée rapporte plus qu'elle n'a coûté",
            juste: paie,
            retour: paie ? `Oui : ${eur(k.passants.margeDUneVente)} de marge pour ${eur(k.coutDUneVente)} de campagne. La campagne ${bilanDeLaCampagne(k.laisse)}.` : `Non : chaque vente gagnée coûte plus qu'elle ne rapporte. La campagne ${bilanDeLaCampagne(k.laisse)}.`,
          },
          {
            texte: "Elle ne paie pas : chaque vente gagnée coûte plus qu'elle ne rapporte",
            juste: !paie,
            retour: !paie ? `Oui : la campagne ${bilanDeLaCampagne(k.laisse)}.` : `Non : ${eur(k.passants.margeDUneVente)} de marge pour ${eur(k.coutDUneVente)} de campagne, elle paie.`,
          },
          {
            texte: "Elle paie, puisqu'elle fait du chiffre d'affaires",
            juste: false,
            retour: `Non : les ventes gagnées font ${eur(k.chiffreDAffaires)} de chiffre d'affaires, mais c'est leur marge, ${eur(k.marge)}, qui paie la campagne. On compare la marge au budget, jamais le chiffre d'affaires.`,
          },
        ];
      },
    },
    {
      id: "et-ensuite",
      objectifs: [3],
      type: "montants",
      titre: "Ce que rapporte encore un client gagné",
      notions: ["customer_lifetime_value", "contribution_margin"],
      question: (c) => {
        return `Le cours suppose que ${pct(PART_DES_GAGNES_QUI_PRENNENT_LA_CARTE * 100)} des clients gagnés prennent la carte de fidélité et reviennent chaque mois, avec la marge d'un passage de cliente fidèle, ${eur(carteDeFidelite(ficheDe(c)).margeDUnMois)}. Calculez les clients gagnés qui prennent la carte (à l'unité), puis la marge qu'ils rapportent dès le mois suivant.`;
      },
      champs: (c) => {
        const k = campagneDuChapitre(c);
        const m = carteDeFidelite(ficheDe(c)).margeDUnMois;
        return [
          { libelle: "Clients gagnés qui prennent la carte", attendu: k.nouvellesFideles, calcul: `${qte(k.ventes)} × ${pct(PART_DES_GAGNES_QUI_PRENNENT_LA_CARTE * 100)} = ${qte(k.nouvellesFideles)}, à l'unité`, tolerance: 1 },
          { libelle: "Marge du mois suivant", attendu: k.margeDuMoisSuivant, calcul: `${qte(k.nouvellesFideles)} × ${eur(m)} = ${eur(k.margeDuMoisSuivant)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = campagneDuChapitre(c);
        return [`Les ${qte(k.nouvellesFideles)} clients qui reviennent rapportent ${eur(k.margeDuMoisSuivant)} dès le mois suivant, et encore les mois d'après : une campagne se juge aussi sur les clients qu'elle fait revenir.`];
      },
    },
    {
      id: "combien-de-ventes",
      objectifs: [2],
      type: "curseur",
      titre: "Combien de ventes pour payer la campagne ?",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: (c) => {
        const k = campagneDuChapitre(c);
        return `Faites varier les ventes gagnées par la campagne de ${eur(k.budget)} : une droite donne leur marge, à ${eur(k.passants.margeDUneVente)} la vente, l'autre le budget de la campagne. Placez le curseur sur le plus petit nombre de ventes gagnées qui paie la campagne, puis validez.`;
      },
      grandeur: () => ({ libelle: "Ventes gagnées par la campagne", unite: "ventes" }),
      cible: (c) => ({ attendu: ventesPourPayer(ficheDe(c)), min: 0, max: 150 }),
      zones: ["La campagne est payée", "La campagne coûte plus qu'elle ne rapporte"],
      rates: () => ({
        dessous: "Avec si peu de ventes gagnées, leur marge ne paie pas la campagne.",
        dessus: "Ces ventes paient la campagne, mais moins suffirait : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les ventes",
      lecture: (c, q) => {
        const k = campagneDuChapitre(c);
        const marge = Math.round(q * k.passants.margeDUneVente * 100) / 100;
        return [
          { libelle: "Marge des ventes gagnées", montant: marge, fort: true },
          { libelle: "Budget de la campagne", montant: k.budget },
          { libelle: "Ce que la campagne laisse", montant: Math.round((marge - k.budget) * 100) / 100 },
        ];
      },
      droites: (c) => {
        const k = campagneDuChapitre(c);
        return { produit: (q) => q * k.passants.margeDUneVente, cout: () => k.budget, libelles: ["Marge des ventes gagnées", "Budget de la campagne"] };
      },
      explication: (c) => {
        const k = campagneDuChapitre(c);
        const q = ventesPourPayer(ficheDe(c));
        return [
          `Il faut ${qte(q)} ventes gagnées pour payer ${eur(k.budget)} : ${eur(k.budget)} ÷ ${eur(k.passants.margeDUneVente)}, arrondi à la vente du dessus. La campagne en gagne ${qte(k.ventes)} : elle ${bilanDeLaCampagne(k.laisse)}.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-campagne",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire de la campagne",
      notions: ["customer_acquisition_cost", "contribution_margin"],
      question: () =>
        "L'agence propose trois offres, et la boutique peut aussi ne rien faire. Plus la campagne est grosse, plus elle fait entrer de passants, mais de moins en moins par euro. Choisissez une offre : les ventes gagnées, leur marge et ce que la campagne laisse se refont. Relevez le défi.",
      leviers: () => [
        {
          code: "budget",
          libelle: "Offre de l'agence",
          unite: "€",
          min: Math.min(...OFFRES_DE_CAMPAGNE.map((o) => o.budget)),
          max: Math.max(...OFFRES_DE_CAMPAGNE.map((o) => o.budget)),
          pas: 1,
          depart: 0,
          choix: OFFRES_DE_CAMPAGNE.map((o) => ({ valeur: o.budget, libelle: o.budget === 0 ? "Pas de campagne" : `${eur(o.budget)}, ${qte(o.entrees)} entrées en plus` })),
        },
      ],
      lecture: (c, p) => {
        const x = campagne(ficheDe(c), p.budget!);
        return [
          { libelle: "Entrées en plus", montant: x.entrees, unite: "entrées" },
          { libelle: "Ventes gagnées", montant: x.ventes, unite: "ventes" },
          { libelle: "Coût d'une vente gagnée", montant: x.coutDUneVente },
          { libelle: "Marge des ventes gagnées", montant: x.marge },
          { libelle: "Ce que la campagne laisse", montant: x.laisse, effet: true, fort: true },
        ];
      },
      defi: (c) => {
        const meilleure = meilleureCampagne(ficheDe(c));
        return {
          consigne: "Choisissez l'offre qui laisse le plus de marge à la boutique, une fois la campagne payée.",
          atteint: (p) => p.budget === meilleure.budget,
          indice: (p) => {
            const x = campagne(ficheDe(c), p.budget!);
            return x.budget === 0
              ? "Sans campagne, la boutique ne dépense rien, mais ne gagne rien non plus. Une offre laisse-t-elle plus ?"
              : `Cette offre ${bilanDeLaCampagne(x.laisse)}. Comparez-la aux autres : une plus grosse campagne gagne plus de ventes, mais chacune coûte plus cher.`;
          },
          solution: { budget: meilleure.budget },
        };
      },
      explication: (c, p) => {
        const f = ficheDe(c);
        const x = campagne(f, p.budget!);
        const plusGrosse = OFFRES_DE_CAMPAGNE.filter((o) => o.budget > x.budget).map((o) => campagne(f, o.budget));
        return [
          `Défi relevé : l'offre à ${eur(x.budget)} gagne ${qte(x.ventes)} ventes, à ${eur(x.coutDUneVente)} la vente, et ${bilanDeLaCampagne(x.laisse)}.`,
          plusGrosse.length > 0
            ? `L'offre à ${eur(plusGrosse[0]!.budget)} gagnerait ${qte(plusGrosse[0]!.ventes)} ventes, mais chacune coûterait ${eur(plusGrosse[0]!.coutDUneVente)} : elle ${bilanDeLaCampagne(plusGrosse[0]!.laisse)}. Au-delà d'un point, chaque euro de plus gagne moins de clients qu'il ne coûte.`
            : "Ici, la plus grosse offre est aussi celle qui laisse le plus.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      texte: (c) => {
        const k = campagneDuChapitre(c);
        return [
          `La campagne de ${eur(k.budget)} gagne ${qte(k.ventes)} ventes : chacune coûte ${eur(k.coutDUneVente)} et rapporte ${eur(k.passants.margeDUneVente)} de marge. La campagne ${bilanDeLaCampagne(k.laisse)}, et ${qte(k.nouvellesFideles)} clients gagnés reviendront.`,
          "Un nouveau client se juge sur sa marge, pas sur son chiffre d'affaires, et sur le temps qu'il reste. Dans l'arène, les chiffres de votre entreprise seront différents : le calcul sera le même.",
        ];
      },
      repere: () => "Une campagne paie si la marge des ventes gagnées dépasse son budget.",
    },
  ],
};
