/**
 * LES OBSERVATIONS D'UNE PARTIE : ce que chaque décision et chaque trace
 * disent d'une compétence.
 *
 * Une observation a une valeur de 0 à 1 et un poids :
 *
 *   · une décision où la compétence est PRINCIPALE : la qualité du choix, poids 1 ;
 *   · une décision où elle est SECONDAIRE : la même qualité, poids 0,5 ;
 *   · S'INFORMER, avant chaque décision : la part des informations décisives
 *     consultées, parmi celles que le niveau laissait atteindre, poids 0,5 ;
 *   · DIAGNOSTIQUER, le diagnostic de la semaine 1 : 1 juste, 0,6 une vraie
 *     cause mais pas la principale, 0 sinon (le jugement du bilan), poids 1 ;
 *   · RÉVISER, la réévaluation : 1 juste, 0 sinon, poids 1 ;
 *   · ÉVITER LE RÉFLEXE, chaque décision qui en offrait un : 1 évité, 0 pris,
 *     poids 0,5 ;
 *   · CALIBRER, la prévision : 1 juste, 0,6 proche, 0 loin, poids 1.
 *
 * Deux règles évitent de punir une bonne décision. L'option la plus sûre,
 * prise à moins de 3 000 € de la meilleure, compte comme bonne : choisir la
 * sécurité est une préférence, pas une erreur. Et un réflexe que le bilan de
 * l'épisode juge bon n'est pas compté comme réflexe pris : sur le meilleur
 * chemin, un test interdit ce cas ; ailleurs, c'est au bilan qu'on se fie.
 *
 * Le résultat obtenu n'entre dans aucune observation.
 */
import { ETIQUETTES, type CodeCompetence } from "@/config/episodes/competences";
import { FAMILLES } from "@/config/episodes/familles";
import { niveauParCode } from "@/config/episodes/niveaux";
import type { Episode, PartieJouee } from "@/config/episodes/types";
import { decisives } from "@/pedagogy/episodes/bilan";
import {
  SEUIL_QUALITE,
  mesurer,
  type DecisionMesuree,
  type MesuresDeLaPartie,
} from "@/pedagogy/episodes/mesures";
import { tracesDe, tracesDeLaPartie } from "@/pedagogy/episodes/traces";

export type SourceDObservation =
  | "principale"
  | "secondaire"
  | "information"
  | "diagnostic"
  | "revision"
  | "reflexe"
  | "prevision";

export const POIDS: Record<SourceDObservation, number> = {
  principale: 1,
  secondaire: 0.5,
  information: 0.5,
  diagnostic: 1,
  revision: 1,
  reflexe: 0.5,
  prevision: 1,
};

export interface Observation {
  competence: CodeCompetence;
  source: SourceDObservation;
  /** De 0 à 1. */
  valeur: number;
  poids: number;
  /** L'épisode, sa famille et son numéro. */
  code: string;
  famille: string;
  numero: number;
  /** La décision observée (0 à 5) ; `null` pour le diagnostic, la révision et la prévision. */
  decision: number | null;
  /** Pour les décisions : l'option prise, la meilleure, et l'écart moyen entre elles. */
  choix?: { prise: string; meilleure: string; ecart: string; ecartBrut: number };
  /** Pour la révision : le diagnostic de départ était faux. */
  aLEpreuve?: boolean;
  /** Pour la prévision : une confiance d'au moins 70 % pour un écart au-delà du seuil « proche ». */
  tropSur?: boolean;
  /** Pour la prévision : la confiance annoncée. */
  confiance?: number;
  /** Pour l'information : combien de sources décisives vues, sur combien. */
  sources?: { vues: number; sur: number };
}

export interface PartieObservee {
  mesures: MesuresDeLaPartie;
  observations: Observation[];
}

export const familleDe = (code: string): string =>
  FAMILLES.find((f) => f.episodes.includes(code))?.code ?? "";

/** La valeur d'une décision : sa qualité, ou au moins le seuil quand la prudence était défendable. */
export const valeurDeLaDecision = (m: DecisionMesuree): number =>
  m.prudenceDefendable ? Math.max(m.choisie.qualite, SEUIL_QUALITE) : m.choisie.qualite;

export function observer(ep: Episode, p: PartieJouee): PartieObservee {
  const mesures = mesurer(ep, p);
  const traces = tracesDeLaPartie(ep, p);
  const base = { code: ep.code, famille: familleDe(ep.code), numero: ep.numero };
  const obs: Observation[] = [];

  const etiquettes = ETIQUETTES[ep.code] ?? [];
  mesures.decisions.forEach((m, d) => {
    const etiquette = etiquettes[d];
    if (!etiquette) return;
    const etape = ep.etapes[d]!;
    const ecartBrut = m.meilleure.moyenne - m.choisie.moyenne;
    const choix = {
      prise: etape.options[m.choisie.option]!.t,
      meilleure: etape.options[m.meilleure.option]!.t,
      ecart: ep.bilan.formatObjectif(ecartBrut),
      ecartBrut,
    };
    const valeur = valeurDeLaDecision(m);
    obs.push({
      ...base,
      competence: etiquette.principale,
      source: "principale",
      valeur,
      poids: POIDS.principale,
      decision: d,
      choix,
    });
    for (const s of etiquette.secondaires) {
      obs.push({
        ...base,
        competence: s,
        source: "secondaire",
        valeur,
        poids: POIDS.secondaire,
        decision: d,
        choix,
      });
    }
  });

  // S'informer, décision par décision.
  const limite = niveauParCode(p.niveau).verificationsParDecision;
  decisives(ep).forEach((ids, d) => {
    const sur = d === 0 || limite == null ? ids.length : Math.min(ids.length, limite);
    if (sur === 0) return;
    const vues = Math.min(sur, ids.filter((id) => p.consultes[d]?.includes(id)).length);
    obs.push({
      ...base,
      competence: "R1",
      source: "information",
      valeur: vues / sur,
      poids: POIDS.information,
      decision: d,
      sources: { vues, sur },
    });
  });

  const [, diagnostic, revision, , prevision] = traces;
  obs.push({
    ...base,
    competence: "R2",
    source: "diagnostic",
    valeur: diagnostic.valeur ?? 0,
    poids: POIDS.diagnostic,
    decision: null,
  });
  obs.push({
    ...base,
    competence: "R3",
    source: "revision",
    valeur: revision.valeur ?? 0,
    poids: POIDS.revision,
    decision: null,
    aLEpreuve: revision.aLEpreuve,
  });

  // Éviter le réflexe, décision par décision.
  const { reflexes } = tracesDe(ep);
  for (const d of new Set(reflexes.map(([dd]) => dd))) {
    const pris = reflexes.some(([dd, o]) => dd === d && p.chemin[d] === o);
    if (pris && mesures.decisions[d]!.bonne) continue;
    obs.push({
      ...base,
      competence: "R4",
      source: "reflexe",
      valeur: pris ? 0 : 1,
      poids: POIDS.reflexe,
      decision: d,
      choix: {
        prise: ep.etapes[d]!.options[p.chemin[d]!]!.t,
        meilleure: "",
        ecart: "",
        ecartBrut: 0,
      },
    });
  }

  obs.push({
    ...base,
    competence: "R7",
    source: "prevision",
    valeur: prevision.valeur ?? 0,
    poids: POIDS.prevision,
    decision: null,
    tropSur: prevision.tropSur,
    confiance: p.confiance,
  });

  return { mesures, observations: obs };
}
