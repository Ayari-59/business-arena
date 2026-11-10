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
    // lot C STMG : 1.3 et 1.4 ont désormais leur version lycée.
    preuve:
      "Audit de la finance (BO spécial n° 8 du 25 juillet 2019), puis la PR #349 (1.1 et 1.2). 1.3 et 1.4, au niveau du lycée (décision du propriétaire, novembre 2026 ; lot C STMG) : « Investir, amortir, clôturer : une image fidèle des comptes ». Il traite le processus d'investissement, l'actif et la charge, le coût d'acquisition, le plan d'amortissement linéaire, l'exercice et l'inventaire, les quatre principes, le stock final, la créance dépréciée, la cession et son résultat, l'annexe. Les chapitres de BTS qui les couvraient restent hors de la page STMG.",
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
    // lot C STMG : 3.4 a désormais sa version lycée.
    preuve:
      "Audit de la finance (BO spécial n° 8 du 25 juillet 2019), puis la PR #349 (3.1 à 3.3). 3.4, au niveau du lycée (décision du propriétaire, novembre 2026 ; lot C STMG) : « Coût complet ou coût spécifique : ce que coûte chaque produit ». Il traite les charges directes et indirectes, coût complet, coût partiel et marge sur coût variable, coût spécifique et marge sur coûts spécifiques, coût marginal et commande supplémentaire, intérêts et limites des méthodes. Le seuil de rentabilité s'y ajoute par « Assez vendre pour ne rien perdre » (le seuil de rentabilité, lot A), qui cite ce thème en second.",
  },
  // lot A STMG : sciences de gestion et numérique de première, les quatre thèmes (début)
  {
    formation: "stmg",
    bloc: "Thème 1 · De l'individu à l'acteur",
    partie: "Première, sciences de gestion et numérique",
    // lot E STMG : T1.3 nomme les chapitres de ressources humaines qui restent sous ce thème.
    preuve: "Audit du chantier STMG, section 1 (annexe 3 du BO spécial n° 1 du 22 janvier 2019), puis le lot A. T1.1 : « De l'individu à l'acteur ». T1.2 : « Qui possède, qui dirige, qui contrôle ? », partagé avec le management 1.2. T1.3 : « Qualification, compétences et nouveaux liens de travail ». La rémunération, le coût du travail et le tableau de bord social y viennent des chapitres de ressources humaines qui citent ce thème en premier : « Du salaire brut au coût pour l'entreprise », « L'effectif et la masse salariale », « Les indicateurs sociaux ». « Recruter », « Former » et « Rémunération et motivation » s'affichent sous les thèmes de ressources humaines depuis le lot E.",
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
  // lot C STMG : la partie commune de terminale (management, sciences de gestion et numérique), ses trois thèmes et ses douze questions (début)
  {
    formation: "stmg",
    bloc: "Thème 1 · Les organisations et l'activité de production de biens et de services",
    partie: "Terminale, enseignement commun",
    preuve:
      "Audit du chantier STMG, section 3 (annexe 2 de l'arrêté du 19 juillet 2019), puis le lot C. 1.1 : « Une offre pour un besoin » (démarche et approches marketing, étude de marché et veille, valeur ajoutée, valeur d'une organisation publique, innovation de produits, modèles économiques). 1.2 : « Les ressources pour produire » (tangibles et intangibles, financement de l'investissement et de l'exploitation, FRNG, BFR et trésorerie nette, GPEC, recrutement et formation, formes de la relation de travail). 1.3 : « Organiser la production » (modes de production, productivité, flux, logistique, qualité, cycle de vie). Le contrôle des coûts de 1.3 : « Coût complet ou coût spécifique », qui cite ce thème en second. Avec « Produire » et « Produire bien ». 1.4 : « Le numérique dans la production » (dématérialisation, automatisation, workflow, PGI, nuage, objets connectés, intelligence artificielle, données ouvertes, diagramme des flux). 1.5 : « Organiser le travail et coordonner » (organisation rigide ou souple, polyvalence, enrichissement, spécialisation, taylorisme et toyotisme, modes de coordination, centralisation, délégation et reporting, lean, performance sociale).",
  },
  {
    formation: "stmg",
    bloc: "Thème 2 · Les organisations et les acteurs",
    partie: "Terminale, enseignement commun",
    preuve:
      "Audit du chantier STMG, section 3, puis le lot C. 2.1 : « Fédérer les acteurs » (intérêts convergents et divergents, statuts, culture, styles de direction, dynamique de groupe, coopération et outils collaboratifs, facteurs de motivation, qualité de vie au travail), avec « Les acteurs de l'organisation et le partage de la valeur ». 2.2 : « Le client à l'ère numérique » (processus d'achat et facteurs, relation client digitalisée et Customer Relationship Management, traces numériques, réseaux sociaux, administration électronique). 2.3 : « Communiquer avec chaque acteur » (stratégie et formes de communication, communication globale, interne et externe, institutionnelle et commerciale, marque employeur, e-réputation, identité numérique, communication financière, normalisation, plan d'affaires), qui cite aussi le thème 3 de ressources humaines.",
  },
  {
    formation: "stmg",
    bloc: "Thème 3 · Les organisations et la société",
    partie: "Terminale, enseignement commun",
    preuve:
      "Audit du chantier STMG, section 3, puis le lot C, au niveau du lycée. 3.1 : « Éthique, transparence et égalité » (éthique et déontologie, éthique des affaires et des organisations publiques, lobbying, greenwashing et social washing, normalisation comptable et transparence, discriminations et égalité entre les femmes et les hommes, mécénat, démocratie participative). 3.2 : « Les modes de vie changent » (temps, lieu et organisation du travail, déconnexion, modes de consommation). 3.3 : « Données et algorithmes » (données personnelles et stratégiques, transparence des algorithmes, chaîne de blocs). 3.4 : « S'implanter sur un territoire » (implantation, délocalisation, relocalisation, écosystème d'affaires, cluster, écosystème d'innovation, pouvoirs publics locaux). « La responsabilité sociétale » et « Ce que rapporte l'engagement » restent sous ce thème, pour aller plus loin.",
  },
  // lot C STMG (fin)
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
  // lot E STMG : les ressources humaines et la communication de terminale, leurs trois thèmes et leurs neuf questions (début)
  {
    formation: "stmg",
    bloc: "Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
    partie: "Terminale, ressources humaines et communication",
    preuve:
      "Audit du chantier STMG, section 5 (annexe 2 de l'arrêté du 19 juillet 2019), puis le lot E. 1.1 : « Recruter et intégrer » (compétences, qualification et potentiel, processus de recrutement, recherche interne et externe, e-recrutement, sélection et non-discrimination, CDI, contrat saisonnier, intérim et apprentissage, accueil, intégration et fidélisation). S'y ajoutent « Recruter » (le coût d'une embauche) et la GPEC de « Les ressources pour produire », qui cite ce thème en second. 1.2 : « Évaluer le travail » (modes d'évaluation et leurs biais, grille pondérée, entretien annuel d'évaluation, entretien de parcours professionnel et son état des lieux, bilan de compétences). L'entretien de parcours professionnel est le nom que la loi du 24 octobre 2025 donne à l'entretien professionnel du texte. 1.3 : « Développer les compétences » (formation continue, e-learning, plan de développement des compétences, CPF, projet de transition professionnelle, mobilité, parcours, employabilité), avec « Former ».",
  },
  {
    formation: "stmg",
    bloc: "Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
    partie: "Terminale, ressources humaines et communication",
    preuve:
      "Audit du chantier STMG, section 5, puis le lot E. 2.1 : « Qualité de vie et conditions de travail » (facteurs d'hygiène et de motivation, qualité de vie et des conditions de travail, responsabilité et performance sociales, ergonomie, durée du travail, heures supplémentaires, repos et durées maximales). 2.2 : « Santé et sécurité au travail » (obligation de sécurité, document unique, accident du travail et de trajet, maladie professionnelle, TMS, risques psychosociaux et harcèlement, taux de fréquence et de gravité, prévention). Il traite aussi la protection sociale et la complémentaire santé. S'y ajoute « Les indicateurs sociaux » (l'absentéisme, sous la SGN). 2.3 : « Au-delà du salaire » (fixe, primes individuelles et collectives, avantages, intéressement, participation et sa formule, plafond et répartition, épargne salariale et abondement), avec « Rémunération et motivation », et « Du salaire brut au coût pour l'entreprise » (sous la SGN).",
  },
  {
    formation: "stmg",
    bloc: "Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
    partie: "Terminale, ressources humaines et communication",
    preuve:
      "Audit du chantier STMG, section 5, puis le lot E. 3.1 : « Le climat social et le conflit » (relations professionnelles, climat social et ses signaux, conflits individuels et collectifs, droit de grève, coût du conflit, négociation, conciliation, médiation, arbitrage, compromis et dépassement). 3.2 : « Le dialogue social » (acteurs, comité social et économique, information, consultation, concertation et négociation, niveaux de la négociation collective, BDESE, que le texte de 2019 nomme BDES, bilan social, accord d'entreprise sans délégué syndical). 3.3 : « Communication interne et marque employeur » (finalités, intranet, réseau social d'entreprise, outils collaboratifs, droit à la déconnexion, marque employeur interne et externe, avis en ligne). S'y ajoute « Communiquer avec chaque acteur », qui cite ce thème en second (communication externe et financière, e-réputation).",
  },
  // lot E STMG (fin)
];

/** Vrai si le bloc du diplôme est une matière couverte en entier. */
export const couverteEnEntier = (formation: string, bloc: string, partie?: string): boolean =>
  MATIERES_COUVERTES_EN_ENTIER.some((m) => m.formation === formation && m.bloc === bloc && m.partie === partie);
