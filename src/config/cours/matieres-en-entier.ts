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
  // lot A STMG : sciences de gestion et numérique de première, les quatre thèmes (début)
  {
    formation: "stmg",
    bloc: "Thème 1 · De l'individu à l'acteur",
    partie: "Première, sciences de gestion et numérique",
    preuve: "Audit du chantier STMG, section 1 (annexe 3 du BO spécial n° 1 du 22 janvier 2019), puis le lot A. T1.1 : « De l'individu à l'acteur ». T1.2 : « Qui possède, qui dirige, qui contrôle ? », partagé avec le management 1.2. T1.3 : « Qualification, compétences et nouveaux liens de travail », avec les chapitres de ressources humaines qui citent ce thème.",
  },
  {
    formation: "stmg",
    bloc: "Thème 2 · Numérique et intelligence collective",
    partie: "Première, sciences de gestion et numérique",
    preuve: "Audit du chantier STMG, section 1 (annexe 3 du BO spécial n° 1 du 22 janvier 2019), puis le lot A. T2.1 : « Données personnelles et données ouvertes », avec « Des données à l'information ». T2.2 : le complément de « Décider ensemble » (rôles et droits, communauté, IA). T2.3 : « Le processus et le PGI ».",
  },
  {
    formation: "stmg",
    bloc: "Thème 3 · Création de valeur et performance",
    partie: "Première, sciences de gestion et numérique",
    preuve: "Audit du chantier STMG, section 1 (annexe 3 du BO spécial n° 1 du 22 janvier 2019), puis le lot A. T3.1 : « Les formes de la valeur », avec la valeur ajoutée et les comptes. T3.2 : « La performance globale au tableau de bord », avec le marché et la rentabilité.",
  },
  {
    formation: "stmg",
    bloc: "Thème 4 · Temps et risque",
    partie: "Première, sciences de gestion et numérique",
    preuve: "Audit du chantier STMG, section 1 (annexe 3 du BO spécial n° 1 du 22 janvier 2019), puis le lot A. T4.1 : le seuil, le budget de trésorerie, « Le temps de l'organisation » et « Une information qui circule à temps ». T4.2 : « Les risques de la performance ».",
  },
  // lot A STMG (fin)
  // lot B STMG : le management de première, ses trois thèmes et ses onze questions.
  {
    formation: "stmg",
    bloc: "Thème 1 · À la rencontre du management des organisations",
    partie: "Première, management",
    preuve:
      "Audit du management de première (annexe 2 du BO spécial n° 1 du 22 janvier 2019, section 2). 1.1 : « Organiser l'action collective » et « Produire ». 1.3 : « Manager : fonctions et décisions ». 1.4 : « Le management face au changement ». 1.2 : « Qui possède, qui dirige, qui contrôle ? La diversité des organisations », le chapitre A2 du lot A, qui cite ce thème en second (finalités, marchand et non marchand, privé, public et partenariat public-privé, financement privé et public, entreprise publique, associations, ONG, syndicats et fondations).",
  },
  {
    formation: "stmg",
    bloc: "Thème 2 · Le management stratégique, du diagnostic à la fixation des objectifs",
    partie: "Première, management",
    preuve:
      "Audit du management de première (section 2). 2.1 et 2.2 : le complément du « Diagnostic stratégique » (définition et démarche, veille, facteurs clés de succès, compétences distinctives). 2.3 et 2.4 : le complément de « Se fixer des objectifs et les suivre » (finalité et RSE, conflit et consensus, variété et appropriation des indicateurs), et « Construire un indicateur juste ».",
  },
  {
    formation: "stmg",
    bloc: "Thème 3 · Les choix stratégiques des organisations",
    partie: "Première, management",
    preuve:
      "Audit du management de première (section 2) : 3.1 par « Domaines d'activité : se spécialiser ou se diversifier » et « Intégrer, externaliser, croître », 3.2 par « La stratégie d'une organisation publique », 3.3 par « La stratégie d'une association ».",
  },
  // fin du lot B STMG.
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
