import { ATELIERS } from "./ateliers";
import { DIFFICULTY_PRESETS } from "./difficulty";
import { SCENARIOS, scenarioByCode } from "./scenarios/registry";
import type { Periodicity } from "./scenarios/periodicity";

/**
 * Choisir la bonne simulation.
 *
 * Neuf secteurs, six niveaux, trois périodicités et une durée réglable font
 * beaucoup de combinaisons pour un enseignant qui découvre la plateforme, et
 * le mauvais choix ne se voit qu'en séance trois. Ce module répond à quatre
 * questions simples et rend un réglage complet, avec les RAISONS de chaque
 * élément : une recommandation qui ne s'explique pas ne s'adopte pas, et ne se
 * discute pas non plus.
 *
 * Rien n'est écrit en dur : les diplômes viennent des ateliers publiés, les
 * secteurs du registre des scénarios, les niveaux des préréglages. Un atelier
 * ajouté apparaît ici sans qu'on y touche.
 */

export type Semestre = "s1" | "s2";

export interface Objectif {
  code: string;
  libelle: string;
  /** Le secteur qui sert le mieux cet objectif, quand il y en a un. */
  secteur: string | null;
  /** Ce que l'objectif exige du niveau de jeu, au minimum. */
  niveauMinimum: number;
  /** La raison, telle qu'elle s'affiche à l'enseignant. */
  raison: string;
}

export const OBJECTIFS: readonly Objectif[] = [
  {
    code: "decouvrir",
    libelle: "Découvrir la gestion d'une entreprise",
    secteur: "nova",
    niveauMinimum: 1,
    raison:
      "NOVA porte un stock, un coût de production et des délais de règlement : les trois choses qu'on rencontre en premier, et elles suffisent à occuper une découverte.",
  },
  {
    code: "cout_seuil",
    libelle: "Les coûts et le seuil de rentabilité",
    secteur: "bistrot",
    niveauMinimum: 2,
    raison:
      "Le bistrot rend le ratio matières visible à chaque service, et son seuil se recalcule à chaque changement de carte : le calcul devient un réflexe plutôt qu'un chapitre.",
  },
  {
    code: "marge_commerciale",
    libelle: "La marge, le coefficient et l'assortiment",
    secteur: "boutique",
    niveauMinimum: 2,
    raison:
      "La boutique achète pour revendre : la marge s'y joue au coefficient et à la démarque, sans atelier de production pour brouiller la lecture.",
  },
  {
    code: "tresorerie_bfr",
    libelle: "La trésorerie, le poste clients et le BFR",
    secteur: "conseil",
    niveauMinimum: 3,
    raison:
      "Le cabinet de conseil a presque tout son argent chez ses clients : le besoin en fonds de roulement y devient concret au lieu d'être une formule.",
  },
  {
    code: "relation_client",
    libelle: "L'acquisition et la fidélisation des clients",
    secteur: "ecommerce",
    niveauMinimum: 2,
    raison:
      "Le commerce en ligne est le seul secteur où le coût d'acquisition d'un client se mesure : l'équipe engage un budget, compte les clients venus, et divise.",
  },
  {
    code: "saison_prevision",
    libelle: "La saisonnalité et la prévision",
    secteur: "hotel",
    niveauMinimum: 2,
    raison:
      "Une chambre vide ce soir est perdue pour toujours : l'hôtel oblige à prévoir avant de vendre, et sanctionne la prévision fausse dès le tour suivant.",
  },
  {
    code: "risques",
    libelle: "Les risques et leur couverture",
    secteur: "batiment",
    niveauMinimum: 3,
    raison:
      "Le bâtiment porte des chantiers en cours et des aléas de chantier : les risques y ont un montant, ce qui permet de les arbitrer plutôt que de les qualifier.",
  },
  {
    code: "diagnostic_financier",
    libelle: "Le diagnostic financier complet",
    secteur: "nova",
    niveauMinimum: 4,
    raison:
      "NOVA est le seul secteur dont le cycle d'exploitation est complet de bout en bout : bilan fonctionnel, soldes intermédiaires, investissement et financement s'y lisent ensemble.",
  },
];

export interface Recommandation {
  scenarioCode: string;
  scenarioTitre: string;
  niveau: number;
  niveauNom: string;
  tours: number;
  periodicite: Periodicity;
  /** L'atelier prêt à animer, quand le diplôme en a un. */
  atelierCode: string | null;
  /** Les raisons du réglage, une par décision prise. */
  pourquoi: string[];
}

export interface Demande {
  /** Code d'un atelier publié, ou « autre ». */
  diplome: string;
  semestre: Semestre;
  objectif: string;
}

/** Les diplômes proposés : ceux qui ont un atelier, plus une porte de sortie. */
export function diplomesProposes(): { code: string; libelle: string }[] {
  return [
    ...ATELIERS.map((a) => ({ code: a.code, libelle: `${a.diplome} · ${a.annee}` })),
    { code: "autre", libelle: "Un autre diplôme ou une autre formation" },
  ];
}

/**
 * Le réglage recommandé, et pourquoi.
 *
 * L'ordre des règles compte : l'atelier du diplôme donne la base, l'objectif
 * peut déplacer le secteur, et le semestre décide seul de l'ambition. Un
 * premier semestre reçoit un niveau plus bas et une partie plus courte, parce
 * que la classe découvre en même temps l'outil et la matière.
 */
export function recommander(demande: Demande): Recommandation {
  const atelier = ATELIERS.find((a) => a.code === demande.diplome) ?? null;
  const objectif = OBJECTIFS.find((o) => o.code === demande.objectif) ?? OBJECTIFS[0]!;
  const pourquoi: string[] = [];

  // 1. Le secteur : celui de l'objectif, qui est le plus parlant, sauf si
  //    l'atelier du diplôme en impose un autre pour de bonnes raisons.
  let scenarioCode = objectif.secteur ?? atelier?.reglages.scenarioCode ?? SCENARIOS[0]!.code;
  if (atelier && objectif.secteur && atelier.reglages.scenarioCode !== objectif.secteur) {
    pourquoi.push(
      `L'atelier ${atelier.diplome} se joue d'ordinaire sur un autre secteur ; votre objectif déplace le choix. ${objectif.raison}`,
    );
  } else {
    pourquoi.push(objectif.raison);
  }
  if (!SCENARIOS.some((s) => s.code === scenarioCode)) scenarioCode = SCENARIOS[0]!.code;

  // 2. Le niveau : celui de l'atelier, jamais sous ce que l'objectif exige,
  //    et rabattu d'un cran au premier semestre.
  const maximum = DIFFICULTY_PRESETS[DIFFICULTY_PRESETS.length - 1]!.level;
  let niveau = Math.max(atelier?.reglages.niveau ?? 2, objectif.niveauMinimum);
  if (demande.semestre === "s1") {
    // Le plancher de l'objectif ne se franchit pas : proposer « la trésorerie et
    // le BFR » sur un niveau qui n'ouvre pas le financement enverrait
    // l'enseignant chercher une banque qui n'existe pas dans sa partie.
    const abaisse = Math.max(objectif.niveauMinimum, 1, niveau - 1);
    if (abaisse !== niveau) {
      pourquoi.push(
        "Au premier semestre, la classe découvre l'outil en même temps que la matière : un niveau de moins laisse le temps de lire les résultats avant d'ouvrir de nouvelles décisions.",
      );
      niveau = abaisse;
    }
  }
  niveau = Math.min(maximum, Math.max(1, niveau));
  const preset = DIFFICULTY_PRESETS.find((p) => p.level === niveau)!;

  // 3. La durée : celle de l'atelier, raccourcie au premier semestre, et
  //    jamais plus longue que ce que le secteur porte.
  const scenario = scenarioByCode(scenarioCode);
  let tours = atelier?.reglages.tours ?? 4;
  if (demande.semestre === "s1" && tours > 3) {
    tours -= 1;
    pourquoi.push(
      `Une partie de ${tours} tours tient dans un premier semestre sans déborder sur les révisions, et laisse la place à un second essai au semestre suivant.`,
    );
  }
  tours = Math.min(scenario.scenario.roundsCount, Math.max(1, tours));

  const periodicite = atelier?.reglages.periodicite ?? "quarter";
  if (atelier) {
    pourquoi.push(
      `L'atelier « ${atelier.titre} » est écrit pour ce diplôme : ${atelier.format}, avec ses livrables et sa grille d'évaluation.`,
    );
  } else {
    pourquoi.push(
      "Aucun atelier n'est encore publié pour ce diplôme : le réglage ci-dessus reste jouable tel quel, et le déroulé d'un atelier voisin s'adapte en changeant le secteur.",
    );
  }

  return {
    scenarioCode,
    scenarioTitre: scenario.title,
    niveau,
    niveauNom: preset.name,
    tours,
    periodicite,
    atelierCode: atelier?.code ?? null,
    pourquoi,
  };
}
