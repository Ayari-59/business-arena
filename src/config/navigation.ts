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
 */

export interface LienDeMenu {
  href: string;
  libelle: string;
  /** Ce que la page apporte, dit au visiteur avant qu'il ne clique. */
  aide: string;
  /** Les rares liens qui restent visibles hors du menu, sur grand écran. */
  enTete?: true;
}

export interface GroupeDeMenu {
  code: string;
  titre: string;
  liens: LienDeMenu[];
}

/**
 * L'entrée principale, tenue à part.
 *
 * C'est la seule page qui répond à la question que se pose un enseignant qui
 * arrive : par où commencer. Noyée dans une rangée de liens, elle se lisait
 * comme les autres.
 */
export const ACTION_PRINCIPALE: LienDeMenu = {
  href: "/orientation",
  libelle: "Choisir ma simulation",
  aide: "Quatre questions, et le réglage qui convient à votre classe s'écrit à mesure, avec ses raisons.",
};

export const NAVIGATION: readonly GroupeDeMenu[] = [
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
        href: "/animations",
        libelle: "Animations",
        aide: "Des déroulés de séance prêts à animer, avec leurs livrables et leur grille d'évaluation.",
        enTete: true,
      },
      {
        href: "/parcours",
        libelle: "Parcours",
        aide: "Ce que traverse une classe, de la première décision au dernier bilan.",
      },
      {
        href: "/fonctionnalites",
        libelle: "Fonctionnalités",
        aide: "9 scénarios, 79 situations, 18 modèles : tout ce que la plateforme met entre les mains de vos étudiants.",
      },
    ],
  },
  {
    code: "comprendre",
    titre: "Comprendre",
    liens: [
      {
        href: "/notions",
        libelle: "Fiches notions",
        aide: "Les notions mobilisées par le jeu, expliquées et reliées à ce que montre le tableau de bord.",
        enTete: true,
      },
      {
        href: "/guide",
        libelle: "Guide",
        aide: "Comment on joue et comment on anime, réunis au même endroit.",
      },
    ],
  },
  {
    code: "entrer",
    titre: "Entrer",
    liens: [
      {
        href: "/jouer",
        libelle: "Jouer en solo",
        aide: "Lancez une partie tout de suite : choisissez un secteur et un niveau, et pilotez l'entreprise seul contre des concurrents simulés.",
        enTete: true,
      },
      {
        href: "/join",
        libelle: "Rejoindre une partie",
        aide: "Votre enseignant vous a donné un code : c'est ici qu'il s'utilise.",
      },
      {
        href: "/teacher/login",
        libelle: "Espace enseignant",
        aide: "Créer une partie, suivre les équipes, clôturer les tours et relire le carnet d'usage.",
      },
      {
        href: "/compete",
        libelle: "Concours",
        aide: "Les concours entre classes, leurs épreuves et leurs classements.",
      },
    ],
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

/** Tous les liens du plan, groupes confondus, action principale comprise. */
export function tousLesLiens(): LienDeMenu[] {
  return [ACTION_PRINCIPALE, ...NAVIGATION.flatMap((g) => g.liens), ...LIENS_LEGAUX];
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
