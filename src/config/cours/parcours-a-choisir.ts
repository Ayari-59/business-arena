import { FORMATIONS, formationParCode, formationProposee } from "../formations";
import { PARCOURS } from "./parcours";
import { TAILLE_DES_PARCOURS } from "./taille-des-parcours";

/**
 * LES PARCOURS QU'UNE CLASSE PEUT CHOISIR, SANS LES CHAPITRES (./parcours-de-formation.ts les
 * réexporte, et y garde ce qui lit les chapitres : la liste de chaque parcours de formation, les
 * parcours qui ouvrent un chapitre).
 *
 * Le devis (le diplôme ou le parcours, audit produit du 10 novembre 2026, P1-4) et l'administration
 * lisent ces noms sans charger le registre du cours. La règle des parcours de formation :
 * ./parcours-de-formation.ts.
 *
 * UN PARCOURS PAR DIPLÔME (décision du propriétaire, 11 novembre 2026 ; audit du même jour, offre
 * P1-1, pédagogie P1-6, UX P1-4). Sous l'offre Classe, une classe ouvre un seul parcours, et aucun
 * ne valait le cours d'un diplôme : le DCG avait 5 chapitres à son nom sur les 74 de sa page, le
 * BTS CG et le BTS SAM aucun. Chaque diplôme dont aucun parcours ne couvrait la page a désormais le
 * sien, comme les trois BUT avant lui : « le cours du diplôme », qui réunit tous les chapitres que
 * sa page présente (/cours?diplome=…). Un parcours est donc, au choix, le cours d'un diplôme ou une
 * matière (un parcours du registre, ./parcours.ts), et les deux listes qui le font choisir (la
 * création d'une classe, le devis) le rangent par diplôme (`parcoursRangesParDiplome`).
 */

export interface ParcoursDeFormation {
  /** Le code que la classe enregistre : distinct de tout parcours du registre. */
  code: string;
  /** La formation (config/formations.ts) dont la page fait la liste. */
  formation: string;
  titre: string;
  resume: string;
}

/** Le résumé du cours d'un diplôme qu'aucun parcours du registre ne couvre. */
const leCoursDuDiplome = (du: string) =>
  `Le cours ${du} en entier : tous les chapitres que sa page présente, d'où qu'ils viennent, rangés sous les blocs de son référentiel. Une classe qui le choisit les ouvre tous, avec leurs cas pratiques.`;

/**
 * LE COURS DE CHAQUE DIPLÔME, dans l'ordre du registre des formations. Le titre le dit, « Le cours du
 * diplôme » ; la liste se lit dans la page du diplôme (./parcours-de-formation.ts), jamais à la main.
 */
export const PARCOURS_DE_FORMATION: readonly ParcoursDeFormation[] = [
  {
    // Le code « stmg » est celui du parcours de mercatique, au registre depuis le début.
    code: "bac-stmg",
    formation: "stmg",
    titre: "Bac STMG · Le cours du diplôme",
    resume: leCoursDuDiplome("du bac STMG"),
  },
  {
    code: "bts-cg",
    formation: "bts-cg",
    titre: "BTS CG · Le cours du diplôme",
    resume: leCoursDuDiplome("du BTS CG"),
  },
  {
    code: "bts-sam",
    formation: "bts-sam",
    titre: "BTS SAM · Le cours du diplôme",
    resume: leCoursDuDiplome("du BTS SAM"),
  },
  {
    code: "bts-mhr",
    formation: "bts-mhr",
    titre: "BTS MHR · Le cours du diplôme",
    resume: leCoursDuDiplome("du BTS MHR"),
  },
  {
    code: "but-gea",
    formation: "but-gea",
    titre: "BUT GEA · Le cours du diplôme",
    resume:
      "Les chapitres qui travaillent une compétence du BUT GEA, d'où qu'ils viennent : la comptabilité, le contrôle de gestion, la paie, la finance et la comptabilité approfondie, sur les chiffres de la simulation du cours.",
  },
  {
    code: "but-tc",
    formation: "but-tc",
    titre: "BUT TC · Le cours du diplôme",
    resume:
      "Les chapitres qui travaillent une compétence du BUT TC : vendre, piloter un espace de vente, conduire les actions marketing, manager la relation client, sur le marché et la boutique de la simulation du cours.",
  },
  {
    code: "but-gaco",
    formation: "but-gaco",
    titre: "BUT GACO · Le cours du diplôme",
    resume:
      "Les chapitres qui travaillent une compétence du BUT GACO : le pilotage interne et celui des ressources humaines, la démarche marketing, le développement des affaires, sur les chiffres de la simulation du cours.",
  },
  {
    code: "dcg",
    formation: "dcg",
    titre: "DCG · Le cours du diplôme",
    resume: leCoursDuDiplome("du DCG"),
  },
  {
    code: "dscg",
    formation: "dscg",
    titre: "DSCG · Le cours du diplôme",
    resume: leCoursDuDiplome("du DSCG"),
  },
];

export const parcoursDeFormationParCode = (code: string | null | undefined) => PARCOURS_DE_FORMATION.find((p) => p.code === code);

/** La formation où mène un parcours, du registre ou de formation ; null pour un parcours de discipline. */
export function formationDuParcours(code: string | null | undefined): string | null {
  if (!code) return null;
  return PARCOURS.find((p) => p.code === code)?.formation ?? parcoursDeFormationParCode(code)?.formation ?? null;
}

/**
 * LE PARCOURS DU COURS D'UN DIPLÔME (son « cours du diplôme ») : celui de sa formation, ou, pour une
 * option, celui de son diplôme (le BTS MHR, options B et C, a celui du BTS MHR). Null pour un diplôme
 * qui n'en a pas : ses parcours du registre le couvrent déjà (le BTS MCO, le BTS NDRC, le BTS GPME).
 */
export function parcoursDuDiplome(formation: string | null | undefined): string | null {
  if (!formation) return null;
  const diplome = formationParCode(formation)?.optionDe ?? formation;
  return PARCOURS_DE_FORMATION.find((p) => p.formation === diplome)?.code ?? null;
}

/** Les parcours qu'une classe peut choisir : ceux du registre, puis le cours de chaque diplôme. */
export const PARCOURS_A_CHOISIR: readonly { code: string; titre: string; formation: boolean }[] = [
  ...PARCOURS.map((p) => ({ code: p.code as string, titre: p.titre, formation: false })),
  ...PARCOURS_DE_FORMATION.map((p) => ({ code: p.code, titre: p.titre, formation: true })),
];

/** Le titre d'un parcours que la classe a choisi, du registre ou de formation. */
export const titreDuParcours = (code: string | null | undefined) => PARCOURS_A_CHOISIR.find((p) => p.code === code)?.titre;

/** Le code est-il un parcours qu'une classe peut choisir ? */
export const parcoursAChoisir = (code: string | null | undefined): code is string => PARCOURS_A_CHOISIR.some((p) => p.code === code);

/**
 * LES PARCOURS QU'UNE CLASSE PEUT CHOISIR AUJOURD'HUI : sans ceux des formations retirées
 * (config/formations-proposees.ts). Une classe qui en a déjà un le garde : `titreDuParcours` et
 * l'accès aux chapitres lisent la liste entière.
 */
export const PARCOURS_PROPOSES_A_CHOISIR = PARCOURS_A_CHOISIR.filter((p) => {
  const formation = formationDuParcours(p.code);
  return !formation || formationProposee(formation);
});

/** Le code est-il un parcours qu'une classe peut choisir aujourd'hui ? */
export const parcoursProposeAChoisir = (code: string | null | undefined): code is string =>
  PARCOURS_PROPOSES_A_CHOISIR.some((p) => p.code === code);

/* ---------------------------------------------------------------------------
 * LES DEUX LISTES QUI FONT CHOISIR UN PARCOURS, RANGÉES PAR DIPLÔME (décision du propriétaire,
 * 11 novembre 2026 ; audit UX du même jour, P1-4 et P2-12) : la création d'une classe
 * (/teacher/cours) et le devis (/devis) lisent la même.
 * ------------------------------------------------------------------------- */

/** Une entrée de la liste : le parcours, sa taille et les diplômes qu'il sert, en une ligne. */
export interface EntreeDeParcours {
  code: string;
  titre: string;
  /** « BTS CG · Le cours du diplôme · 61 chapitres » ; « Comptabilité générale · 39 chapitres · BTS CG, DCG… ». */
  libelle: string;
}

/** Un diplôme de la liste, ou les matières qui en servent plusieurs. */
export interface GroupeDeParcours {
  /** Le code de la formation ; « matieres » pour les parcours de discipline. */
  cle: string;
  libelle: string;
  parcours: readonly EntreeDeParcours[];
}

/** Le groupe des parcours de discipline, qui ne suivent aucun diplôme. */
export const LIBELLE_DES_MATIERES = "Par matière, pour plusieurs diplômes";

/**
 * CE QU'EST UN PARCOURS, dit sous les deux listes (audit UX du 11 novembre 2026, P2-12 : « parcours »
 * et « diplôme » désignaient deux découpages sans que le site le dise).
 */
export const CE_QU_EST_UN_PARCOURS =
  "Un parcours, ce sont les chapitres qu'une classe ouvre : le cours d'un diplôme, qui réunit tous les chapitres de sa page, ou une matière, qui sert plusieurs diplômes. Les prérequis qu'un chapitre annonce s'ouvrent avec lui.";

const sigleDe = (formation: string) => formationParCode(formation)?.sigle ?? formation;
const chapitres = (n: number) => `${n} chapitre${n > 1 ? "s" : ""}`;

/** La ligne d'un parcours : son titre, son nombre de chapitres, et les diplômes qu'il sert. */
export function libelleDuParcours(code: string): string {
  const titre = titreDuParcours(code) ?? code;
  const taille = TAILLE_DES_PARCOURS[code];
  if (!taille) return titre;
  // Le cours d'un diplôme sert son diplôme, que son titre nomme déjà.
  if (parcoursDeFormationParCode(code)) return `${titre} · ${chapitres(taille.chapitres)}`;
  const diplomes = taille.diplomes.length > 0 ? ` · ${taille.diplomes.map(sigleDe).join(", ")}` : "";
  return `${titre} · ${chapitres(taille.chapitres)}${diplomes}`;
}

/** Le groupe d'un parcours : le diplôme qu'il suit (une option compte pour le sien), ou les matières. */
function groupeDe(code: string): string {
  const formation = formationDuParcours(code);
  if (!formation) return "matieres";
  return formationParCode(formation)?.optionDe ?? formation;
}

/**
 * LES PARCOURS, RANGÉS PAR DIPLÔME : un groupe par diplôme, dans l'ordre du registre des formations,
 * le cours du diplôme en premier, puis les parcours du registre qui suivent ce diplôme ; les matières
 * ferment la liste. Chaque entrée dit son nombre de chapitres et les diplômes qu'elle sert
 * (`libelleDuParcours`, ./taille-des-parcours.ts). `codes` : les parcours à montrer (ceux que l'admin
 * a attribués, le seul de la licence), dans n'importe quel ordre ; par défaut, ceux qu'on propose.
 */
export function parcoursRangesParDiplome(
  codes: readonly string[] = PARCOURS_PROPOSES_A_CHOISIR.map((p) => p.code),
): GroupeDeParcours[] {
  const voulus = PARCOURS_A_CHOISIR.filter((p) => codes.includes(p.code));
  const entree = (code: string): EntreeDeParcours => ({ code, titre: titreDuParcours(code) ?? code, libelle: libelleDuParcours(code) });
  const groupes: GroupeDeParcours[] = FORMATIONS.filter((f) => !f.optionDe).flatMap((f) => {
    const siens = voulus.filter((p) => groupeDe(p.code) === f.code);
    if (siens.length === 0) return [];
    // Le cours du diplôme d'abord : `PARCOURS_A_CHOISIR` le range après ceux du registre.
    const ranges = [...siens].sort((a, b) => Number(b.formation) - Number(a.formation));
    return [{ cle: f.code, libelle: f.sigle, parcours: ranges.map((p) => entree(p.code)) }];
  });
  const matieres = voulus.filter((p) => groupeDe(p.code) === "matieres");
  if (matieres.length > 0) groupes.push({ cle: "matieres", libelle: LIBELLE_DES_MATIERES, parcours: matieres.map((p) => entree(p.code)) });
  return groupes;
}

/** Les codes d'une liste rangée, dans l'ordre où elle les montre. */
export const codesDesGroupes = (groupes: readonly GroupeDeParcours[]): string[] => groupes.flatMap((g) => g.parcours.map((p) => p.code));
