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
 * UN MENU PAR PRODUIT, UN MOT PAR ENTRÉE (décision du propriétaire, novembre
 * 2026 : « un menu plus cohérent et plus simple, avec à chaque fois un seul mot
 * et pas plusieurs »). Le plan d'avant était rangé par public : la barre
 * montrait 5 groupes et le menu déplié 6 (« Élèves » n'était que dans le menu),
 * trois titres portaient une précision (« lycée, BTS, université ») et les
 * entrées étaient des phrases (« Choisir ma simulation »). Il est maintenant
 * rangé par produit : le cours, l'arène, les épisodes, puis les offres et
 * l'aide. Les mêmes 5 mots ouvrent la barre, les groupes du menu déplié et les
 * colonnes du pied de page, et chacun mène à la même page partout.
 *
 * LA PÉDAGOGIE EN AVANT, LE LÉGAL EN PETIT (le propriétaire, avant la mise en
 * ligne : « les CGV, CGU, RGPD et cie, je ne veux pas que ce soit trop voyant ;
 * le menu horizontal m'a l'air bien ; je veux un menu qui montre la pédagogie
 * et met en avant le produit »). Sous le titre du cours, de l'arène et des
 * épisodes, le menu déplié dit en une phrase ce qu'on y fait apprendre
 * (`phrase`, en texte discret : jamais une entrée). Les mentions légales, les
 * CGV et les CGU ne sont plus des entrées : une seule petite ligne, tout en bas
 * du pied de page (`LIENS_LEGAUX`). L'examen, l'intégration, l'aide au choix et
 * le profil décisionnel des épisodes quittent aussi le menu : des pages du plan
 * y mènent (tests/architecture/menu-par-produit.test.ts le vérifie, lien par
 * lien).
 *
 * LES ADRESSES NE CHANGENT PAS. Seuls les libellés et leur rangement bougent :
 * un lien partagé, un signet, un support imprimé restent justes.
 */
// Les modules légers, hors des épisodes : le menu est lu par des composants client.
import { DECISIONS_PAR_EPISODE, NOMBRE_D_EPISODES } from "@/config/familles-des-episodes";
import { COMPETENCES } from "@/config/referentiel-des-competences";

export interface LienDeMenu {
  href: string;
  /** Le mot du menu : UN SEUL (tests/architecture/menu-en-un-mot.test.ts). */
  libelle: string;
  /** Ce que la page apporte, dit au visiteur avant qu'il ne clique (au survol). */
  aide: string;
  /**
   * Le nom que lit une synthèse vocale, quand le mot seul en dit trop peu :
   * « Rejoindre avec un code ». Il COMMENCE par le mot affiché, pour que
   * celui qui dicte ce qu'il voit soit compris (WCAG 2.5.3).
   */
  nom?: string;
  /**
   * Les deux portes d'entrée, l'une par public, posées en boutons à droite de
   * la barre sur grand écran et en tête du menu déplié : un élève cherche où
   * taper son code, un enseignant cherche son espace. Ni l'un ni l'autre n'a à
   * chercher dans un groupe.
   */
  acces?: "enseignant" | "eleve";
}

export interface GroupeDeMenu {
  code: string;
  /**
   * Le titre du groupe : UN MOT, celui du produit. C'est aussi, tel quel, le
   * mot de la barre et le titre de la colonne du pied de page : rien ne
   * s'écrit à côté de lui.
   */
  titre: string;
  /**
   * La page que le titre ouvre, partout où il s'affiche : la barre, le menu
   * déplié et le pied de page. Sur téléphone, où la barre ne montre pas ses
   * mots, c'est le titre du groupe dans le menu qui y mène.
   */
  entree: string;
  /**
   * Ce que cette page apporte, au survol du titre, quand elle n'est pas une
   * entrée du groupe : « Arène » ouvre la présentation du simulateur, qui n'a
   * plus d'entrée à elle. Sinon, l'aide est celle de l'entrée.
   */
  aide?: string;
  /**
   * Ce que le groupe fait apprendre, en une phrase, sous son titre dans le
   * menu déplié SEULEMENT, en texte discret : ce n'est pas une entrée, et ni
   * la barre ni le pied de page ne la disent. Le cours, l'arène et les
   * épisodes en ont une ; les offres et l'aide n'en ont pas.
   */
  phrase?: string;
  liens: LienDeMenu[];
}

/**
 * LES GUIDES DE PRISE EN MAIN (/guides) : un guide par public, avec les écrans réels et
 * une version PDF. C'est la page que « Aide » ouvre : on cherche l'aide là où l'on bute,
 * c'est-à-dire n'importe où.
 */
export const LIEN_GUIDES: LienDeMenu = {
  href: "/guides",
  libelle: "Guides",
  aide: "Un guide par public (enseignant, élève, référent établissement, formateur), les étapes dans l'ordre avec les écrans réels, et sa version PDF.",
};

/**
 * LES RÈGLES DU JEU (/guide) : comment on joue, comment on anime, les concours, le
 * courrier, le score. « Guide » au singulier ne désigne aucune entrée du menu : à côté
 * des « Guides », un « Guide » tout court obligeait à ouvrir les deux pour savoir
 * laquelle on cherchait. La page garde son titre, « Règles du jeu ».
 */
export const LIEN_REGLES: LienDeMenu = {
  href: "/guide",
  libelle: "Règles",
  aide: "Comment se joue un tour, comment on anime une classe, les concours, le courrier et le score, réunis au même endroit.",
};

/** Les conditions générales de vente (/cgv) : ce que signe un acheteur. */
export const LIEN_CGV: LienDeMenu = {
  href: "/cgv",
  libelle: "CGV",
  aide: "Les conditions générales de vente : la commande, les prix, le paiement, la durée, la responsabilité et le droit applicable.",
};

/** Les conditions générales d'utilisation (/cgu) : les règles qui valent pour tous les utilisateurs. */
export const LIEN_CGU: LienDeMenu = {
  href: "/cgu",
  libelle: "CGU",
  aide: "Les conditions générales d'utilisation : qui utilise le service, les comptes et les codes, le bon usage, la disponibilité et le droit applicable.",
};

/** Les mentions que la loi impose, discrètes mais jamais absentes. */
export const LIEN_MENTIONS: LienDeMenu = {
  href: "/mentions-legales",
  libelle: "Mentions",
  aide: "Les mentions légales et le RGPD : qui édite le site, quelles données sont conservées, combien de temps et comment les faire effacer.",
};

/**
 * LA PETITE LIGNE LÉGALE, tout en bas du pied de page de chaque page publique,
 * et nulle part ailleurs dans la navigation : ni dans le menu déplié, ni dans
 * les groupes du pied de page (« je ne veux pas que ce soit trop voyant »). La
 * loi la veut atteignable sur toutes les pages : elle l'est, en petit.
 */
export const LIENS_LEGAUX: readonly LienDeMenu[] = [LIEN_MENTIONS, LIEN_CGV, LIEN_CGU];

/**
 * LES GROUPES SONT LES PRODUITS DU SITE (décisions du propriétaire, novembre 2026).
 *
 *   Cours      Diplômes · Notions · Référentiels
 *   Arène      Solo · Métiers · Ateliers · Concours
 *   Épisodes   Catalogue · Classe
 *   Offres     Enseignants · Lycées · Écoles · Entreprises · Devis
 *   Aide       Guides · Manuel · Règles · Reprendre · Profil · Contact
 *
 * Le menu déplié montre la pédagogie : sous le titre du cours, de l'arène et
 * des épisodes, une phrase dit ce qu'on y fait (`phrase`). Chaque page n'a
 * qu'une place et qu'un nom. Les deux portes, Rejoindre et Connexion, sont hors
 * des groupes (`PORTES`) ; le légal tient sur sa petite ligne (`LIENS_LEGAUX`).
 *
 * SORTIS DU MENU, ET ATTEINTS AUTREMENT : l'examen individuel (/ecoles#evaluer,
 * une section de la page des écoles), l'intégration (/integration, liée depuis
 * les offres et les guides), l'aide au choix (/orientation, les boutons de la
 * page des enseignants) et le profil décisionnel des épisodes
 * (/entreprises/episode/profil, lié depuis le profil de l'arène et la fin de
 * chaque épisode). tests/architecture/menu-par-produit.test.ts tient ces liens.
 */
export const NAVIGATION: readonly GroupeDeMenu[] = [
  {
    code: "cours",
    titre: "Cours",
    entree: "/cours",
    phrase: "Chaque notion se pratique : vous passez l'écriture, et vous voyez ce qu'elle change dans les comptes.",
    liens: [
      {
        href: "/cours",
        libelle: "Diplômes",
        aide: "Votre diplôme d'abord : ses chapitres dans l'ordre d'apprentissage, bloc par bloc du référentiel, chacun sur une entreprise simulée, guidé puis en cas pratique.",
      },
      {
        href: "/notions",
        libelle: "Notions",
        aide: "Les notions mobilisées par le jeu, expliquées et reliées à ce que montre le tableau de bord.",
      },
      {
        href: "/parcours",
        libelle: "Référentiels",
        aide: "Votre référentiel bloc par bloc, pour chaque formation servie, du CAP au DSCG : où chacun se travaille, et ce qui n'est qu'effleuré.",
      },
    ],
  },
  {
    // L'ARÈNE : le simulateur. Son mot ouvre sa présentation (/fonctionnalites), qui n'a plus
    // d'entrée à elle ; ses entrées sont ce qu'on y fait.
    code: "arene",
    titre: "Arène",
    entree: "/fonctionnalites",
    aide: "Les scénarios, les situations, les modèles d'analyse : tout ce que la plateforme met entre les mains de vos élèves et de vos étudiants.",
    phrase: "Vous dirigez une entreprise en équipe, et le marché répond à vos choix.",
    liens: [
      {
        href: "/jouer",
        libelle: "Solo",
        aide: "Lancez une partie tout de suite : choisissez un secteur et un niveau, et pilotez l'entreprise seul contre des concurrents simulés.",
      },
      {
        // Les entreprises de l'arène, celles qu'on dirige en jouant (« Choisissez votre métier ») :
        // pas les entreprises clientes, qui ont leur entrée dans les offres.
        href: "/entreprises",
        libelle: "Métiers",
        aide: "Les fiches des entreprises que l'on dirige dans l'arène : leur marché, leurs contraintes, ce qu'on y apprend.",
      },
      {
        href: "/animations",
        libelle: "Ateliers",
        aide: "Des déroulés de séance prêts à animer, avec leurs livrables et leur grille d'évaluation.",
      },
      {
        href: "/guide#concours",
        libelle: "Concours",
        aide: "Comment se déroule un concours entre classes, des inscriptions à la finale ; l'enseignant le crée depuis son espace.",
      },
    ],
  },
  {
    code: "episodes",
    titre: "Épisodes",
    entree: "/entreprises/episode",
    phrase: "Vous décidez en manager, puis vous voyez ce que la décision a coûté.",
    liens: [
      {
        href: "/entreprises/episode",
        libelle: "Catalogue",
        aide: `${NOMBRE_D_EPISODES} trimestres dans la peau d'un manager, du terrain à la stratégie : ${DECISIONS_PAR_EPISODE} décisions, et un bilan qui sépare la qualité des décisions du hasard.`,
      },
      {
        href: "/enseignants/episodes",
        libelle: "Classe",
        aide: "Un coût marginal, une VAN ou un rachat joué comme une décision, en une séance de deux heures, avec la fiche de l'enseignant.",
      },
    ],
  },
  {
    // LES OFFRES : à qui elles s'adressent, et le devis où elles aboutissent (le site n'encaisse
    // rien). Leur mot ouvre la page des offres, /tarifs : l'adresse reste, pour les liens partagés
    // et le référencement.
    code: "offres",
    titre: "Offres",
    entree: "/tarifs",
    aide: "Gratuit pour découvrir en solo ; sur mesure et sur devis pour faire cours, et pour les épisodes manager.",
    liens: [
      {
        href: "/enseignants",
        libelle: "Enseignants",
        aide: "Découvrir Business Arena : pourquoi la plateforme apprend à décider et pas à cliquer, ses ateliers clés en main et sa prise en main en classe.",
      },
      // « LYCÉES » A SA PLACE ICI, juste après « Enseignants » : { href: "/lycees", libelle: "Lycées" }.
      // La page /lycees vient avec un chantier suivant, qui pose l'entrée ; d'ici là, aucune
      // entrée ne mène à une page absente (tests/architecture/menu-par-produit.test.ts).
      {
        href: "/ecoles",
        libelle: "Écoles",
        aide: `L'arène pour le bachelor, les épisodes manager pour le master et la formation continue, et ${COMPETENCES.length} compétences mesurées à montrer à un jury d'accréditation.`,
      },
      {
        href: "/entreprises/offre",
        libelle: "Entreprises",
        aide: "Pour une entreprise ou un organisme de formation : les formules, ce qui est inclus, ce qui se chiffre au devis.",
      },
      {
        href: "/devis",
        libelle: "Devis",
        aide: "Une demande écrite : l'offre, l'établissement ou l'entreprise, le niveau souhaité, le nombre d'enseignants ou de managers. La réponse vient par écrit.",
      },
    ],
  },
  {
    // L'AIDE : les guides, le manuel, les règles du jeu, la reprise d'une partie, le profil de
    // l'arène et le contact.
    code: "aide",
    titre: "Aide",
    entree: "/guides",
    liens: [
      LIEN_GUIDES,
      {
        href: "/manuel",
        libelle: "Manuel",
        aide: "Le manuel de l'enseignant : comment l'application évalue, les situations, les grilles, l'indice et le mérite, dans un document qui s'imprime.",
      },
      LIEN_REGLES,
      {
        href: "/reprendre",
        libelle: "Reprendre",
        aide: "Vous avez changé d'appareil, ou le navigateur a oublié qui vous étiez : votre code de reprise vous rend votre partie.",
      },
      {
        // Le profil de l'arène. Celui des épisodes (/entreprises/episode/profil) s'ouvre depuis
        // cette page et depuis la fin de chaque épisode.
        href: "/profile",
        libelle: "Profil",
        aide: "Vos compétences, vos parties jouées et vos réussites, sur cet appareil ou sous votre code de reprise.",
      },
      {
        // Le rendez-vous téléphonique, le seul lien du plan qui mette une personne au bout du fil.
        // Les pages l'appellent par son verbe (`LIEN_CONTACT`).
        href: "/rendez-vous",
        libelle: "Contact",
        aide: "Trente minutes au téléphone pour parler de votre classe : les créneaux proposés sont ceux que l'agenda laisse libres.",
      },
    ],
  },
];

/**
 * LES DEUX PORTES, hors des groupes : en boutons à droite de la barre sur grand
 * écran, et en tête du menu déplié, seules (aucune autre action n'y a sa
 * place). Un mot chacune, et un nom plus long pour une synthèse vocale.
 */
export const PORTES: readonly LienDeMenu[] = [
  {
    href: "/join",
    libelle: "Rejoindre",
    nom: "Rejoindre avec un code",
    // Une seule porte (services/rejoindre.service) : un code de partie, de classe du cours,
    // de cohorte, de concours ou d'examen tapé ici mène à sa page.
    aide: "Votre enseignant vous a donné un code, quel qu'il soit (partie, classe, concours, examen) : c'est ici qu'il s'utilise.",
    acces: "eleve",
  },
  {
    href: "/teacher/login",
    libelle: "Connexion",
    nom: "Connexion à l'espace enseignant",
    aide: "L'espace enseignant : créer une partie, suivre les équipes, clôturer les tours et relire le carnet d'usage.",
    acces: "enseignant",
  },
];

/** Tous les liens du plan public : les entrées des groupes, puis les deux portes. */
export function tousLesLiens(): LienDeMenu[] {
  return [...NAVIGATION.flatMap((g) => g.liens), ...PORTES];
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
 * Les mots de la barre, sur grand écran : un par groupe, sous le TITRE du
 * groupe, vers la page que ce titre ouvre. Cinq, par construction : une barre
 * qui affiche tout n'affiche plus rien, et c'est de là que venait
 * l'encombrement.
 */
export function liensDeTete(): LienDeMenu[] {
  return NAVIGATION.map((g) => ({
    href: g.entree,
    libelle: g.titre,
    aide: g.aide ?? lienDuPlan(g.entree).aide,
  }));
}

/** Les portes d'entrée par public, en boutons à droite de la barre et en tête du menu déplié. */
export function liensDAcces(): LienDeMenu[] {
  return [...PORTES];
}

/**
 * LES APPELS DES PAGES, SOUS LEUR VERBE. Le menu nomme une page d'un mot ; un
 * bouton dit ce qu'il fait. La barre d'action du téléphone et le corps des
 * pages appellent donc « Jouer en solo » et « Prendre rendez-vous » : les
 * adresses de « Solo » et « Contact », lues dans le plan, sous le verbe de
 * l'action. Deux endroits qui écriraient ces adresses se désaccorderaient le
 * jour où l'une change.
 */
const appel = (href: string, libelle: string): LienDeMenu => ({ ...lienDuPlan(href), libelle });

/** Jouer tout de suite : l'appel des pages générales, dans la barre d'action du téléphone. */
export const APPEL_JOUER: LienDeMenu = appel("/jouer", "Jouer en solo");

/**
 * Par où commencer, pour un enseignant : l'aide au choix (/orientation). C'est
 * l'appel de la barre d'action du téléphone sur les pages enseignantes, et
 * celui des boutons de la page des enseignants. La page n'est plus une entrée
 * du menu (novembre 2026) : son adresse s'écrit donc ici.
 */
export const ACTION_PRINCIPALE: LienDeMenu = {
  href: "/orientation",
  libelle: "Choisir ma simulation",
  aide: "Quatre questions, et le réglage qui convient à votre classe s'écrit à mesure, avec ses raisons.",
};

/**
 * De quoi joindre quelqu'un. Des pages le citent depuis leur corps (les tarifs,
 * le devis, les parcours), sous son verbe ; le menu le nomme « Contact ».
 */
export const LIEN_CONTACT: LienDeMenu = appel("/rendez-vous", "Prendre rendez-vous");

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
  /** Une ligne qui dit ce qu'est la rubrique, sous la navigation quand elle est ouverte. */
  aide?: string;
}

/**
 * L'ESPACE ENSEIGNANT, dans l'ordre d'usage : ce qu'on ouvre le plus souvent
 * d'abord. Un mot par pastille, comme le menu du site (novembre 2026) : la
 * page garde son titre (« Mes parties », « Mes classes du cours », « Carnet
 * d'usage »), la pastille n'en dit que le mot. L'aide mène au guide de prise
 * en main de l'enseignant ; le manuel s'y lit, et depuis le groupe « Aide » du
 * site.
 */
/*
 * UNE LIGNE PAR RUBRIQUE (audit UX du 29 octobre 2026, P2-11) : un nouvel enseignant ne voyait
 * pas la différence entre une partie, une classe du cours, une cohorte et un examen. La ligne
 * de la rubrique ouverte se lit sous la navigation.
 */
export const NAVIGATION_ENSEIGNANT: readonly Pastille[] = [
  {
    code: "parties",
    href: "/teacher",
    libelle: "Parties",
    aide: "Une partie : vos élèves dirigent en équipes une entreprise de l'arène, tour après tour, face à des concurrents. Les concours entre classes se créent ici aussi.",
  },
  {
    code: "examens",
    href: "/teacher/examens",
    libelle: "Examens",
    aide: "Un examen : chaque candidat joue seul la même entreprise, dans un temps donné, et reçoit une note.",
  },
  {
    code: "cohortes",
    href: "/teacher/cohortes",
    libelle: "Cohortes",
    aide: "Une cohorte : une classe qui joue des épisodes manager, de courtes situations de management, par un code.",
  },
  {
    code: "cours",
    href: "/teacher/cours",
    libelle: "Classes",
    aide: "Une classe du cours : vos élèves suivent les chapitres du cours par la simulation, et vous voyez où chacun en est.",
  },
  {
    code: "scenarios",
    href: "/teacher/scenarios",
    libelle: "Scénarios",
    aide: "Vos propres entreprises, écrites par vous, à lancer en partie comme celles de l'arène.",
  },
  { code: "usage", href: "/teacher/usage", libelle: "Usage", aide: "Ce que vos classes ont fait sur la plateforme, partie après partie." },
  { code: "aide", href: "/guides/enseignant", libelle: "Aide" },
];

/** À droite des pastilles enseignantes : l'établissement, et l'administration pour le propriétaire. */
export const LIEN_ETABLISSEMENT: Pastille = { code: "etablissement", href: "/org", libelle: "Établissement" };
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
  { code: "cours", href: "/admin/cours", libelle: "Cours attribués" },
  { code: "cohortes", href: "/admin/cohortes", libelle: "Cohortes" },
  { code: "lti", href: "/admin/lti", libelle: "Moodle" },
  { code: "renater", href: "/admin/renater", libelle: "RENATER" },
  { code: "theme", href: "/admin/theme", libelle: "Thème" },
  { code: "effacements", href: "/admin/effacements", libelle: "Effacements" },
];

/**
 * L'ÉTUDIANT CONNECTÉ PAR SON ÉTABLISSEMENT (/etablissement/parties) : ses
 * parties, et les deux autres pages du plan qui le concernent (la porte du
 * code, son profil), sous les mots du plan.
 */
export const NAVIGATION_ETUDIANT: readonly Pastille[] = [
  { code: "parties", href: "/etablissement/parties", libelle: "Vos parties et cohortes" },
  { code: "rejoindre", ...lienDuPlan("/join") },
  { code: "profil", ...lienDuPlan("/profile") },
];

/**
 * L'ARÈNE : le petit menu de l'élève, le même sur ordinateur et dans le menu
 * du téléphone. Les deux pages publiques sont citées sous leur nom du plan ;
 * « Quitter la partie » mène là d'où l'élève vient (components/menu-de-l-arene.tsx).
 */
export const NAVIGATION_ARENE: readonly LienDeMenu[] = [
  { href: "/guides/etudiant", libelle: "Guide de l'élève", aide: "Du code donné en classe au bilan de fin de partie, les étapes dans l'ordre avec les écrans réels." },
  lienDuPlan("/notions"),
  lienDuPlan("/profile"),
];
export const LIBELLE_QUITTER_LA_PARTIE = "Quitter la partie";
