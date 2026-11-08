import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_DONNEES } from "../../chapitres/donnees-personnelles-et-donnees-ouvertes";
import { FICHIER_DE_MAILLE, campagne } from "../../monde/fichier-de-maille";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DONNÉES PERSONNELLES ET DONNÉES OUVERTES » : ÉCRIRE À TOUTES LES CLIENTES ?
 * (Bac STMG, SGN de première, palier 1).
 *
 * Le gérant de MAILLE & CO veut envoyer la campagne de la nouvelle collection aux 1 200 clientes du
 * fichier, pas seulement aux 540 qui ont consenti. La vendeuse propose plutôt de demander l'accord en
 * caisse pendant un mois : elle pense atteindre 800 consentantes (hypothèse du cas). Les calculs sont
 * ceux du chapitre (ce qu'une campagne rapporte selon ses destinataires), la règle aussi.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** Les consentantes que la vendeuse pense réunir en demandant l'accord en caisse (hypothèse du cas). */
export const CONSENTANTES_APRES_LA_CAISSE = 800;

export function ecrireAToutes() {
  return { aujourdhui: campagne(FICHIER_DE_MAILLE.consentantes), apres: campagne(CONSENTANTES_APRES_LA_CAISSE), toutes: campagne(FICHIER_DE_MAILLE.inscrites) };
}

export const ECRIRE_A_TOUTES_LES_CLIENTES: Situation = {
  code: "ecrire-a-toutes-les-clientes",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["donnees-personnelles-et-donnees-ouvertes"],
  commanditaire: "Le gérant de la boutique",
  titre: "Écrire à toutes les clientes ?",
  accroche: "Pour la nouvelle collection, le gérant veut écrire à toutes les clientes du fichier. La vendeuse propose de demander d'abord leur accord en caisse. Qui a raison ?",
  objectifs: ["Chiffrer ce que rapporte une campagne selon ses destinataires", "Appliquer la règle du consentement", "Répondre au gérant, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_DONNEES,
    pourquoi: "le cas reprend le fichier de clientes de MAILLE & CO et la campagne du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du gérant",
      texte: () => [
        `« La collection de printemps arrive. Envoyons le courriel aux ${qte(FICHIER_DE_MAILLE.inscrites)} clientes du fichier : ce sera bien plus rentable qu'aux ${qte(FICHIER_DE_MAILLE.consentantes)} qui ont coché la case. » Le gérant`,
        `« Et si on demandait leur accord en caisse pendant un mois ? Je pense arriver à ${qte(CONSENTANTES_APRES_LA_CAISSE)}. » La vendeuse`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : ce que rapporte la campagne aujourd'hui et après la demande en caisse, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Ce que rapporte la campagne",
      notions: ["segmentation"],
      question: () => "Calculez ce que rapporte la campagne (marge des achats moins son coût), envoyée aux consentantes d'aujourd'hui, puis à celles qu'espère la vendeuse.",
      champs: () => {
        const k = ecrireAToutes();
        return [
          { libelle: "Gain avec les consentantes d'aujourd'hui", attendu: k.aujourdhui.gain, calcul: `${qte(k.aujourdhui.destinataires)} × ${eur(k.aujourdhui.parDestinataire)} − ${eur(k.aujourdhui.cout)} = ${eur(k.aujourdhui.gain)}`, tolerance: 1 },
          { libelle: "Gain après la demande en caisse", attendu: k.apres.gain, calcul: `${qte(k.apres.destinataires)} × ${eur(k.apres.parDestinataire)} − ${eur(k.apres.cout)} = ${eur(k.apres.gain)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = ecrireAToutes();
        return [`Demander l'accord en caisse fait passer le gain de ${eur(k.aujourdhui.gain)} à ${eur(k.apres.gain)}, sans rien enfreindre.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Que répondez-vous au gérant ?",
      options: () => {
        const k = ecrireAToutes();
        return [
          {
            texte: `La vendeuse a raison : ${eur(k.apres.gain)}, et dans la loi`,
            juste: true,
            retour: `Oui : sans consentement, une offre commerciale par courriel est interdite, même à une cliente. La demande en caisse est permise et rapporte ${eur(k.apres.gain)}, contre ${eur(k.aujourdhui.gain)} aujourd'hui.`,
          },
          {
            texte: `Le gérant a raison : écrire aux ${qte(FICHIER_DE_MAILLE.inscrites)} clientes rapporterait ${eur(k.toutes.gain)}, le plus haut gain`,
            juste: false,
            retour: "Non : le calcul est juste, mais la campagne serait illégale. Une cliente qui n'a pas consenti ne peut pas recevoir d'offre par courriel.",
          },
          {
            texte: "Aucun des deux : la campagne ne rapporte rien, il vaut mieux ne pas l'envoyer du tout",
            juste: false,
            retour: `Non : avec ${qte(FICHIER_DE_MAILLE.consentantes)} consentantes, elle rapporte déjà ${eur(k.aujourdhui.gain)}.`,
          },
        ];
      },
    },
  ],
};
