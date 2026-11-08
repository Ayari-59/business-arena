import { ENTREPRISES_DU_MANAGEMENT, type NiveauDeDecision } from "../../monde/management-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « MANAGER : FONCTIONS ET DÉCISIONS » : QUI DÉCIDE DE QUOI ?
 * (Bac STMG, management de première, palier 1).
 *
 * Le président de NOVA n'a plus le temps de tout décider : il veut nommer un chef d'atelier et lui
 * confier une partie des décisions. Le cas est neuf par sa question : le chapitre rangeait des
 * décisions ; ici, l'élève dit lesquelles se délèguent, sur une liste nouvelle, et ce que le président
 * garde. Les décisions sont des exemples rédigés pour le cours, sans montant.
 */

/** Les décisions de la semaine du président, chacune stratégique ou opérationnelle. */
export const DECISIONS_DE_LA_SEMAINE: readonly { libelle: string; niveau: NiveauDeDecision; pourquoi: string }[] = [
  { libelle: "Vendre la NOVA One en Belgique à partir de l'an prochain", niveau: "strategique", pourquoi: "Un nouveau marché, pour des années : le président la garde." },
  { libelle: "Racheter une boutique de hi-fi", niveau: "strategique", pourquoi: "Une croissance qui engage l'entreprise et son argent : le président la garde." },
  { libelle: "Arrêter la fabrication de la NOVA Go", niveau: "strategique", pourquoi: "Elle change la gamme et les clients servis : le président la garde." },
  { libelle: "Remplacer demain un opérateur absent sur son poste", niveau: "operationnel", pourquoi: "Une question du jour : le chef d'atelier la règle." },
  { libelle: "Ranger le stock de composants avant l'inventaire", niveau: "operationnel", pourquoi: "Un geste courant : le chef d'atelier l'organise." },
  { libelle: "Vérifier la livraison d'Électro-Composants Lyon", niveau: "operationnel", pourquoi: "Un contrôle de chaque livraison : il se délègue." },
];

export const QUI_DECIDE_DE_QUOI: Situation = {
  code: "qui-decide-de-quoi",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["manager-fonctions-et-decisions"],
  commanditaire: "Le président de NOVA",
  titre: "Qui décide de quoi ?",
  accroche: "Le président n'a plus le temps de tout décider. Il veut nommer un chef d'atelier : lesquelles de ses décisions lui confier, et lesquelles garder ?",
  objectifs: ["Distinguer les décisions stratégiques et opérationnelles", "Dire ce qui se délègue", "Répondre au président"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MANAGEMENT,
    pourquoi: "le cas reprend le président de NOVA du chapitre, sa gamme, sa ligne et son fournisseur.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du président",
      texte: () => [
        "« Je passe mes journées sur l'atelier et je n'ai plus le temps de penser à l'avenir de l'entreprise. Je veux nommer un chef d'atelier et lui confier une partie de mes décisions. Voici celles de cette semaine : dites-moi lesquelles je lui confie, et ce que je dois garder. » Le président",
        "Pas de cours cette fois : le tri est celui du chapitre.",
      ],
      repere: () => "À rendre : chaque décision rangée, stratégique ou opérationnelle, et votre réponse.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Les décisions de la semaine",
      question: () => "Rangez chaque décision de la semaine : stratégique ou opérationnelle ?",
      categories: [
        { code: "strategique", libelle: "Décision stratégique" },
        { code: "operationnel", libelle: "Décision opérationnelle" },
      ],
      elements: () => DECISIONS_DE_LA_SEMAINE.map((d) => ({ libelle: d.libelle, montant: 0, categorie: d.niveau, pourquoi: d.pourquoi })),
      relance: "La décision engage-t-elle l'avenir de l'entreprise, ou règle-t-elle une question du moment ?",
      explication: () => [
        "Les décisions stratégiques engagent le devenir de NOVA : ses marchés, sa gamme, sa croissance. Les décisions opérationnelles reviennent chaque jour ou chaque semaine.",
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => [
        {
          texte: "Confier les décisions opérationnelles au chef d'atelier, garder les stratégiques",
          juste: true,
          retour: "Oui : le chef d'atelier règle le quotidien, au plus près de la ligne ; le président garde ce qui engage l'avenir de NOVA, et contrôle le travail qu'il a délégué. Il retrouve du temps pour la stratégie.",
        },
        {
          texte: "Tout confier au chef d'atelier, la Belgique et le rachat compris, puisqu'il connaît bien la ligne",
          juste: false,
          retour: "Non : connaître la ligne ne donne pas la vue d'ensemble. Une décision qui engage l'avenir se prend au sommet, par le président et les associés.",
        },
        {
          texte: "Ne rien confier : un président qui délègue perd le contrôle de son entreprise",
          juste: false,
          retour: "Non : déléguer n'est pas abandonner. Le président fixe le cadre et contrôle ; sans délégation, il n'a plus le temps de la stratégie.",
        },
      ],
    },
  ],
};
