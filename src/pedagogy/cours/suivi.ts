import type { Chapitre } from "../../config/cours/types";
import { bilanDesObjectifs } from "./aides-du-guide";

/**
 * LA VUE DE L'ENSEIGNANT SUR UNE CLASSE : CE QUE LES PROGRESSIONS DISENT, AGRÉGÉ.
 *
 * Pour chaque élève : où il en est, combien d'étapes réussies du premier coup, combien
 * avec de l'aide. Pour chaque étape du chapitre : combien l'ont atteinte, réussie du
 * premier coup, avec de l'aide, et les remarques du correcteur qui reviennent le plus :
 * ce que la classe ne sait pas encore faire, à reprendre au tableau.
 */

export interface SuiviDEtape {
  essais: number;
  reussi: boolean;
  aide: boolean;
}

export interface ProgressionLue {
  eleve: string;
  entreprise: string;
  etape: number;
  etapes: Record<string, SuiviDEtape>;
  erreurs: Record<string, string[]>;
  majLe: Date;
}

/** Combien de remarques fréquentes l'enseignant voit par étape. */
export const REMARQUES_PAR_ETAPE = 3;

export const duPremierCoup = (s: SuiviDEtape | undefined) => !!s && s.reussi && s.essais === 1 && !s.aide;

export interface LigneDEleve {
  eleve: string;
  entreprise: string;
  /** L'étape où il en est (0 : pas commencé) ; égale au nombre d'étapes : fini. */
  etape: number;
  fini: boolean;
  premierCoup: number;
  aidees: number;
  /** L'état de chaque étape, dans l'ordre du chapitre. */
  cases: ("premier-coup" | "reussie" | "aidee" | "en-cours" | "a-venir")[];
  majLe: Date;
}

export interface LigneDEtape {
  id: string;
  titre: string;
  notee: boolean;
  atteinte: number;
  premierCoup: number;
  aidees: number;
  /** Les remarques les plus fréquentes, avec le nombre d'élèves qui les ont reçues. */
  remarques: { texte: string; eleves: number }[];
}

/**
 * Un objectif du chapitre, vu sur la classe : parmi les élèves qui ont fini le chapitre, combien
 * l'ont acquis, en cours ou à revoir, par la règle du bilan de fin (`bilanDesObjectifs`). Un
 * élève en route ne compte pas : ses étapes à venir le mettraient « à revoir ».
 */
export interface LigneDObjectif {
  objectif: string;
  acquis: number;
  enCours: number;
  aRevoir: number;
}

export interface VueDeLaClasse {
  eleves: LigneDEleve[];
  etapes: LigneDEtape[];
  /** Vide quand les étapes du chapitre ne disent pas leurs objectifs. */
  objectifs: LigneDObjectif[];
  finis: number;
}

export function vueDeLaClasse(chapitre: Chapitre, progressions: readonly ProgressionLue[]): VueDeLaClasse {
  const n = chapitre.etapes.length;
  const eleves = progressions
    .map((p): LigneDEleve => {
      const cases = chapitre.etapes.map((e, i) => {
        const s = p.etapes[e.id];
        if (s?.reussi) return s.aide ? "aidee" : duPremierCoup(s) || e.type === "lecture" ? "premier-coup" : "reussie";
        return i === p.etape ? "en-cours" : "a-venir";
      });
      const notees = chapitre.etapes.filter((e) => e.type !== "lecture");
      return {
        eleve: p.eleve,
        entreprise: p.entreprise,
        etape: Math.min(p.etape, n),
        fini: p.etape >= n,
        premierCoup: notees.filter((e) => duPremierCoup(p.etapes[e.id])).length,
        aidees: notees.filter((e) => p.etapes[e.id]?.aide).length,
        cases,
        majLe: p.majLe,
      };
    })
    .sort((a, b) => a.eleve.localeCompare(b.eleve, "fr"));
  const etapes = chapitre.etapes.map((e, i): LigneDEtape => {
    const parRemarque = new Map<string, Set<number>>();
    progressions.forEach((p, k) => {
      for (const r of p.erreurs[e.id] ?? []) parRemarque.set(r, (parRemarque.get(r) ?? new Set()).add(k));
    });
    const remarques = [...parRemarque.entries()]
      .map(([texte, qui]) => ({ texte, eleves: qui.size }))
      .sort((a, b) => b.eleves - a.eleves || a.texte.localeCompare(b.texte, "fr"))
      .slice(0, REMARQUES_PAR_ETAPE);
    return {
      id: e.id,
      titre: e.titre,
      notee: e.type !== "lecture",
      atteinte: progressions.filter((p) => p.etape >= i || p.etapes[e.id]).length,
      premierCoup: progressions.filter((p) => duPremierCoup(p.etapes[e.id])).length,
      aidees: progressions.filter((p) => p.etapes[e.id]?.aide).length,
      remarques,
    };
  });
  const bilans = progressions.filter((p) => p.etape >= n).map((p) => bilanDesObjectifs(chapitre.objectifs, chapitre.etapes, p.etapes));
  const avecObjectifs = chapitre.etapes.some((e) => e.type !== "lecture" && e.objectifs?.length);
  const objectifs = avecObjectifs
    ? chapitre.objectifs.map((objectif, k): LigneDObjectif => {
        const etats = bilans.map((b) => b?.[k]?.etat);
        return {
          objectif,
          acquis: etats.filter((x) => x === "acquis").length,
          enCours: etats.filter((x) => x === "en-cours").length,
          aRevoir: etats.filter((x) => x === "a-revoir").length,
        };
      })
    : [];
  return { eleves, etapes, objectifs, finis: eleves.filter((e) => e.fini).length };
}
