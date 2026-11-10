import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ACTIONS_QVT, COUT_D_UN_JOUR_D_ABSENCE, ENTREPRISES_DE_LA_COHESION, STATUTS, actionsQuiRapportentLePlus, qualiteDeVie } from "../monde/cohesion-de-nova";
import { ABSENCES_DE_L_ANNEE } from "../monde/organisation-du-travail-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : FÉDÉRER LES ACTEURS, CULTURE, STYLE DE DIRECTION ET DYNAMIQUE DE GROUPE (Bac STMG,
 * management, sciences de gestion et numérique de terminale, enseignement commun, thème 2, question
 * 2.1 : « Comment fédérer les acteurs de l'organisation ? »).
 *
 * Les intérêts convergents et divergents des salariés et des associés, les statuts (salariés,
 * fonctionnaires, bénévoles) et les formes de relation de travail, la culture de l'organisation et ses
 * manifestations, les quatre styles de direction et leur contexte, la dynamique de groupe (leadership,
 * cohésion, décision collective), la coopération et ses outils, les facteurs de motivation internes et
 * externes, et la qualité de vie au travail, chiffrée au laboratoire : quelles actions retenir.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/cohesion-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const FEDERER_LES_ACTEURS: Chapitre = {
  code: "federer-les-acteurs",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Les organisations et les acteurs"],
  titre: "Fédérer les acteurs : culture, style de direction et dynamique de groupe",
  accroche:
    "Des associés qui veulent des dividendes, des opérateurs qui veulent de meilleures conditions de travail, une équipe qui doit tenir ensemble : comment le management rassemble des acteurs aux intérêts différents.",
  objectifs: [
    "Repérer les intérêts convergents et divergents des acteurs",
    "Reconnaître la culture d'une organisation",
    "Reconnaître un style de direction et l'adapter au contexte",
    "Distinguer les facteurs de motivation et les conditions de la coopération",
    "Chiffrer des actions de qualité de vie au travail",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_COHESION,
    pourquoi: "ce chapitre suit l'équipe de NOVA, ses associés et son président.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des acteurs aux intérêts différents",
      texte: (c) => [
        `Chez ${c.entreprise}, les associés ont apporté le capital et attendent une part du bénéfice ; les opérateurs ont besoin de leur salaire et de bonnes conditions de travail ; le président doit faire avancer l'entreprise avec les uns et les autres.`,
        "Leurs intérêts sont tantôt convergents (que l'entreprise dure et vende), tantôt divergents (le partage de ce qu'elle gagne), et cela crée des conflits. Fédérer les acteurs, c'est une fonction majeure du management.",
      ],
      repere: () => "Intérêts convergents : ce que tous veulent. Intérêts divergents : ce que l'un gagne quand l'autre perd.",
    },
    {
      id: "converger-ou-diverger",
      objectifs: [0],
      type: "tri",
      titre: "Convergents ou divergents",
      question: () => "Entre les opérateurs et les associés de NOVA, rangez chaque sujet.",
      categories: [
        { code: "convergent", libelle: "Intérêt convergent" },
        { code: "divergent", libelle: "Intérêt divergent" },
      ],
      elements: () => [
        { libelle: "Que NOVA garde ses clients et dure", montant: 0, categorie: "convergent", pourquoi: "Les emplois et le capital en dépendent : tous le veulent." },
        { libelle: "Que la ligne ne tombe pas en panne", montant: 0, categorie: "convergent", pourquoi: "Moins de stress pour l'équipe, plus de marge pour les associés." },
        { libelle: "Le partage du bénéfice entre hausse des salaires et dividendes", montant: 0, categorie: "divergent", pourquoi: "Ce qui va aux uns ne va pas aux autres." },
        { libelle: "Le travail du samedi pour tenir les commandes de Noël", montant: 0, categorie: "divergent", pourquoi: "Plus de ventes pour les associés, moins de repos pour l'équipe." },
      ],
      relance: "Le sujet profite-t-il à tous, ou ce que l'un gagne, l'autre le perd-il ?",
      explication: () => ["Le management s'appuie sur les intérêts convergents pour régler les divergents par la discussion, avant qu'ils ne deviennent un conflit ouvert."],
    },
    {
      id: "les-statuts",
      objectifs: [0],
      type: "choix",
      titre: "Salariés, fonctionnaires, bénévoles",
      question: () => `Le ${STATUTS.club} repose sur des bénévoles ; la ${STATUTS.communaute} emploie ${qte(STATUTS.agents)} agents, fonctionnaires pour la plupart. Que doit en retenir leur management ?`,
      options: () => [
        {
          texte: "Chaque statut se mobilise autrement, selon ce qui le lie",
          juste: true,
          retour: "Oui : un bénévole n'est pas payé, il vient pour le projet et l'ambiance ; un fonctionnaire a un statut et des règles de carrière ; un salarié, un contrat. Le management en tient compte, comme des prestataires et des intérimaires.",
        },
        {
          texte: "Rien : tous les statuts se mobilisent par une prime",
          juste: false,
          retour: "Non : on ne verse pas de prime à un bénévole, et la rémunération d'un fonctionnaire suit une grille. La prime n'est qu'un levier parmi d'autres.",
        },
        {
          texte: "Seuls les salariés d'une entreprise ont besoin d'être fédérés",
          juste: false,
          retour: "Non : toute organisation doit fédérer ses membres, et une association plus encore, puisque ses bénévoles peuvent partir du jour au lendemain.",
        },
      ],
    },
    {
      id: "la-culture",
      type: "lecture",
      titre: "La culture de l'organisation",
      texte: (c) => [
        `La culture d'une organisation, ce sont les valeurs que ses membres partagent et la façon dont elles se manifestent. Chez ${c.entreprise}, on dit volontiers « une enceinte qui part doit être celle qu'on voudrait chez soi ».`,
        "Elle assure la cohésion de ses membres autour de ces valeurs et favorise leur implication. Elle se lit dans ses valeurs, ses rites (les habitudes répétées), ses symboles et ses mythes (les histoires qu'on raconte).",
      ],
      repere: () => "Culture d'organisation : valeurs partagées, rites, symboles et histoires, qui font la cohésion.",
    },
    {
      id: "lire-la-culture",
      objectifs: [1],
      type: "tri",
      titre: "Lire la culture de NOVA",
      question: () => "Rangez chaque élément de la culture de NOVA.",
      categories: [
        { code: "valeur", libelle: "Une valeur" },
        { code: "rite", libelle: "Un rite" },
        { code: "symbole", libelle: "Un symbole" },
        { code: "mythe", libelle: "Une histoire fondatrice" },
      ],
      elements: () => [
        { libelle: "La qualité du son passe avant la vitesse de montage", montant: 0, categorie: "valeur", pourquoi: "Un principe auquel l'équipe tient : une valeur." },
        { libelle: "Le café du lundi matin où chacun dit sa semaine", montant: 0, categorie: "rite", pourquoi: "Une habitude répétée qui rassemble : un rite." },
        { libelle: "La première enceinte montée, exposée à l'entrée de l'atelier", montant: 0, categorie: "symbole", pourquoi: "Un objet qui représente l'entreprise : un symbole." },
        { libelle: "Le président qui a réparé la ligne une nuit entière pour livrer la première commande", montant: 0, categorie: "mythe", pourquoi: "Une histoire qu'on se raconte et qui dit ce qu'est NOVA." },
      ],
      relance: "Est-ce un principe, une habitude répétée, un objet qui représente, ou une histoire qu'on raconte ?",
      explication: () => ["Une culture forte fédère, mais elle peut aussi freiner le changement : ce qui a réussi hier devient « la façon de faire »."],
    },
    {
      id: "les-styles",
      objectifs: [2],
      type: "tri",
      titre: "Quatre styles de direction",
      question: () => "Rangez chaque façon de diriger selon son style.",
      categories: [
        { code: "paternaliste", libelle: "Paternaliste" },
        { code: "autoritaire", libelle: "Autoritaire" },
        { code: "consultatif", libelle: "Consultatif" },
        { code: "participatif", libelle: "Participatif" },
      ],
      elements: () => [
        { libelle: "Le dirigeant décide seul, mais veille à chacun comme un chef de famille", montant: 0, categorie: "paternaliste", pourquoi: "Bienveillant, mais sans partage de la décision : le style paternaliste." },
        { libelle: "Le dirigeant décide seul et attend qu'on exécute, sans discussion", montant: 0, categorie: "autoritaire", pourquoi: "La décision et le contrôle au sommet : le style autoritaire." },
        { libelle: "Le dirigeant demande l'avis de l'équipe, puis décide seul", montant: 0, categorie: "consultatif", pourquoi: "L'avis est demandé, la décision reste au dirigeant : le style consultatif." },
        { libelle: "Le dirigeant décide avec l'équipe, qui fixe avec lui l'objectif", montant: 0, categorie: "participatif", pourquoi: "La décision se prend ensemble : le style participatif." },
      ],
      relance: "Qui prend la décision, et l'avis de l'équipe compte-t-il ?",
      explication: () => ["Le style résulte de la personnalité du dirigeant, de l'organisation, de sa culture et de son environnement. Il n'existe pas de style idéal."],
    },
    {
      id: "le-bon-style",
      objectifs: [2],
      type: "choix",
      titre: "Un style adapté au contexte",
      question: () => "Une fumée sort d'un poste de la ligne. Puis, la semaine suivante, NOVA réorganise les postes pour la gamme. Quels styles conviennent ?",
      options: () => [
        {
          texte: "Autoritaire pour la fumée, participatif pour la réorganisation",
          juste: true,
          retour: "Oui : face à un danger, il faut un ordre clair et immédiat. Pour réorganiser les postes, ceux qui les tiennent savent ce qui marche : les associer rend la décision meilleure et mieux acceptée.",
        },
        {
          texte: "Participatif dans les deux cas : on demande toujours son avis à l'équipe",
          juste: false,
          retour: "Non : en cas de danger, une discussion ferait perdre un temps précieux. Le style s'adapte au contexte.",
        },
        {
          texte: "Autoritaire dans les deux cas : le président sait mieux que l'équipe",
          juste: false,
          retour: "Non : pour réorganiser les postes, l'expérience des opérateurs compte. Décider seul priverait NOVA de leurs idées et de leur adhésion.",
        },
      ],
    },
    {
      id: "le-groupe",
      type: "lecture",
      titre: "Le groupe, la coopération et la motivation",
      texte: () => [
        "Un groupe n'est pas efficace parce qu'il est un groupe : sa qualité tient à sa dynamique, à son leader (qui n'est pas toujours le chef), à sa cohésion, à la façon dont il décide. La coopération ne se décrète pas ; groupes de projet, réunions, techniques de créativité, outils collaboratifs (plateformes, agendas partagés, messagerie interne, réseau social d'entreprise) l'accompagnent.",
        "Mobiliser ne suffit pas : il faut que chacun soit motivé. La motivation dépend de facteurs internes à la personne (l'intérêt du travail, la fierté, l'envie d'apprendre) et de facteurs externes (le salaire, les conditions de travail, la reconnaissance, la communication interne).",
      ],
      repere: () => "Facteurs internes : ce qui motive de l'intérieur. Facteurs externes : ce que l'organisation apporte ou impose.",
    },
    {
      id: "interne-ou-externe",
      objectifs: [3],
      type: "tri",
      titre: "Ce qui motive",
      question: () => "Rangez chaque raison qu'un opérateur de NOVA donne pour son implication.",
      categories: [
        { code: "interne", libelle: "Facteur interne" },
        { code: "externe", libelle: "Facteur externe" },
      ],
      elements: () => [
        { libelle: "« J'aime trouver la cause d'un grésillement »", montant: 0, categorie: "interne", pourquoi: "L'intérêt pour la tâche : un facteur interne." },
        { libelle: "« Je suis fier quand un client écrit un bel avis »", montant: 0, categorie: "interne", pourquoi: "La fierté du travail bien fait vient de la personne." },
        { libelle: "« La prime du trimestre récompense nos efforts »", montant: 0, categorie: "externe", pourquoi: "Une rémunération apportée par l'organisation : un facteur externe." },
        { libelle: "« Depuis les nouveaux sièges, je finis la journée sans mal de dos »", montant: 0, categorie: "externe", pourquoi: "Les conditions de travail : un facteur externe." },
      ],
      relance: "La raison vient-elle de la personne elle-même, ou de ce que l'organisation lui apporte ?",
      explication: () => ["Les deux se combinent : de bonnes conditions de travail ne remplacent pas l'intérêt du travail, mais leur absence peut l'éteindre."],
    },
    {
      id: "decider-en-groupe",
      objectifs: [3],
      type: "choix",
      titre: "Décider en groupe",
      question: () => "Pour choisir les actions de qualité de vie au travail, le président réunit toute l'équipe. Le plus ancien opérateur parle le premier, et tout le monde se range à son avis. Qu'en penser ?",
      options: () => [
        {
          texte: "Le groupe subit une influence : il faut faire parler chacun",
          juste: true,
          retour: "Oui : un leader peut entraîner le groupe sans que les autres idées soient entendues. Un tour de table, un vote, ou des idées écrites d'abord, permettent une vraie décision de groupe.",
        },
        {
          texte: "Parfait : un accord aussi rapide prouve que le groupe est cohésif",
          juste: false,
          retour: "Non : un accord trop rapide peut cacher des avis qui n'ont pas osé s'exprimer. La cohésion se construit.",
        },
        {
          texte: "Le président doit décider seul, pour éviter l'influence",
          juste: false,
          retour: "Non : on perdrait l'avis de l'équipe et son adhésion. Il faut organiser la décision collective, pas la supprimer.",
        },
      ],
    },
    {
      id: "le-laboratoire-de-la-qualite-de-vie",
      objectifs: [4],
      type: "simulation",
      titre: "La qualité de vie au travail, chiffrée",
      question: () => {
        const liste = ACTIONS_QVT.map((a) => `${a.nom} (${eur(a.cout)}, ${qte(a.joursEvites)} jours)`).join(" ; ");
        return `L'équipe a compté ${qte(ABSENCES_DE_L_ANNEE)} jours d'absence dans l'année, et un jour d'absence coûte ${eur(COUT_D_UN_JOUR_D_ABSENCE)}. Elle propose, dans cet ordre : ${liste}. Faites varier le nombre d'actions retenues, en suivant la liste.`;
      },
      leviers: () => [{ code: "actions", libelle: "Actions retenues", unite: "actions", min: 0, max: ACTIONS_QVT.length, pas: 1, depart: 0 }],
      lecture: (_c, p) => {
        const q = qualiteDeVie(p.actions!);
        return [
          { libelle: "Jours d'absence évités", montant: q.joursEvites, unite: "jours" },
          { libelle: "Ce que valent les jours évités", montant: q.economie },
          { libelle: "Coût des actions", montant: q.cout },
          { libelle: "Ce que les actions laissent", montant: q.gain, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = actionsQuiRapportentLePlus();
        return {
          consigne: "Trouvez le nombre d'actions qui laisse le plus à NOVA.",
          atteint: (p) => p.actions === juste,
          indice: (p) => `À ${qte(p.actions!)} actions, NOVA garde ${eur(qualiteDeVie(p.actions!).gain)}. Une action de plus, ou de moins, ferait-elle mieux ?`,
          solution: { actions: juste },
        };
      },
      explication: (_c, p) => {
        const q = qualiteDeVie(p.actions!);
        return [
          `Défi relevé : les ${qte(q.n)} premières actions évitent ${qte(q.joursEvites)} jours d'absence et laissent ${eur(q.gain)}. La dernière coûterait plus que les absences qu'elle évite.`,
          "La qualité de vie au travail est une source de performance : elle se chiffre en partie. Mais l'action qui ne se paie pas par les absences peut encore se justifier par la santé et la fidélité de l'équipe.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const n = actionsQuiRapportentLePlus();
        return [
          `${c.entreprise} fédère des acteurs aux intérêts en partie divergents par sa culture, un style de direction adapté au contexte, des groupes qui décident vraiment, et la motivation de chacun. Ses ${qte(n)} premières actions de qualité de vie au travail laissent ${eur(qualiteDeVie(n).gain)} dans l'année.`,
          "Dans l'arène, les salaires et la formation se règlent à chaque tour : une équipe mal payée ou épuisée finit par partir.",
        ];
      },
      repere: () => "Intérêts · statuts · culture · style de direction · dynamique de groupe · coopération · motivation · qualité de vie au travail.",
    },
  ],
};
