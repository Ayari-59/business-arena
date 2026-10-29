"use client";

import { bouton } from "@/components/bouton";
import { createCompetitionAction, type CreateCompetitionState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { LongActionProgress } from "@/components/long-action-progress";
import { ATTENTES } from "@/config/cloture";
import { LIEN_TARIFS } from "@/config/vitrine-solo";

/**
 * Le formulaire « Organiser un concours ».
 *
 * Constaté en production : une première soumission repartait sans un mot, le
 * nom saisi effacé, aucun concours dans la liste, et le second essai
 * réussissait. Un échec qui ressemble à un clic perdu fait recliquer, ou
 * renoncer.
 *
 * Trois règles, donc : l'action répond toujours (une erreur est un message,
 * pas un silence) ; ce que l'enseignant avait saisi lui est rendu tel quel ;
 * et le bouton dit qu'il travaille.
 */

const ETAT_INITIAL: CreateCompetitionState = { error: null, values: null };

const champ = "mt-1 w-full champ px-3 py-2 text-sm";
const etiquette = "text-xs font-medium uppercase tracking-wide text-slate-400";

export function CompetitionCreateForm({
  initial = ETAT_INITIAL,
  desactive = false,
}: {
  /** État de départ : celui d'un formulaire vierge, sauf pour reprendre un échec. */
  initial?: CreateCompetitionState;
  /**
   * Sans offre de l'arène, le formulaire est grisé AVANT la saisie (audit UX du 29 octobre
   * 2026, P0-1) : la page dit au-dessus pourquoi ; le serveur refuse de toute façon.
   */
  desactive?: boolean;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    createCompetitionAction,
    initial,
    { label: "création de concours" },
  );
  // Après une action, React remet les champs à leur defaultValue : c'est donc
  // par là que la saisie revient, en cas d'échec, à sa place.
  const v = state.values;

  return (
    <form ref={formRef} action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
      <fieldset disabled={desactive || undefined} className="contents" data-formulaire-sans-offre={desactive ? "" : undefined}>
      <label className="block sm:col-span-2">
        <span className={etiquette}>Nom du concours</span>
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={v?.name ?? ""}
          placeholder="Championnat BTS MCO 2026"
          className={champ}
        />
      </label>
      {/*
        DEUX NIVEAUX, DEUX MOTS. Une ÉQUIPE réunit des élèves et se qualifie
        d'un bloc ; une POULE réunit des équipes qui jouent une même partie.
        Les libellés disaient « groupe », qui s'entend comme un groupe
        d'élèves : « deux qualifiés par groupe » se lisait alors comme si une
        équipe pouvait partir en finale amputée de la moitié des siens.
      */}
      <label className="block">
        <span className={etiquette}>Équipes par poule de qualification</span>
        <select name="groupSize" defaultValue={v?.groupSize ?? "3"} className={champ}>
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} équipes s&apos;affrontent dans une poule
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={etiquette}>Équipes qualifiées par poule</span>
        <select name="advancePerGroup" defaultValue={v?.advancePerGroup ?? "1"} className={champ}>
          {[1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n === 1 ? "La première de chaque poule" : `Les ${n} premières de chaque poule`}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm leading-relaxed text-slate-400 sm:col-span-2">
        Une poule est un ensemble d&apos;équipes qui jouent la même partie de qualification. Une
        équipe qualifiée part en finale entière, avec tous ses membres.
      </p>
      <label className="block sm:col-span-2">
        <span className={etiquette}>Périodicité</span>
        <select name="periodicity" defaultValue={v?.periodicity ?? "quarter"} className={champ}>
          <option value="month">Un mois par tour</option>
          <option value="quarter">Un trimestre par tour</option>
          <option value="year">Une année par tour</option>
        </select>
      </label>
      {state.error ? (
        <p
          role="alert"
          className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300 sm:col-span-2"
        >
          {state.error}
          {state.devis ? (
            <>
              {" "}
              <a
                href={state.devis.href}
                data-devis-du-refus=""
                className="font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Demander un devis ({state.devis.offre})
              </a>{" "}
              ·
            </>
          ) : null}
          {state.offre ? (
            <>
              {" "}
              <a
                href={LIEN_TARIFS}
                className="font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Voir les offres
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {guardError ? (
        <div className="sm:col-span-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
      {pending ? (
        <div className="sm:col-span-2">
          <LongActionProgress label={ATTENTES.creationConcours} />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${bouton()} sm:col-span-2`}
      >
        {pending ? "Création du concours…" : "Créer le concours et ouvrir les inscriptions"}
      </button>
      </fieldset>
    </form>
  );
}
