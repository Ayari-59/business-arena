import {
  CRITERES,
  ENTREPRISES_DE_L_EVALUATION,
  NOTES_DE_HUGO_SANS_L_ENTRAIDE,
  NOTES_DE_SARAH,
  NOTE_DE_L_OBJECTIF,
  NOTE_MAXIMALE,
  entraideNecessaire,
  evaluationDeSarah,
  noteGlobale,
  pointsDeHugoSansLEntraide,
} from "../monde/evaluation-a-la-table";
import type { Cas } from "../cas";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ÉVALUER LE TRAVAIL, ENTRETIENS ET BILAN DE COMPÉTENCES (Bac STMG, enseignement spécifique de
 * ressources humaines et communication de terminale, thème 1, question 1.2 : « Peut-on tout évaluer dans
 * le travail ? »).
 *
 * Ce qui s'évalue et ce qui s'évalue mal (le travail invisible), les modes d'évaluation (par le supérieur,
 * auto-évaluation, à 360°, par le client) et leurs biais, l'encadrement légal (des méthodes pertinentes,
 * annoncées au salarié), la grille pondérée, chiffrée au curseur, l'entretien annuel d'évaluation et
 * l'entretien de parcours professionnel (le texte de 2019 dit « entretien professionnel » ; la loi du 24
 * octobre 2025 l'a renommé et l'a espacé), son état des lieux, et le bilan de compétences.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez LA TABLE D'AUGUSTIN : monde/evaluation-a-la-table.ts.
 */

const note = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR")} %`;

function grille(c: Cas): TableauDeDonnees {
  return {
    titre: `La grille d'évaluation des serveurs de ${c.entreprise}`,
    colonnes: ["Poids", "Sarah", "Hugo"],
    lignes: CRITERES.map((k, i) => ({ libelle: k.libelle, valeurs: [pct(k.poids), note(NOTES_DE_SARAH[i]!), i < NOTES_DE_HUGO_SANS_L_ENTRAIDE.length ? note(NOTES_DE_HUGO_SANS_L_ENTRAIDE[i]!) : "à fixer"] })),
  };
}

export const EVALUER_LE_TRAVAIL: Chapitre = {
  code: "evaluer-le-travail",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences"],
  titre: "Évaluer le travail : entretiens et bilan de compétences",
  accroche:
    "La responsable de salle d'un bistrot évalue ses serveurs. Une grille, des notes, des entretiens : ce qui se mesure, ce qui échappe à la mesure, et ce que la loi demande.",
  objectifs: [
    "Distinguer ce qui s'évalue facilement de ce qui s'évalue mal",
    "Reconnaître les modes d'évaluation et leurs biais",
    "Calculer une note d'évaluation pondérée",
    "Distinguer l'entretien d'évaluation de l'entretien de parcours professionnel",
    "Situer le bilan de compétences",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_EVALUATION,
    pourquoi: "ce chapitre suit l'évaluation des serveurs de LA TABLE D'AUGUSTIN.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Pourquoi évaluer",
      texte: (c) => [
        `Chaque année, la responsable de salle de ${c.entreprise} fait le point avec chaque serveur. Évaluer, c'est apprécier un travail et des compétences au regard de ce qui était attendu.`,
        "L'évaluation sert à reconnaître (une prime, une promotion), à repérer un besoin de formation, à fixer les objectifs suivants. Encore faut-il que ce qu'on évalue se voie, et que la façon de l'évaluer soit juste.",
      ],
      repere: () => "Évaluer : apprécier un travail et des compétences, au regard d'attendus annoncés.",
    },
    {
      id: "ce-qui-s-evalue",
      objectifs: [0],
      type: "tri",
      titre: "Ce qui se mesure, ce qui échappe",
      question: () => "Rangez chaque élément du travail d'un serveur.",
      categories: [
        { code: "chiffre", libelle: "Un résultat chiffré" },
        { code: "observe", libelle: "Une compétence observée" },
        { code: "echappe", libelle: "Ce qui échappe à la mesure" },
      ],
      elements: () => [
        { libelle: "Le nombre de desserts vendus pour 100 couverts", montant: 0, categorie: "chiffre", pourquoi: "Il se compte en caisse : un résultat quantitatif." },
        { libelle: "Le temps d'attente moyen entre la commande et le plat", montant: 0, categorie: "chiffre", pourquoi: "Il se mesure : un indicateur chiffré." },
        { libelle: "La façon de conseiller un vin à un client hésitant", montant: 0, categorie: "observe", pourquoi: "Elle se voit au travail, et s'apprécie sur une grille : une compétence." },
        { libelle: "Le coup de main donné en cuisine un soir de rush, quand personne ne regarde", montant: 0, categorie: "echappe", pourquoi: "Un travail invisible, qui fait pourtant tenir l'équipe : il échappe à la grille." },
      ],
      relance: "Peut-on le compter, peut-on l'observer sur le moment, ou ne le voit-on presque jamais ?",
      explication: () => ["Tout ne s'évalue pas : la part invisible du travail, l'entraide, l'effort d'un soir difficile. Une évaluation qui ne retient que ce qui se compte pousse à ne faire que ce qui se compte."],
    },
    {
      id: "les-modes",
      type: "lecture",
      titre: "Qui évalue, et selon quelles règles",
      texte: () => [
        "L'évaluation est souvent faite par le supérieur direct. Elle peut aussi partir du salarié (l'auto-évaluation), recueillir l'avis des collègues, des autres services et des clients (l'évaluation à 360°), ou lire les avis des clients.",
        "Le Code du travail l'encadre : le salarié est informé, avant leur mise en œuvre, des méthodes et techniques d'évaluation ; elles doivent être pertinentes au regard de ce qu'elles cherchent, et leurs résultats restent confidentiels.",
      ],
      repere: () => "Supérieur · auto-évaluation · 360° · client. Des méthodes annoncées, pertinentes, aux résultats confidentiels.",
    },
    {
      id: "qui-evalue",
      objectifs: [1],
      type: "tri",
      titre: "Les modes d'évaluation",
      question: () => "Rangez chaque façon d'évaluer Hugo.",
      categories: [
        { code: "superieur", libelle: "Par le supérieur" },
        { code: "auto", libelle: "Auto-évaluation" },
        { code: "360", libelle: "À 360°" },
      ],
      elements: () => [
        { libelle: "La responsable de salle remplit la grille de Hugo", montant: 0, categorie: "superieur", pourquoi: "La hiérarchie évalue : le mode le plus courant." },
        { libelle: "Hugo remplit lui-même la grille avant l'entretien", montant: 0, categorie: "auto", pourquoi: "Le salarié s'évalue : il prépare l'échange et dit ce qu'il voit de son travail." },
        { libelle: "Les cuisiniers, les autres serveurs et des clients donnent leur avis", montant: 0, categorie: "360", pourquoi: "Tout l'entourage de travail donne son avis : l'évaluation à 360°." },
      ],
      relance: "Qui tient la grille : le chef, le salarié, ou tout son entourage de travail ?",
      explication: () => ["Croiser les regards limite les biais d'un seul évaluateur, mais demande du temps et de la confiance."],
    },
    {
      id: "la-note-de-sarah",
      objectifs: [2],
      type: "montants",
      titre: "La note globale de Sarah",
      tableau: grille,
      question: () => `Calculez les points que Sarah obtient sur l'accueil et la rapidité, puis sur les ventes et l'entraide (chaque note × son poids), et sa note globale sur ${note(NOTE_MAXIMALE)}.`,
      champs: () => {
        const k = evaluationDeSarah();
        const n = NOTES_DE_SARAH;
        const c = CRITERES;
        return [
          { libelle: "Points de l'accueil et de la rapidité", attendu: k.premiers, calcul: `${note(n[0])} × ${note(c[0].poids)} + ${note(n[1])} × ${note(c[1].poids)} = ${note(k.premiers)}` },
          { libelle: "Points des ventes et de l'entraide", attendu: k.derniers, calcul: `${note(n[2])} × ${note(c[2].poids)} + ${note(n[3])} × ${note(c[3].poids)} = ${note(k.derniers)}` },
          { libelle: "Note globale", attendu: k.globale, calcul: `${note(k.premiers)} + ${note(k.derniers)} = ${note(k.globale)}` },
        ];
      },
      explication: () => [`Sarah atteint ${note(evaluationDeSarah().globale)} sur ${note(NOTE_MAXIMALE)} : l'objectif de ${note(NOTE_DE_L_OBJECTIF)} est tenu, malgré des ventes additionnelles faibles. La pondération dit ce que le bistrot juge important.`],
    },
    {
      id: "le-curseur-de-l-entraide",
      objectifs: [2],
      type: "curseur",
      titre: "La note d'entraide de Hugo",
      question: () => `Sur les trois premiers critères, Hugo a ${note(pointsDeHugoSansLEntraide())} points. L'entraide compte pour ${pct(CRITERES[3].poids)}. Faites varier sa note d'entraide : une droite donne sa note globale, l'autre l'objectif de ${note(NOTE_DE_L_OBJECTIF)}. Placez le curseur sur la plus petite note d'entraide qui le fait atteindre.`,
      cible: () => ({ attendu: entraideNecessaire(), max: NOTE_MAXIMALE }),
      grandeur: () => ({ libelle: "Note d'entraide", unite: `sur ${note(NOTE_MAXIMALE)}` }),
      rates: () => ({ dessous: "Pas encore : la note globale reste sous l'objectif.", dessus: "L'objectif est atteint, mais un point de moins suffirait-il encore ?" }),
      zones: ["Objectif atteint", "Objectif manqué"],
      montrer: "Montrer la note",
      lecture: (_c, n) => [
        { libelle: "Points de l'entraide", montant: Math.round(n * CRITERES[3].poids * 100) / 100 },
        { libelle: "Note globale", montant: noteGlobale([...NOTES_DE_HUGO_SANS_L_ENTRAIDE, n]), fort: true },
      ],
      droites: () => ({ produit: (n) => pointsDeHugoSansLEntraide() + n * CRITERES[3].poids, cout: () => NOTE_DE_L_OBJECTIF, libelles: ["Note globale", "Objectif"] }),
      explication: () => {
        const n = entraideNecessaire();
        return [`Il faut ${note(n)} en entraide pour que Hugo atteigne l'objectif : un critère difficile à observer décide de la prime. Plus un critère pèse, plus sa note doit reposer sur des faits que l'on peut citer.`];
      },
    },
    {
      id: "un-biais",
      objectifs: [1],
      type: "choix",
      titre: "Un biais de l'évaluateur",
      question: () => "Pour noter l'entraide de Hugo, la responsable se souvient surtout de la soirée ratée de la semaine dernière. Quel biais menace sa note ?",
      options: () => [
        {
          texte: "L'effet de récence",
          juste: true,
          retour: "Oui : le dernier souvenir efface l'année. Noter au fil de l'année des faits précis, datés, le corrige.",
        },
        {
          texte: "L'effet de halo : une qualité de Hugo éclaire toutes les autres notes",
          juste: false,
          retour: "Non : l'effet de halo étend une impression à tous les critères. Ici, c'est l'événement le plus récent qui pèse trop.",
        },
        {
          texte: "Aucun : un souvenir précis est toujours une preuve",
          juste: false,
          retour: "Non : un seul souvenir n'est pas une année de travail.",
        },
      ],
    },
    {
      id: "deux-entretiens",
      type: "lecture",
      titre: "Deux entretiens, deux objets",
      texte: () => [
        "L'entretien annuel d'évaluation n'est pas imposé par la loi : l'entreprise le choisit. Il revient sur le travail de l'année, les résultats, les objectifs, et peut décider d'une prime.",
        "L'entretien de parcours professionnel, lui, est obligatoire. Le programme l'appelle entretien professionnel ; la loi du 24 octobre 2025 l'a renommé. Il a lieu dans la première année suivant l'embauche, puis au moins tous les 4 ans, et tous les 8 ans il dresse un état des lieux du parcours. Il porte sur les compétences, la qualification, la formation et les souhaits d'évolution, jamais sur l'évaluation du travail.",
      ],
      repere: () => "Évaluation : le travail de l'année, au choix de l'entreprise. Parcours professionnel : l'avenir du salarié, obligatoire.",
    },
    {
      id: "quel-entretien",
      objectifs: [3],
      type: "tri",
      titre: "Quel entretien ?",
      question: () => "Dans quel entretien chaque sujet a-t-il sa place ?",
      categories: [
        { code: "evaluation", libelle: "Entretien d'évaluation" },
        { code: "parcours", libelle: "Entretien de parcours professionnel" },
      ],
      elements: () => [
        { libelle: "La note de l'année et la prime qui en dépend", montant: 0, categorie: "evaluation", pourquoi: "Le travail de l'année est jugé : c'est l'évaluation." },
        { libelle: "Les objectifs de ventes de l'année prochaine", montant: 0, categorie: "evaluation", pourquoi: "Fixer des objectifs de travail relève de l'évaluation." },
        { libelle: "Le souhait de Hugo de devenir chef de rang, et la formation qu'il faudrait", montant: 0, categorie: "parcours", pourquoi: "Son évolution et ses besoins de formation : le parcours professionnel." },
        { libelle: "Le point, après 8 ans, sur les formations suivies et la progression", montant: 0, categorie: "parcours", pourquoi: "C'est l'état des lieux récapitulatif de l'entretien de parcours." },
      ],
      relance: "Juge-t-on le travail passé, ou parle-t-on de l'avenir du salarié ?",
      explication: () => ["Les deux peuvent se tenir le même jour, mais l'un après l'autre : on ne parle pas sereinement de son avenir pendant qu'on reçoit sa note."],
    },
    {
      id: "le-bilan-de-competences",
      objectifs: [4],
      type: "choix",
      titre: "Le bilan de compétences",
      question: () => "Le chef de cuisine voudrait que Hugo fasse un bilan de compétences et lui en remette les conclusions. Qu'en dit la loi ?",
      options: () => [
        {
          texte: "Le bilan ne se fait qu'avec l'accord de Hugo, et ses conclusions lui appartiennent",
          juste: true,
          retour: "Oui : le bilan de compétences aide un salarié à analyser ses compétences, ses aptitudes et ses motivations pour bâtir un projet professionnel. Il est mené par un organisme extérieur, peut se financer par le compte personnel de formation, et ses résultats ne sont communiqués à personne sans l'accord du salarié.",
        },
        {
          texte: "L'employeur peut l'imposer, et en lire les conclusions, puisqu'il le finance",
          juste: false,
          retour: "Non : le bilan de compétences demande le consentement du salarié, et ses conclusions restent les siennes, même quand l'employeur paie.",
        },
        {
          texte: "Le bilan de compétences est une autre façon de noter le travail de l'année, plus complète que la grille",
          juste: false,
          retour: "Non : il ne note pas le travail, il prépare un projet. L'évaluation, elle, regarde le passé.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `${c.entreprise} évalue ses serveurs sur une grille pondérée annoncée à l'avance : Sarah atteint ${note(evaluationDeSarah().globale)}, Hugo doit obtenir ${note(entraideNecessaire())} en entraide. Mais tout ne s'évalue pas : le travail invisible échappe à la grille, et un évaluateur a ses biais. L'entretien d'évaluation juge l'année ; l'entretien de parcours professionnel, obligatoire, prépare l'avenir ; le bilan de compétences appartient au salarié.`,
        "Dans l'arène, la productivité de l'équipe se lit tour après tour : ce que le chiffre ne montre pas reste à observer.",
      ],
      repere: () => "Résultats et compétences · travail invisible · supérieur, auto-évaluation, 360° · biais · grille pondérée · entretien d'évaluation · entretien de parcours professionnel · bilan de compétences.",
    },
  ],
};
