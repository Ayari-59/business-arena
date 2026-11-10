import { arrondi2, eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DES_DOMAINES, gammeDuMois } from "../../monde/domaines-d-activite-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DOMAINES D'ACTIVITÉ » : ABANDONNER L'ENCEINTE NOMADE ?
 * (Bac STMG, management de première, palier 1).
 *
 * Un associé de NOVA propose de sortir du domaine de Go, la petite enceinte qui rapporte le moins, pour
 * se concentrer sur One et Studio. Le cas est neuf par sa question : le chapitre mesurait la dépendance
 * à One ; ici, l'élève juge un choix de stratégie globale, sortir d'un domaine, sur sa contribution et
 * sur les heures-machine qu'il libérerait. Chiffres : le mois en gamme (monde/domaines-d-activite-de-nova.ts).
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : la contribution de Go attend le centime (à l'euro près,
 * avant) ; les heures-machine sont des grandeurs, au centième (au dixième près, avant).
 */

const qte = nombreAuCentieme;

/** Sans Go : ce que la gamme perd, et les heures-machine qui restent libres. */
export function sansLEnceinteNomade() {
  const g = gammeDuMois();
  const heuresDeGo = arrondi2(g.go.heuresMachineParUnite * g.go.quantite);
  return { g, heuresDeGo, heuresLibres: arrondi2(g.capaciteHeures - g.heures), perte: g.go.contribution };
}

export const ABANDONNER_L_ENCEINTE_NOMADE: Situation = {
  code: "abandonner-l-enceinte-nomade",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["domaines-d-activite"],
  commanditaire: "Le président de NOVA",
  titre: "Abandonner l'enceinte nomade ?",
  accroche: "Un associé veut sortir du domaine de Go, la petite enceinte qui rapporte le moins, pour se concentrer sur les deux autres. Faut-il le suivre ?",
  objectifs: ["Chiffrer ce qu'apporte un domaine d'activité", "Juger un choix de stratégie globale", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_DOMAINES,
    pourquoi: "le cas reprend la gamme de NOVA du chapitre, ses prix, ses coûts, sa publicité et ses heures-machine.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de l'associé",
      texte: () => {
        const k = sansLEnceinteNomade();
        return [
          `« Un associé veut arrêter ${k.g.go.nom} : c'est l'enceinte qui rapporte le moins, et ses heures-machine serviraient mieux à la One et à Studio. Avant l'assemblée, dites-moi ce que nous perdrions, et si ces heures nous manquent vraiment. » Le président`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      tableau: () => {
        const k = sansLEnceinteNomade();
        const g = k.g;
        return {
          titre: "Le mois en gamme",
          colonnes: [g.go.nom, g.one.nom, g.studio.nom],
          lignes: [
            { libelle: "Marge sur coût variable d'une unité", valeurs: [eur(g.go.margeUnitaire), eur(g.one.margeUnitaire), eur(g.studio.margeUnitaire)] },
            { libelle: "Unités vendues", valeurs: [qte(g.go.quantite), qte(g.one.quantite), qte(g.studio.quantite)] },
            { libelle: "Publicité du mois", valeurs: [eur(g.go.publicite), eur(g.one.publicite), eur(g.studio.publicite)] },
            { libelle: "Heures-machine d'une unité", valeurs: [qte(g.go.heuresMachineParUnite), qte(g.one.heuresMachineParUnite), qte(g.studio.heuresMachineParUnite)] },
          ],
        };
      },
      repere: () => {
        const k = sansLEnceinteNomade();
        return `À rendre : la contribution de Go, les heures-machine qu'elle prend et celles qui restent libres sur les ${qte(k.g.capaciteHeures)} heures-machine du mois, et votre réponse.`;
      },
    },
    {
      id: "ce-que-go-apporte",
      type: "montants",
      titre: "Ce que Go apporte, ce qu'elle prend",
      question: () => "Calculez la contribution de Go sur le mois (marge sur coût variable moins publicité), les heures-machine qu'elle prend, puis les heures-machine qui restent libres avec toute la gamme.",
      champs: () => {
        const k = sansLEnceinteNomade();
        const g = k.g;
        return [
          { libelle: "Contribution de Go", attendu: g.go.contribution, calcul: `${eur(g.go.margeUnitaire)} × ${qte(g.go.quantite)} − ${eur(g.go.publicite)} = ${eur(g.go.contribution)}` },
          { libelle: "Heures-machine de Go", nature: "grandeur", attendu: k.heuresDeGo, calcul: `${qte(g.go.heuresMachineParUnite)} × ${qte(g.go.quantite)} = ${qte(k.heuresDeGo)}` },
          { libelle: "Heures-machine libres", nature: "grandeur", attendu: k.heuresLibres, calcul: `${qte(g.capaciteHeures)} − ${qte(g.heures)} = ${qte(k.heuresLibres)}` },
        ];
      },
      explication: () => {
        const k = sansLEnceinteNomade();
        return [`Go rapporte ${eur(k.perte)} par mois, publicité payée, et ${qte(k.heuresLibres)} heures-machine restent libres même avec elle : ses heures ne manquent à personne.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = sansLEnceinteNomade();
        const garder = k.perte > 0 && k.heuresLibres > 0;
        return [
          {
            texte: `Garder Go : elle rapporte ${eur(k.perte)} par mois`,
            juste: garder,
            retour: garder
              ? `Oui : sa contribution est positive, et les heures qu'elle prend ne manquent pas aux autres. La sortir ferait perdre ${eur(k.perte)} par mois et un domaine, celui des clients qui comparent les prix, sans rien gagner ailleurs.`
              : "Non : Go ne rapporte rien, ou ses heures manquent aux autres.",
          },
          {
            texte: "La sortir : l'enceinte qui rapporte le moins affaiblit toujours une gamme",
            juste: !garder,
            retour: !garder ? "Oui." : "Non : rapporter le moins n'est pas perdre. Tant que sa contribution est positive et que la capacité ne manque pas, un domaine paie une part des charges communes.",
          },
          {
            texte: "La sortir et mettre ses heures sur Studio, qui rapporte le plus par heure-machine",
            juste: false,
            retour: "Non : les heures libres suffisent déjà à monter plus de Studio si des clients le demandent. Ce qui limite Studio, ce sont ses ventes, pas la ligne.",
          },
        ];
      },
    },
  ],
};
