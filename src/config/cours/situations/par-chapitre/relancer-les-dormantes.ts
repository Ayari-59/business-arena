import { eur, nombreAuCentieme, qte, quotient2 } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DE_LA_RELATION } from "../../chapitres/fideliser-grace-au-numerique";
import { RELANCE_DES_ANCIENNES, fichierCrm, relanceDesAnciennes, retoursQuiPaient } from "../../monde/relation-numerique-de-la-boutique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FIDÉLISER GRÂCE AU NUMÉRIQUE » : RELANCER LES DORMANTES ? (Bac STMG,
 * mercatique de terminale, palier 1).
 *
 * La gérante veut écrire à toutes les cartes qui ont accepté les offres, dormantes comprises, et attend
 * que 8 anciennes clientes reviennent (RELANCE_DES_ANCIENNES.retoursAttendus). L'élève refait les
 * calculs du chapitre : le gain de la relance des anciennes, le nombre de retours qui la paie, et voit
 * que les cartes dormantes, au-delà de la durée de conservation, ne se relancent pas : elles s'effacent,
 * même si leurs titulaires avaient accepté les offres.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les retours qui paient la relance sont une quantité : le
 * quotient à deux décimales, puis l'unité supérieure, que le corrigé nomme.
 */


/** Les chiffres de la réponse, calculés une fois. */
export function relancerLesDormantes() {
  const f = fichierCrm();
  const r = relanceDesAnciennes(RELANCE_DES_ANCIENNES.retoursAttendus);
  return { attendus: RELANCE_DES_ANCIENNES.retoursAttendus, gain: r.gain, seuil: retoursQuiPaient(), destinataires: r.destinataires, dormantes: f.dormantes, ans: f.ansDeConservation };
}

export const RELANCER_LES_DORMANTES: Situation = {
  code: "relancer-les-dormantes",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["fideliser-grace-au-numerique"],
  commanditaire: "La gérante de la boutique",
  titre: "Relancer les dormantes ?",
  accroche: "La gérante veut écrire à toutes les cartes qui ont accepté les offres, même les plus anciennes. Ce que la relance rapporterait, et ce que le fichier permet.",
  objectifs: ["Chiffrer le gain d'une relance ciblée", "Respecter la durée de conservation des données", "Répondre à la gérante, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_RELATION,
    pourquoi: "le cas reprend la carte de MAILLE & CO et son fichier, du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "Le projet de la gérante",
      texte: () => {
        const r = relancerLesDormantes();
        return [
          `« Écrivons à toutes celles qui ont accepté nos offres : les anciennes clientes, et aussi les ${qte(r.dormantes.consentement)} titulaires de cartes dormantes qui avaient coché la case. J'attends au moins ${qte(r.attendus)} retours chez les anciennes. » La gérante`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Les cartes dormantes sont celles dont le dernier achat date de ${r.dormantes.dernierAchat} ; les données d'une cliente qui n'achète plus se gardent ${qte(r.ans)} ans.`,
        ];
      },
      repere: () => "À rendre : le gain de la relance des anciennes avec les retours attendus, le nombre de retours qui la paie, et votre réponse sur les dormantes.",
    },
    {
      id: "la-relance-des-anciennes",
      type: "montants",
      titre: "La relance des anciennes clientes",
      notions: ["customer_lifetime_value"],
      question: () => `Calculez le gain de la relance des anciennes clientes avec ${qte(relancerLesDormantes().attendus)} retours, puis le plus petit nombre de retours qui la paie.`,
      champs: () => {
        const r = relancerLesDormantes();
        const k = relanceDesAnciennes(r.attendus);
        return [
          { libelle: "Gain de la relance", attendu: r.gain, calcul: `${qte(r.attendus)} × ${eur(k.margeDUnRetour)} − ${eur(k.coutFixe)} = ${eur(r.gain)}` },
          {
            libelle: "Retours qui paient la relance",
            nature: "quantite",
            attendu: r.seuil,
            calcul: `${eur(k.coutFixe)} ÷ ${eur(k.margeDUnRetour)} = ${nombreAuCentieme(quotient2(k.coutFixe, k.margeDUnRetour))}, soit ${qte(r.seuil)} au retour supérieur : un de moins ne paierait pas la relance`,
          },
        ];
      },
      explication: () => {
        const r = relancerLesDormantes();
        return [`Avec ${qte(r.attendus)} retours, la relance des anciennes rapporte ${eur(r.gain)} ; elle se paie dès ${qte(r.seuil)} retours.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      question: () => "Quelle phrase envoyez-vous à la gérante ?",
      options: () => {
        const r = relancerLesDormantes();
        return [
          { texte: "Relançons les anciennes ; les dormantes s'effacent", juste: true, retour: `Oui : la relance des anciennes rapporte ${eur(r.gain)} avec ${qte(r.attendus)} retours. Les cartes dormantes dépassent la durée de conservation de ${qte(r.ans)} ans : leurs données doivent être effacées ou rendues anonymes, même si les clientes avaient accepté les offres.` },
          { texte: "Relançons tout le monde : elles avaient toutes accepté", juste: false, retour: `Non : l'accord ne prolonge pas la durée de conservation. Au-delà de ${qte(r.ans)} ans sans achat, les données des cartes dormantes ne se gardent plus.` },
          { texte: "Ne relançons personne : un SMS ne fait pas revenir", juste: false, retour: `Non : ${qte(r.seuil)} retours suffisent à payer la relance des anciennes, et la gérante en attend ${qte(r.attendus)}.` },
        ];
      },
    },
  ],
};
