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
];

/** Vrai si le bloc du diplôme est une matière couverte en entier. */
export const couverteEnEntier = (formation: string, bloc: string, partie?: string): boolean =>
  MATIERES_COUVERTES_EN_ENTIER.some((m) => m.formation === formation && m.bloc === bloc && m.partie === partie);
