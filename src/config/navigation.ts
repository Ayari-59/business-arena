/**
 * Le plan du site, en un seul endroit.
 *
 * Le menu portait huit liens de rang égal, tous masqués sous la barre des
 * petits écrans : un visiteur sur téléphone n'avait plus AUCUNE navigation, et
 * le bas de page d'accueil recopiait la même liste à la main, si bien que la
 * page d'orientation y manquait déjà. Les deux défauts ont la même cause :
 * personne ne tenait la liste.
 *
 * Elle vit donc ici. La barre, le menu, le pied de page, l'espace enseignant,
 * l'administration et l'arène la LISENT, ce qui rend impossible qu'une page
 * soit atteignable d'un côté et introuvable de l'autre, ou qu'une même page
 * porte deux noms selon l'endroit d'où l'on y va.
 *
 * UN SEUL PLAN PAR PUBLIC, LES MÊMES MOTS PARTOUT (décision du propriétaire,
 * octobre 2026 : « repenser et harmoniser les différents menus, les rendre
 * plus lisibles, plus logiques »). Le plan précédent mêlait les publics
 * (« Formations » portait aussi l'espace enseignant et le déploiement,
 * « Entreprises » vivait dans « Ressources »), dispersait l'aide en cinq
 * entrées (« Guide » et « Guides » côte à côte), parlait anglais
 * (« Championship ») et laissait quatre pages publiques introuvables
 * (/integration, /reprendre, /examen, /profile). Il est maintenant rangé par
 * public, un mot par public, et chaque groupe de la barre est le même que
 * celui du menu : « Enseignants » dans la barre ouvre la présentation, et
 * « Enseignants » dans le menu déplie tout ce qui s'adresse à eux.
 *
 * LES ADRESSES NE CHANGENT PAS. Seuls les libellés et leur rangement bougent :
 * un lien partagé, un signet, un support imprimé restent justes.
 */
import { NOMBRE_D_EPISODES } from "@/config/episodes/familles";

export interface LienDeMenu {
  href: string;
  libelle: string;
  /** Ce que la page apporte, dit au visiteur avant qu'il ne clique. */
  aide: string;
  /**
   * Les deux portes d'entrée, l'une par public, posées en boutons à droite de
   * la barre sur grand écran : un enseignant cherche son espace, un élève
   * cherche où taper son code. Ni l'un ni l'autre n'a à ouvrir le menu.
   */
  acces?: "enseignant" | "eleve";
}

export interface GroupeDeMenu {
  code: string;
  /**
   * Le titre du groupe : UN MOT, celui du public. C'est aussi, tel quel, le
   * libellé du lien à plat dans la barre sur grand écran (voir `entree`), et
   * le titre de la colonne du pied de page.
   */
  titre: string;
  /**
   * Ce que le mot ne dit pas seul, en petit à côté du titre dans le menu :
   * « lycée, BTS, université » sous « Enseignants ». Jamais dans la barre, où
   * la place manque et où le mot suffit.
   */
  precision?: string;
  /**
   * La page que le titre ouvre depuis la barre : la présentation du public.
   * Un groupe sans `entree` n'a pas de lien à plat (« Jouer » : ses portes
   * sont les boutons et l'action principale).
   */
  entree?: string;
  liens: LienDeMenu[];
}

/**
 * L'entrée principale.
 *
 * C'est la seule page qui répond à la question que se pose un enseignant qui
 * arrive : par où commencer. Elle reste l'action principale du pied de page
 * et de la barre d'action du téléphone sur les pages enseignantes, et vit
 * dans le groupe « Jouer », qui est le seul déplié à l'ouverture du menu.
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
 * C'est le seul lien du plan qui mette une personne au bout du fil, et des
 * pages le citent depuis leur corps (les tarifs, le devis, les parcours). Il
 * est donc nommé ici : deux endroits qui l'écrivent sont deux endroits qui se
 * désaccorderont le jour où le libellé change.
 */
export const LIEN_CONTACT: LienDeMenu = {
  href: "/rendez-vous",
  libelle: "Prendre rendez-vous",
  aide: "Trente minutes au téléphone pour parler de votre classe : les créneaux proposés sont ceux que l'agenda laisse libres.",
};

/**
 * LES OFFRES. Le titre du groupe dans la barre, et la première entrée du groupe.
 * L'aide ne nomme pas les offres (leurs noms vivent dans config/tarifs.ts, qui tire le
 * registre des scénarios ; ce plan est lu par le menu, côté navigateur). Décision du
 * propriétaire (octobre 2026) : « J'aimerais retirer les prix. Les offres se font sur
 * mesure et aboutissent à une demande de devis. » Le libellé est « Offres » ; l'adresse
 * /tarifs reste (liens partagés, référencement).
 */
export const LIEN_TARIFS_DU_MENU: LienDeMenu = {
  href: "/tarifs",
  libelle: "Offres",
  aide: "Gratuit pour découvrir en solo ; sur mesure et sur devis pour faire cours, et pour les épisodes manager.",
};

/**
 * LES GUIDES DE PRISE EN MAIN (/guides) : un guide par public, avec les écrans réels et
 * une version PDF. C'est l'entrée du groupe « Aide », celle que la barre ouvre : on
 * cherche l'aide là où l'on bute, c'est-à-dire n'importe où.
 */
export const LIEN_GUIDES: LienDeMenu = {
  href: "/guides",
  libelle: "Guides de prise en main",
  aide: "Un guide par public (enseignant, étudiant, référent établissement, formateur), les étapes dans l'ordre avec les écrans réels, et sa version PDF.",
};

/**
 * LES RÈGLES DU JEU (/guide) : comment on joue, comment on anime, les concours, le
 * courrier, le score. « Guide » au singulier ne désigne plus que cette page, et sous ce
 * nom : à côté des « Guides de prise en main », un « Guide » tout court obligeait à
 * ouvrir les deux pour savoir laquelle on cherchait.
 */
export const LIEN_REGLES: LienDeMenu = {
  href: "/guide",
  libelle: "Règles du jeu",
  aide: "Comment se joue un tour, comment on anime une classe, les concours, le courrier et le score, réunis au même endroit.",
};

/** Les mentions que la loi impose, discrètes mais jamais absentes. */
export const LIEN_MENTIONS: LienDeMenu = {
  href: "/mentions-legales",
  libelle: "Mentions légales et RGPD",
  aide: "Qui édite le site, quelles données sont conservées, combien de temps et comment les faire effacer.",
};

/**
 * LES GROUPES SONT LES PUBLICS DU SITE.
 *
 * Un groupe pour qui vient jouer, puis un par public (les enseignants du
 * lycée, du BTS et de l'université ; les écoles de commerce ; les entreprises
 * et leurs managers), puis ce qui sert à tous : l'aide, les offres et le
 * contact. Chaque page n'a qu'une place et qu'un nom.
 *
 * Sur téléphone, le menu est la seule navigation : le premier groupe est
 * déplié à l'ouverture, celui qui vient jouer n'a rien à chercher.
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
        // Une seule porte (services/rejoindre.service) : un code de classe, de cohorte, de
        // concours ou d'examen tapé ici mène à sa page.
        aide: "Votre enseignant vous a donné un code, quel qu'il soit : c'est ici qu'il s'utilise.",
        acces: "eleve",
      },
      {
        // Audit d'octobre 2026 : /compete est le formulaire de l'équipe qui s'inscrit, il
        // était rangé chez les enseignants, qui organisent depuis leur espace.
        href: "/compete",
        libelle: "Rejoindre un concours",
        aide: "Inscrire son équipe à un concours entre classes, avec le code donné par l'enseignant.",
      },
      {
        href: "/reprendre",
        libelle: "Reprendre une partie",
        aide: "Vous avez changé d'appareil, ou le navigateur a oublié qui vous étiez : votre code de reprise vous rend votre partie.",
      },
      {
        href: "/examen",
        libelle: "Passer un examen",
        aide: "Le code donné par votre enseignant ouvre votre examen individuel : vous dirigez seul votre entreprise, tour après tour.",
      },
      {
        href: "/profile",
        libelle: "Mon profil",
        aide: "Vos compétences, vos parties jouées et vos réussites, sur cet appareil ou sous votre code de reprise.",
      },
    ],
  },
  {
    code: "enseignants",
    titre: "Enseignants",
    precision: "lycée, BTS, université",
    entree: "/enseignants",
    liens: [
      {
        href: "/enseignants",
        libelle: "Présentation",
        aide: "Découvrir Business Arena : pourquoi la plateforme apprend à décider et pas à cliquer, ses ateliers clés en main et sa prise en main en classe.",
      },
      {
        href: "/animations",
        libelle: "Ateliers clés en main",
        aide: "Des déroulés de séance prêts à animer, avec leurs livrables et leur grille d'évaluation.",
      },
      {
        href: "/cours",
        libelle: "Cours par la simulation",
        aide: "Une notion à la fois, de la comptabilité au marketing, sur une entreprise simulée : l'élève fait les calculs, guidé, puis les refait seul dans un cas pratique.",
      },
      {
        href: "/parcours",
        libelle: "Référentiels par diplôme",
        aide: "Votre référentiel bloc par bloc, pour chaque diplôme qui a un atelier : où chacun se travaille, et ce qui n'est qu'effleuré.",
      },
      {
        href: "/enseignants/episodes",
        libelle: "Épisodes en classe",
        aide: "Un coût marginal, une VAN ou un rachat joué comme une décision, en une séance de deux heures, avec la fiche de l'enseignant.",
      },
      {
        href: "/guide#concours",
        libelle: "Concours entre classes",
        aide: "Comment se déroule un concours entre classes, des inscriptions à la finale ; l'enseignant le crée depuis son espace.",
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
    code: "ecoles",
    titre: "Écoles",
    precision: "de commerce",
    entree: "/ecoles",
    liens: [
      {
        href: "/ecoles",
        libelle: "Présentation",
        aide: "L'arène pour le bachelor, les épisodes manager pour le master et la formation continue, et dix compétences mesurées à montrer à un jury d'accréditation.",
      },
      {
        // La section « Évaluer et accréditer » de la page des écoles, qui présente
        // l'examen individuel : son ancre est #evaluer, et c'est elle qu'on vise.
        href: "/ecoles#evaluer",
        libelle: "Examen individuel",
        aide: "Chaque étudiant dirige seul son entreprise, sur le même scénario que sa promotion : une note qui juge les décisions, pas le hasard.",
      },
      {
        href: "/fonctionnalites",
        libelle: "Fonctionnalités",
        aide: "Les scénarios, les situations, les modèles d'analyse : tout ce que la plateforme met entre les mains de vos étudiants.",
      },
      {
        href: "/integration",
        libelle: "Moodle et RENATER",
        aide: "Ajouter Business Arena à Moodle ou à Canvas par LTI 1.3, et laisser vos étudiants entrer avec le compte de leur établissement.",
      },
    ],
  },
  {
    code: "entreprises",
    titre: "Entreprises",
    precision: "et managers",
    entree: "/entreprises",
    liens: [
      {
        href: "/entreprises",
        libelle: "Présentation",
        aide: "Les fiches des entreprises jouables : leur marché, leurs contraintes, ce qu'on y apprend.",
      },
      {
        href: "/entreprises/episode",
        libelle: "Épisodes manager",
        aide: `${NOMBRE_D_EPISODES} trimestres dans la peau d'un manager, du terrain à la stratégie : six décisions, et un bilan qui sépare la qualité des décisions du hasard.`,
      },
      {
        href: "/entreprises/episode/profil",
        libelle: "Mon profil décisionnel",
        aide: "Ce que vos épisodes disent de votre façon de décider : dix compétences, leurs preuves, et les épisodes à jouer ensuite.",
      },
    ],
  },
  {
    code: "aide",
    titre: "Aide",
    entree: "/guides",
    liens: [
      LIEN_GUIDES,
      LIEN_REGLES,
      {
        href: "/manuel",
        libelle: "Manuel de l'enseignant",
        aide: "Comment l'application évalue : les situations, les grilles, l'indice et le mérite, dans un document qui s'imprime.",
      },
      {
        href: "/notions",
        libelle: "Fiches notions",
        aide: "Les notions mobilisées par le jeu, expliquées et reliées à ce que montre le tableau de bord.",
      },
    ],
  },
  {
    // LES OFFRES VIVENT AVEC LE CONTACT : la grille dit ce qui est gratuit et
    // ce qui se vend, et tout se vend sur devis (le site n'encaisse rien). Les
    // deux entrées servent le même moment. Les mentions légales ferment le plan.
    code: "offres",
    titre: "Offres",
    precision: "et contact",
    entree: "/tarifs",
    liens: [LIEN_TARIFS_DU_MENU, LIEN_CONTACT, LIEN_MENTIONS],
  },
];

/** Tous les liens du plan public, groupes confondus. */
export function tousLesLiens(): LienDeMenu[] {
  return NAVIGATION.flatMap((g) => g.liens);
}

/**
 * Un lien du plan, retrouvé par son adresse : c'est ainsi que l'arène ou
 * l'espace enseignant citent une page publique SANS réécrire son nom. Une
 * adresse absente du plan est une erreur de programme, pas un cas à gérer.
 */
export function lienDuPlan(href: string): LienDeMenu {
  const lien = tousLesLiens().find((l) => l.href === href);
  if (!lien) throw new Error(`${href} n'est pas dans le plan du site (config/navigation.ts)`);
  return lien;
}

/**
 * Les liens à plat de la barre, sur grand écran : un par groupe qui a une
 * entrée, sous le TITRE du groupe. Peu nombreux par construction : une barre
 * qui affiche tout n'affiche plus rien, et c'est de là que venait
 * l'encombrement.
 */
export function liensDeTete(): LienDeMenu[] {
  return NAVIGATION.filter((g) => g.entree).map((g) => ({
    href: g.entree!,
    libelle: g.titre,
    aide: lienDuPlan(g.entree!).aide,
  }));
}

/** Les portes d'entrée par public, en boutons à droite de la barre. */
export function liensDAcces(): LienDeMenu[] {
  return tousLesLiens().filter((l) => l.acces);
}

/* -------------------------------------------------------------------------
 * LES ESPACES SOUS COMPTE : les mêmes pastilles, lues ici.
 *
 * L'espace enseignant, l'établissement et l'administration portaient chacun
 * leur rangée de liens, écrite dans la page, avec trois styles et des mots
 * différents pour une même page. Les rangées vivent ici, et un seul composant
 * les dessine (components/pastilles-de-navigation.tsx).
 * ---------------------------------------------------------------------- */

export interface Pastille {
  code: string;
  href: string;
  libelle: string;
}

/**
 * L'ESPACE ENSEIGNANT, dans l'ordre d'usage : ce qu'on ouvre le plus souvent
 * d'abord. L'aide mène au guide de prise en main de l'enseignant ; le manuel
 * s'y lit, et depuis le groupe « Aide » du site.
 */
export const NAVIGATION_ENSEIGNANT: readonly Pastille[] = [
  { code: "parties", href: "/teacher", libelle: "Mes parties" },
  { code: "examens", href: "/teacher/examens", libelle: "Mes examens" },
  { code: "cohortes", href: "/teacher/cohortes", libelle: "Mes cohortes" },
  { code: "cours", href: "/teacher/cours", libelle: "Mes classes du cours" },
  { code: "scenarios", href: "/teacher/scenarios", libelle: "Mes scénarios" },
  { code: "usage", href: "/teacher/usage", libelle: "Carnet d'usage" },
  { code: "aide", href: "/guides/enseignant", libelle: "Aide" },
];

/** À droite des pastilles enseignantes : l'établissement, et l'administration pour le propriétaire. */
export const LIEN_ETABLISSEMENT: Pastille = { code: "etablissement", href: "/org", libelle: "Mon établissement" };
export const LIEN_ADMINISTRATION: Pastille = { code: "administration", href: "/admin", libelle: "Administration" };
export const LIEN_ESPACE_ENSEIGNANT: Pastille = { code: "parties", href: "/teacher", libelle: "Espace enseignant" };

/**
 * L'ADMINISTRATION GÉNÉRALE, dans l'ordre d'usage : les inscrits et les offres
 * tous les jours, les cohortes souvent, Moodle et RENATER à l'arrivée d'un
 * établissement, le thème une fois. « Plateforme » est la page d'accueil de
 * l'espace, d'où l'on revient.
 */
export const NAVIGATION_ADMIN: readonly Pastille[] = [
  { code: "plateforme", href: "/admin", libelle: "Plateforme" },
  { code: "inscrits", href: "/admin/inscrits", libelle: "Inscrits" },
  { code: "offres", href: "/admin/offres", libelle: "Offres" },
  { code: "cohortes", href: "/admin/cohortes", libelle: "Cohortes" },
  { code: "lti", href: "/admin/lti", libelle: "Moodle" },
  { code: "renater", href: "/admin/renater", libelle: "RENATER" },
  { code: "theme", href: "/admin/theme", libelle: "Thème" },
];

/**
 * L'ÉTUDIANT CONNECTÉ PAR SON ÉTABLISSEMENT (/etablissement/parties) : ses
 * parties, et les deux autres portes du groupe « Jouer » qui le concernent,
 * sous les mots du plan.
 */
export const NAVIGATION_ETUDIANT: readonly Pastille[] = [
  { code: "parties", href: "/etablissement/parties", libelle: "Vos parties et cohortes" },
  { code: "rejoindre", ...lienDuPlan("/join") },
  { code: "profil", ...lienDuPlan("/profile") },
];

/**
 * L'ARÈNE : le petit menu de l'élève, le même sur ordinateur et dans le menu
 * du téléphone. Les trois pages publiques sont citées sous leur nom du plan ;
 * « Quitter la partie » mène là d'où l'élève vient (components/menu-de-l-arene.tsx).
 */
export const NAVIGATION_ARENE: readonly LienDeMenu[] = [
  { href: "/guides/etudiant", libelle: "Guide de l'étudiant", aide: "Du code donné en classe au bilan de fin de partie, les étapes dans l'ordre avec les écrans réels." },
  lienDuPlan("/notions"),
  lienDuPlan("/profile"),
];
export const LIBELLE_QUITTER_LA_PARTIE = "Quitter la partie";
