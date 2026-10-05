/**
 * Le plan du site, en un seul endroit.
 *
 * Le menu portait huit liens de rang égal, tous masqués sous la barre des
 * petits écrans : un visiteur sur téléphone n'avait plus AUCUNE navigation, et
 * le bas de page d'accueil recopiait la même liste à la main, si bien que la
 * page d'orientation y manquait déjà. Les deux défauts ont la même cause :
 * personne ne tenait la liste.
 *
 * Elle vit donc ici. Le menu et le pied de page la lisent, ce qui rend
 * impossible qu'une page soit atteignable d'un côté et introuvable de l'autre.
 * Les groupes ne sont pas décoratifs : ils disent à qui la page s'adresse, ce
 * qu'aucune rangée de mots alignés ne pouvait faire.
 *
 * Les groupes portent le nom du public, pas d'un verbe. « Découvrir »,
 * « Comprendre », « Entrer » obligeaient un élève muni d'un code à deviner que
 * « Rejoindre une partie » vivait sous « Entrer », et un enseignant que les
 * ateliers vivaient sous « Découvrir ». Enseignants, Élèves, Ressources :
 * chacun sait où regarder.
 */

export interface LienDeMenu {
  href: string;
  libelle: string;
  /** Ce que la page apporte, dit au visiteur avant qu'il ne clique. */
  aide: string;
  /** Les rares liens qui restent visibles hors du menu, sur grand écran. */
  enTete?: true;
  /**
   * Les deux portes d'entrée, l'une par public, posées en boutons à droite de
   * la barre sur grand écran : un enseignant cherche son espace, un élève
   * cherche où taper son code. Ni l'un ni l'autre n'a à ouvrir le menu.
   */
  acces?: "enseignant" | "eleve";
}

export interface GroupeDeMenu {
  code: string;
  titre: string;
  liens: LienDeMenu[];
}

/**
 * L'entrée principale.
 *
 * C'est la seule page qui répond à la question que se pose un enseignant qui
 * arrive : par où commencer. Elle ouvre le premier groupe du plan, celui de
 * l'orientation et du contact, qui est le seul à s'afficher déplié quand le
 * menu s'ouvre.
 */
export const ACTION_PRINCIPALE: LienDeMenu = {
  href: "/orientation",
  libelle: "Choisir ma simulation",
  aide: "Quatre questions, et le réglage qui convient à votre classe s'écrit à mesure, avec ses raisons.",
};

/** Le groupe qui s'affiche déplié à l'ouverture du menu. */
export const GROUPE_OUVERT = "jouer";

/**
 * De quoi joindre quelqu'un.
 *
 * C'est le seul lien du plan qui mette une personne au bout du fil, et le pied
 * de page le cite sur toutes les pages publiques. Il est donc nommé ici, comme
 * l'entrée principale : deux endroits qui l'écrivent sont deux endroits qui se
 * désaccorderont le jour où le libellé change.
 */
export const LIEN_CONTACT: LienDeMenu = {
  href: "/rendez-vous",
  libelle: "Prendre rendez-vous",
  aide: "Trente minutes au téléphone pour parler de votre classe : les créneaux proposés sont ceux que l'agenda laisse libres.",
};

/**
 * LES GROUPES DISENT CE QU'ON VEUT FAIRE, pas à qui la page s'adresse.
 *
 * Sur téléphone, le menu est la seule navigation : il est lu comme une
 * question — je veux jouer, je veux animer une classe, je représente un
 * établissement, je veux comprendre — et chaque groupe y répond par une à
 * cinq entrées. Le premier est déplié à l'ouverture : celui qui vient jouer
 * n'a rien à chercher.
 *
 * Les libellés des entrées « à plat » sur grand écran (enTete) ne changent
 * pas : la barre du bureau n'avait pas à bouger pour que le menu du téléphone
 * s'organise autrement.
 */
export const NAVIGATION: readonly GroupeDeMenu[] = [
  {
    code: GROUPE_OUVERT,
    titre: "Jouer",
    liens: [
      {
        href: "/jouer",
        libelle: "Jouer maintenant",
        aide: "Lancez une partie tout de suite : choisissez un secteur et un niveau, et pilotez l'entreprise seul contre des concurrents simulés.",
      },
      ACTION_PRINCIPALE,
      {
        href: "/join",
        libelle: "Rejoindre une partie",
        aide: "Votre enseignant vous a donné un code : c'est ici qu'il s'utilise.",
        acces: "eleve",
      },
    ],
  },
  {
    code: "enseignants",
    titre: "Enseignants",
    liens: [
      {
        href: "/enseignants",
        libelle: "Pour les enseignants",
        aide: "Découvrir Business Arena : pourquoi la plateforme apprend à décider et pas à cliquer, ses ateliers clés en main et sa prise en main en classe.",
        enTete: true,
      },
      {
        href: "/animations",
        libelle: "Ateliers",
        aide: "Des déroulés de séance prêts à animer, avec leurs livrables et leur grille d'évaluation.",
        enTete: true,
      },
      {
        href: "/parcours",
        libelle: "Référentiels par diplôme",
        aide: "Votre référentiel bloc par bloc, pour chaque diplôme qui a un atelier : où chacun se travaille, et ce qui n'est qu'effleuré.",
      },
      {
        href: "/guide",
        libelle: "Guide",
        aide: "Comment on joue et comment on anime, réunis au même endroit.",
      },
      {
        href: "/teacher/login",
        libelle: "Espace enseignant",
        aide: "Créer une partie, suivre les équipes, clôturer les tours et relire le carnet d'usage.",
        acces: "enseignant",
      },
    ],
  },
  {
    code: "etablissements",
    titre: "Établissements",
    liens: [
      {
        href: "/guide#etablissements",
        libelle: "Déploiement",
        aide: "Un espace d'administration par établissement : codes d'invitation pour les enseignants, suivi des parties et des concours.",
      },
      {
        href: "/compete",
        libelle: "Championship",
        aide: "Les concours entre classes, leurs épreuves et leurs classements.",
      },
    ],
  },
  {
    code: "managers",
    titre: "Managers",
    liens: [
      {
        href: "/entreprises/episode",
        libelle: "Épisodes manager",
        aide: "Quarante-huit trimestres dans la peau d'un manager, du terrain à la stratégie : six décisions, et un bilan qui sépare la qualité des décisions du hasard.",
      },
    ],
  },
  {
    code: "decouvrir",
    titre: "Découvrir",
    liens: [
      {
        href: "/entreprises",
        libelle: "Entreprises",
        aide: "Les fiches des entreprises jouables : leur marché, leurs contraintes, ce qu'on y apprend.",
        enTete: true,
      },
      {
        href: "/fonctionnalites",
        libelle: "Fonctionnalités",
        aide: "Les scénarios, les situations, les modèles d'analyse : tout ce que la plateforme met entre les mains de vos étudiants.",
      },
      {
        href: "/notions",
        libelle: "Fiches notions",
        aide: "Les notions mobilisées par le jeu, expliquées et reliées à ce que montre le tableau de bord.",
      },
    ],
  },
  {
    code: "contact",
    titre: "Nous joindre",
    liens: [LIEN_CONTACT],
  },
];

/** Les mentions que la loi impose, discrètes mais jamais absentes. */
export const LIENS_LEGAUX: readonly LienDeMenu[] = [
  {
    href: "/mentions-legales",
    libelle: "Mentions légales & RGPD",
    aide: "Qui édite le site, quelles données sont conservées, combien de temps et comment les faire effacer.",
  },
];

/** Tous les liens du plan, groupes confondus, mentions légales comprises. */
export function tousLesLiens(): LienDeMenu[] {
  return [...NAVIGATION.flatMap((g) => g.liens), ...LIENS_LEGAUX];
}

/**
 * Les ancres qui restent hors du menu sur grand écran.
 *
 * Peu nombreuses par construction : une barre qui affiche tout n'affiche plus
 * rien, et c'est de là que venait l'encombrement.
 */
export function liensDeTete(): LienDeMenu[] {
  return NAVIGATION.flatMap((g) => g.liens).filter((l) => l.enTete);
}

/** Les portes d'entrée par public, en boutons à droite de la barre. */
export function liensDAcces(): LienDeMenu[] {
  return NAVIGATION.flatMap((g) => g.liens).filter((l) => l.acces);
}
