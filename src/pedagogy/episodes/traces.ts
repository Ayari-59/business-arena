/**
 * LES CINQ RÈGLES DE TRACES : ce qu'une partie mesure directement.
 *
 * Les décisions disent si un choix était bon ; les traces disent comment la
 * personne y est arrivée. Cinq règles, les mêmes pour tous les épisodes :
 *
 *   · S'INFORMER (R1) : la part des informations décisives consultées avant
 *     de décider, parmi celles que le niveau joué laissait atteindre ;
 *   · DIAGNOSTIQUER (R2) : le problème principal retenu en semaine 1 ;
 *   · RÉVISER (R3) : la réévaluation de ce diagnostic. Corriger un diagnostic
 *     faux et maintenir un diagnostic juste valent tous deux 1, mais seul le
 *     premier met la révision à l'épreuve : on le dit ;
 *   · ÉVITER LE RÉFLEXE (R4) : sur les décisions qui offraient une réponse
 *     réflexe, la part où elle a été évitée ;
 *   · CALIBRER (R7) : l'écart entre la prévision chiffrée et le réalisé, et
 *     une confiance plus forte que la précision.
 *
 * Une trace décrit ce qui a été fait, jamais la personne. Le résultat en
 * euros n'y entre pas. Tout est pur : la même partie donne les mêmes traces.
 */
import type { CodeCompetence, CodeTrace } from "@/config/episodes/competences";
import { niveauParCode } from "@/config/episodes/niveaux";
import { TRACES, type TracesDeLEpisode } from "@/config/episodes/traces";
import type { Episode, PartieJouee, Resultat } from "@/config/episodes/types";
import { decisives, nombre } from "./bilan";

export interface Trace {
  trace: CodeTrace;
  competence: CodeCompetence;
  /** De 0 à 1 ; `null` quand la partie ne permettait pas de l'observer. */
  valeur: number | null;
  /** Combien de fois la partie offrait l'occasion de l'observer. */
  occasions: number;
  /** Ce qui a été fait, en une phrase. */
  fait: string;
}

export type CasDeRevision =
  | "corrige"
  | "maintient-juste"
  | "maintient-faux"
  | "corrige-a-tort"
  | "abandonne";

export interface TraceDeRevision extends Trace {
  trace: "revision";
  cas: CasDeRevision;
  /** Le diagnostic de départ était faux : la révision était vraiment à l'épreuve. */
  aLEpreuve: boolean;
}

export interface TraceDeCalibrage extends Trace {
  trace: "calibrage";
  ecart: number;
  /** L'écart dépasse le seuil « proche » avec une confiance d'au moins 70 %. */
  tropSur: boolean;
}

export const tracesDe = (ep: Pick<Episode, "code">): TracesDeLEpisode => {
  const t = TRACES[ep.code];
  if (!t) throw new Error(`Pas de traces pour l'épisode « ${ep.code} »`);
  return t;
};

/** R1 : les informations décisives consultées, parmi celles que le niveau laissait atteindre. */
export function traceInformation(ep: Pick<Episode, "etapes">, p: PartieJouee): Trace {
  const limite = niveauParCode(p.niveau).verificationsParDecision;
  const ids = decisives(ep);
  let vues = 0;
  let atteignables = 0;
  ids.forEach((liste, d) => {
    vues += liste.filter((id) => p.consultes[d]?.includes(id)).length;
    // La première décision se règle par le temps d'enquête ; les suivantes, par le nombre de vérifications.
    atteignables += d === 0 || limite == null ? liste.length : Math.min(liste.length, limite);
  });
  const prises = Math.min(vues, atteignables);
  return {
    trace: "information",
    competence: "R1",
    valeur: atteignables ? prises / atteignables : null,
    occasions: atteignables,
    fait: `${vues} des ${atteignables} informations décisives consultées avant de décider.`,
  };
}

const estJuste = (t: TracesDeLEpisode, id: string | null) =>
  id === t.diagnostic.juste || id === t.diagnostic.proche;

/** R2 : le problème principal retenu en semaine 1. */
export function traceDiagnostic(ep: Pick<Episode, "code" | "diagnostics">, p: PartieJouee): Trace {
  const t = tracesDe(ep);
  const nom = ep.diagnostics.find((d) => d.id === p.diagnostic)?.t ?? p.diagnostic;
  const valeur =
    p.diagnostic === t.diagnostic.juste ? 1 : p.diagnostic === t.diagnostic.proche ? 0.6 : 0;
  return {
    trace: "diagnostic",
    competence: "R2",
    valeur,
    occasions: 1,
    fait:
      valeur === 1
        ? `Problème principal retenu : « ${nom} », la cause principale.`
        : valeur > 0
          ? `Problème principal retenu : « ${nom} », une vraie cause, mais pas la principale.`
          : `Problème principal retenu : « ${nom} », qui n'était pas la cause.`,
  };
}

/** R3 : la réévaluation du diagnostic. */
export function traceRevision(ep: Pick<Episode, "code">, p: PartieJouee): TraceDeRevision {
  const t = tracesDe(ep);
  const corrige = p.reevaluation.choix === "corrige" && p.reevaluation.principal != null;
  const departJuste = estJuste(t, p.diagnostic);
  const arriveeJuste = corrige ? estJuste(t, p.reevaluation.principal) : departJuste;
  const cas: CasDeRevision = departJuste
    ? !corrige
      ? "maintient-juste"
      : arriveeJuste
        ? "corrige"
        : "abandonne"
    : !corrige
      ? "maintient-faux"
      : arriveeJuste
        ? "corrige"
        : "corrige-a-tort";
  const faits: Record<CasDeRevision, string> = {
    corrige: "Diagnostic corrigé vers une vraie cause à la réévaluation.",
    "maintient-juste": "Diagnostic juste maintenu à la réévaluation.",
    "maintient-faux": "Diagnostic faux maintenu à la réévaluation, malgré les signaux.",
    "corrige-a-tort": "Diagnostic faux remplacé par un autre diagnostic faux à la réévaluation.",
    abandonne: "Diagnostic juste abandonné pour un diagnostic faux à la réévaluation.",
  };
  return {
    trace: "revision",
    competence: "R3",
    valeur: arriveeJuste ? 1 : 0,
    occasions: 1,
    fait: faits[cas],
    cas,
    aLEpreuve: !departJuste,
  };
}

/** R4 : sur les décisions qui offraient une réponse réflexe, la part où elle a été évitée. */
export function traceReflexes(ep: Pick<Episode, "code">, p: PartieJouee): Trace {
  const { reflexes } = tracesDe(ep);
  const decisions = [...new Set(reflexes.map(([d]) => d))];
  const cedees = decisions.filter((d) =>
    reflexes.some(([dd, o]) => dd === d && p.chemin[d] === o),
  ).length;
  const evitees = decisions.length - cedees;
  return {
    trace: "reflexes",
    competence: "R4",
    valeur: decisions.length ? evitees / decisions.length : null,
    occasions: decisions.length,
    fait: `Réponse réflexe évitée ${evitees} fois sur ${decisions.length} décisions qui en offraient une.`,
  };
}

/** R7 : l'écart entre la prévision et le réalisé, et la confiance qu'on y mettait. */
export function traceCalibrage<R extends Resultat>(
  ep: Pick<Episode<R>, "code" | "prevision">,
  p: PartieJouee,
  trimestre: R,
): TraceDeCalibrage {
  const { prevision: seuils } = tracesDe(ep);
  const reel = ep.prevision.reel(trimestre);
  const ecart = Math.abs(p.prevision - reel);
  const tropSur = ecart > seuils.proche && p.confiance >= 70;
  const unite = ep.prevision.unite;
  return {
    trace: "calibrage",
    competence: "R7",
    valeur: ecart <= seuils.juste ? 1 : ecart <= seuils.proche ? 0.6 : 0,
    occasions: 1,
    fait: `Prévision de ${nombre(p.prevision)} ${unite} avec ${p.confiance} % de confiance, pour ${nombre(reel)} ${unite} réalisés${
      tropSur ? " : la confiance dépassait la précision" : ""
    }.`,
    ecart,
    tropSur,
  };
}

/** Les cinq traces d'une partie, dans l'ordre des compétences. */
export function tracesDeLaPartie<R extends Resultat>(
  ep: Episode<R>,
  p: PartieJouee,
  trimestre: R = ep.simuler(p.chemin, p.graine, p.jours),
): [Trace, Trace, TraceDeRevision, Trace, TraceDeCalibrage] {
  return [
    traceInformation(ep, p),
    traceDiagnostic(ep, p),
    traceRevision(ep, p),
    traceReflexes(ep, p),
    traceCalibrage(ep, p, trimestre),
  ];
}
