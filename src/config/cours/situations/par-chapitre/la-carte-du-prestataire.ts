import { arrondi2 as auCentime, eur, nombreAuCentieme, pct } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "../../chapitres/taux-de-marque";
import { DEPARTS_AVEC_LA_REMISE, DEPARTS_D_UNE_BOUTIQUE_COMPARABLE, REMISE_DU_PRESTATAIRE, remiseQuiTient, valeurDUneCliente } from "../../monde/clientele-de-la-boutique";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FIDÉLISER LA CLIENTÈLE » : LA CARTE DU PRESTATAIRE (BTS MCO, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les clientes de la carte de MAILLE & CO et la valeur d'une
 * cliente (monde/clientele-de-la-boutique.ts, `valeurDUneCliente`, `remiseQuiTient`). Le prestataire
 * propose 8 % de remise et promet des départs à 4 % ; une boutique comparable ne les a vus tomber qu'à
 * 4,5 %. L'élève refait seul les calculs du chapitre : la valeur d'une cliente aujourd'hui, avec la
 * carte dans les deux hypothèses, puis, à rebours, les départs qu'il faudrait pour que 8 % ne coûte rien,
 * et la remise qui tient au taux de la boutique comparable.
 *
 * Les pièges : croire la promesse sans la mesurer ; juger la remise sur un passage, pas sur la durée de vie.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la durée de vie moyenne est une grandeur, en mois, au centième.
 */

const qte = nombreAuCentieme;
/** Un taux de départs donné, écrit en fraction avec toutes ses décimales (0,045 pour 4,5 %) : il n'est pas arrondi. */
const fraction = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 4 });

/** Les chiffres du cas, calculés une fois sur la fiche. */
export function laCarteDuPrestataire(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const base = valeurDUneCliente(f);
  const promise = valeurDUneCliente(f, REMISE_DU_PRESTATAIRE, DEPARTS_AVEC_LA_REMISE);
  const comparable = valeurDUneCliente(f, REMISE_DU_PRESTATAIRE, DEPARTS_D_UNE_BOUTIQUE_COMPARABLE);
  // Les départs les plus hauts qui gardent la valeur d'aujourd'hui, avec 8 % de remise : marge après remise ÷ valeur d'aujourd'hui.
  const departsQuiTiennent = promise.margeDUnPassage / base.valeur;
  return {
    f,
    base,
    promise,
    comparable,
    perte: auCentime(base.valeur - comparable.valeur),
    departsQuiTiennent,
    remiseQuiTient: remiseQuiTient(f, DEPARTS_D_UNE_BOUTIQUE_COMPARABLE),
  };
}

const tableauDuCas = (c: Pick<Cas, "code">): TableauDeDonnees => {
  const x = laCarteDuPrestataire(c);
  return {
    titre: "La carte d'aujourd'hui, et l'offre du prestataire",
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Clientes de la carte (un passage par mois)", valeurs: [qte(x.base.clientes)] },
      { libelle: "Panier hors taxes d'un passage", valeurs: [eur(x.base.panierHt)] },
      { libelle: "Marge d'un passage", valeurs: [eur(x.base.margeDUnPassage)] },
      { libelle: "Départs par mois, sans remise", valeurs: [pct(x.base.departs * 100)] },
      { libelle: "Remise proposée", valeurs: [pct(REMISE_DU_PRESTATAIRE * 100)] },
      { libelle: "Départs promis par le prestataire", valeurs: [pct(DEPARTS_AVEC_LA_REMISE * 100)] },
      { libelle: "Départs d'une boutique comparable", valeurs: [pct(DEPARTS_D_UNE_BOUTIQUE_COMPARABLE * 100)] },
    ],
  };
};

export const LA_CARTE_DU_PRESTATAIRE: Situation = {
  code: "la-carte-du-prestataire",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["fideliser-la-clientele"],
  commanditaire: "La direction",
  titre: "La carte du prestataire",
  accroche:
    "Le prestataire propose une carte à 8 % de remise et promet moins de départs. Une boutique comparable n'a pas eu tout ce qu'il promettait. Signer, ou négocier ?",
  objectifs: [
    "Calculer la durée de vie et la valeur d'une cliente fidèle",
    "Chiffrer la valeur d'une cliente avec une remise, dans deux hypothèses de départs",
    "Retrouver à rebours les départs qui rendent une remise neutre",
    "Répondre à la direction sur le taux à négocier",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend la carte du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDuCas,
      texte: () => [
        `« Le prestataire nous propose sa carte : ${pct(REMISE_DU_PRESTATAIRE * 100)} de remise sur chaque achat, et il promet que nos départs tomberont à ${pct(DEPARTS_AVEC_LA_REMISE * 100)} par mois. Une boutique comparable qui l'a prise n'est descendue qu'à ${pct(DEPARTS_D_UNE_BOUTIQUE_COMPARABLE * 100)}. Signons-nous à ce taux ? »`,
        "Pas de cours cette fois : vous avez la carte d'aujourd'hui, l'offre, et la méthode du chapitre.",
      ],
      repere: () => "À rendre : la valeur d'une cliente aujourd'hui, avec la carte selon la promesse et selon la boutique comparable, les départs qui rendraient la remise neutre, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Une cliente, aujourd'hui",
      notions: ["customer_lifetime_value", "churn_rate"],
      tableau: tableauDuCas,
      question: () => "Calculez la durée de vie moyenne d'une cliente de la carte, sans remise (en mois), puis sa valeur.",
      champs: (c) => {
        const b = laCarteDuPrestataire(c).base;
        return [
          { libelle: "Durée de vie moyenne (mois)", nature: "grandeur", attendu: b.dureeDeVie, calcul: `1 ÷ ${fraction(b.departs)} = ${qte(b.dureeDeVie)} mois` },
          { libelle: "Valeur d'une cliente", attendu: b.valeur, calcul: `${eur(b.margeDUnPassage)} × ${qte(b.dureeDeVie)} = ${eur(b.valeur)}` },
        ];
      },
      explication: (c) => {
        const b = laCarteDuPrestataire(c).base;
        return [`Une cliente reste ${qte(b.dureeDeVie)} mois et vaut ${eur(b.valeur)} : c'est la barre que la carte doit dépasser.`];
      },
    },
    {
      id: "la-carte-a-8",
      type: "montants",
      titre: "La carte du prestataire",
      notions: ["customer_lifetime_value", "churn_rate"],
      tableau: tableauDuCas,
      question: () =>
        "Calculez la marge d'un passage après la remise du prestataire, puis la valeur d'une cliente si la promesse se vérifie, et si les départs ne tombent qu'au taux de la boutique comparable.",
      champs: (c) => {
        const x = laCarteDuPrestataire(c);
        return [
          { libelle: "Marge d'un passage après remise", attendu: x.promise.margeDUnPassage, calcul: `${eur(x.base.margeDUnPassage)} − ${eur(x.base.panierHt)} × ${pct(REMISE_DU_PRESTATAIRE * 100)} = ${eur(x.base.margeDUnPassage)} − ${eur(x.promise.remiseDUnPassage)} = ${eur(x.promise.margeDUnPassage)}` },
          { libelle: "Valeur, départs promis", attendu: x.promise.valeur, calcul: `${eur(x.promise.margeDUnPassage)} ÷ ${fraction(DEPARTS_AVEC_LA_REMISE)} = ${eur(x.promise.valeur)}` },
          { libelle: "Valeur, départs de la boutique comparable", attendu: x.comparable.valeur, calcul: `${eur(x.comparable.margeDUnPassage)} ÷ ${fraction(DEPARTS_D_UNE_BOUTIQUE_COMPARABLE)} = ${eur(x.comparable.valeur)}` },
        ];
      },
      explication: (c) => {
        const x = laCarteDuPrestataire(c);
        return [
          `Si la promesse se tient, une cliente vaut ${eur(x.promise.valeur)}, un peu plus qu'aujourd'hui. Si les départs ne tombent qu'à ${pct(DEPARTS_D_UNE_BOUTIQUE_COMPARABLE * 100)}, elle vaut ${eur(x.comparable.valeur)} : la carte fait perdre ${eur(x.perte)} par cliente.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Les départs qu'il faudrait",
      notions: ["customer_lifetime_value", "churn_rate"],
      question: () =>
        `À rebours. Avec ${pct(REMISE_DU_PRESTATAIRE * 100)} de remise, quels départs par mois, au plus, garderaient la valeur d'une cliente à celle d'aujourd'hui ? Calculez-les (en %, au centième), puis la plus forte remise, en % entier, qui tient avec les départs de la boutique comparable.`,
      champs: (c) => {
        const x = laCarteDuPrestataire(c);
        return [
          { libelle: "Départs au plus (%)", attendu: auCentime(x.departsQuiTiennent * 100), calcul: `${eur(x.promise.margeDUnPassage)} ÷ ${eur(x.base.valeur)} × 100 = ${pct(auCentime(x.departsQuiTiennent * 100))}` },
          {
            libelle: "Remise qui tient (%)",
            attendu: x.remiseQuiTient,
            calcul: `À ${pct(x.remiseQuiTient)} : ${eur(valeurDUneCliente(x.f, x.remiseQuiTient / 100, DEPARTS_D_UNE_BOUTIQUE_COMPARABLE).valeur)} ; à ${pct(x.remiseQuiTient + 1)} : ${eur(valeurDUneCliente(x.f, (x.remiseQuiTient + 1) / 100, DEPARTS_D_UNE_BOUTIQUE_COMPARABLE).valeur)}, sous ${eur(x.base.valeur)}`,
          },
        ];
      },
      explication: (c) => {
        const x = laCarteDuPrestataire(c);
        return [
          `À ${pct(REMISE_DU_PRESTATAIRE * 100)}, la carte ne paie que si les départs tombent sous ${pct(auCentime(x.departsQuiTiennent * 100))} : la marge de sécurité sur la promesse est mince. Au taux de la boutique comparable, la remise ne doit pas dépasser ${pct(x.remiseQuiTient)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const x = laCarteDuPrestataire(c);
        return [
          {
            texte: `Négocier la remise à ${pct(x.remiseQuiTient)} au plus`,
            juste: true,
            retour: `Oui : à ${pct(REMISE_DU_PRESTATAIRE * 100)}, la carte ne paie que si les départs tombent sous ${pct(auCentime(x.departsQuiTiennent * 100))} ; la boutique comparable est à ${pct(DEPARTS_D_UNE_BOUTIQUE_COMPARABLE * 100)}, et y perdrait ${eur(x.perte)} par cliente. À ${pct(x.remiseQuiTient)}, la carte tient même dans ce cas.`,
          },
          {
            texte: `Signer : la valeur d'une cliente passe à ${eur(x.promise.valeur)}, au-dessus d'aujourd'hui`,
            juste: false,
            retour: `Seulement si la promesse se tient. Avec les départs de la boutique comparable, elle tombe à ${eur(x.comparable.valeur)}.`,
          },
          {
            texte: `Refuser toute remise : ${pct(REMISE_DU_PRESTATAIRE * 100)} retirent ${eur(x.promise.remiseDUnPassage)} à chaque passage`,
            juste: false,
            retour: `Non : une remise plus faible tient même dans l'hypothèse prudente. Elle se juge sur la durée de vie de la cliente, pas sur un passage.`,
          },
        ];
      },
    },
  ],
};
