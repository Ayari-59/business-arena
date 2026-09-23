"use client";

import { useState } from "react";
import {
  finishCompetitionAction,
  startFinalAction,
  startIntermediateStageAction,
  startQualificationAction,
  type CompetitionActionState,
} from "@/app/teacher/actions";
import { apercuDePhase, libelleApercuDePhase } from "@/config/concours";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { LongActionProgress } from "@/components/long-action-progress";
import { ATTENTES } from "@/config/cloture";

const initial: CompetitionActionState = { error: null };

const ACTIONS = {
  qualification: {
    fn: startQualificationAction,
    label: "Clore les inscriptions et tirer les poules de qualification",
    attente: ATTENTES.tirageGroupes,
    // Ce que l'enseignant s'apprête à rendre définitif.
    effet:
      "Les inscriptions seront closes et les poules tirées au sort. Le tirage est définitif : plus personne ne pourra s'inscrire ensuite.",
  },
  final: {
    fn: startFinalAction,
    label: "Qualifier les meilleurs et lancer la finale",
    attente: ATTENTES.finale,
    effet:
      "Les meilleures équipes de la phase en cours sont qualifiées et la finale démarre. Les autres sont éliminées, c'est sans retour.",
  },
  finish: {
    fn: finishCompetitionAction,
    label: "Clore le concours et proclamer le podium",
    attente: ATTENTES.podium,
    effet:
      "Le concours sera clos et le podium proclamé. Aucun tour ne pourra plus être joué ensuite.",
  },
} as const;

/**
 * Une phase de concours est IRRÉVERSIBLE (tirage seedé consommé, équipes
 * éliminées, podium figé). On demande donc une confirmation qui nomme l'effet
 * avant de la déclencher — même geste en deux temps que la clôture d'un tour,
 * pour qu'un misclic ne ferme pas un concours en cours de remplissage.
 */
export function CompetitionControl({
  competitionId,
  action,
}: {
  competitionId: string;
  action: keyof typeof ACTIONS;
}) {
  const config = ACTIONS[action];
  const [confirmation, setConfirmation] = useState(false);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    config.fn.bind(null, competitionId),
    initial,
    { label: `concours : ${action}`, timeoutMs: 45_000 },
  );
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />
      {pending ? (
        <LongActionProgress label={config.attente} />
      ) : confirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={config.label}
          className="space-y-3 rounded-lg border border-amber-400/40 bg-slate-950 p-3 sm:p-5"
        >
          <p className="text-sm text-amber-200">{config.effet}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirmation(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmation(true)}
          className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-300"
        >
          {config.label}
        </button>
      )}
    </form>
  );
}

/**
 * LANCER UNE PHASE INTERMÉDIAIRE.
 *
 * Le concours n'allait que des poules à la finale. Un tournoi de campus veut
 * un tour de plus — préliminaires, demi-finales, finale —, et rien ne le
 * permettait alors que la table des phases savait déjà le porter.
 *
 * Ce bloc diffère des autres commandes : il porte des réglages, et il ne se
 * confirme pas à l'aveugle. L'APERÇU est recalculé à chaque changement, avec
 * la formule exacte du tirage (le nombre de poules est un quotient entier, et
 * le reste se redistribue) : l'organisateur voit ses poules et ses survivantes
 * avant de rendre le tirage définitif. Quand la combinaison est impossible,
 * l'aperçu dit pourquoi et le bouton reste fermé.
 */
export function NouvellePhase({
  competitionId,
  equipesEnLice,
  taillePouleParDefaut,
  qualifieesParDefaut,
}: {
  competitionId: string;
  /** Équipes qui sortiront de la phase en cours : la matière de la suivante. */
  equipesEnLice: number;
  taillePouleParDefaut: number;
  qualifieesParDefaut: number;
}) {
  const [taille, setTaille] = useState(taillePouleParDefaut);
  const [qualifiees, setQualifiees] = useState(qualifieesParDefaut);
  const [nom, setNom] = useState("Demi-finales");
  const [confirmation, setConfirmation] = useState(false);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    startIntermediateStageAction.bind(null, competitionId),
    initial,
    { label: "concours : nouvelle phase", timeoutMs: 45_000 },
  );

  const apercu = apercuDePhase(equipesEnLice, taille, qualifiees);
  const champ =
    "mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none";
  const etiquette = "text-xs font-medium uppercase tracking-wide text-slate-400";

  return (
    <form ref={formRef} action={formAction} className="carte space-y-3 p-3 sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-200">
          Ajouter une phase avant la finale
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Les {equipesEnLice} équipes qui sortent de la phase en cours sont retirées au sort dans
          de nouvelles poules. Sans cette phase, elles iraient directement en finale.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={etiquette}>Nom de la phase</span>
          <input
            name="nom"
            maxLength={40}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className={champ}
          />
        </label>
        <label className="block">
          <span className={etiquette}>Équipes par poule</span>
          <select
            name="groupSize"
            value={taille}
            onChange={(e) => setTaille(Number(e.target.value))}
            className={champ}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} équipes
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={etiquette}>Qualifiées par poule</span>
          <select
            name="advancePerGroup"
            value={qualifiees}
            onChange={(e) => setQualifiees(Number(e.target.value))}
            className={champ}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "La première" : `Les ${n} premières`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p
        role="status"
        className={`rounded-lg border px-3 py-2 text-sm ${
          apercu.possible
            ? "border-white/5 bg-slate-950 text-slate-300"
            : "border-amber-400/30 bg-amber-400/5 text-amber-200"
        }`}
      >
        {libelleApercuDePhase(apercu)}
      </p>

      {state.error ? (
        <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      <GuardError message={guardError} />

      {pending ? (
        <LongActionProgress label={ATTENTES.tirageGroupes} />
      ) : confirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lancer la phase"
          className="space-y-3 rounded-lg border border-amber-400/40 bg-slate-950 p-3 sm:p-5"
        >
          <p className="text-sm text-amber-200">
            Le tirage est définitif et les équipes non qualifiées de la phase en cours sont
            éliminées. {libelleApercuDePhase(apercu)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirmation(false)}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={!apercu.possible}
          onClick={() => setConfirmation(true)}
          className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Qualifier et lancer « {nom.trim() || "la phase suivante"} »
        </button>
      )}
    </form>
  );
}
