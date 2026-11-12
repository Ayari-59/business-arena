"use client";

import { useEffect } from "react";
import { bouton } from "@/components/bouton";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import {
  demanderLAdresseDInscriptionAction,
  type EtatDeLaDemandeDAdresse,
} from "@/app/integration/actions";

/**
 * LA DEMANDE D'ADRESSE D'INSCRIPTION, PAR ÉCRIT (/integration ; audit UX du 11 novembre 2026, P2-10).
 *
 * Un formulaire court, pour le référent informatique : qui il est, son établissement, sa plateforme de
 * cours, son adresse électronique. Les erreurs se disent toutes d'un coup, chacune sous son champ, et la
 * saisie revient dans les champs (le serveur la rend ; une clé suit chaque valeur, que React remet à
 * zéro sur la valeur par défaut). La confirmation dit la vérité : l'accusé n'est annoncé que s'il est parti.
 * La page serveur passe les plateformes et la durée de l'adresse (lti/constantes.ts).
 */

const ETAT_INITIAL: EtatDeLaDemandeDAdresse = { erreurs: {}, ok: null, valeurs: null };

const CHAMPS = ["nom", "fonction", "organisation", "identifiant", "plateforme", "email", "message"] as const;

export function DemandeDAdresseDInscription({
  plateformes,
  dureeJours,
  contact,
  initial = ETAT_INITIAL,
}: {
  plateformes: readonly string[];
  /** La durée de validité d'une adresse d'inscription, en jours. */
  dureeJours: number;
  /** L'adresse de contact publique, pour une question. */
  contact: string;
  /** L'état de départ : vide ; un test y met un refus ou un envoi, pour lire ce que le formulaire en rend. */
  initial?: EtatDeLaDemandeDAdresse;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(demanderLAdresseDInscriptionAction, initial, {
    label: "demande d'adresse d'inscription",
  });
  const v = state.valeurs;
  const e = state.erreurs;
  const premier = CHAMPS.find((c) => e[c]) ?? null;
  useEffect(() => {
    if (!premier) return;
    const el = formRef.current?.elements.namedItem(premier);
    if (el && "focus" in el) (el as HTMLElement).focus();
  }, [state, premier, formRef]);

  const champ = "mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none";
  // Le libellé du périmètre de l'intégration (tests/architecture/orange-de-l-action.test.ts) : sans capitales.
  const etiquette = "libelle";
  const erreur = (nom: string) =>
    e[nom] ? (
      <span id={`erreur-adresse-${nom}`} role="alert" data-erreur-du-champ={nom} className="mt-1 block text-sm text-red-300">
        {e[nom]}
      </span>
    ) : null;
  const invalide = (nom: string) => (e[nom] ? { "aria-invalid": true as const, "aria-describedby": `erreur-adresse-${nom}` } : {});
  const valeur = (nom: string) => v?.[nom] ?? "";

  if (state.ok) {
    return (
      <div className="grid gap-3 rounded-xl encadre-neutre p-4 sm:p-5" data-adresse-demandee="">
        <p role="status" className="text-base leading-relaxed text-slate-100">
          ✓ Votre demande d&apos;adresse d&apos;inscription est enregistrée. L&apos;adresse vous sera envoyée par écrit, à{" "}
          {state.ok.email} : elle est propre à votre établissement, ne sert qu&apos;une fois et reste valable {dureeJours} jours.
        </p>
        <p className="text-sm text-slate-300" data-accuse={state.ok.accuseEnvoye ? "envoye" : "non-envoye"}>
          {state.ok.accuseEnvoye
            ? `Un accusé de réception est parti à ${state.ok.email}.`
            : `Aucun courriel d'accusé de réception n'a pu partir à ${state.ok.email} : la demande est bien enregistrée, et nous vous répondons à cette adresse.`}
        </p>
        <p className="text-sm text-slate-400">
          Une question : <span className="select-all font-semibold text-slate-200">{contact}</span>
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-4 sm:grid-cols-2" data-demande-d-adresse="">
      <label className="block">
        <span className={etiquette}>Votre nom</span>
        <input key={`nom:${valeur("nom")}`} name="nom" maxLength={120} autoComplete="name" defaultValue={valeur("nom")} className={champ} {...invalide("nom")} />
        {erreur("nom")}
      </label>
      <label className="block">
        <span className={etiquette}>Votre fonction</span>
        <input
          key={`fonction:${valeur("fonction")}`}
          name="fonction"
          maxLength={120}
          autoComplete="organization-title"
          placeholder="Administrateur Moodle, référent numérique…"
          defaultValue={valeur("fonction")}
          className={champ}
          {...invalide("fonction")}
        />
        {erreur("fonction")}
      </label>
      <label className="block">
        <span className={etiquette}>Établissement</span>
        <input
          key={`organisation:${valeur("organisation")}`}
          name="organisation"
          maxLength={160}
          autoComplete="organization"
          defaultValue={valeur("organisation")}
          className={champ}
          {...invalide("organisation")}
        />
        {erreur("organisation")}
      </label>
      <label className="block">
        <span className={etiquette}>UAI (facultatif)</span>
        <input
          key={`identifiant:${valeur("identifiant")}`}
          name="identifiant"
          maxLength={40}
          defaultValue={valeur("identifiant")}
          className={champ}
          {...invalide("identifiant")}
        />
        {erreur("identifiant")}
      </label>
      <label className="block">
        <span className={etiquette}>Votre plateforme de cours</span>
        <select
          key={`plateforme:${valeur("plateforme")}`}
          name="plateforme"
          defaultValue={valeur("plateforme")}
          className={champ}
          {...invalide("plateforme")}
        >
          <option value="" disabled>
            Choisir la plateforme
          </option>
          {plateformes.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {erreur("plateforme")}
      </label>
      <label className="block">
        <span className={etiquette}>Votre adresse électronique, pour recevoir l&apos;adresse</span>
        <input
          key={`email:${valeur("email")}`}
          name="email"
          type="email"
          maxLength={200}
          autoComplete="email"
          defaultValue={valeur("email")}
          className={champ}
          {...invalide("email")}
        />
        {erreur("email")}
      </label>
      <label className="block sm:col-span-2">
        <span className={etiquette}>Votre message</span>
        <textarea
          key={`message:${valeur("message")}`}
          name="message"
          rows={3}
          maxLength={1200}
          placeholder="La version de votre plateforme, la date prévue de mise en place…"
          defaultValue={valeur("message")}
          className={champ}
          {...invalide("message")}
        />
        <span className="mt-1 block text-xs text-slate-400">Facultatif.</span>
        {erreur("message")}
      </label>
      {/* piège à robots : invisible, doit rester vide */}
      <label className="hidden" aria-hidden="true">
        Site web
        <input name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
      {e.general ? (
        <p role="alert" className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300 sm:col-span-2">
          {e.general}
        </p>
      ) : null}
      {guardError ? (
        <div className="sm:col-span-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={bouton()}>
          {pending ? "Envoi…" : "Demander l'adresse d'inscription"}
        </button>
        <span className="text-xs text-slate-400">Vos coordonnées servent à vous envoyer l&apos;adresse.</span>
      </div>
    </form>
  );
}
