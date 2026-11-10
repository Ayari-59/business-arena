import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_EXPERIENCE } from "../../chapitres/l-experience-client";
import { SOIREE_DU_CHEF, couvertsQuiPaient, margeDUnCouvert, margeDUnCouvertDeLaSoiree, margeDUnSoirOrdinaire, soireeDuChef } from "../../monde/experience-du-bistrot";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'EXPÉRIENCE CLIENT ET LA VALEUR PERÇUE » : UNE SOIRÉE LE MARDI ? (Bac
 * STMG, mercatique de terminale, palier 1).
 *
 * Les jeudis du chef plaisent ; le gérant veut en ouvrir une le mardi, soir plus calme (25 dîners
 * ordinaires), et 38 clients ont déjà réservé. Les calculs sont ceux du chapitre : la marge du soir
 * ordinaire remplacé, le nombre de couverts qui paient la soirée, ce qu'elle rapporte avec les
 * réservations. Le piège : reprendre le seuil du jeudi, calculé sur un soir ordinaire plus rempli.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** Les chiffres de la réponse, calculés une fois. */
export function uneSoireeLeMardi() {
  const s = SOIREE_DU_CHEF;
  const k = soireeDuChef(s.reservationsDuMardi, s.dinersDUnMardiOrdinaire);
  return {
    diners: s.dinersDUnMardiOrdinaire,
    reservations: s.reservationsDuMardi,
    margeDuMardi: margeDUnSoirOrdinaire(s.dinersDUnMardiOrdinaire),
    aCouvrir: k.aCouvrir,
    seuil: couvertsQuiPaient(s.dinersDUnMardiOrdinaire),
    seuilDuJeudi: couvertsQuiPaient(),
    gain: k.gain,
  };
}

export const UNE_SOIREE_LE_MARDI: Situation = {
  code: "une-soiree-le-mardi",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["l-experience-client"],
  commanditaire: "Le gérant du bistrot",
  titre: "Une soirée du chef le mardi ?",
  accroche: "Les jeudis du chef plaisent. Le gérant voudrait en ouvrir une le mardi, un soir plus calme, où des clients ont déjà réservé. La soirée y paierait-elle ?",
  objectifs: ["Chiffrer ce qu'une soirée expérientielle doit couvrir", "Trouver le nombre de couverts qui la paie", "Répondre au gérant, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_EXPERIENCE,
    pourquoi: "le cas reprend la soirée du chef de LA TABLE D'AUGUSTIN, du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du gérant",
      texte: () => {
        const r = uneSoireeLeMardi();
        return [
          `« Le mardi soir, nous ne servons que ${qte(r.diners)} dîners. ${qte(r.reservations)} clients ont déjà réservé une soirée du chef ce jour-là. Est-ce qu'elle nous rapporterait plus qu'un mardi ordinaire, musicien payé ? » Le gérant`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Un couvert ordinaire laisse ${eur(margeDUnCouvert())}, un couvert de la soirée ${eur(margeDUnCouvertDeLaSoiree())}, et l'animation coûte ${eur(SOIREE_DU_CHEF.animation)}.`,
        ];
      },
      repere: () => "À rendre : ce que la soirée doit couvrir le mardi, le nombre de couverts qui la paie, ce qu'elle rapporte avec les réservations, et votre réponse.",
    },
    {
      id: "ce-qu-il-faut-couvrir",
      type: "montants",
      titre: "Ce que la soirée doit couvrir",
      notions: ["contribution_margin", "breakeven"],
      question: () => "Calculez la marge d'un mardi soir ordinaire, ce que la soirée doit couvrir (cette marge et l'animation), puis le plus petit nombre de couverts qui la paie.",
      champs: () => {
        const r = uneSoireeLeMardi();
        return [
          { libelle: "Marge d'un mardi soir ordinaire", attendu: r.margeDuMardi, calcul: `${qte(r.diners)} × ${eur(margeDUnCouvert())} = ${eur(r.margeDuMardi)}` },
          { libelle: "Ce que la soirée doit couvrir", attendu: r.aCouvrir, calcul: `${eur(r.margeDuMardi)} + ${eur(SOIREE_DU_CHEF.animation)} = ${eur(r.aCouvrir)}` },
          { libelle: "Couverts qui paient la soirée", attendu: r.seuil, calcul: `${eur(r.aCouvrir)} ÷ ${eur(margeDUnCouvertDeLaSoiree())}, arrondi au couvert supérieur = ${qte(r.seuil)}` },
        ];
      },
      explication: () => {
        const r = uneSoireeLeMardi();
        return [`Le mardi est plus calme que le jeudi : la soirée y remplace moins de marge, et elle paie dès ${qte(r.seuil)} couverts, contre ${qte(r.seuilDuJeudi)} le jeudi.`];
      },
    },
    {
      id: "avec-les-reservations",
      type: "montants",
      titre: "Avec les réservations",
      notions: ["contribution_margin"],
      question: () => `Calculez ce que la soirée rapporterait de plus qu'un mardi ordinaire, avec les ${qte(uneSoireeLeMardi().reservations)} couverts déjà réservés.`,
      champs: () => {
        const r = uneSoireeLeMardi();
        return [{ libelle: "Ce que la soirée rapporte de plus", attendu: r.gain, calcul: `${qte(r.reservations)} × ${eur(margeDUnCouvertDeLaSoiree())} − ${eur(r.aCouvrir)} = ${eur(r.gain)}` }];
      },
      explication: () => {
        const r = uneSoireeLeMardi();
        return [`Avec ${qte(r.reservations)} couverts, la soirée rapporte ${eur(r.gain)} de plus qu'un mardi ordinaire, et les clients vivent un moment qu'ils raconteront.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: () => {
        const r = uneSoireeLeMardi();
        return [
          { texte: `Ouvrons-la : elle rapporte ${eur(r.gain)} de plus`, juste: r.gain >= 0, retour: r.gain >= 0 ? `Oui : il faut ${qte(r.seuil)} couverts le mardi, et ${qte(r.reservations)} sont déjà réservés. La soirée rapporte ${eur(r.gain)} de plus qu'un mardi ordinaire, animation payée.` : `Non : avec ${qte(r.reservations)} couverts, elle rapporterait moins qu'un mardi ordinaire.` },
          { texte: `Non : il faudrait ${qte(r.seuilDuJeudi)} couverts, comme le jeudi`, juste: false, retour: `Non : ce seuil est celui du jeudi, où la soirée remplace ${qte(SOIREE_DU_CHEF.dinersDUnJeudiOrdinaire)} dîners. Le mardi, elle n'en remplace que ${qte(r.diners)} : ${qte(r.seuil)} couverts suffisent.` },
          { texte: "Oui, quel que soit le nombre de réservations", juste: false, retour: `Non : en dessous de ${qte(r.seuil)} couverts, la soirée rapporterait moins qu'un mardi ordinaire. Le nombre de réservations décide.` },
        ];
      },
    },
  ],
};
