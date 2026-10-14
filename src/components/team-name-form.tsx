"use client";

import { useState } from "react";
import { bouton } from "@/components/bouton";
import { Embleme } from "@/components/embleme";
import { EMBLEMES } from "@/config/emblemes";
import { nommerEquipeAction, type NomEquipeState } from "@/app/arena/[gameId]/actions";
import { NOM_EQUIPE_MAX } from "@/config/nom-equipe";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { Icone } from "@/components/icone";

const initial: NomEquipeState = { error: null };

/**
 * L'équipe se donne un nom d'entreprise, et le corrige tant qu'il est temps.
 *
 * Le panneau reste ouvert pendant tout le premier tour, y compris une fois un
 * nom adopté. Il se fermait auparavant dès le premier enregistrement, et une
 * coquille tapée à la hâte suivait l'équipe jusqu'au relevé de notes sans que
 * personne puisse la reprendre. Après la clôture du premier tour, le nom se
 * fige pour de bon : un classement qui change d'intitulé en cours de partie
 * devient illisible.
 *
 * Le champ est libre plutôt que choisi dans une liste : nommer son entreprise
 * est le premier acte de gestion de l'équipe, et une liste le lui retirerait.
 */
export function TeamNameForm({
  gameId,
  nomActuel,
  dejaNommee,
  emblemeActuel = null,
}: {
  gameId: string;
  nomActuel: string;
  /** L'équipe a déjà adopté un nom : on propose de le corriger, pas d'en choisir un. */
  dejaNommee: boolean;
  /** L'emblème déjà choisi, s'il y en a un. */
  emblemeActuel?: string | null;
}) {
  const [choisi, setChoisi] = useState(emblemeActuel ?? "");
  const action = nommerEquipeAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "nom d'entreprise",
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="encadre-neutre rounded-xl p-3 sm:p-5"
    >
      <p className="text-sm font-semibold text-slate-100">
        <Icone nom="ecrire" className="mr-1.5 h-3.5 w-3.5" />
        {dejaNommee ? "Corrigez le nom de votre entreprise" : "Nommez votre entreprise"}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
        {dejaNommee ? (
          <>
            Votre équipe s&apos;appelle « {nomActuel} ». Une faute de frappe ? Reprenez-la
            maintenant : ce nom suivra vos résultats jusqu&apos;au classement final, et il
            se fige à la clôture du premier tour.
          </>
        ) : (
          <>
            Votre équipe s&apos;appelle « {nomActuel} » pour l&apos;instant. Donnez-lui le
            nom sous lequel elle affrontera les autres : c&apos;est celui qui suivra vos
            résultats jusqu&apos;au classement final. Il se fige à la clôture du premier
            tour.
          </>
        )}
      </p>
      {/*
        L'EMBLÈME, AVEC LE NOM ET DANS LA MÊME FENÊTRE. Une équipe avait un nom
        et aucun signe : dans la composition, dans le classement, sur l'écran
        projeté, six lignes grises se ressemblaient. Huit formes franches, parce
        qu'à distance c'est la silhouette qu'on reconnaît, et parce qu'un choix
        qui tient sur une ligne se fait en dix secondes — c'est le tour 1, tout
        le monde attend.

        Des boutons radio, dessinés : le clavier les parcourt, un lecteur
        d'écran les annonce par le nom de la forme, et « aucun » en fait partie
        plutôt que d'être une absence de choix.
      */}
      <fieldset className="mt-3">
        <legend className="libelle">
          Votre emblème
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <label
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-xs transition ${
              choisi === ""
                ? "border-amber-400/60 bg-amber-400/10 text-slate-100"
                : "border-white/10 text-slate-400 hover:text-slate-200"
            }`}
          >
            <input
              type="radio"
              name="embleme"
              value=""
              checked={choisi === ""}
              onChange={() => setChoisi("")}
              className="sr-only"
            />
            <span aria-hidden>—</span>
            <span className="sr-only">Aucun emblème</span>
          </label>
          {EMBLEMES.map((e) => (
            <label
              key={e.code}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition ${
                choisi === e.code
                  ? "border-amber-400/60 bg-amber-400/10 text-slate-100"
                  : "border-white/10 text-slate-400 hover:text-slate-200"
              }`}
            >
              <input
                type="radio"
                name="embleme"
                value={e.code}
                checked={choisi === e.code}
                onChange={() => setChoisi(e.code)}
                className="sr-only"
              />
              <Embleme code={e.code} className="h-5 w-5" />
              <span className="sr-only">{e.nom}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Nom de l&apos;entreprise</span>
          <input
            name="nom"
            required
            maxLength={NOM_EQUIPE_MAX}
            defaultValue={dejaNommee ? nomActuel : ""}
            placeholder="Le nom de votre entreprise"
            className="w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={bouton()}
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              Enregistrement
            </span>
          ) : (
            <>{dejaNommee ? "Enregistrer" : "Adopter ce nom"}</>
          )}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {state.error}
        </p>
      ) : null}
      {guardError ? (
        <div className="mt-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </form>
  );
}
