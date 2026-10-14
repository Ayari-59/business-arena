/**
 * LES RÉFÉRENTIELS, TELS QUE LEURS TEXTES LES ÉCRIVENT.
 *
 * Les ateliers citaient leurs blocs, processus et thèmes en texte libre, séance
 * par séance. Trois erreurs y vivaient, et aucune ne se voyait autrement qu'en
 * ouvrant l'arrêté : un thème de programme purement inventé, un intitulé de
 * management tronqué au tiers, et un diplôme entier rangé sous le mauvais mot,
 * le BTS Gestion de la PME ayant des blocs de compétences là où le produit lui
 * prêtait des activités.
 *
 * Ce sont les erreurs que repère du premier coup d'œil le seul lecteur qui
 * compte ici : celui qui connaît son référentiel par cœur.
 *
 * CE REGISTRE EST UNE RÉFÉRENCE, PAS UN CARCAN. Le mot qui découpe un métier
 * reste un choix d'affichage : blocs de compétences, activités, processus,
 * unités d'enseignement, une autre filière viendra avec le sien et devra
 * pouvoir l'écrire. Un intitulé raccourci pour tenir dans une fiche n'est pas
 * une faute non plus. La garde ne retient donc que ce qui a réellement fait
 * défaut : une entrée que le texte ne porte pas du tout, comme ce thème de
 * programme entièrement inventé. Elle compare le fond, sans accents, sans
 * casse et sans le préfixe qui numérote.
 *
 * Un diplôme absent d'ici n'est pas bloqué : il n'est simplement pas confronté
 * à un texte, faute qu'on l'ait lu. Ajouter une filière ne demande donc rien.
 *
 * La provenance n'est pas un ornement. Une liste lue dans l'arrêté et une liste
 * reconstituée de mémoire ne se corrigent pas de la même façon, et le prochain
 * qui passera ici doit savoir laquelle il a sous les yeux.
 */

export interface Referentiel {
  /** Le mot par lequel le texte découpe le métier. */
  label: string;
  accord: "mobilisés" | "mobilisées";
  /** D'où vient la liste, et à quelle date elle a été confrontée au texte. */
  source: string;
  /**
   * Les intitulés, tels que le texte les écrit. Un atelier peut les raccourcir
   * ou les préfixer autrement : c'est le fond qui est comparé, pas la lettre.
   */
  entrees: readonly string[];
}

const REFERENTIEL_NDRC: Referentiel = {
  label: "Blocs de compétences",
  accord: "mobilisés",
  source:
    "Référentiel du BTS Négociation et digitalisation de la relation client. Lu sur le texte.",
  entrees: [
    "Bloc 1 · Relation client et négociation-vente",
    "Bloc 2 · Relation client à distance et digitalisation",
    "Bloc 3 · Relation client et animation de réseaux",
  ],
};

const REFERENTIEL_MCO: Referentiel = {
  label: "Blocs de compétences",
  accord: "mobilisés",
  source:
    "Arrêté du 8 juillet 2024 modifiant l'arrêté du 15 octobre 2018, BTS Management commercial opérationnel. Lu sur le texte.",
  entrees: [
    "Bloc 1 · Développer la relation client et assurer la vente conseil",
    "Bloc 2 · Animer et dynamiser l'offre commerciale",
    "Bloc 3 · Assurer la gestion opérationnelle",
    "Bloc 4 · Manager l'équipe commerciale",
  ],
};

const REFERENTIEL_DCG: Referentiel = {
  label: "Unités d'enseignement",
  accord: "mobilisées",
  source:
    "Annexe 1, programme des unités d'enseignement du diplôme de comptabilité et de gestion. Lu sur le texte. Il s'agit du programme réformé, celui qui porte la durabilité et l'intelligence artificielle dans plusieurs unités.",
  entrees: [
    "UE1 · Fondamentaux du droit",
    "UE2 · Droit des affaires",
    "UE3 · Droit social",
    "UE4 · Droit fiscal",
    "UE5 · Économie contemporaine",
    "UE6 · Finance d'entreprise",
    "UE7 · Management des organisations",
    "UE8 · Système d'information de gestion",
    "UE9 · Comptabilité",
    "UE10 · Comptabilité approfondie",
    "UE11 · Contrôle de gestion",
    "UE12 · Anglais des affaires",
    "UE13 · Communication professionnelle",
  ],
};

export const REFERENTIELS: Record<string, Referentiel> = {
  mco: REFERENTIEL_MCO,
  // Le même diplôme, une année plus tard : même texte, même garde.
  mco2: REFERENTIEL_MCO,
  ndrc: REFERENTIEL_NDRC,
  // L'atelier de deuxième année du même diplôme se confronte au même texte.
  fitness: REFERENTIEL_NDRC,
  cg1: {
    label: "Processus",
    accord: "mobilisés",
    source:
      "Arrêté du 3 novembre 2014 portant définition du BTS Comptabilité et gestion, annexe I b, référentiel de certification, modifié par les arrêtés du 9 juin 2016 et du 15 septembre 2016. Lu sur le texte.",
    entrees: [
      "P1 · Contrôle et traitement comptable des opérations commerciales",
      "P2 · Contrôle et production de l'information financière",
      "P3 · Gestion des obligations fiscales",
      "P4 · Gestion des relations sociales",
      "P5 · Analyse et prévision de l'activité",
      "P6 · Analyse de la situation financière",
      "P7 · Fiabilisation de l'information et système d'information comptable (SIC)",
    ],
  },
  dcg: REFERENTIEL_DCG,
  // L'atelier RSE se joue sur le même diplôme : il relève du même texte.
  "dcg-rse": REFERENTIEL_DCG,
  stmg: {
    label: "Thèmes du programme",
    accord: "mobilisés",
    source:
      "Les trois programmes du cycle terminal STMG, lus sur leurs annexes : sciences de gestion et numérique de première (annexe 3), management de première (annexe 2), management, sciences de gestion et numérique de terminale, enseignement commun (annexe 2).",
    entrees: [
      // Première, sciences de gestion et numérique.
      "Thème 1 · De l'individu à l'acteur",
      "Thème 2 · Numérique et intelligence collective",
      "Thème 3 · Création de valeur et performance",
      "Thème 4 · Temps et risque",
      // Première, management.
      "Thème 1 · À la rencontre du management des organisations",
      "Thème 2 · Le management stratégique, du diagnostic à la fixation des objectifs",
      "Thème 3 · Les choix stratégiques des organisations",
      // Terminale, enseignement commun.
      "Thème 1 · Les organisations et l'activité de production de biens et de services",
      "Thème 2 · Les organisations et les acteurs",
      "Thème 3 · Les organisations et la société",
    ],
  },
  gpme: {
    label: "Blocs de compétences",
    accord: "mobilisés",
    source:
      "Référentiel du BTS Gestion de la PME. Lu sur le texte, qui parle de blocs de compétences et non d'activités, et dont trois intitulés sur quatre se terminent par « de la PME ».",
    entrees: [
      "Bloc 1 · Gérer la relation avec les clients et les fournisseurs de la PME",
      "Bloc 2 · Participer à la gestion des risques de la PME",
      "Bloc 3 · Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
      "Bloc 4 · Soutenir le fonctionnement et le développement de la PME",
    ],
  },
};

/**
 * Les diplômes dont la liste n'a pas encore été confrontée à son texte.
 *
 * Le BTS MHR, sur ses deux ateliers, et le BUT GEA y figurent : leurs
 * animations sont publiées, mais leurs blocs n'ont pas encore été relus sur le
 * texte, et cela doit se voir
 * plutôt que de se confondre avec les diplômes dont le référentiel a été lu. Ce
 * n'est pas un état définitif : le jour où l'on ouvre le texte de l'un, il
 * rejoint REFERENTIELS et sort d'ici. C'est précisément à cela que sert cette
 * liste. (Les animations transversales, découverte et approfondissement, ne
 * s'adossent à aucun diplôme : elles n'ont donc rien à faire ici.)
 */
export const REFERENTIELS_NON_VERIFIES = ["mhr", "bistrot", "gea"] as const;

/**
 * LES FICHES QUI CITENT PLUSIEURS DIPLÔMES.
 *
 * Une immersion de campus réunit quatre filières et cite donc quatre
 * référentiels dans la même séance. Aucune clé unique ne peut la couvrir, et
 * elle échappait par là même à toute vérification : ses douze intitulés
 * étaient exacts, mais rien ne le garantissait pour la suite.
 *
 * Ces fiches préfixent chaque intitulé du diplôme dont il vient, « BTS CG P5 ·
 * Analyse et prévision de l'activité ». Le préfixe devient donc la clé, et la
 * garde retrouve le texte à confronter. L'ordre compte : le préfixe le plus
 * long gagne, sans quoi « BTS CG » attraperait ce qui commence par « BTS ».
 */
const PREFIXES_DE_DIPLOME: readonly [string, string][] = [
  ["BTS CG", "cg1"],
  ["BTS MCO", "mco"],
  ["BTS NDRC", "ndrc"],
  ["BTS GPME", "gpme"],
  ["DCG", "dcg"],
  ["STMG", "stmg"],
];

/** Le référentiel d'un intitulé préfixé, et ce qu'il reste à comparer. */
export function referentielDeCitation(
  entree: string,
): { code: string; referentiel: Referentiel } | null {
  const trouve = [...PREFIXES_DE_DIPLOME]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefixe]) => entree.startsWith(`${prefixe} `));
  if (!trouve) return null;
  const referentiel = REFERENTIELS[trouve[1]];
  return referentiel ? { code: trouve[1], referentiel } : null;
}

/**
 * CE QUI S'ADOSSE AU RÉFÉRENTIEL D'UN DIPLÔME, ET CE QUI NE S'Y ADOSSE PAS.
 *
 * La page des parcours présentait douze sections dont trois n'étaient pas des
 * formations : une découverte ouverte à toutes les filières, un
 * approfondissement, et un tournoi inter-filières. Elles affichaient pourtant
 * des « blocs de référentiel » comme les autres — « Étape 1 · Lire une
 * situation et fixer un prix », « Volet 3 · Piloter la trésorerie » — qui sont
 * nos propres découpages et ne figurent dans aucun arrêté.
 *
 * Un bloc de référentiel appartient à un diplôme. Mêler un découpage maison
 * aux blocs d'un texte officiel, sur la page même où un enseignant vient
 * vérifier son programme, enlève sa valeur à tout ce qui l'entoure : il ne
 * sait plus lesquelles des listes il peut opposer à son inspection.
 *
 * LA LISTE NE S'ÉCRIT PAS, ELLE SE DÉDUIT. Un atelier adossé à un diplôme a
 * forcément une entrée ici — soit confrontée à son texte, soit en attente de
 * l'être. Les trois autres n'en ont aucune, et n'en auront jamais, puisqu'il
 * n'existe pas de texte à confronter. Un atelier ajouté demain pour un vrai
 * diplôme entre donc tout seul, et un atelier maison reste dehors tout seul.
 */
export function adosseAUnReferentiel(code: string): boolean {
  return (
    code in REFERENTIELS ||
    (REFERENTIELS_NON_VERIFIES as readonly string[]).includes(code)
  );
}

/**
 * LE BLOC OFFICIEL DERRIÈRE UN BLOC CITÉ.
 *
 * Deux ateliers d'un même diplôme ne nomment pas toujours un bloc de la même
 * façon, et c'est permis : le mot qui découpe un métier est un choix
 * d'affichage, et un intitulé raccourci pour tenir dans une fiche n'est pas
 * une faute. Le tournoi inter-filières, lui, préfixe les siens du diplôme dont
 * ils viennent — « BTS CG P5 · Analyse et prévision de l'activité » — parce
 * qu'il en mêle quatre.
 *
 * TANT QUE RIEN NE LES RAPPROCHAIT, un atelier ne pouvait pas rejoindre les
 * autres sous la même formation : ses blocs auraient fait doublon avec les
 * leurs, sous deux libellés différents. Le tournoi était donc tenu à l'écart
 * de la page des parcours, alors même qu'il sert quatre formations.
 *
 * LA RÉSOLUTION EXISTAIT DÉJÀ, mais dans un test : la garde qui vérifie
 * qu'aucun bloc n'est inventé compare le FOND, segment par segment, sans
 * accents, sans casse et sans le préfixe qui numérote. Elle vit ici désormais,
 * puisque la page en a besoin autant que la garde.
 *
 * Mesuré sur le registre : les quarante blocs cités se résolvent chacun vers
 * une entrée officielle et une seule, les douze du tournoi compris.
 */

/** Les segments comparables d'un intitulé : sans accents, sans casse, sans numéro. */
function segmentsComparables(entree: string): string[] {
  return entree
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split("·")
    .map((s) =>
      s
        .trim()
        .replace(/^[a-z]{1,6}\s?\d+\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Deux intitulés parlent du même bloc si l'un de leurs segments se retrouve
 * dans l'autre. Le seuil de six signes écarte les rencontres de hasard entre
 * mots courts, qui rapprocheraient n'importe quoi.
 */
function memeBloc(cite: string, officiel: string): boolean {
  const a = segmentsComparables(cite);
  const b = segmentsComparables(officiel);
  return a.some((x) =>
    b.some(
      (y) => x.length > 6 && y.length > 6 && (x.includes(y) || y.includes(x)),
    ),
  );
}

/**
 * L'entrée officielle que désigne un bloc cité, pour le référentiel donné.
 *
 * Renvoie null si le texte n'a pas été lu (aucune entrée à confronter), ou si
 * le bloc n'y correspond à rien — auquel cas le bloc cité reste ce qu'il est,
 * et la garde des référentiels le signalera comme inventé.
 */
export function blocOfficiel(
  bloc: string,
  referentielCode: string,
): string | null {
  const referentiel = REFERENTIELS[referentielCode];
  if (!referentiel) return null;
  const trouves = referentiel.entrees.filter((e) => memeBloc(bloc, e));
  // Deux correspondances ne valent pas mieux qu'aucune : on ne devine pas.
  return trouves.length === 1 ? trouves[0]! : null;
}
