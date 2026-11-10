import { eur, qte } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DES_MODES_DE_VIE, parcEnLocation } from "../../monde/modes-de-vie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES MODES DE VIE CHANGENT » : UN PARC DE STUDIO EN LOCATION (Bac STMG,
 * enseignement commun de terminale, palier 1).
 *
 * Le chapitre comparait la vente et la location d'une Studio ; le cas juge un parc entier, sur la durée
 * d'une Studio louée. Hypothèses : monde/modes-de-vie.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les locations d'une Studio sont une quantité ; les montants
 * au centime.
 */


export const UN_PARC_DE_STUDIO_EN_LOCATION: Situation = {
  code: "un-parc-de-studio-en-location",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["les-modes-de-vie-changent"],
  commanditaire: "Le président",
  titre: "Un parc de Studio en location ?",
  accroche: "Une plateforme propose à NOVA de mettre des Studio en location plutôt que de les vendre. Sur la durée d'une Studio, que rapporterait le parc ?",
  objectifs: ["Chiffrer une offre d'économie de la fonctionnalité", "La comparer à la vente", "Répondre au président, en pesant le temps"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_MODES_DE_VIE, pourquoi: "le cas reprend la Studio de NOVA et la location du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const p = parcEnLocation();
        return [
          `« La plateforme nous propose de mettre ${qte(p.studios)} Studio en location. Elle en attend ${qte(p.locationsParAn)} locations par an chacune, pendant les ${qte(p.ans)} ans que dure une Studio louée. Les conditions de location sont celles que vous connaissez. Est-ce mieux que de les vendre ? » Le président`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      repere: () => "À rendre : les locations d'une Studio, ce qu'elle laisse, ce que laisse le parc, la vente, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Le parc, sur la durée",
      question: () => "Calculez les locations d'une Studio sur sa durée, ce qu'elle laisse une fois sa fabrication payée, ce que laisse le parc entier, puis ce que rapporterait la vente des mêmes Studio.",
      champs: () => {
        const p = parcEnLocation();
        return [
          { libelle: "Locations d'une Studio", nature: "quantite", attendu: p.locations, calcul: `${qte(p.locationsParAn)} × ${qte(p.ans)} = ${qte(p.locations)}` },
          { libelle: "Ce que laisse une Studio louée", attendu: p.parStudio, calcul: `ce que laissent ${qte(p.locations)} locations, moins la fabrication = ${eur(p.parStudio)}` },
          { libelle: "Ce que laisse le parc", attendu: p.location, calcul: `${qte(p.studios)} × ${eur(p.parStudio)} = ${eur(p.location)}` },
          { libelle: "Ce que rapporterait la vente", attendu: p.vente, calcul: `${qte(p.studios)} × la marge d'une vente = ${eur(p.vente)}` },
        ];
      },
      explication: () => {
        const p = parcEnLocation();
        return [`Le parc laisserait ${eur(p.location)} en ${qte(p.ans)} ans, contre ${eur(p.vente)} tout de suite par la vente.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const p = parcEnLocation();
        return [
          {
            texte: `Louer : ${eur(p.location)} sur ${qte(p.ans)} ans, si la demande se confirme`,
            juste: true,
            retour: `Oui : la location laisse ${eur(p.location - p.vente)} de plus que la vente, mais en ${qte(p.ans)} ans, et seulement si les locations attendues arrivent. Commencer par un petit parc permet de le vérifier.`,
          },
          {
            texte: "Vendre : l'argent de la vente rentre tout de suite, c'est donc toujours mieux",
            juste: false,
            retour: "Non : le temps compte, mais l'écart est grand. La vente rapporte plus vite, pas plus.",
          },
          {
            texte: "Louer toute la production, puisque la location rapporte plus",
            juste: false,
            retour: "Non : la demande de location est limitée. Au-delà, les Studio resteraient sur l'étagère.",
          },
        ];
      },
    },
  ],
};
