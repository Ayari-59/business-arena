import { aLUnite, arrondi2, eur, nombreAuCentieme, pct, qte } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DE_LA_SALLE } from "../../chapitres/le-plan-de-communication";
import { INFLUENCEUSE, adherentDeLaSalle, campagneSponsorisee, valeurDUnContact, videoDeLInfluenceuse } from "../../monde/volt-fitness";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « INFLUENCE, COMMUNAUTÉ ET E-RÉPUTATION » : L'INFLUENCEUSE DU HAUT-VERDASSE
 * (Bac STMG, mercatique de terminale, palier 1).
 *
 * Une sportive du territoire propose une vidéo tournée à la salle, contre 1 500 € (INFLUENCEUSE). Le
 * gérant veut savoir si elle vaut son prix. L'élève refait les calculs du chapitre sur les vues
 * attendues : les clics, les contacts, le coût par lead, comparé à ce que rapporte un contact, puis les
 * adhésions attendues et ce qu'elles laissent. Le piège : juger l'influenceuse sur ses abonnés, et non
 * sur ce que coûte un contact.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les clics, les contacts et les adhésions attendus sont des
 * quantités : le produit à deux décimales, puis l'unité la plus proche ; les adhésions se comptent
 * sur le taux de transformation de septembre à deux décimales.
 */


/** Une quantité calculée : la valeur à deux décimales quand le calcul ne tombe pas juste, puis l'arrondi à l'unité. */
const aLUniteEcrite = (x: number) => (Number.isInteger(arrondi2(x)) ? qte(aLUnite(x)) : `${nombreAuCentieme(x)}, soit ${qte(aLUnite(x))} à l'unité la plus proche`);

export const L_INFLUENCEUSE_DU_HAUT_VERDASSE: Situation = {
  code: "l-influenceuse-du-haut-verdasse",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["influence-communaute-et-e-reputation"],
  commanditaire: "Le gérant de la salle",
  titre: "L'influenceuse du Haut-Verdasse",
  accroche: "Une sportive du territoire propose une vidéo tournée à la salle. Ses abonnés sont peu nombreux, son prix n'est pas rien : que rapporterait-elle ?",
  objectifs: ["Calculer les contacts et le coût par lead d'une action d'influence", "Comparer ce coût à ce que rapporte un contact", "Répondre au gérant, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_SALLE,
    pourquoi: "le cas reprend la communauté en ligne de VOLT FITNESS, du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de l'influenceuse",
      texte: () => {
        const k = INFLUENCEUSE;
        return [
          `« Une sportive du Haut-Verdasse, ${qte(k.abonnes)} abonnés, propose une vidéo tournée chez nous pour ${eur(k.prix)}. Elle annonce ${qte(k.vues)} vues. C'est peu d'abonnés pour ce prix, non ? » Le gérant`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Ses vidéos sont cliquées par ${pct(k.tauxDeClic * 100)} de ceux qui les voient, et ${pct(k.contactsParClic * 100)} des clics laissent un contact pour une séance d'essai. Un contact rapporte ${eur(valeurDUnContact())} en moyenne à la salle.`,
        ];
      },
      repere: () => "À rendre : les clics, les contacts et le coût par lead de la vidéo, les adhésions attendues et ce qu'elles laissent, et votre réponse.",
    },
    {
      id: "les-contacts",
      type: "montants",
      titre: "Des vues aux contacts",
      notions: ["conversion_rate", "customer_acquisition_cost"],
      question: () => "Calculez les clics attendus, les contacts attendus, puis le coût par lead de la vidéo.",
      champs: () => {
        const v = videoDeLInfluenceuse();
        return [
          { libelle: "Clics attendus", nature: "quantite", attendu: v.clics, calcul: `${qte(v.vues)} × ${pct(v.tauxDeClic * 100)} = ${aLUniteEcrite(v.vues * v.tauxDeClic)}` },
          { libelle: "Contacts attendus", nature: "quantite", attendu: v.contacts, calcul: `${qte(v.clics)} × ${pct(v.contactsParClic * 100)} = ${aLUniteEcrite(v.clics * v.contactsParClic)}` },
          { libelle: "Coût par lead", attendu: v.coutParContact, calcul: `${eur(v.prix)} ÷ ${qte(v.contacts)} = ${eur(v.coutParContact)}` },
        ];
      },
      explication: () => {
        const v = videoDeLInfluenceuse();
        return [`Chaque contact coûterait ${eur(v.coutParContact)}, sous les ${eur(valeurDUnContact())} qu'il rapporte en moyenne.`];
      },
    },
    {
      id: "les-adhesions",
      type: "montants",
      titre: "Ce que laisseraient les adhésions",
      notions: ["customer_acquisition_cost"],
      question: () => `${pct(campagneSponsorisee().tauxDeTransformation)} des contacts deviennent adhérents, comme en septembre. Calculez les adhésions attendues, arrondies à l'unité, puis ce qu'elles laisseraient sur leur durée moyenne, moins le prix de la vidéo.`,
      champs: () => {
        const v = videoDeLInfluenceuse();
        const a = adherentDeLaSalle();
        return [
          { libelle: "Adhésions attendues", nature: "quantite", attendu: v.adhesions, calcul: `${qte(v.contacts)} × ${pct(campagneSponsorisee().tauxDeTransformation)}, le taux de transformation de septembre = ${aLUniteEcrite((v.contacts * campagneSponsorisee().tauxDeTransformation) / 100)}` },
          { libelle: "Ce que rapporte la vidéo", attendu: v.gain, calcul: `${qte(v.adhesions)} × ${eur(a.margeDUnNouvelAdherent)} − ${eur(v.prix)} = ${eur(v.gain)}` },
        ];
      },
      explication: () => {
        const v = videoDeLInfluenceuse();
        return [`Avec ${qte(v.adhesions)} adhésions, la vidéo rapporterait ${eur(v.gain)}, prix payé. Ses abonnés sont peu nombreux, mais ils habitent près de la salle.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: () => {
        const v = videoDeLInfluenceuse();
        return [
          { texte: `Acceptons : un contact coûterait ${eur(v.coutParContact)}`, juste: v.coutParContact <= valeurDUnContact(), retour: `Oui : ${eur(v.coutParContact)} par contact, pour ${eur(valeurDUnContact())} rapportés en moyenne. La vidéo laisserait ${eur(v.gain)}, prix payé. Le nombre d'abonnés compte moins que leur proximité.` },
          { texte: "Refusons : trop peu d'abonnés pour ce prix", juste: false, retour: `Non : on juge une action sur ce que coûte un contact, pas sur le nombre d'abonnés. Ici, ${eur(v.coutParContact)} par contact, quand un contact en rapporte ${eur(valeurDUnContact())}.` },
          { texte: "Acceptons, mais seulement si elle double ses abonnés", juste: false, retour: "Non : des abonnés de plus, loin du territoire, n'ajouteraient guère d'adhésions. La vidéo paie déjà telle quelle." },
        ];
      },
    },
  ],
};
