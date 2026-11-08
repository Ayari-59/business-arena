/**
 * LES MATIÈRES QUE LE COURS COUVRE EN ENTIER (décision du propriétaire, novembre 2026 : « une
 * matière ou une UE est prise dans sa totalité » ; une matière incomplète reste en ligne, marquée
 * « en cours »).
 *
 * Sur la page du cours d'un diplôme (/cours?diplome=…), chaque bloc du référentiel porte le
 * repère « en cours », sauf ceux de cette liste. La liste s'écrit à la main, parce que seul un
 * audit du programme officiel, section par section, dit qu'une matière est complète : le nombre de
 * chapitres ne le dit pas. Une matière jamais auditée reste donc « en cours » par défaut.
 *
 * Chaque entrée nomme le bloc exactement comme la page l'affiche (`bloc`, et `partie` quand le
 * texte réunit plusieurs programmes) ; une garde vérifie qu'elle désigne un bloc qui existe
 * (tests/cours/matieres-en-entier.test.ts).
 */
export interface MatiereEnEntier {
  /** Le code de la formation (config/formations.ts). */
  formation: string;
  bloc: string;
  partie?: string;
  /** Ce qui l'atteste : l'audit et la publication qui l'ont bouclée. */
  preuve: string;
}

export const MATIERES_COUVERTES_EN_ENTIER: readonly MatiereEnEntier[] = [
  {
    formation: "bts-cg",
    bloc: "P1 · Contrôle et traitement comptable des opérations commerciales",
    preuve: "Audit des processus P1 à P4, sous-activité par sous-activité, puis les dix chapitres et les compléments de la PR du P1 et du P2.",
  },
  {
    formation: "bts-cg",
    bloc: "P2 · Contrôle et production de l'information financière",
    preuve: "Audit des processus P1 à P4, sous-activité par sous-activité, puis les dix chapitres et les compléments de la PR du P1 et du P2.",
  },
  {
    formation: "bts-cg",
    bloc: "P5 · Analyse et prévision de l'activité",
    preuve: "Audit du contrôle de gestion, puis les cinq chapitres de la PR #347.",
  },
  {
    formation: "bts-cg",
    bloc: "P6 · Analyse de la situation financière",
    preuve: "Audit de la finance (section 3), puis les six chapitres de la PR du P6 et les étiquettes P6 de la VAN, du TRI et de « Croître en investissant ».",
  },
  {
    formation: "bts-mco",
    bloc: "Bloc 1 · Développer la relation client et assurer la vente conseil",
    preuve: "Audit du référentiel (arrêté du 15 octobre 2018 modifié le 8 juillet 2024), savoir par savoir, puis les seize chapitres et les sept compléments de la PR du MCO.",
  },
  {
    formation: "bts-mco",
    bloc: "Bloc 2 · Animer et dynamiser l'offre commerciale",
    preuve: "Audit du référentiel (arrêté du 15 octobre 2018 modifié le 8 juillet 2024), savoir par savoir, puis les seize chapitres et les sept compléments de la PR du MCO.",
  },
  {
    formation: "bts-mco",
    bloc: "Bloc 3 · Assurer la gestion opérationnelle",
    preuve: "Audit du référentiel (arrêté du 15 octobre 2018 modifié le 8 juillet 2024), savoir par savoir, puis les seize chapitres et les sept compléments de la PR du MCO.",
  },
  {
    formation: "bts-mco",
    bloc: "Bloc 4 · Manager l'équipe commerciale",
    preuve: "Audit du référentiel (arrêté du 15 octobre 2018 modifié le 8 juillet 2024), savoir par savoir, puis les seize chapitres et les sept compléments de la PR du MCO.",
  },
  {
    formation: "bts-ndrc",
    bloc: "Bloc 1 · Relation client et négociation-vente",
    preuve: "Audit du référentiel du BTS NDRC, savoir par savoir, puis les huit chapitres et les six compléments de la PR du NDRC.",
  },
  {
    formation: "bts-ndrc",
    bloc: "Bloc 2 · Relation client à distance et digitalisation",
    preuve: "Audit du référentiel du BTS NDRC, savoir par savoir, puis les huit chapitres et les six compléments de la PR du NDRC.",
  },
  {
    formation: "bts-ndrc",
    bloc: "Bloc 3 · Relation client et animation de réseaux",
    preuve: "Audit du référentiel du BTS NDRC, savoir par savoir, puis les huit chapitres et les six compléments de la PR du NDRC.",
  },
  {
    formation: "dcg",
    bloc: "UE6 · Finance d'entreprise",
    preuve: "Programme 2025 (sessions 2027 et suivantes) : les six chapitres du BTS CG P6 (PR #351), puis les sept chapitres et les deux compléments de la PR de l'UE6.",
  },
  {
    formation: "dcg",
    bloc: "UE11 · Contrôle de gestion",
    preuve: "Programme 2025 (sessions 2027 et suivantes) : audit du contrôle de gestion, PR #347 et #348.",
  },
  {
    formation: "stmg",
    bloc: "Thème 1 · Appliquer les règles comptables",
    partie: "Terminale, gestion et finance",
    preuve: "Audit de la finance (BO spécial n° 8 du 25 juillet 2019), puis la PR #349.",
  },
  {
    formation: "stmg",
    bloc: "Thème 2 · Analyser la situation de l'entreprise",
    partie: "Terminale, gestion et finance",
    preuve: "Audit de la finance (BO spécial n° 8 du 25 juillet 2019), puis la PR #349.",
  },
  {
    formation: "stmg",
    bloc: "Thème 3 · Accompagner la prise de décision",
    partie: "Terminale, gestion et finance",
    preuve: "Audit de la finance (BO spécial n° 8 du 25 juillet 2019), puis la PR #349.",
  },
  // lot D STMG : mercatique de terminale, les trois thèmes (début)
  {
    formation: "stmg",
    bloc: "Thème 1 · La définition de l'offre",
    partie: "Terminale, mercatique",
    preuve: "Audit du chantier STMG (8 novembre 2026, section 4, annexe 2 de l'arrêté du 19 juillet 2019), question par question. Lot D du chantier STMG. 1.1 « Segmenter et cibler » et « Positionner l'offre : marque, gamme, types de marketing ». 1.2 « L'expérience client et la valeur perçue », la valeur perçue partagée avec « Les formes de la valeur » de la SGN. 1.3 « Le prix psychologique », « La demande répond au prix » et « Les politiques tarifaires ».",
  },
  {
    formation: "stmg",
    bloc: "Thème 2 · La distribution de l'offre",
    partie: "Terminale, mercatique",
    preuve: "Audit du chantier STMG (8 novembre 2026, section 4, annexe 2 de l'arrêté du 19 juillet 2019), question par question. Lot D du chantier STMG. 2.1 « Les canaux de distribution » et son complément (intensive, sélective ou exclusive, unités physiques et virtuelles, désintermédiation et réintermédiation, ECR). 2.2 « Le parcours client : ROPO, cross-canal, omnicanal ». 2.3 « Vendre en ligne : e-commerce, m-commerce, place de marché ».",
  },
  {
    formation: "stmg",
    bloc: "Thème 3 · La communication de l'offre",
    partie: "Terminale, mercatique",
    preuve: "Audit du chantier STMG (8 novembre 2026, section 4, annexe 2 de l'arrêté du 19 juillet 2019), question par question. Lot D du chantier STMG. 3.1 « Ce que rapporte la communication » et « Le plan de communication : objectifs, cibles, médias, copy strategy ». 3.2 « Fidéliser grâce au numérique : programme, valeur vie, gestion de la relation client » et « Influence, communauté et e-réputation ».",
  },
  // lot D STMG (fin)
];

/** Vrai si le bloc du diplôme est une matière couverte en entier. */
export const couverteEnEntier = (formation: string, bloc: string, partie?: string): boolean =>
  MATIERES_COUVERTES_EN_ENTIER.some((m) => m.formation === formation && m.bloc === bloc && m.partie === partie);
