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
  /**
   * Quand le texte réunit plusieurs programmes : le titre de chacun et le
   * nombre d'entrées qu'il compte, dans l'ordre des entrées. Les thèmes du
   * lycée se numérotent programme par programme, si bien qu'un « Thème 1 »
   * seul ne dit pas duquel il s'agit.
   */
  parties?: readonly { titre: string; entrees: number }[];
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

const REFERENTIEL_MHR: Referentiel = {
  label: "Blocs de compétences",
  accord: "mobilisés",
  source:
    "Référentiel du BTS Management en hôtellerie restauration, annexe I, tableau des blocs de compétences professionnelles (pôles P1 à P5), communs aux trois options. Lu sur le texte ; blocs professionnels seulement.",
  entrees: [
    "Bloc 1 · Conception et production de services en hôtellerie restauration",
    "Bloc 2 · Mercatique des services en hôtellerie restauration",
    "Bloc 3 · Management de la production de services en hôtellerie restauration",
    "Bloc 4 · Pilotage de la production de services en hôtellerie restauration",
    "Bloc 5 · Projet d'entrepreneuriat en hôtellerie restauration",
  ],
};

const REFERENTIEL_BUT_GEA: Referentiel = {
  label: "Compétences",
  accord: "mobilisées",
  source:
    "BUT Gestion des entreprises et des administrations, programme national, annexe 12 de l'arrêté du 15 avril 2022 (BO spécial n° 4 du 26 mai 2022). Lu sur le texte.",
  entrees: [
    "Analyser les processus de l'organisation dans son environnement",
    "Aider à la prise de décision",
    "Piloter les relations avec les parties prenantes de l'organisation",
    "Produire l'information comptable, fiscale et sociale de l'organisation",
    "Évaluer l'activité de l'organisation",
    "Concevoir des outils de contrôle de gestion",
    "Mettre en œuvre des leviers d'amélioration continue des performances de l'organisation",
    "Concevoir la stratégie de création de valeur",
    "Assurer la gestion et le développement de la chaîne de valeur",
    "Gérer l'administration du personnel",
    "Gérer le développement des ressources humaines",
  ],
  parties: [
    { titre: "Tronc commun", entrees: 3 },
    { titre: "Parcours gestion comptable, fiscale et financière", entrees: 2 },
    { titre: "Parcours contrôle de gestion et pilotage de la performance", entrees: 2 },
    { titre: "Parcours gestion, entrepreneuriat et management d'activités", entrees: 2 },
    { titre: "Parcours gestion et pilotage des ressources humaines", entrees: 2 },
  ],
};

export const REFERENTIELS: Record<string, Referentiel> = {
  mco: REFERENTIEL_MCO,
  // Le même diplôme, une année plus tard : même texte, même garde.
  mco2: REFERENTIEL_MCO,
  ndrc: REFERENTIEL_NDRC,
  // L'atelier de deuxième année du même diplôme se confronte au même texte.
  fitness: REFERENTIEL_NDRC,
  // Les deux ateliers du BTS MHR, l'hôtel et le bistrot, se confrontent au
  // même texte : les blocs professionnels sont communs aux trois options.
  mhr: REFERENTIEL_MHR,
  bistrot: REFERENTIEL_MHR,
  gea: REFERENTIEL_BUT_GEA,
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
      "Les programmes du cycle terminal STMG, lus sur leurs annexes : sciences de gestion et numérique de première (annexe 3), management de première (annexe 2), et management, sciences de gestion et numérique de terminale (annexe 2 de l'arrêté du 19 juillet 2019), enseignement commun et ses quatre enseignements spécifiques : gestion et finance, mercatique, ressources humaines et communication, systèmes d'information de gestion. Les enseignements spécifiques ont été lus le 25 octobre 2026 sur le document d'eduscol.",
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
      // Terminale, enseignement spécifique de gestion et finance.
      "Thème 1 · Appliquer les règles comptables",
      "Thème 2 · Analyser la situation de l'entreprise",
      "Thème 3 · Accompagner la prise de décision",
      // Terminale, enseignement spécifique de mercatique (marketing).
      "Thème 1 · La définition de l'offre",
      "Thème 2 · La distribution de l'offre",
      "Thème 3 · La communication de l'offre",
      // Terminale, enseignement spécifique de ressources humaines et communication.
      "Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
      "Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
      "Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
      // Terminale, enseignement spécifique de systèmes d'information de gestion.
      "Thème 1 · Organisation et numérisation",
      "Thème 2 · Management du système d'information et performance",
      "Thème 3 · Information, action et décision",
      "Thème 4 · Système d'information et échange",
    ],
    parties: [
      { titre: "Première, sciences de gestion et numérique", entrees: 4 },
      { titre: "Première, management", entrees: 3 },
      { titre: "Terminale, enseignement commun", entrees: 3 },
      { titre: "Terminale, gestion et finance", entrees: 3 },
      { titre: "Terminale, mercatique", entrees: 3 },
      { titre: "Terminale, ressources humaines et communication", entrees: 3 },
      { titre: "Terminale, systèmes d'information de gestion", entrees: 4 },
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
 * LES DIPLÔMES SANS ATELIER, ET LE REGISTRE RANGÉ PAR FORMATION.
 *
 * Le registre était rangé par atelier : un diplôme n'y entrait que si un
 * atelier lui était écrit. Un baccalauréat professionnel, une classe de
 * seconde, un BUT se travaillent pourtant par le cours, chapitre par chapitre,
 * sans déroulé de séances ; ils n'avaient pas de place pour dire leur
 * programme, ni de page pour dire ce qui en est couvert. Le registre se range
 * donc aussi par formation (config/formations.ts), et c'est par lui que la
 * couverture d'un diplôme se lit.
 *
 * Chaque liste ci-dessous a été recopiée sur son texte le 25 octobre 2026 :
 * l'annexe de l'arrêté quand elle était lisible, sinon le « référentiel
 * d'activité, de compétences et d'évaluation » que le ministère dépose sur la
 * fiche RNCP de France Compétences, qui reproduit l'annexe. La provenance de
 * chacune est écrite avec elle.
 */

const REFERENTIEL_SECONDE_MG: Referentiel = {
  label: "Thèmes du programme",
  accord: "mobilisés",
  source:
    "Programme d'enseignement optionnel de management et gestion de la classe de seconde générale et technologique, annexe de l'arrêté du 17 janvier 2019 (BO spécial n° 1 du 22 janvier 2019). Lu sur le texte. Les thèmes n'y sont pas numérotés ; l'ordre est celui du texte.",
  entrees: [
    "S'engager et entreprendre, de l'intention à la création",
    "Organiser et décider, des objectifs à la réalisation",
    "Évaluer et évoluer, du pilotage aux développements numériques",
  ],
};

const REFERENTIEL_SECONDE_SES: Referentiel = {
  label: "Questions du programme",
  accord: "mobilisées",
  source:
    "Programme de sciences économiques et sociales de seconde générale et technologique, annexe de l'arrêté du 17 janvier 2019 (BO spécial n° 1 du 22 janvier 2019). Lu sur le texte. Les questions n'y sont pas numérotées ; l'ordre est celui du texte.",
  entrees: [
    "Comment les économistes, les sociologues et les politistes raisonnent-ils et travaillent-ils ?",
    "Comment crée-t-on des richesses et comment les mesure-t-on ?",
    "Comment se forment les prix sur un marché ?",
    "Comment devenons-nous des acteurs sociaux ?",
    "Comment s'organise la vie politique ?",
    "Quelles relations entre le diplôme, l'emploi et le salaire ?",
  ],
};

const REFERENTIEL_SECONDE_PRO_RC: Referentiel = {
  label: "Compétences communes de la famille",
  accord: "mobilisées",
  source:
    "Vademecum d'eduscol « Ressources pour la classe de seconde professionnelle, famille des métiers de la relation client », septembre 2019. Lu sur le texte. Ce n'est pas un texte réglementaire : aucun arrêté ne fixe de compétences communes de famille, et le vademecum est la seule liste publiée par le ministère.",
  entrees: [
    "Intégrer la relation client dans un cadre « omnicanal »",
    "Assurer le suivi de la relation client",
    "Collecter et exploiter l'information dans le cadre de la relation client",
  ],
};

const REFERENTIEL_SECONDE_PRO_GATL: Referentiel = {
  label: "Domaines de compétences communes",
  accord: "mobilisés",
  source:
    "Vademecum d'eduscol « Ressources pour la classe de seconde professionnelle, famille des métiers de la gestion administrative, du transport et de la logistique », septembre 2019. Lu sur le texte. Ce n'est pas un texte réglementaire : aucun arrêté ne fixe de compétences communes de famille, et le vademecum est la seule liste publiée par le ministère. Les intitulés y sont en capitales.",
  entrees: [
    "1 · Gérer des relations interpersonnelles",
    "2 · Organiser et planifier l'activité",
    "3 · Mettre en œuvre et contrôler les processus administratifs",
    "4 · Traiter les flux physiques en relation avec les données de gestion",
    "5 · Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements",
  ],
};

const REFERENTIEL_CAP_EPC: Referentiel = {
  label: "Blocs de compétences",
  accord: "mobilisés",
  source:
    "CAP Équipier polyvalent du commerce, annexes de l'arrêté du 29 octobre 2019 et fiche RNCP40994 de France Compétences. Lu sur le texte ; blocs professionnels seulement.",
  entrees: [
    "Bloc 1 · Recevoir et suivre les commandes",
    "Bloc 2 · Mettre en valeur et approvisionner",
    "Bloc 3 · Conseiller et accompagner le client dans son parcours d'achat",
  ],
};

const REFERENTIEL_BAC_PRO_AGORA: Referentiel = {
  label: "Blocs de compétences",
  accord: "mobilisés",
  source:
    "Baccalauréat professionnel Assistance à la gestion des organisations et de leurs activités, arrêté du 18 février 2020 et ses annexes (JO du 3 mars 2020), recoupés avec la fiche RNCP40705 de France Compétences. Lu sur le texte ; blocs professionnels seulement.",
  entrees: [
    "Bloc 1 · Gérer des relations avec les clients, les usagers et les adhérents",
    "Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
    "Bloc 3 · Administrer le personnel",
  ],
};

const REFERENTIEL_BAC_PRO_MCV: Referentiel = {
  label: "Blocs de compétences",
  accord: "mobilisés",
  source:
    "Baccalauréat professionnel Métiers du commerce et de la vente, annexes de l'arrêté du 17 décembre 2018, recoupées avec la fiche RNCP38399 de France Compétences. Lu sur le texte ; blocs professionnels seulement. Les annexes numérotent les blocs d'option 4A et 4B.",
  entrees: [
    "Bloc 1 · Conseiller et vendre",
    "Bloc 2 · Suivre les ventes",
    "Bloc 3 · Fidéliser la clientèle et développer la relation client",
    "Bloc 4A · Animer et gérer l'espace commercial",
    "Bloc 4B · Prospecter et valoriser l'offre commerciale",
  ],
  parties: [
    { titre: "Tronc commun", entrees: 3 },
    { titre: "Option A, animation et gestion de l'espace commercial", entrees: 1 },
    { titre: "Option B, prospection clientèle et valorisation de l'offre commerciale", entrees: 1 },
  ],
};

const REFERENTIEL_BTS_SAM: Referentiel = {
  label: "Blocs de compétences",
  accord: "mobilisés",
  source:
    "BTS Support à l'action managériale, référentiel de l'arrêté du 16 février 2018 modifié, recoupé avec la fiche RNCP38364 de France Compétences. Lu sur le texte ; blocs professionnels seulement.",
  entrees: [
    "Bloc 1 · Optimisation des processus administratifs",
    "Bloc 2 · Gestion de projet",
    "Bloc 3 · Collaboration à la gestion des ressources humaines",
  ],
};

const REFERENTIEL_BUT_TC: Referentiel = {
  label: "Compétences",
  accord: "mobilisées",
  source:
    "BUT Techniques de commercialisation, programme national, annexe 25 de l'arrêté du 15 avril 2022 (BO spécial n° 4 du 26 mai 2022). Lu sur le texte.",
  entrees: [
    "Conduire les actions marketing",
    "Vendre une offre commerciale",
    "Communiquer l'offre commerciale",
    "Elaborer l'identité d'une marque",
    "Manager un projet événementiel",
    "Manager une équipe commerciale sur un espace de vente",
    "Piloter un espace de vente",
    "Gérer une activité digitale",
    "Développer un projet e-business",
    "Formuler une stratégie de commerce à l'international",
    "Piloter les opérations à l'international",
    "Participer à la stratégie marketing et commerciale de l'organisation",
    "Manager la relation client",
  ],
  parties: [
    { titre: "Tronc commun", entrees: 3 },
    { titre: "Parcours stratégie de marque et événementiel", entrees: 2 },
    { titre: "Parcours marketing et management du point de vente", entrees: 2 },
    { titre: "Parcours marketing digital, e-business et entrepreneuriat", entrees: 2 },
    { titre: "Parcours business international : achat et vente", entrees: 2 },
    { titre: "Parcours business développement et management de la relation client", entrees: 2 },
  ],
};

const REFERENTIEL_BUT_GACO: Referentiel = {
  label: "Compétences",
  accord: "mobilisées",
  source:
    "BUT Gestion administrative et commerciale des organisations, programme national mis à jour en 2023 (annexe publiée par le ministère de l'enseignement supérieur ; seule l'appellation du premier parcours change par rapport à l'annexe 11 de 2022). Lu sur le texte.",
  entrees: [
    "Gérer un projet interne ou externe à l'organisation",
    "Participer au pilotage interne de l'organisation",
    "Concevoir la démarche marketing",
    "Accompagner une organisation dans sa démarche de responsabilité sociale et environnementale",
    "Entreprendre dans un contexte de reprise ou de création d'organisation",
    "Participer au pilotage RH de l'organisation",
    "Développer une approche conseil auprès des parties prenantes",
    "Déployer le marketing omnicanal et digital",
    "Assurer le développement des affaires, de la prospection à la fidélisation",
    "Développer des structures et des évènements culturels ou sportifs ou touristiques",
    "Gérer des organisations culturelles ou sportives ou touristiques",
  ],
  parties: [
    { titre: "Tronc commun", entrees: 3 },
    { titre: "Parcours management responsable de projet et entrepreneuriat", entrees: 2 },
    { titre: "Parcours management des fonctions supports", entrees: 2 },
    { titre: "Parcours management commercial et marketing omnicanal", entrees: 2 },
    { titre: "Parcours management des activités culturelles, artistiques, sportives et de tourisme", entrees: 2 },
  ],
};

const REFERENTIEL_DSCG: Referentiel = {
  label: "Unités d'enseignement",
  accord: "mobilisées",
  source:
    "Diplôme supérieur de comptabilité et de gestion, arrêté du 4 août 2025 (BOESR n° 32 du 28 août 2025), en vigueur à partir de la session 2027, article 2. Lu sur le texte. La session 2026 relève encore de l'arrêté du 13 février 2019, dont l'UE3 s'appelait « Management et contrôle de gestion ».",
  entrees: [
    "UE1 · Gestion juridique, fiscale et sociale",
    "UE2 · Finance",
    "UE3 · Contrôle de gestion et stratégie",
    "UE4 · Comptabilité et audit",
    "UE5 · Management des systèmes d'information",
    "UE6 · Anglais des affaires",
    "UE7 · Mémoire professionnel",
  ],
};

/**
 * LE REGISTRE PAR FORMATION : la clé est le code de la formation
 * (config/formations.ts). Les diplômes qui ont un atelier y retrouvent le même
 * texte que leur atelier ; les autres n'y sont que par lui.
 */
export const REFERENTIELS_DES_FORMATIONS: Record<string, Referentiel> = {
  "seconde-mg": REFERENTIEL_SECONDE_MG,
  "seconde-ses": REFERENTIEL_SECONDE_SES,
  "seconde-pro-rc": REFERENTIEL_SECONDE_PRO_RC,
  "seconde-pro-gatl": REFERENTIEL_SECONDE_PRO_GATL,
  "cap-epc": REFERENTIEL_CAP_EPC,
  "bac-pro-agora": REFERENTIEL_BAC_PRO_AGORA,
  "bac-pro-mcv": REFERENTIEL_BAC_PRO_MCV,
  stmg: REFERENTIELS.stmg!,
  "bts-cg": REFERENTIELS.cg1!,
  "bts-mco": REFERENTIEL_MCO,
  "bts-ndrc": REFERENTIEL_NDRC,
  "bts-gpme": REFERENTIELS.gpme!,
  "bts-mhr": REFERENTIEL_MHR,
  "bts-mhr-bc": REFERENTIEL_MHR,
  "bts-sam": REFERENTIEL_BTS_SAM,
  "but-gea": REFERENTIEL_BUT_GEA,
  "but-tc": REFERENTIEL_BUT_TC,
  "but-gaco": REFERENTIEL_BUT_GACO,
  dcg: REFERENTIEL_DCG,
  dscg: REFERENTIEL_DSCG,
};

/**
 * Les diplômes dont la liste n'a pas encore été confrontée à son texte.
 *
 * Un atelier publié avant que son texte soit lu y figure, pour que cela se
 * voie plutôt que de se confondre avec les diplômes dont le référentiel a été
 * lu. Le jour où l'on ouvre le texte, il rejoint REFERENTIELS et sort d'ici.
 * Le BTS MHR, sur ses deux ateliers, et le BUT GEA en sont sortis : la liste
 * est vide, et le mécanisme reste pour le prochain atelier. (Les animations transversales, découverte et approfondissement, ne
 * s'adossent à aucun diplôme : elles n'ont donc rien à faire ici.)
 */
export const REFERENTIELS_NON_VERIFIES: readonly string[] = [];

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
  ["2de MG", "seconde-mg"],
  ["2de SES", "seconde-ses"],
  ["2de pro RC", "seconde-pro-rc"],
  ["2de pro GATL", "seconde-pro-gatl"],
  ["CAP EPC", "cap-epc"],
  ["Bac pro AGORA", "bac-pro-agora"],
  ["Bac pro MCV", "bac-pro-mcv"],
  ["STMG", "stmg"],
  ["BTS CG", "bts-cg"],
  ["BTS MCO", "bts-mco"],
  ["BTS NDRC", "bts-ndrc"],
  ["BTS GPME", "bts-gpme"],
  ["BTS MHR", "bts-mhr"],
  ["BTS SAM", "bts-sam"],
  ["BUT GEA", "but-gea"],
  ["BUT TC", "but-tc"],
  ["BUT GACO", "but-gaco"],
  ["DCG", "dcg"],
  ["DSCG", "dscg"],
];

/**
 * Le référentiel d'un intitulé préfixé : la formation qu'il nomme (son code,
 * config/formations.ts) et le texte auquel le confronter.
 */
export function referentielDeCitation(
  entree: string,
): { code: string; referentiel: Referentiel } | null {
  const trouve = [...PREFIXES_DE_DIPLOME]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefixe]) => entree.startsWith(`${prefixe} `));
  if (!trouve) return null;
  const referentiel = REFERENTIELS_DES_FORMATIONS[trouve[1]];
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
  const referentiel = REFERENTIELS[referentielCode] ?? REFERENTIELS_DES_FORMATIONS[referentielCode];
  if (!referentiel) return null;
  return blocOfficielDans(bloc, referentiel);
}

/** L'entrée officielle que désigne un bloc cité, dans le texte donné. */
export function blocOfficielDans(bloc: string, referentiel: Referentiel): string | null {
  const trouves = referentiel.entrees.filter((e) => memeBloc(bloc, e));
  if (trouves.length === 1) return trouves[0]!;
  // DEUX CORRESPONDANCES, DONT UNE MOT POUR MOT. « Comptabilité » se retrouve
  // dans « Comptabilité approfondie », si bien que l'UE9 du DCG désignait aussi
  // l'UE10 et ne se résolvait jamais. Le segment identique n'est pas une
  // devinette : c'est le même intitulé. Hors de ce cas, deux correspondances ne
  // valent pas mieux qu'aucune, et on ne devine pas.
  const cites = segmentsComparables(bloc);
  const exacts = trouves.filter((e) =>
    segmentsComparables(e).some((s) => cites.includes(s)),
  );
  return exacts.length === 1 ? exacts[0]! : null;
}
