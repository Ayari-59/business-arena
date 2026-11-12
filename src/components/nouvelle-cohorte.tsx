"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { creerCohorteAction, type EtatDeLaNouvelleCohorte } from "@/app/teacher/cohortes/actions";

/**
 * LE FORMULAIRE DE CRÉATION D'UNE COHORTE (/teacher/cohortes).
 *
 * Il était un formulaire serveur : un refus (« Cochez au moins un épisode. ») revenait par l'adresse, la
 * page se rechargeait, le nom tapé s'effaçait et les épisodes cochés se décochaient (audit UX du
 * 11 novembre 2026, P2-6). Le refus revient maintenant dans l'état du formulaire, la page ne se recharge
 * plus, et la saisie revient dans les champs : le nom par sa valeur, les cases par leur état. React
 * remet un formulaire à zéro quand son action se termine ; on rejoue donc les cases après lui, comme le
 * garde-fou rejoue une saisie après une panne (components/guarded-action.tsx).
 *
 * La liste des épisodes est celle de la page serveur (`children`, components/choix-des-episodes.tsx) :
 * le registre des épisodes ne part pas dans le navigateur. Les phrases des refus aussi viennent de la
 * page (config/cohortes.ts), qui lit la grille des offres.
 */

const ETAT_INITIAL: EtatDeLaNouvelleCohorte = { refus: null, valeurs: null };

export function NouvelleCohorte({
  licence,
  phrases,
  lienDesOffres,
  nomMax,
  children,
  initial = ETAT_INITIAL,
}: {
  /** L'établissement a-t-il une offre qui inclut les épisodes ? Sans elle, le formulaire est grisé. */
  licence: boolean;
  /** La phrase de chaque refus (config/cohortes.ts, `REFUS_DE_COHORTE`). */
  phrases: Readonly<Record<string, string>>;
  /** La page des offres, après le refus de la licence. */
  lienDesOffres: string;
  nomMax: number;
  /** Le choix des épisodes, rendu par la page serveur. */
  children: ReactNode;
  /** L'état de départ : vide ; un test y met un refus, pour lire ce que le formulaire en rend. */
  initial?: EtatDeLaNouvelleCohorte;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(creerCohorteAction, initial, {
    label: "création d'une cohorte",
  });
  const v = state.valeurs;

  // LES CASES COCHÉES REVIENNENT, et le nom : après la remise à zéro de React, puis encore au tick
  // suivant, pour passer derrière elle.
  useEffect(() => {
    if (pending || !v) return;
    const rejouer = () => {
      const form = formRef.current;
      if (!form) return;
      form.querySelectorAll<HTMLInputElement>('input[name="episodes"]').forEach((c) => {
        c.checked = v.episodes.includes(c.value);
      });
      const nom = form.elements.namedItem("nom");
      if (nom instanceof HTMLInputElement) nom.value = v.nom;
    };
    rejouer();
    const minuteur = setTimeout(rejouer, 0);
    return () => clearTimeout(minuteur);
  }, [state, pending, v, formRef]);

  // Le focus sur le champ en cause : le nom, ou la première case.
  useEffect(() => {
    if (!state.refus) return;
    const form = formRef.current;
    if (!form) return;
    const cible =
      state.refus === "nom"
        ? form.elements.namedItem("nom")
        : state.refus === "episodes"
          ? form.querySelector('input[name="episodes"]')
          : null;
    if (cible && "focus" in cible) (cible as HTMLElement).focus();
  }, [state, formRef]);

  return (
    <form ref={formRef} action={formAction} noValidate className="mt-4 grid gap-5" data-nouvelle-cohorte="">
      <fieldset disabled={pending} className="contents">
        <fieldset disabled={!licence || undefined} className="contents" data-formulaire-sans-offre={!licence ? "" : undefined}>
          <label className="grid gap-1">
            <span className="text-sm font-semibold text-slate-200">Nom de la cohorte</span>
            <input
              key={`nom:${v?.nom ?? ""}`}
              name="nom"
              required
              maxLength={nomMax}
              placeholder="BTS MCO 2 · groupe A"
              defaultValue={v?.nom ?? ""}
              className="champ w-full px-3 py-2 text-base"
              aria-invalid={state.refus === "nom" ? true : undefined}
              aria-describedby={state.refus ? "refus-de-la-cohorte" : undefined}
            />
          </label>
          {children}
          {state.refus ? (
            <p
              id="refus-de-la-cohorte"
              role="alert"
              data-refus-de-cohorte={state.refus}
              className="rounded-xl encadre-perte px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3"
            >
              {state.refus === "licence" ? "La cohorte n'a pas été créée. " : ""}
              {phrases[state.refus]}
              {state.refus === "licence" ? (
                <>
                  {" "}
                  <Link href={lienDesOffres} prefetch={false} className={LIEN_A_L_ENCRE}>
                    Voir les offres
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <SubmitButton pendingLabel="Création de la cohorte…" className={bouton()}>
            Créer la cohorte
          </SubmitButton>
        </fieldset>
      </fieldset>
      {guardError ? <GuardError message={guardError} /> : null}
    </form>
  );
}
