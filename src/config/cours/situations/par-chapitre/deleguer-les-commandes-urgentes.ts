import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_ORGANISATION_DU_TRAVAIL, delegation } from "../../monde/organisation-du-travail-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ORGANISER LE TRAVAIL ET COORDONNER » : DÉLÉGUER LES COMMANDES URGENTES ?
 * (Bac STMG, enseignement commun de terminale, palier 1).
 *
 * Le chapitre rangeait la centralisation et la délégation ; le cas chiffre une délégation au chef
 * d'équipe, avec son compte rendu. Hypothèses : monde/organisation-du-travail-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const DELEGUER_LES_COMMANDES_URGENTES: Situation = {
  code: "deleguer-les-commandes-urgentes",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["organiser-le-travail-et-coordonner"],
  commanditaire: "Le chef d'équipe",
  titre: "Déléguer les commandes urgentes ?",
  accroche: "Quand le président est absent, les commandes urgentes attendent, et des clients partent. Faut-il confier la décision au chef d'équipe ?",
  objectifs: ["Chiffrer ce que coûte une décision trop centralisée", "Comparer ce coût à celui d'une délégation", "Répondre au chef d'équipe, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_ORGANISATION_DU_TRAVAIL, pourquoi: "le cas reprend l'équipe de NOVA et ses commandes." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du chef d'équipe",
      texte: () => {
        const d = delegation();
        return [
          `« Nous recevons ${qte(d.parAn)} commandes urgentes par an. Seul le président peut les accepter ; il est absent une fois sur ${qte(d.absenceDuPresident)}, et la réponse attend alors 2 jours : le client part une fois sur ${qte(d.departDuClient)}. Une commande urgente, c'est ${qte(d.enceintes)} enceintes en moyenne. Si je les acceptais moi-même, avec un compte rendu chaque semaine, on me verserait une prime de ${eur(d.prime)} par mois. Qu'en pensez-vous ? » Le chef d'équipe`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : les commandes perdues, la marge perdue, le coût de la prime, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte la centralisation",
      question: () => {
        const d = delegation();
        return `Calculez les commandes perdues dans l'année, la marge qu'elles emportent (${eur(d.margeParCommande / d.enceintes)} par enceinte, ${eur(d.margeParCommande)} par commande), la prime de l'année, puis le gain d'une délégation.`;
      },
      champs: () => {
        const d = delegation();
        return [
          { libelle: "Commandes perdues dans l'année", attendu: d.perdues, calcul: `${qte(d.parAn)} ÷ ${qte(d.absenceDuPresident)} ÷ ${qte(d.departDuClient)} = ${qte(d.perdues)}`, tolerance: 0 },
          { libelle: "Marge perdue", attendu: d.margePerdue, calcul: `${qte(d.perdues)} × ${eur(d.margeParCommande)} = ${eur(d.margePerdue)}` },
          { libelle: "Prime de l'année", attendu: d.primeDeLAnnee, calcul: `${eur(d.prime)} × 12 = ${eur(d.primeDeLAnnee)}` },
          { libelle: "Gain de la délégation", attendu: d.gain, calcul: `${eur(d.margePerdue)} − ${eur(d.primeDeLAnnee)} = ${eur(d.gain)}` },
        ];
      },
      explication: () => {
        const d = delegation();
        return [`Les commandes perdues emportent ${eur(d.margePerdue)} de marge ; la prime en coûte ${eur(d.primeDeLAnnee)} : déléguer laisse ${eur(d.gain)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au chef d'équipe",
      question: () => "Que répondez-vous au chef d'équipe ?",
      options: () => {
        const d = delegation();
        return [
          {
            texte: `Déléguer, avec le compte rendu : ${eur(d.gain)} de mieux`,
            juste: true,
            retour: "Oui : la délégation rend NOVA plus réactive et responsabilise le chef d'équipe. Le compte rendu de chaque semaine garde au président le contrôle des engagements pris.",
          },
          {
            texte: "Déléguer sans compte rendu : la confiance suffit, et cela fait gagner du temps",
            juste: false,
            retour: "Non : une délégation s'accompagne d'un contrôle. Sans compte rendu, le président ne saurait plus ce que l'entreprise a promis.",
          },
          {
            texte: "Garder la décision au président : une commande urgente se perd de toute façon",
            juste: false,
            retour: `Non : c'est l'attente qui fait partir le client. Répondre tout de suite en sauve ${qte(d.perdues)} par an.`,
          },
        ];
      },
    },
  ],
};
