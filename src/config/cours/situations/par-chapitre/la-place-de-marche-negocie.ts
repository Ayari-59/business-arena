import { arrondi2, eur, pct, qte } from "../../../../pedagogy/cours/deux-decimales";
import { VENDRE_EN_LIGNE } from "../../chapitres/vendre-en-ligne";
import { OFFRE_NEGOCIEE, PLACE_DE_MARCHE, trimestreSurLaPlace, venteSurLaPlace } from "../../monde/vente-en-ligne-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « VENDRE EN LIGNE » : LA PLACE DE MARCHÉ NÉGOCIE (Bac STMG, mercatique de
 * terminale, palier 1).
 *
 * La plateforme propose une seconde offre : moins de commission, plus d'abonnement (OFFRE_NEGOCIEE). Le
 * président veut savoir laquelle choisir, si 30 % des ventes de la plateforme sont prises au site. Les
 * calculs sont ceux du chapitre, faits pour les deux offres : la marge d'une enceinte, puis ce que la
 * place de marché rapporte sur le trimestre. Le piège : choisir l'offre à la commission la plus basse
 * sans compter l'abonnement, ou l'inverse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les gains du trimestre attendent le centime (à l'euro près,
 * avant).
 */


/** Les chiffres de la réponse, calculés une fois. */
export function laPlaceNegocie() {
  const c = OFFRE_NEGOCIEE.cannibalisation;
  const premiere = trimestreSurLaPlace(c);
  const seconde = trimestreSurLaPlace(c, OFFRE_NEGOCIEE);
  return {
    prises: c,
    margePremiere: venteSurLaPlace().marge,
    margeSeconde: venteSurLaPlace(OFFRE_NEGOCIEE.commission).marge,
    premiere,
    seconde,
    meilleure: seconde.gain > premiere.gain ? ("seconde" as const) : ("premiere" as const),
    ecart: arrondi2(Math.abs(seconde.gain - premiere.gain)),
  };
}

export const LA_PLACE_DE_MARCHE_NEGOCIE: Situation = {
  code: "la-place-de-marche-negocie",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["vendre-en-ligne"],
  commanditaire: "Le président",
  titre: "La place de marché négocie",
  accroche: "La plateforme propose une seconde offre : moins de commission, plus d'abonnement. Laquelle laisse le plus à NOVA, ventes prises au site comprises ?",
  objectifs: ["Calculer la marge d'une vente sur une place de marché", "Comparer deux offres, ventes prises au site comprises", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: VENDRE_EN_LIGNE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const r = laPlaceNegocie();
        return [
          `« La plateforme nous propose deux offres : ${pct(PLACE_DE_MARCHE.commission * 100)} de commission et ${eur(PLACE_DE_MARCHE.abonnement)} d'abonnement par trimestre, ou ${pct(OFFRE_NEGOCIEE.commission * 100)} et ${eur(OFFRE_NEGOCIEE.abonnement)}. Nous y attendons ${qte(PLACE_DE_MARCHE.ventesAttendues)} ventes par trimestre, dont ${pct(r.prises * 100)} prises à notre site. Laquelle choisir ? » Le président`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Sur le site, une enceinte laisse ${eur(venteSurLaPlace().margeSurLeSite)} de marge.`,
        ];
      },
      repere: () => "À rendre : la marge d'une enceinte avec chaque offre, ce que chaque offre rapporte sur le trimestre, et votre réponse.",
    },
    {
      id: "la-marge-d-une-enceinte",
      type: "montants",
      titre: "La marge d'une enceinte",
      notions: ["distribution_commission"],
      question: () => "Calculez la marge qui reste sur une enceinte vendue par la plateforme, avec la première offre, puis avec la seconde.",
      champs: () => {
        const r = laPlaceNegocie();
        const v = venteSurLaPlace();
        const w = venteSurLaPlace(OFFRE_NEGOCIEE.commission);
        return [
          { libelle: "Marge par enceinte, première offre", attendu: r.margePremiere, calcul: `${eur(v.prix)} − ${eur(v.commission)} − ${eur(v.coutVariable)} = ${eur(v.marge)}` },
          { libelle: "Marge par enceinte, seconde offre", attendu: r.margeSeconde, calcul: `${eur(w.prix)} − ${eur(w.commission)} − ${eur(w.coutVariable)} = ${eur(w.marge)}` },
        ];
      },
      explication: () => {
        const r = laPlaceNegocie();
        return [`La seconde offre laisse ${eur(r.margeSeconde - r.margePremiere)} de plus par enceinte. Reste à savoir si cela paie son abonnement plus cher.`];
      },
    },
    {
      id: "le-trimestre",
      type: "montants",
      titre: "Ce que rapporte chaque offre",
      notions: ["cannibalization", "distribution_commission"],
      question: () => "Calculez ce que la place de marché rapporte sur le trimestre avec chaque offre : marge des ventes nouvelles, moins la marge perdue sur les ventes prises au site, moins l'abonnement.",
      champs: () => {
        const r = laPlaceNegocie();
        const ligne = (t: typeof r.premiere) => `${eur(t.margeDesNouvelles)} − ${eur(t.perteSurLesPrises)} − ${eur(t.abonnement)} = ${eur(t.gain)}`;
        return [
          { libelle: "Gain du trimestre, première offre", attendu: r.premiere.gain, calcul: ligne(r.premiere) },
          { libelle: "Gain du trimestre, seconde offre", attendu: r.seconde.gain, calcul: ligne(r.seconde) },
        ];
      },
      explication: () => {
        const r = laPlaceNegocie();
        return [`${qte(r.premiere.nouvelles)} ventes sont nouvelles, ${qte(r.premiere.prises)} prises au site. Avec ces ventes, la ${r.meilleure === "seconde" ? "seconde" : "première"} offre rapporte ${eur(r.ecart)} de plus sur le trimestre.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Quelle phrase envoyez-vous au président ?",
      options: () => {
        const r = laPlaceNegocie();
        const seconde = r.meilleure === "seconde";
        return [
          { texte: `Prenons la seconde : ${eur(r.ecart)} de plus`, juste: seconde, retour: seconde ? `Oui : malgré un abonnement plus cher, la seconde offre rapporte ${eur(r.seconde.gain)} sur le trimestre, contre ${eur(r.premiere.gain)}. La commission plus basse s'applique à chaque vente, l'abonnement ne se paie qu'une fois.` : `Non : la première rapporte ${eur(r.ecart)} de plus.` },
          { texte: `Prenons la première : son abonnement coûte moins`, juste: !seconde, retour: seconde ? `Non : l'abonnement coûte ${eur(OFFRE_NEGOCIEE.abonnement - PLACE_DE_MARCHE.abonnement)} de moins, mais la commission plus forte coûte plus sur ${qte(PLACE_DE_MARCHE.ventesAttendues)} ventes. La première rapporte ${eur(r.ecart)} de moins.` : `Oui : elle rapporte ${eur(r.ecart)} de plus.` },
          { texte: "Aucune : les ventes prises au site font tout perdre", juste: false, retour: `Non : même avec ${pct(r.prises * 100)} de ventes prises au site, les deux offres rapportent (${eur(r.premiere.gain)} et ${eur(r.seconde.gain)}).` },
        ];
      },
    },
  ],
};
