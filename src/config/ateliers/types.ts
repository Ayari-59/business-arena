/**
 * ATELIERS PROFESSIONNELS.
 *
 * Un atelier n'est pas du code, c'est une DONNÉE : un déroulé de plusieurs
 * séances, adossé à une partie réelle, qui dit à l'enseignant ce qu'il prépare,
 * ce que les élèves produisent et ce qu'il évalue. Ajouter un atelier, c'est
 * ajouter une entrée au registre.
 *
 * La règle qui tient tout : chaque séance produit une TRACE. Un business game
 * qui ne laisse que des souvenirs ne remplit pas un passeport professionnel.
 */

/** Un moment de la séance, avec sa durée : un déroulé sans minutes ne s'anime pas. */
export interface AtelierPhase {
  minutes: number;
  titre: string;
  detail: string;
}

export interface AtelierSeance {
  numero: number;
  titre: string;
  /** Durée de la séance, en minutes. */
  dureeMinutes: number;
  /**
   * Le tour de la partie joué pendant cette séance, s'il y en a un. Une séance
   * peut n'en jouer aucun : la dernière sert à rendre compte.
   */
  tourJoue: number | null;
  /** Processus du référentiel mobilisés, nommés comme le référentiel les nomme. */
  processus: string[];
  objectif: string;
  /**
   * Ce que l'élève sait faire à la fin, écrit à la première personne : c'est la
   * forme qu'attend un passeport professionnel, et elle oblige à nommer un acte
   * plutôt qu'un chapitre.
   */
  competences: string[];
  notions: string[];
  /** Ce que l'enseignant fait AVANT la séance, dans le produit et sur papier. */
  preparation: string;
  deroule: AtelierPhase[];
  /** Ce que l'équipe rend à la fin de la séance. */
  livrable: string;
  /** La phrase à verser au passeport professionnel. */
  tracePasseport: string;
  /** Les critères sur lesquels le livrable est regardé. */
  evaluation: string[];
}

export interface AtelierDefinition {
  code: string;
  titre: string;
  diplome: string;
  annee: string;
  /**
   * Le mot par lequel le référentiel du diplôme découpe le métier. Le BTS CG
   * a des processus, le BTS MCO des blocs de compétences, le BTS GPME des
   * activités, le DCG des unités d'enseignement. Écrire « processus » sur la
   * fiche d'un diplôme qui n'en a pas, c'est se tromper devant le seul lecteur
   * qui connaît son référentiel par cœur.
   */
  referentielLabel: string;
  /**
   * L'accord du participe qui suit ce mot. « Blocs mobilisés » mais
   * « activités mobilisées » : le genre est une donnée du diplôme, pas une
   * chose que la phrase peut deviner.
   */
  referentielAccord: "mobilisés" | "mobilisées";
  /** Une phrase : ce que l'atelier fait faire aux élèves. */
  pitch: string;
  /** Résumé d'une ligne, pour la carte du tableau récapitulatif. */
  resume: string;
  /** Exigence, de 1 (initiation) à 4 (avancé), et son mot. */
  difficulte: 1 | 2 | 3 | 4;
  difficulteLabel: string;
  /** Durée telle qu'elle s'annonce à un enseignant (« 6 séances de 4 h »). */
  format: string;
  /** Pourquoi un jeu d'entreprise plutôt qu'un dossier, dit sans slogan. */
  pourquoi: string;
  /** Les réglages de la partie qui porte l'atelier. */
  reglages: {
    scenarioCode: string;
    periodicite: "month" | "quarter" | "year";
    periodiciteLabel: string;
    niveau: number;
    niveauNom: string;
    equipes: number;
    bots: number;
    tva: boolean;
    mondeVariable: boolean;
    quizMode: string;
    /**
     * Tours à demander à la création. Une partie dure par défaut tous les tours
     * du secteur, et un atelier dont la dernière séance rend compte en joue
     * moins : la partie restait alors ouverte sur des tours que personne ne
     * jouerait, sans classement final ni relevé complet.
     */
    tours: number;
    notes: string;
  };
  seances: AtelierSeance[];
  /**
   * Les tempos possibles pour le MÊME contenu. Un atelier hebdomadaire, une
   * semaine bloquée et un fil rouge sur l'année ne demandent pas d'écrire trois
   * ateliers : ils demandent de dire comment on découpe celui-là.
   */
  formats: { nom: string; quand: string; comment: string }[];
  /** Comment l'atelier se note, une fois les six séances passées. */
  evaluationFinale: string[];
  /** Ce qu'on peut faire ensuite, quand l'atelier a bien tourné. */
  prolongements: string[];
  /** Les questions que pose un enseignant avant de se lancer, et leurs réponses. */
  faq: { question: string; reponse: string }[];
}
