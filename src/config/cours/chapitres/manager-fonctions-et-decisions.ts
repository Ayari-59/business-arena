import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  DECISIONS_DE_NOVA,
  ENTREPRISES_DU_MANAGEMENT,
  GESTES_DU_PRESIDENT,
  HAUT_VERDASSE_DU_MANAGEMENT,
  efficaciteDeLAnnee,
  traitsDuManagement,
} from "../monde/management-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : MANAGER, FONCTIONS ET DÉCISIONS (Bac STMG, management de première, question 1.3, palier 1).
 *
 * Le management est le gouvernement des organisations : conduire une production collective en tenant
 * compte de ses contraintes. Chez NOVA, le président fixe des objectifs, organise et anime, mobilise et
 * contrôle, évalue. L'élève range ses gestes dans les quatre fonctions, sépare les décisions
 * stratégiques des décisions opérationnelles, évalue l'efficacité du management sur l'année N
 * (l'objectif tenu, et à quel coût du personnel par enceinte), puis compare le management privé de
 * NOVA au management public de la Communauté de communes du Haut-Verdasse.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : monde/management-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const FONCTIONS_DU_MANAGEMENT = [
  { code: "fixer", libelle: "Fixer des objectifs" },
  { code: "organiser", libelle: "Organiser, animer" },
  { code: "mobiliser", libelle: "Mobiliser, contrôler" },
  { code: "evaluer", libelle: "Évaluer" },
] as const;

export const NIVEAUX_DE_DECISION = [
  { code: "strategique", libelle: "Décision stratégique" },
  { code: "operationnel", libelle: "Décision opérationnelle" },
] as const;

export const COTES_DU_MANAGEMENT = [
  { code: "prive", libelle: "Le management privé de NOVA" },
  { code: "public", libelle: "Le management public de la communauté" },
  { code: "les-deux", libelle: "Les deux" },
] as const;

export const MANAGER_FONCTIONS_ET_DECISIONS: Chapitre = {
  code: "manager-fonctions-et-decisions",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · À la rencontre du management des organisations"],
  titre: "Manager : fonctions et décisions",
  accroche:
    "Fixer des objectifs, organiser, mobiliser, évaluer : les gestes du président, rangés un par un. Puis les décisions qui engagent l'avenir et celles du quotidien, l'efficacité du management mesurée sur l'année, et ce qui change dans une organisation publique.",
  objectifs: [
    "Reconnaître les quatre fonctions du management",
    "Distinguer une décision stratégique d'une décision opérationnelle",
    "Évaluer l'efficacité du management avec des indicateurs",
    "Comparer le management privé et le management public",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MANAGEMENT,
    pourquoi: "ce chapitre suit le président de NOVA, dont le cours tient les objectifs, l'équipe et les ventes de l'année N.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le gouvernement de l'organisation",
      texte: (c) => [
        `Le management est le gouvernement des organisations : il conduit une production collective vers ses buts, en tenant compte de contraintes financières, humaines, juridiques et environnementales. Chez ${c.entreprise}, c'est le président qui l'exerce, avec l'aide de ceux à qui il confie une partie des décisions.`,
        "Sa démarche tient en quatre fonctions : fixer des objectifs ; organiser et animer ; mobiliser et contrôler ; évaluer. Chacune se traduit par des décisions.",
      ],
      repere: () => "Les quatre fonctions du management : fixer des objectifs, organiser et animer, mobiliser et contrôler, évaluer.",
    },
    {
      id: "fonctions",
      objectifs: [0],
      type: "tri",
      titre: "Les gestes du président",
      question: (c) => `Rangez chaque geste du président ${dE(c.entreprise)} dans la fonction du management qu'il exerce.`,
      categories: FONCTIONS_DU_MANAGEMENT,
      elements: () => GESTES_DU_PRESIDENT.map((g) => ({ libelle: g.libelle, montant: 0, categorie: g.fonction, pourquoi: g.pourquoi })),
      relance: "Le geste dit-il ce qu'il faut atteindre, comment répartir le travail, comment entraîner et surveiller en cours de route, ou ce qui a été atteint à la fin ?",
      explication: () => [
        "Les quatre fonctions s'enchaînent et recommencent : l'évaluation de l'année nourrit les objectifs de l'année suivante. Un manager qui en oublie une perd la main : sans contrôle, l'écart se voit trop tard ; sans évaluation, on refait les mêmes erreurs.",
      ],
    },
    {
      id: "strategique-ou-operationnel",
      objectifs: [1],
      type: "tri",
      titre: "Stratégique ou opérationnelle ?",
      question: (c) => `Rangez chaque décision ${dE(c.entreprise)} : stratégique ou opérationnelle ?`,
      categories: NIVEAUX_DE_DECISION,
      elements: () => DECISIONS_DE_NOVA.map((d) => ({ libelle: d.libelle, montant: 0, categorie: d.niveau, pourquoi: d.pourquoi })),
      relance: "La décision engage-t-elle l'avenir de l'entreprise pour des années, ou règle-t-elle une question du moment, qui reviendra ?",
      explication: (c) => [
        `Les décisions stratégiques ${dE(c.entreprise)} engagent son devenir : ce qu'elle vend, ses moyens de produire, ses clients. Elles se prennent au sommet, par le président et les associés. Les décisions opérationnelles font tourner l'entreprise au quotidien ; elles se délèguent.`,
      ],
    },
    {
      id: "ce-qui-les-distingue",
      objectifs: [1],
      type: "choix",
      titre: "Ce qui distingue les deux",
      question: () => "Qu'est-ce qui fait d'une décision une décision stratégique ?",
      options: () => [
        {
          texte: "Ses effets sur le devenir de l'organisation, et le niveau où elle se prend",
          juste: true,
          retour: "Oui : une décision stratégique engage l'organisation pour longtemps, elle est difficile à défaire, et elle se prend au plus haut niveau de la hiérarchie.",
        },
        {
          texte: "Son montant : au-delà d'une certaine somme, toute décision devient stratégique",
          juste: false,
          retour: "Non : une grosse commande de composants reste opérationnelle si elle se répète chaque mois. Ce qui compte, c'est l'effet sur l'avenir de l'organisation.",
        },
        {
          texte: "Le temps qu'on met à la prendre : une décision réfléchie longtemps est stratégique",
          juste: false,
          retour: "Non : on peut réfléchir longtemps à un planning. Ce qui fait la décision stratégique, c'est son effet sur le devenir de l'organisation et le niveau où elle se prend.",
        },
      ],
    },
    {
      id: "evaluer-l-efficacite",
      objectifs: [2],
      type: "montants",
      titre: "Évaluer l'efficacité du management",
      notions: ["dashboard", "productivity"],
      tableau: (c) => {
        const e = efficaciteDeLAnnee();
        return {
          titre: `L'année N ${dE(c.entreprise)}`,
          colonnes: ["Année N"],
          lignes: [
            { libelle: "Objectif de ventes de l'année", valeurs: [`${qte(e.objectifDeLAnnee)} enceintes`] },
            { libelle: "Enceintes vendues", valeurs: [qte(e.ventes)] },
            { libelle: "Coût du personnel de montage de l'année", valeurs: [eur(e.coutDuPersonnel)] },
          ],
        };
      },
      question: () =>
        "Le président évalue son année sur deux indicateurs. Calculez le taux de réalisation de l'objectif (ventes sur objectif, en pourcentage au dixième), puis le coût du personnel de montage par enceinte vendue (au centime).",
      champs: () => {
        const e = efficaciteDeLAnnee();
        return [
          { libelle: "Taux de réalisation de l'objectif (%)", attendu: e.realisation, calcul: `${qte(e.ventes)} ÷ ${qte(e.objectifDeLAnnee)} × 100 = ${pct(e.realisation)}`, tolerance: 0.1 },
          { libelle: "Coût du personnel par enceinte", attendu: e.coutParEnceinte, calcul: `${eur(e.coutDuPersonnel)} ÷ ${qte(e.ventes)} = ${eur(e.coutParEnceinte)}`, tolerance: 0.01 },
        ];
      },
      explication: () => {
        const e = efficaciteDeLAnnee();
        return [
          `L'objectif est réalisé à ${pct(e.realisation)} : le management a été efficace, il a atteint ce qu'il visait. Le coût du personnel par enceinte, ${eur(e.coutParEnceinte)}, dit avec quels moyens : il se compare d'une année à l'autre, ou à celui d'un concurrent. Évaluer, c'est regarder les deux.`,
        ];
      },
    },
    {
      id: "un-indicateur-ne-suffit-pas",
      objectifs: [2],
      type: "choix",
      titre: "Un indicateur ne suffit pas",
      question: () => {
        const e = efficaciteDeLAnnee();
        return `L'objectif de l'année est dépassé (${pct(e.realisation)}). Le président peut-il en conclure que son management a été bon en tout ?`;
      },
      options: () => [
        {
          texte: "Non : il doit aussi regarder les moyens, les clients et l'équipe",
          juste: true,
          retour: "Oui : un objectif dépassé peut venir d'un objectif posé trop bas, ou avoir été atteint au prix d'une équipe épuisée ou de clients mal servis. L'efficacité du management s'évalue sur plusieurs indicateurs.",
        },
        {
          texte: "Oui : dépasser l'objectif est la seule preuve qu'on attend d'un manager",
          juste: false,
          retour: "Non : l'objectif ne dit pas avec quels moyens il a été atteint, ni ce qu'en pensent les clients et les salariés.",
        },
        {
          texte: "Non : un objectif dépassé prouve au contraire que le management a échoué",
          juste: false,
          retour: "Non : dépasser son objectif n'est pas un échec. C'est un bon signe, à compléter par d'autres indicateurs.",
        },
      ],
    },
    {
      id: "prive-ou-public",
      objectifs: [3],
      type: "tri",
      titre: "Management privé, management public",
      question: (c) => `Rangez chaque trait : est-il propre au management privé ${dE(c.entreprise)}, au management public de la communauté de communes du ${HAUT_VERDASSE_DU_MANAGEMENT.court.replace(/^le /, "")}, ou commun aux deux ?`,
      categories: COTES_DU_MANAGEMENT,
      elements: () => traitsDuManagement().map((t) => ({ libelle: t.libelle, montant: 0, categorie: t.cote, pourquoi: t.pourquoi })),
      relance: "Qui dirige, pour quelle finalité, avec quel argent ? Et ce trait ne vaut-il pas pour toute organisation ?",
      explication: () => {
        const h = HAUT_VERDASSE_DU_MANAGEMENT;
        return [
          `Le management public de la communauté (${qte(h.agents.effectif)} agents, sous l'autorité de ${h.agents.direction}) poursuit l'intérêt général et rend compte aux électeurs ; le management privé de NOVA cherche un bénéfice et rend compte aux associés. Les fonctions du management, elles, sont les mêmes.`,
        ];
      },
    },
    {
      id: "decider-dans-le-public",
      objectifs: [3],
      type: "choix",
      titre: "Qui décide dans l'organisation publique ?",
      question: () => "La communauté de communes envisage d'ouvrir la piscine le dimanche matin. Qui prend cette décision, qui l'exécute ?",
      options: () => {
        const h = HAUT_VERDASSE_DU_MANAGEMENT;
        return [
          {
            texte: `Les élus décident, ${h.agents.direction} et les agents l'exécutent`,
            juste: true,
            retour: `Oui : dans une organisation publique, les élus (le conseil communautaire et son président) fixent les orientations et votent le budget ; ${h.agents.direction} et les agents les mettent en œuvre. Le management public sépare la décision politique et la gestion.`,
          },
          {
            texte: "Les maîtres-nageurs décident seuls, puisque ce sont eux qui ouvriront la piscine",
            juste: false,
            retour: "Non : les agents exécutent et conseillent, mais une décision qui engage le service public et son budget revient aux élus.",
          },
          {
            texte: "Les usagers votent à la caisse de la piscine, comme des clients qui achètent ou non",
            juste: false,
            retour: "Non : les usagers s'expriment (enquêtes, réunions publiques, élections), mais ce sont leurs élus qui décident.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const e = efficaciteDeLAnnee();
        return [
          `Le président ${dE(c.entreprise)} fixe des objectifs, organise et anime, mobilise et contrôle, évalue. Ses décisions stratégiques engagent l'avenir de l'entreprise ; ses décisions opérationnelles la font tourner. Son année N se lit sur deux indicateurs au moins : ${pct(e.realisation)} de l'objectif, ${eur(e.coutParEnceinte)} de personnel par enceinte.`,
          "Dans une organisation publique, les mêmes fonctions servent l'intérêt général, sous l'autorité d'élus. Dans l'arène, chaque tour fait passer par les quatre fonctions : l'objectif, la feuille de décision, le suivi, le bilan.",
        ];
      },
      repere: () => "Décision stratégique : elle engage l'avenir, se prend au sommet. Décision opérationnelle : elle règle le quotidien, se délègue.",
    },
  ],
};
