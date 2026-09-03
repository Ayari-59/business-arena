"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";

/**
 * Garde-fou client autour d'une action serveur.
 *
 * Constaté en production (re-test du 2 septembre, soir) : un POST d'action
 * serveur reçoit parfois un 503 au niveau du edge Vercel, sans trace dans les
 * journaux de fonction. Next ne remonte rien : le formulaire de concours se
 * vidait sans un mot, « Jouer la carte » restait sans effet après deux clics.
 * La vague 0 traite les erreurs QUE L'ACTION RENVOIE ; ceci traite l'absence
 * de réponse, la réponse illisible, le délai dépassé.
 *
 * Trois règles :
 * - toute exception devient un message sous le bouton, jamais un silence ;
 * - la saisie est rejouée dans le formulaire (React le remet à zéro quand une
 *   action se termine, y compris par une erreur attrapée) ;
 * - aucun nouvel essai automatique sur une mutation : c'est à la personne de
 *   recliquer, le bouton est rendu pour ça.
 */

export const MESSAGE_SERVEUR_MUET =
  "Le serveur n'a pas répondu. Vos saisies sont conservées, réessayez.";

export const DELAI_PAR_DEFAUT_MS = 20_000;

export interface GardeOptions {
  /** Au-delà, l'attente est considérée comme un échec (défaut 20 s). */
  timeoutMs?: number;
  /** Nom court de l'action, pour la console (« création de concours »). */
  label: string;
}

/** Ce que la garde retient d'un échec : pour la console et pour le rejeu. */
export interface Echec {
  label: string;
  raison: string;
  /** Copie de la saisie envoyée, pour la remettre dans le formulaire. */
  saisie: FormData;
}

class DelaiDepasse extends Error {
  constructor(ms: number) {
    super(`aucune réponse après ${Math.round(ms / 1000)} s`);
    this.name = "DelaiDepasse";
  }
}

export function avecDelai<T>(promesse: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const minuteur = setTimeout(() => reject(new DelaiDepasse(ms)), ms);
    promesse.then(
      (v) => {
        clearTimeout(minuteur);
        resolve(v);
      },
      (e) => {
        clearTimeout(minuteur);
        reject(e);
      },
    );
  });
}

/** Une copie indépendante : le FormData d'origine appartient à React. */
export function copierSaisie(fd: FormData): FormData {
  const copie = new FormData();
  for (const [cle, valeur] of fd.entries()) copie.append(cle, valeur);
  return copie;
}

export function decrireErreur(e: unknown): string {
  if (e instanceof Error) return e.message || e.name;
  if (typeof e === "object" && e !== null && "status" in e) return `status ${String((e as { status: unknown }).status)}`;
  return String(e);
}

/**
 * Enveloppe une action à état : renvoie l'état précédent et signale l'échec
 * au lieu de laisser l'exception filer. Pure, testable sans React.
 *
 * Une action qui redirige ne renvoie rien : on garde alors l'état précédent,
 * la navigation fait le reste.
 */
export function garder<S>(
  action: (prev: S, fd: FormData) => Promise<S | void>,
  options: GardeOptions & { onEchec?: (echec: Echec) => void; onSucces?: () => void },
): (prev: S, fd: FormData) => Promise<S> {
  const timeoutMs = options.timeoutMs ?? DELAI_PAR_DEFAUT_MS;
  return async (prev, fd) => {
    const saisie = copierSaisie(fd);
    try {
      const resultat = await avecDelai(action(prev, fd), timeoutMs);
      options.onSucces?.();
      return (resultat ?? prev) as S;
    } catch (e) {
      const raison = decrireErreur(e);
      console.warn("[action-failed]", options.label, raison);
      options.onEchec?.({ label: options.label, raison, saisie });
      return prev;
    }
  };
}

/** Le strict nécessaire d'un formulaire pour y remettre une saisie. */
export interface FormulaireMinimal {
  elements: { namedItem(name: string): unknown };
}

/**
 * Remet une saisie dans les champs d'un formulaire, après que React l'a remis
 * à zéro. Champs texte et listes : la valeur ; cases et boutons radio : cochés
 * si leur valeur fait partie de celles envoyées.
 */
export function rejouerSaisie(form: FormulaireMinimal, saisie: FormData): void {
  const parNom = new Map<string, string[]>();
  for (const [cle, valeur] of saisie.entries()) {
    if (typeof valeur !== "string") continue;
    parNom.set(cle, [...(parNom.get(cle) ?? []), valeur]);
  }
  for (const [nom, valeurs] of parNom) {
    const cible = form.elements.namedItem(nom);
    if (!cible) continue;
    const elements: unknown[] =
      typeof (cible as { length?: number }).length === "number" && !("type" in (cible as object))
        ? Array.from(cible as ArrayLike<unknown>)
        : [cible];
    for (const el of elements) {
      const champ = el as { type?: string; value?: string; checked?: boolean };
      if (champ.type === "checkbox" || champ.type === "radio") {
        champ.checked = valeurs.includes(champ.value ?? "");
      } else if (champ.type !== "hidden" && champ.type !== "submit" && "value" in champ) {
        champ.value = valeurs[valeurs.length - 1] ?? "";
      }
    }
  }
}

/**
 * useActionState, gardé. Rend en plus le message d'échec réseau et une ref à
 * poser sur le <form>, pour que la saisie y soit rejouée.
 */
export function useGuardedAction<S>(
  action: (prev: S, fd: FormData) => Promise<S | void>,
  initial: S,
  options: GardeOptions,
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [echec, setEchec] = useState<{ n: number; saisie: FormData } | null>(null);
  const { label, timeoutMs } = options;

  const gardee = useCallback(
    (prev: S, fd: FormData) =>
      garder(action, {
        label,
        timeoutMs,
        onEchec: (e) => setEchec((prec) => ({ n: (prec?.n ?? 0) + 1, saisie: e.saisie })),
        onSucces: () => setEchec(null),
      })(prev, fd),
    [action, label, timeoutMs],
  );

  // Les états gardés ne sont jamais des promesses : Awaited<S> vaut S.
  const [state, formAction, pending] = useActionState(
    gardee as (state: Awaited<S>, payload: FormData) => Promise<Awaited<S>>,
    initial as Awaited<S>,
  );

  // L'échec est connu pendant que l'action est encore « en cours » pour React ;
  // la remise à zéro du formulaire, elle, tombe quand l'action se termine. On
  // rejoue donc la saisie au rendu où l'attente cesse, puis encore au tick
  // suivant pour passer derrière la remise à zéro. Le compteur fait rejouer à
  // chaque échec, même identique au précédent.
  useEffect(() => {
    if (pending || !echec) return;
    const rejouer = () => {
      if (formRef.current) rejouerSaisie(formRef.current, echec.saisie);
    };
    rejouer();
    const minuteur = setTimeout(rejouer, 0);
    return () => clearTimeout(minuteur);
  }, [pending, echec]);

  return {
    state,
    formAction,
    pending,
    formRef,
    guardError: echec ? MESSAGE_SERVEUR_MUET : null,
  };
}

/** Le message d'échec réseau, dans le style des erreurs métier. */
export function GuardError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300"
    >
      {message}
    </p>
  );
}

/**
 * Un <form> gardé qui demande confirmation avant d'agir : pour les gestes
 * destructifs (supprimer un scénario, une situation). Le premier clic arme la
 * confirmation en place — « Oui / Non » — plutôt qu'une `confirm()` native,
 * qui ne se teste pas et casse le style. « Oui » est le vrai envoi (gardé) ;
 * les enfants sont les champs cachés de l'action.
 */
export function ConfirmForm({
  action,
  label,
  className,
  children,
  trigger,
  confirmPrompt,
  confirmLabel = "Oui",
  cancelLabel = "Non",
  triggerClassName = "rounded-lg border border-white/10 px-3 py-1 text-xs text-red-300 hover:border-red-400/50",
}: {
  action: (fd: FormData) => Promise<unknown>;
  label: string;
  className?: string;
  children: React.ReactNode;
  trigger: string;
  confirmPrompt: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerClassName?: string;
}) {
  const [armed, setArmed] = useState(false);
  const sansEtat = useCallback(
    async (_prev: null, fd: FormData) => {
      await action(fd);
    },
    [action],
  );
  const { formAction, pending, formRef, guardError } = useGuardedAction<null>(sansEtat, null, {
    label,
  });
  return (
    <form ref={formRef} action={formAction} className={className}>
      <fieldset disabled={pending} className="contents">
        {children}
        {armed ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-xs text-slate-400">{confirmPrompt}</span>
            <button
              type="submit"
              className="rounded-lg border border-red-400/50 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-400/20"
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => setArmed(false)}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-white/30"
            >
              {cancelLabel}
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setArmed(true)} className={triggerClassName}>
            {trigger}
          </button>
        )}
      </fieldset>
      {guardError ? (
        <div className="mt-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </form>
  );
}

/**
 * Un <form> gardé pour les actions sans état (celles des pages serveur).
 * Les enfants restent rendus côté serveur ; le bouton d'envoi reste le
 * SubmitButton habituel. Tout le formulaire est désactivé pendant l'attente,
 * ce qui coupe court au double clic.
 */
export function GuardedForm({
  action,
  label,
  timeoutMs,
  className,
  children,
}: {
  action: (fd: FormData) => Promise<unknown>;
  label: string;
  timeoutMs?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const sansEtat = useCallback(
    async (_prev: null, fd: FormData) => {
      await action(fd);
    },
    [action],
  );
  const { formAction, pending, formRef, guardError } = useGuardedAction<null>(sansEtat, null, {
    label,
    timeoutMs,
  });
  return (
    <form ref={formRef} action={formAction} className={className}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {guardError ? (
        <div className="mt-3 sm:col-span-3">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </form>
  );
}
