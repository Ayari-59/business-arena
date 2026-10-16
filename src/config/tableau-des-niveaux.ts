import { DIFFICULTY_PRESETS, type DifficultyPreset } from "./difficulty";
import { LEVIERS } from "./decisions";
import { investissementPlafonne } from "../engine/investment/plafond";

/**
 * LE TABLEAU DES NIVEAUX, SUR /jouer.
 *
 * Le propriétaire : « je pense qu'il faut être plus clair sur les niveaux. » Le
 * curseur ne disait qu'un nom et une phrase ; on découvrait en jouant qu'au
 * niveau 3 on achète des machines sans pouvoir embaucher. Sous le choix du
 * niveau, trois blocs disent donc ce que le niveau confie au joueur, ce qu'il
 * tient pour lui, et ce que le suivant ouvre.
 *
 * RIEN N'EST ÉCRIT À LA MAIN NIVEAU PAR NIVEAU. Les blocs se lisent dans les
 * préréglages (`difficulty.ts` : leviers ouverts, plafond d'indices, intensité
 * des aléas) et dans le registre des leviers (`decisions.ts`, pour l'ordre) ;
 * le seul texte propre à ce module est une table de libellés PAR LEVIER, que le
 * typage oblige à tenir complète : un levier ajouté aux préréglages sans libellé
 * ne compile pas, et un levier ouvert à un niveau paraît dans son tableau.
 */

type CleDesPreselections = keyof DifficultyPreset["decisions"];
/** Un groupe de leviers : un drapeau du niveau, ou ce qui est de tous les niveaux. */
export type GroupeDeLeviers = CleDesPreselections | "toujours" | "secteur";

interface LibelleDuGroupe {
  /** Dans « Vous décidez » : ce que le joueur tient, dans ses mots. */
  decidez: string;
  /** Dans « Géré pour vous » : ce qui reste fixé quand le niveau ne l'ouvre pas. */
  gere: string;
  /** La ligne du comparatif. */
  court: string;
  /** Dans une phrase qui dit où chaque levier s'ouvre : « la qualité ». */
  phrase: string;
}

export const LIBELLES_DES_LEVIERS: Readonly<Record<GroupeDeLeviers, LibelleDuGroupe>> = {
  toujours: {
    decidez: "Le prix, la production et le marketing",
    gere: "",
    court: "Prix, production, marketing", phrase: "le prix, la production et le marketing",
  },
  secteur: {
    decidez: "Le fournisseur, les commandes exceptionnelles et les études, selon l'entreprise",
    gere: "",
    court: "Fournisseur, commandes, études", phrase: "le fournisseur, les commandes exceptionnelles et les études",
  },
  quality: { decidez: "Le budget qualité", gere: "La qualité, tenue au niveau du marché", court: "Qualité", phrase: "la qualité" },
  maintenance: {
    decidez: "L'entretien de l'outil",
    gere: "L'entretien, au budget de référence",
    court: "Maintenance", phrase: "la maintenance",
  },
  rd: {
    decidez: "La recherche et développement",
    gere: "La R&D : les nouvelles références arrivent prêtes",
    court: "R&D", phrase: "la R&D",
  },
  hr: {
    decidez: "Les embauches, la formation et les salaires",
    gere: "L'effectif et les salaires, fixés",
    court: "Effectif et salaires", phrase: "les ressources humaines",
  },
  rse: { decidez: "L'engagement RSE", gere: "La RSE, sans budget engagé", court: "RSE", phrase: "la RSE" },
  finance: {
    decidez: "L'emprunt et l'apport des associés",
    gere: "La banque : le découvert couvre un manque, sans emprunt à décider",
    court: "Emprunt et apport", phrase: "l'emprunt et l'apport des associés",
  },
  investment: {
    decidez: "L'investissement en capacité",
    gere: "La capacité de l'outil, fixée",
    court: "Investissement", phrase: "l'investissement",
  },
  dividend: {
    decidez: "Le dividende versé aux associés",
    gere: "Le résultat, gardé en réserve",
    court: "Dividende", phrase: "l'affectation du résultat",
  },
  creances: {
    decidez: "Les créances clients : escompte et affacturage",
    gere: "Les créances, encaissées à leur échéance",
    court: "Créances clients", phrase: "la mobilisation des créances",
  },
  placement: {
    decidez: "Le placement du surplus de trésorerie",
    gere: "La trésorerie, laissée en compte",
    court: "Placement", phrase: "le placement du surplus",
  },
  insurance: { decidez: "L'assurance", gere: "Aucune assurance souscrite", court: "Assurance", phrase: "l'assurance" },
  croissanceExterne: {
    decidez: "Le rachat d'un site à l'arrêt, d'un fournisseur ou d'une entreprise étrangère",
    gere: "Aucun rachat : la croissance reste interne",
    court: "Croissance externe", phrase: "la croissance externe",
  },
  externalisation: {
    decidez: "La sous-traitance : fabriquer ou faire fabriquer",
    gere: "Toute la production dans votre atelier",
    court: "Sous-traitance", phrase: "la sous-traitance",
  },
};

/** L'investissement aux niveaux qui le plafonnent : la règle dite dans le libellé. */
export const INVESTISSEMENT_PLAFONNE = "L'investissement, à hauteur de votre équipe";
const INVESTISSEMENT_LIBERE = "L'investissement au-delà de votre équipe, avec les embauches";

const ouvert = (p: DifficultyPreset, g: GroupeDeLeviers) =>
  g === "toujours" || g === "secteur" || p.decisions[g] === true;

/**
 * Les groupes, dans l'ORDRE OÙ ILS S'OUVRENT (le premier niveau qui les donne) :
 * le comparatif se lit alors en escalier, de l'exploitation à la stratégie. À
 * niveau égal, l'ordre du registre des leviers (le cycle d'exploitation) ; puis
 * tout drapeau des préréglages que le registre ne connaîtrait pas encore.
 */
export function groupesDansLOrdre(presets: readonly DifficultyPreset[] = DIFFICULTY_PRESETS): GroupeDeLeviers[] {
  const ordre: GroupeDeLeviers[] = [];
  for (const l of LEVIERS) if (!ordre.includes(l.ouvertPar)) ordre.push(l.ouvertPar);
  for (const p of presets)
    for (const cle of Object.keys(p.decisions) as CleDesPreselections[])
      if (!ordre.includes(cle)) ordre.push(cle);
  const ouvertureDe = (g: GroupeDeLeviers) => {
    const i = presets.findIndex((p) => ouvert(p, g));
    return i < 0 ? presets.length : i;
  };
  return ordre
    .map((g, rang) => ({ g, rang, niveau: ouvertureDe(g) }))
    .sort((a, b) => a.niveau - b.niveau || a.rang - b.rang)
    .map((x) => x.g);
}

const libelleOuvert = (p: DifficultyPreset, g: GroupeDeLeviers) =>
  g === "investment" && investissementPlafonne(p.decisions) ? INVESTISSEMENT_PLAFONNE : LIBELLES_DES_LEVIERS[g].decidez;

/** Les indices, en une phrase lue dans le préréglage. */
function indices(n: number): string {
  return n === 0 ? "Aucun indice" : `Jusqu'à ${n} indice${n > 1 ? "s" : ""} par situation`;
}

/** L'intensité des aléas, en mots : le multiplicateur du préréglage. */
function aleas(m: number): string {
  if (m < 1) return "Des aléas moins fréquents qu'en temps normal";
  if (m === 1) return "Des aléas à leur fréquence normale";
  return "Des aléas plus fréquents qu'en temps normal";
}

export interface TableauDuNiveau {
  level: number;
  decidez: string[];
  gere: string[];
  /** Ce que le niveau suivant ouvre ; vide au dernier. */
  suivant: string[];
  /** Les indices et les aléas du niveau, en une ligne. */
  reperes: string;
}

export function tableauDuNiveau(
  level: number,
  presets: readonly DifficultyPreset[] = DIFFICULTY_PRESETS,
): TableauDuNiveau | null {
  const i = presets.findIndex((p) => p.level === level);
  const p = presets[i];
  if (!p) return null;
  const groupes = groupesDansLOrdre(presets);
  const decidez = groupes.filter((g) => ouvert(p, g)).map((g) => libelleOuvert(p, g));
  const gere = groupes.filter((g) => !ouvert(p, g)).map((g) => LIBELLES_DES_LEVIERS[g].gere);
  const suivantP = presets[i + 1];
  const suivant: string[] = [];
  if (suivantP) {
    for (const g of groupes) {
      if (!ouvert(p, g) && ouvert(suivantP, g)) suivant.push(libelleOuvert(suivantP, g));
    }
    if (investissementPlafonne(p.decisions) && !investissementPlafonne(suivantP.decisions) && suivantP.decisions.investment) {
      suivant.push(INVESTISSEMENT_LIBERE);
    }
    if (suivantP.hintMaxLevel !== p.hintMaxLevel) suivant.push(indices(suivantP.hintMaxLevel));
    if (suivantP.eventProbabilityMultiplier > p.eventProbabilityMultiplier) {
      suivant.push("Des aléas plus fréquents");
    }
  }
  return {
    level: p.level,
    decidez,
    gere,
    suivant,
    reperes: `${indices(p.hintMaxLevel)} · ${aleas(p.eventProbabilityMultiplier)}`,
  };
}

/** Une case du comparatif : ouvert, ouvert sous plafond, ou fermé. */
export type CaseDuComparatif = "oui" | "plafonne" | "non";

export interface ComparatifDesNiveaux {
  niveaux: { level: number; name: string }[];
  lignes: { groupe: GroupeDeLeviers; libelle: string; cases: CaseDuComparatif[] }[];
  /** Le plafond d'indices de chaque niveau, dans l'ordre des colonnes. */
  indices: number[];
}

export function comparatifDesNiveaux(
  presets: readonly DifficultyPreset[] = DIFFICULTY_PRESETS,
): ComparatifDesNiveaux {
  return {
    niveaux: presets.map((p) => ({ level: p.level, name: p.name })),
    lignes: groupesDansLOrdre(presets).map((g) => ({
      groupe: g,
      libelle: LIBELLES_DES_LEVIERS[g].court,
      cases: presets.map((p) =>
        !ouvert(p, g) ? "non" : g === "investment" && investissementPlafonne(p.decisions) ? "plafonne" : "oui",
      ),
    })),
    indices: presets.map((p) => p.hintMaxLevel),
  };
}

/**
 * Où s'ouvre chaque levier, en une phrase : « le prix, la production et le
 * marketing au niveau Découverte, la qualité et la maintenance au niveau
 * Gestion, … ». Lue dans les préréglages : le guide la cite au lieu de l'écrire.
 */
export function phraseDesOuvertures(presets: readonly DifficultyPreset[] = DIFFICULTY_PRESETS): string {
  const groupes = groupesDansLOrdre(presets).filter((g) => g !== "secteur");
  const enumerer = (mots: string[]) =>
    mots.length <= 1 ? (mots[0] ?? "") : `${mots.slice(0, -1).join(", ")} et ${mots.at(-1)}`;
  const parties: string[] = [];
  presets.forEach((p, i) => {
    const avant = presets[i - 1];
    const nouveaux = groupes.filter((g) => ouvert(p, g) && !(avant && ouvert(avant, g)));
    if (nouveaux.length > 0) {
      parties.push(`${enumerer(nouveaux.map((g) => LIBELLES_DES_LEVIERS[g].phrase))} au niveau ${p.name}`);
    }
  });
  return parties.join(", ");
}
