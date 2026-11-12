import { blocOfficielDans, referentielDeCitation } from "../ateliers/referentiels";
import { FORMATIONS_PROPOSEES, chapitrePropose } from "../formations-proposees";
import { PARCOURS_DE_FORMATION, PARCOURS_PROPOSES_A_CHOISIR, formationDuParcours, parcoursDeFormationParCode } from "./parcours-a-choisir";
import type { Chapitre } from "./types";
import { CHAPITRES } from "./registre";

// Les parcours qu'une classe peut choisir, sans les chapitres : ./parcours-a-choisir.ts.
export {
  CE_QU_EST_UN_PARCOURS,
  PARCOURS_A_CHOISIR,
  PARCOURS_DE_FORMATION,
  PARCOURS_PROPOSES_A_CHOISIR,
  codesDesGroupes,
  libelleDuParcours,
  parcoursAChoisir,
  parcoursDeFormationParCode,
  parcoursDuDiplome,
  parcoursProposeAChoisir,
  parcoursRangesParDiplome,
  titreDuParcours,
  type GroupeDeParcours,
  type ParcoursDeFormation,
} from "./parcours-a-choisir";

/**
 * LES PARCOURS DE FORMATION : LE COURS D'UN DIPLÔME, QUI REGROUPE DES CHAPITRES EXISTANTS.
 *
 * Un chapitre n'a qu'un champ `parcours`, celui de sa discipline ou de la formation qui l'a fait
 * écrire (registre.ts). Le BUT n'en avait donc aucun : ses chapitres sont ceux de la comptabilité,
 * du contrôle de gestion, du point de vente ou de la relation client, écrits pour d'autres
 * parcours, et la classe d'un IUT ne pouvait choisir qu'un seul de ces parcours, qui ne lui ouvrait
 * qu'une part de son programme. Le bac STMG, le BTS CG, le BTS SAM, le BTS MHR, le DCG et le DSCG
 * étaient dans le même cas (décision du propriétaire, 11 novembre 2026) : chacun a désormais le sien.
 *
 * UN PARCOURS DE FORMATION NE DUPLIQUE AUCUN CHAPITRE. Il les regroupe, et sa liste ne s'écrit pas :
 * c'est celle de LA PAGE DU DIPLÔME (/cours?diplome=…, config/couverture.ts, `coursDeLaFormation`),
 * sur la même règle : les chapitres proposés des parcours qui suivent la formation, et ceux qui citent
 * un bloc de son référentiel (le préfixe nomme la formation, le bloc désigne une entrée de son
 * référentiel). Un chapitre qui cite demain un bloc du diplôme entre tout seul dans son parcours ; la
 * garde (tests/cours/parcours-de-formation.test.ts) vérifie que la liste est la page, chapitre pour
 * chapitre.
 *
 * LE CHAMP `parcours` NE CHANGE PAS. Une classe choisit un code de parcours (`cours_classes.parcours`,
 * offre Classe ou Programme) ; ce code peut être celui d'un parcours de formation, et la règle
 * d'accès (services/cours.service.ts, `coursOuvert` ; services/chapitres-de-la-classe.ts) ouvre un
 * chapitre à la classe dont le parcours est le sien, ou un parcours de formation qui le regroupe. Un
 * cas dédié s'ouvre avec le chapitre qu'il reprend.
 *
 * LES PRÉREQUIS ANNONCÉS S'OUVRENT AVEC LE CHAPITRE QUI LES ANNONCE (décision du propriétaire,
 * 11 novembre 2026 ; audit pédagogique du même jour, P1-6 : 35 prérequis annoncés menaient à un
 * chapitre fermé à la classe). Un chapitre qu'un parcours ouvre ouvre aussi ses prérequis, et les
 * leurs, de proche en proche, même hors de ce parcours (`parcoursQuiOuvrent`) ; une classe qui libère
 * un chapitre libère ses prérequis avec lui (`ouvertAvecUnLibere`). Le contrôle d'accès les lit partout
 * où il se fait, au serveur.
 */

/** Le chapitre cite au moins un bloc de la formation, qui désigne une entrée de son référentiel. */
export function citeLaFormation(chapitre: Pick<Chapitre, "blocs">, formation: string): boolean {
  return chapitre.blocs.some((bloc) => {
    const cite = referentielDeCitation(bloc);
    return cite !== null && cite.code === formation && blocOfficielDans(bloc, cite.referentiel) !== null;
  });
}

/**
 * LES CHAPITRES DE LA PAGE D'UN DIPLÔME (/cours?diplome=…), dans l'ordre du registre : la règle de
 * config/couverture.ts (`coursDeLaFormation`), sans ce qu'elle charge (les ateliers, les épisodes).
 */
export function chapitresDeLaPageDuDiplome(formation: string): Chapitre[] {
  return CHAPITRES.filter((c) => chapitrePropose(c) && (formationDuParcours(c.parcours) === formation || citeLaFormation(c, formation)));
}

/** Les codes des chapitres de chaque parcours de formation : ceux de la page de son diplôme, dans l'ordre du registre. */
export const CHAPITRES_DES_PARCOURS_DE_FORMATION: Readonly<Record<string, readonly string[]>> = Object.fromEntries(
  PARCOURS_DE_FORMATION.map((p) => [p.code, chapitresDeLaPageDuDiplome(p.formation).map((c) => c.code)]),
);
const ENSEMBLES = new Map(Object.entries(CHAPITRES_DES_PARCOURS_DE_FORMATION).map(([p, codes]) => [p, new Set(codes)]));

/** Les chapitres d'un parcours de formation, rangés par palier. */
export function chapitresDuParcoursDeFormation(code: string): Chapitre[] {
  const codes = ENSEMBLES.get(code) ?? new Set<string>();
  return CHAPITRES.filter((c) => codes.has(c.code)).sort((a, b) => a.palier - b.palier);
}

/**
 * Les chapitres qu'un parcours ouvre de lui-même, sans les prérequis, dans l'ordre du registre : le
 * cours de son diplôme, ou ceux de son champ `parcours`.
 */
export function chapitresDuParcoursAChoisir(code: string): Chapitre[] {
  const regroupes = ENSEMBLES.get(code);
  return regroupes ? CHAPITRES.filter((c) => regroupes.has(c.code)) : CHAPITRES.filter((c) => c.parcours === code);
}

const PAR_CODE = new Map(CHAPITRES.map((c) => [c.code, c]));

/**
 * CEUX QUI ANNONCENT UN CHAPITRE EN PRÉREQUIS, DE PROCHE EN PROCHE : pour un chapitre, ceux qui le
 * citent dans leurs `prerequis`, puis ceux qui citent ces chapitres-là. Lu une fois, au chargement.
 */
const ANNONCE_PAR: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const directs = new Map<string, Set<string>>();
  for (const c of CHAPITRES) {
    for (const p of c.prerequis ?? []) if (p !== c.code) directs.set(p, (directs.get(p) ?? new Set()).add(c.code));
  }
  const fermeture = new Map<string, Set<string>>();
  for (const [code, siens] of directs) {
    const vus = new Set<string>();
    const pile = [...siens];
    while (pile.length > 0) {
      const a = pile.pop()!;
      if (vus.has(a) || a === code) continue;
      vus.add(a);
      pile.push(...(directs.get(a) ?? []));
    }
    fermeture.set(code, vus);
  }
  return fermeture;
})();

/** Les chapitres qui annoncent celui-ci en prérequis, de proche en proche ; vide s'il n'en a aucun. */
export const annonceursDe = (code: string): ReadonlySet<string> => ANNONCE_PAR.get(code) ?? new Set<string>();

/** Ce qu'il faut savoir d'un chapitre, ou d'un cas, pour dire quels parcours l'ouvrent. */
export type OuvrablePar = Pick<Chapitre, "parcours"> & { code?: string; reprend?: readonly string[] };

/**
 * LES PARCOURS QUI OUVRENT UN CHAPITRE : le sien, chaque parcours de formation qui le regroupe, et
 * ceux qui ouvrent un chapitre qui l'annonce en prérequis (le parcours de ce chapitre, et les parcours
 * de formation qui le regroupent). Un cas dédié (une situation) s'ouvre avec les chapitres qu'il
 * reprend. Le parcours propre vient en premier : le devis d'un contenu réservé le préremplit
 * (config/cours/devis-du-contenu.ts).
 */
export function parcoursQuiOuvrent(chapitre: OuvrablePar): string[] {
  const codes = [chapitre.code, ...(chapitre.reprend ?? [])].filter((x): x is string => Boolean(x));
  const annonceurs = [...new Set(codes.flatMap((c) => [...annonceursDe(c)]))].filter((a) => !codes.includes(a));
  const avecLesAnnonceurs = [...codes, ...annonceurs];
  const formations = PARCOURS_DE_FORMATION.filter((p) => avecLesAnnonceurs.some((c) => ENSEMBLES.get(p.code)!.has(c))).map((p) => p.code);
  const parAnnonce = annonceurs.map((a) => PAR_CODE.get(a)?.parcours as string | undefined).filter((p): p is string => Boolean(p));
  return [...new Set<string>([chapitre.parcours, ...formations, ...parAnnonce])];
}

/**
 * LIBÉRÉ AVEC UN CHAPITRE QUI L'ANNONCE : le chapitre libéré, parmi `liberes`, qui annonce celui-ci en
 * prérequis (de proche en proche) ; null s'il n'y en a pas. Une classe qui libère un chapitre libère
 * ses prérequis avec lui (services/chapitres-de-la-classe.ts, `libereALaClasse`).
 */
export function ouvertAvecUnLibere(liberes: ReadonlySet<string>, code: string): string | null {
  for (const a of annonceursDe(code)) if (liberes.has(a)) return a;
  return null;
}

/**
 * LA TAILLE DE CHAQUE PARCOURS PROPOSÉ ET LES DIPLÔMES QU'IL SERT, comme les deux listes la disent
 * (config/cours/parcours-a-choisir.ts, `libelleDuParcours`). Le cours d'un diplôme sert ce diplôme ;
 * un autre parcours, chaque diplôme dont la page présente au moins un de ses chapitres : celui qu'il
 * suit d'abord, s'il en suit un, puis le plus servi. Le devis ne charge pas le registre :
 * scripts/compter-les-parcours.ts écrit ce calcul dans
 * config/cours/taille-des-parcours.ts, et tests/cours/parcours-de-formation.test.ts vérifie qu'il est
 * à jour.
 */
export function tailleDesParcours(): Record<string, { chapitres: number; diplomes: string[] }> {
  const pages = FORMATIONS_PROPOSEES.filter((f) => !f.optionDe).map(
    (f) => [f.code, new Set(chapitresDeLaPageDuDiplome(f.code).map((c) => c.code))] as const,
  );
  return Object.fromEntries(
    PARCOURS_PROPOSES_A_CHOISIR.map((p) => {
      const siens = chapitresDuParcoursAChoisir(p.code).map((c) => c.code);
      const diplome = parcoursDeFormationParCode(p.code)?.formation;
      const suivi = formationDuParcours(p.code);
      const servis = diplome
        ? [diplome]
        : pages
            .map(([f, page]) => [f, siens.filter((c) => page.has(c)).length] as const)
            .filter(([, n]) => n > 0)
            .sort((a, b) => Number(b[0] === suivi) - Number(a[0] === suivi) || b[1] - a[1])
            .map(([f]) => f);
      return [p.code, { chapitres: siens.length, diplomes: servis }];
    }),
  );
}
