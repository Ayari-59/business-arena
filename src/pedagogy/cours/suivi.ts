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
  /**
   * L'élève a-t-il ouvert ce chapitre ? Faux pour celui qui a rejoint la classe sans l'ouvrir : il est
   * « pas commencé », et n'a atteint aucune étape (audit UX du 11 novembre 2026, P2-9). Absent : oui.
   */
  commence?: boolean;
}

/** Combien de remarques fréquentes l'enseignant voit par étape. */
export const REMARQUES_PAR_ETAPE = 3;

/** La progression d'un élève dans un chapitre : l'étape la plus avancée atteinte, et chaque étape tentée. */
export interface ProgressionDuChapitre {
  etape: number;
  etapes: Record<string, SuiviDEtape>;
}

/**
 * Deux suivis d'une même étape : une étape réussie le reste, avec ses essais et son aide d'alors
 * (« du premier coup » se juge au premier passage) ; sinon, celui qui a le plus d'essais.
 */
const etapeLaPlusAvancee = (a: SuiviDEtape, b: SuiviDEtape): SuiviDEtape => (a.reussi ? a : b.reussi ? b : b.essais >= a.essais ? b : a);

/**
 * LA PROGRESSION NE RECULE JAMAIS (décision du propriétaire du 11 novembre 2026 ; audit UX du même jour,
 * P1-5). Chaque geste d'un élève de classe envoie sa progression entière, et le serveur la remplaçait :
 * un appareil qui avait oublié la sienne (stockage vidé, autre poste) repartait de l'étape 1, et
 * l'enseignant voyait « 2 sur 7 » là où l'élève avait fini. Désormais, une progression moins avancée
 * ne remplace pas une plus avancée : l'étape la plus loin des deux, et pour chaque étape, la plus
 * avancée (`etapeLaPlusAvancee`). Ce qui n'était que d'un côté reste.
 */
export function progressionLaPlusAvancee(avant: ProgressionDuChapitre | null, envoyee: ProgressionDuChapitre): ProgressionDuChapitre {
  if (!avant) return { etape: envoyee.etape, etapes: { ...envoyee.etapes } };
  const etapes: Record<string, SuiviDEtape> = { ...avant.etapes };
  for (const [id, s] of Object.entries(envoyee.etapes)) {
    const a = etapes[id];
    etapes[id] = a ? etapeLaPlusAvancee(a, s) : s;
  }
  return { etape: Math.max(avant.etape, envoyee.etape), etapes };
}

export const duPremierCoup = (s: SuiviDEtape | undefined) => !!s && s.reussi && s.essais === 1 && !s.aide;

export interface LigneDEleve {
  eleve: string;
  entreprise: string;
  /** L'étape où il en est ; égale au nombre d'étapes : fini. */
  etape: number;
  /** Faux : il n'a pas encore ouvert le chapitre. */
  commence: boolean;
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
  const commence = (p: ProgressionLue) => p.commence !== false;
  const eleves = progressions
    .map((p): LigneDEleve => {
      const cases = chapitre.etapes.map((e, i) => {
        const s = p.etapes[e.id];
        if (s?.reussi) return s.aide ? "aidee" : duPremierCoup(s) || e.type === "lecture" ? "premier-coup" : "reussie";
        return i === p.etape && commence(p) ? "en-cours" : "a-venir";
      });
      const notees = chapitre.etapes.filter((e) => e.type !== "lecture");
      return {
        eleve: p.eleve,
        entreprise: p.entreprise,
        etape: Math.min(p.etape, n),
        commence: commence(p),
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
      atteinte: progressions.filter((p) => commence(p) && (p.etape >= i || p.etapes[e.id])).length,
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
