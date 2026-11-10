import { eur, pct } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DE_LA_STRATEGIE_DU_CLUB, LE_CLUB, parrainageDuGarage } from "../../monde/strategie-du-club";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA STRATÉGIE D'UNE ASSOCIATION » : LE PARRAIN QUI VEUT CHOISIR L'ENTRAÎNEUR
 * (Bac STMG, management de première, palier 1).
 *
 * Un garage du territoire propose de parrainer le club, à condition de choisir l'entraîneur de l'équipe
 * senior. Le cas est neuf par sa question : le chapitre chiffrait une subvention qui baisse ; ici,
 * l'élève chiffre une ressource privée nouvelle et la juge face à l'indépendance de l'association et à
 * ses organes de décision. Hypothèse : monde/strategie-du-club.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les parts des sponsors se donnaient au dixième, elles sont à
 * deux décimales ; l'excédent attend le centime.
 */


export const LE_PARRAIN_QUI_VEUT_CHOISIR_L_ENTRAINEUR: Situation = {
  code: "le-parrain-qui-veut-choisir-l-entraineur",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["la-strategie-d-une-association"],
  commanditaire: "Le trésorier du club",
  titre: "Le parrain qui veut choisir l'entraîneur",
  accroche: "Un garage du territoire propose de parrainer l'équipe senior, son nom sur les maillots, à condition de choisir l'entraîneur. Que vaut l'offre, et que répondre ?",
  objectifs: ["Chiffrer le poids d'une ressource nouvelle dans le budget", "Juger une ressource face à l'indépendance de l'association", "Répondre au trésorier, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_STRATEGIE_DU_CLUB,
    pourquoi: "le cas reprend l'association du chapitre, son budget et ses organes de décision.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "L'offre du garage",
      texte: () => {
        const k = parrainageDuGarage();
        return [
          `« Un garage propose ${eur(k.parrainage)} par saison, son nom sur les maillots de l'équipe senior. Mais il veut aussi choisir l'entraîneur de cette équipe. Avant le conseil d'administration, dites-moi ce que pèserait ce parrainage dans notre budget, et ce que nous devons répondre. » ${LE_CLUB.bureau[1]!.nom}, le trésorier`,
          "Pas de cours cette fois : les calculs et les règles sont ceux du chapitre.",
        ];
      },
      tableau: () => {
        const k = parrainageDuGarage();
        return {
          titre: "Les sponsors dans le budget du club",
          colonnes: ["Aujourd'hui", "Avec le garage"],
          lignes: [
            { libelle: "Partenaires et sponsors", valeurs: [eur(k.sponsorsAvant), eur(k.sponsorsApres)] },
            { libelle: "Recettes de la saison", valeurs: [eur(k.recettesApres - k.parrainage), eur(k.recettesApres)] },
          ],
        };
      },
      repere: () => "À rendre : la part des sponsors dans les recettes, avant et avec le garage, l'excédent de la saison avec lui, et votre réponse.",
    },
    {
      id: "le-poids-du-parrain",
      type: "montants",
      titre: "Ce que pèserait le parrain",
      question: () => "Calculez la part des sponsors dans les recettes aujourd'hui, puis avec le garage (en pourcentage à deux décimales), et l'excédent de la saison avec lui.",
      champs: () => {
        const k = parrainageDuGarage();
        const avant = k.recettesApres - k.parrainage;
        return [
          { libelle: "Part des sponsors aujourd'hui (%)", attendu: k.partDesSponsorsAvant, calcul: `${eur(k.sponsorsAvant)} ÷ ${eur(avant)} × 100 = ${pct(k.partDesSponsorsAvant)}` },
          { libelle: "Part des sponsors avec le garage (%)", attendu: k.partDesSponsorsApres, calcul: `${eur(k.sponsorsApres)} ÷ ${eur(k.recettesApres)} × 100 = ${pct(k.partDesSponsorsApres)}` },
          { libelle: "Excédent de la saison avec le garage", attendu: k.excedentApres, calcul: `${eur(k.recettesApres)} − ${eur(k.recettesApres - k.excedentApres)} = ${eur(k.excedentApres)}` },
        ];
      },
      explication: () => {
        const k = parrainageDuGarage();
        return [`Avec le garage, les sponsors feraient ${pct(k.partDesSponsorsApres)} des recettes, et la saison laisserait ${eur(k.excedentApres)} d'excédent : une ressource privée utile, qui réduit la dépendance à la subvention.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au trésorier",
      question: () => "Que répondez-vous au trésorier ?",
      options: () => {
        const k = parrainageDuGarage();
        return [
          {
            texte: "Accepter le parrainage et le nom sur les maillots, refuser le choix de l'entraîneur",
            juste: true,
            retour: `Oui : ${eur(k.parrainage)} de plus servent l'objet du club, et un nom sur les maillots est la contrepartie habituelle d'un parrainage. Mais choisir l'entraîneur revient au bureau et au conseil d'administration, élus par les adhérents : une association garde son indépendance.`,
          },
          {
            texte: "Tout accepter : à ce prix, le garage peut bien choisir l'entraîneur de l'équipe senior",
            juste: false,
            retour: "Non : celui qui finance ne dirige pas l'association. Les décisions reviennent aux organes élus par les adhérents.",
          },
          {
            texte: "Tout refuser : une association ne doit accepter aucun argent d'une entreprise",
            juste: false,
            retour: "Non : le club vit déjà de ses sponsors. Une ressource privée est bienvenue, tant qu'elle n'achète pas les décisions.",
          },
        ];
      },
    },
  ],
};
