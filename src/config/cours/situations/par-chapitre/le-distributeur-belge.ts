import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_CHAINE, offreDuDistributeurBelge } from "../../monde/chaine-de-valeur-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « INTÉGRER, EXTERNALISER, CROÎTRE » : LE DISTRIBUTEUR BELGE
 * (Bac STMG, management de première, palier 1).
 *
 * Un distributeur belge propose d'acheter des NOVA One chaque trimestre de N + 1, moins cher que les
 * clients français. Le cas est neuf par sa question : le chapitre comparait le montage intégré et le
 * sous-traitant ; ici, l'élève juge une internationalisation par un partenaire, face à la capacité de
 * la ligne trimestre par trimestre. Hypothèse et chiffres : monde/chaine-de-valeur-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const LE_DISTRIBUTEUR_BELGE: Situation = {
  code: "le-distributeur-belge",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["integrer-externaliser-croitre"],
  commanditaire: "Le président de NOVA",
  titre: "Le distributeur belge",
  accroche: "Un distributeur propose de vendre la NOVA One en Belgique, à un prix plus bas que celui des clients français, chaque trimestre. La ligne peut-elle suivre, et que rapporterait l'accord ?",
  objectifs: ["Confronter une commande à la capacité, trimestre par trimestre", "Chiffrer ce que rapporte une internationalisation par un partenaire", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CHAINE,
    pourquoi: "le cas reprend la ligne de NOVA du chapitre, sa demande de N + 1, son coût variable et son sous-traitant.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "L'offre du distributeur",
      texte: () => {
        const k = offreDuDistributeurBelge();
        return [
          `« Un distributeur belge veut ${qte(k.parTrimestre)} NOVA One par trimestre l'an prochain, à ${eur(k.prix)} l'enceinte. C'est notre premier pas à l'étranger. Pouvons-nous les monter, et que nous rapporterait l'accord ? » Le président`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      tableau: () => {
        const k = offreDuDistributeurBelge();
        return {
          titre: "La ligne de NOVA en N + 1, trimestre par trimestre",
          colonnes: k.trimestres.map((x) => `T${x.numero}`),
          lignes: [
            { libelle: "Enceintes demandées par les clients actuels", valeurs: k.trimestres.map((x) => qte(x.demande)) },
            { libelle: "Ce que la ligne peut monter", valeurs: k.trimestres.map(() => qte(k.ligne)) },
          ],
        };
      },
      repere: () => "À rendre : les enceintes belges que la ligne peut monter sur l'année, la marge qu'elles laissent, et votre réponse.",
    },
    {
      id: "ce-que-la-ligne-peut",
      type: "montants",
      titre: "Ce que la ligne peut monter en plus",
      question: () => {
        const k = offreDuDistributeurBelge();
        return `Une enceinte coûte ${eur(k.prix - k.margeUnitaire)} de coût variable à NOVA. Sans refuser un client actuel, calculez les enceintes belges que la ligne peut monter sur l'année (ce qu'elle a de libre chaque trimestre, dans la limite de la commande), la marge d'une enceinte belge, puis la marge de l'année.`;
      },
      champs: () => {
        const k = offreDuDistributeurBelge();
        return [
          { libelle: "Enceintes belges montées sur l'année", attendu: k.servies, calcul: `${k.trimestres.map((x) => qte(x.servies)).join(" + ")} = ${qte(k.servies)}`, tolerance: 0 },
          { libelle: "Marge d'une enceinte belge", attendu: k.margeUnitaire, calcul: `${eur(k.prix)} − ${eur(k.prix - k.margeUnitaire)} = ${eur(k.margeUnitaire)}`, tolerance: 0.01 },
          { libelle: "Marge de l'année", attendu: k.marge, calcul: `${qte(k.servies)} × ${eur(k.margeUnitaire)} = ${eur(k.marge)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = offreDuDistributeurBelge();
        return [
          `La ligne ne peut monter que ${qte(k.servies)} des ${qte(k.demandees)} enceintes demandées : au printemps et à Noël, elle est déjà pleine. Le reste, fait monter au sous-traitant, laisserait ${eur(k.margeSousTraitee)} par enceinte.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = offreDuDistributeurBelge();
        return [
          {
            texte: `Accepter ${qte(k.servies)} enceintes, aux trimestres où la ligne a du jeu`,
            juste: k.servies > 0,
            retour:
              k.servies > 0
                ? `Oui : ${eur(k.marge)} de marge sur l'année, sans refuser un client français, et un premier pas à l'étranger avec un partenaire qui connaît son marché. Pour le reste, le sous-traitant laisserait ${eur(k.margeSousTraitee)} par enceinte : rien à gagner.`
                : "Non : la ligne n'a aucun jeu.",
          },
          {
            texte: `Accepter les ${qte(k.demandees)} enceintes et faire monter le reste au sous-traitant pour gagner davantage`,
            juste: false,
            retour: `Non : une enceinte belge faite monter au sous-traitant laisse ${eur(k.margeSousTraitee)}. Le reste de la commande ne rapporte rien, et prend du temps à suivre.`,
          },
          {
            texte: "Refuser : vendre à l'étranger moins cher qu'en France fait toujours perdre de l'argent",
            juste: false,
            retour: `Non : chaque enceinte belge montée sur la ligne laisse ${eur(k.margeUnitaire)} de marge, puisque les charges fixes sont déjà payées par les ventes françaises.`,
          },
        ];
      },
    },
  ],
};
