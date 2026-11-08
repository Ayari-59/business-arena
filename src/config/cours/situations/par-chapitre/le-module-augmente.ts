import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_PARCOURS } from "../../chapitres/le-parcours-client";
import { MODULE_DE_RESERVATION, margeDUneReservation, moisDuModule, reservationsQuiPaient } from "../../monde/parcours-client-de-la-boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PARCOURS CLIENT » : LE MODULE AUGMENTE (Bac STMG, mercatique de
 * terminale, palier 1).
 *
 * Le prestataire du module « réserver en ligne, essayer en boutique » passe son loyer à 400 € par mois
 * (MODULE_DE_RESERVATION.loyerDuCas). La gérante attend 18 réservations par mois. L'élève refait les
 * calculs du chapitre au nouveau loyer : le gain du mois, le nombre de réservations qui paie le module.
 * La réponse n'est pas de fermer le service par principe : elle compare le nombre attendu au nombre
 * qui paie, et cherche ce qui ferait réserver plus de clientes.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** Les chiffres de la réponse, calculés une fois. */
export function leModuleAugmente() {
  const k = MODULE_DE_RESERVATION;
  return {
    loyer: k.loyerDuCas,
    attendues: k.reservationsAttendues,
    parReservation: margeDUneReservation().parReservation,
    gain: moisDuModule(k.reservationsAttendues, k.loyerDuCas).gain,
    gainAvant: moisDuModule(k.reservationsAttendues).gain,
    seuil: reservationsQuiPaient(k.loyerDuCas),
    seuilAvant: reservationsQuiPaient(),
  };
}

export const LE_MODULE_AUGMENTE: Situation = {
  code: "le-module-augmente",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["le-parcours-client"],
  commanditaire: "La gérante de la boutique",
  titre: "Le module de réservation augmente",
  accroche: "Le service qui permet de réserver en ligne et d'essayer en boutique coûtera plus cher. Le garder, l'arrêter, ou le faire mieux connaître ?",
  objectifs: ["Chiffrer le gain d'un service qui relie les canaux", "Trouver le nombre de réservations qui le paie", "Répondre à la gérante, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_PARCOURS,
    pourquoi: "le cas reprend le site et la boutique de MAILLE & CO, du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Le courrier du prestataire",
      texte: () => {
        const r = leModuleAugmente();
        return [
          `« Le prestataire passe le module de réservation à ${eur(r.loyer)} par mois, au lieu de ${eur(MODULE_DE_RESERVATION.loyerParMois)}. Nous attendons ${qte(r.attendues)} réservations par mois. On le garde ? » La gérante`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Une réservation rapporte en moyenne ${eur(r.parReservation)} de marge.`,
        ];
      },
      repere: () => "À rendre : le gain du mois au nouveau loyer, le nombre de réservations qui le paie, et votre réponse.",
    },
    {
      id: "au-nouveau-loyer",
      type: "montants",
      titre: "Au nouveau loyer",
      notions: ["breakeven", "conversion_rate"],
      question: () => "Calculez le gain du mois avec les réservations attendues au nouveau loyer, puis le plus petit nombre de réservations qui paie ce loyer.",
      champs: () => {
        const r = leModuleAugmente();
        return [
          { libelle: "Gain du mois au nouveau loyer", attendu: r.gain, tolerance: 0.05, calcul: `${qte(r.attendues)} × ${eur(r.parReservation)} − ${eur(r.loyer)} = ${eur(r.gain)}` },
          { libelle: "Réservations qui paient le loyer", attendu: r.seuil, calcul: `${eur(r.loyer)} ÷ ${eur(r.parReservation)}, arrondi à la réservation supérieure = ${qte(r.seuil)}` },
        ];
      },
      explication: () => {
        const r = leModuleAugmente();
        return [`Au nouveau loyer, le module ${r.gain < 0 ? `coûte ${eur(-r.gain)} de plus qu'il ne rapporte` : `rapporte encore ${eur(r.gain)}`} : il faudrait ${qte(r.seuil)} réservations, contre ${qte(r.seuilAvant)} avant la hausse.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: () => {
        const r = leModuleAugmente();
        return [
          { texte: `Gardons-le s'il atteint ${qte(r.seuil)} réservations`, juste: r.gain < 0, retour: `Oui : avec ${qte(r.attendues)} réservations, le module coûte ${eur(-r.gain)} par mois. Il se paie à partir de ${qte(r.seuil)} : il faut le faire connaître (sur le site, en caisse, dans le courriel de la carte), puis l'arrêter si les réservations n'arrivent pas.` },
          { texte: `Gardons-le : il rapporte ${eur(r.gainAvant)} par mois`, juste: false, retour: `Non : ce gain est celui de l'ancien loyer. Au nouveau, le module coûte ${eur(-r.gain)} de plus qu'il ne rapporte.` },
          { texte: "Arrêtons-le : un service en ligne ne rapporte rien en boutique", juste: false, retour: `Non : chaque réservation rapporte ${eur(r.parReservation)} de marge en boutique en moyenne. Le service paie dès ${qte(r.seuil)} réservations.` },
        ];
      },
    },
  ],
};
