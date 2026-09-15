"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  diplomesProposes,
  OBJECTIFS,
  recommander,
  type Semestre,
} from "@/config/orientation";
import { PERIODICITY_LABELS } from "@/config/scenarios/periodicity";
import {
  envoyerDemandeOrientationAction,
  type OrientationFormState,
} from "@/app/orientation/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

/**
 * Le formulaire d'orientation.
 *
 * Quatre questions, une recommandation immédiate. Elle s'affiche pendant qu'on
 * répond plutôt qu'après un envoi : un enseignant qui compare deux hypothèses
 * ne doit pas attendre une réponse par courrier pour voir ce que chacune donne.
 *
 * L'envoi se fait ICI, par le formulaire, et non plus par un courriel
 * pré-rempli ouvert dans la messagerie du visiteur : sur un poste de salle des
 * profs sans messagerie, rien ne partait, et rien n'en restait chez nous. Le
 * formulaire recueille donc qui écrit et d'où, avec le profil de la classe ;
 * la demande est enregistrée, et l'adresse de contact prévenue.
 */
const ETAT_INITIAL: OrientationFormState = { error: null, ok: null, values: null };

export function OrientationForm({ initial = ETAT_INITIAL }: { initial?: OrientationFormState }) {
  const diplomes = diplomesProposes();
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    envoyerDemandeOrientationAction,
    initial,
    { label: "demande de simulation" },
  );
  const v = state.values;
  const [diplome, setDiplome] = useState(v?.diplome ?? diplomes[0]!.code);
  const [semestre, setSemestre] = useState<Semestre>(v?.semestre === "s2" ? "s2" : "s1");
  const [objectif, setObjectif] = useState(v?.objectif ?? OBJECTIFS[0]!.code);

  const reco = useMemo(
    () => recommander({ diplome, semestre, objectif }),
    [diplome, semestre, objectif],
  );
  const periodiciteLabel = PERIODICITY_LABELS[reco.periodicite].singular.toLowerCase();

  const champ =
    "mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";
  const etiquette = "text-xs font-medium uppercase tracking-wide text-slate-400";

  return (
    <form ref={formRef} action={formAction} className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
      <div className="carte space-y-4 p-6">
        <label className="block">
          <span className={etiquette}>Le diplôme préparé</span>
          <select
            name="diplome"
            value={diplome}
            onChange={(e) => setDiplome(e.target.value)}
            className={champ}
          >
            {diplomes.map((d) => (
              <option key={d.code} value={d.code}>
                {d.libelle}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className={etiquette}>Où vous en êtes dans l&apos;année</legend>
          <input type="hidden" name="semestre" value={semestre} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["s1", "Premier semestre", "La classe découvre l'outil et la matière"],
                ["s2", "Second semestre", "Les bases sont posées, on peut ouvrir"],
              ] as const
            ).map(([code, titre, aide]) => (
              <button
                key={code}
                type="button"
                onClick={() => setSemestre(code)}
                aria-pressed={semestre === code}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  semestre === code
                    ? "border-amber-400/60 bg-amber-950/20 text-slate-100"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:border-white/25"
                }`}
              >
                <span className="block font-medium">{titre}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
                  {aide}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className={etiquette}>Ce que vous voulez faire travailler</span>
          <select
            name="objectif"
            value={objectif}
            onChange={(e) => setObjectif(e.target.value)}
            className={champ}
          >
            {OBJECTIFS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.libelle}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={etiquette}>Votre contexte, en quelques lignes</span>
          <textarea
            name="message"
            defaultValue={v?.message ?? ""}
            rows={4}
            maxLength={1200}
            placeholder="Effectif, volume horaire, contraintes de salle, ce que vous avez déjà essayé, ce qui vous manque…"
            className={champ}
          />
          <span className="mt-1 block text-xs text-slate-400">
            Facultatif. C&apos;est ce champ qui nous permet de répondre autre chose que la
            recommandation automatique.
          </span>
        </label>

        {/*
          QUI ÉCRIT. Trois champs, pour pouvoir répondre : un nom, un
          établissement, une adresse. Rien d'autre n'est demandé, rien n'est
          réutilisé ailleurs que pour cette réponse.
        */}
        <div className="grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
          <label className="block">
            <span className={etiquette}>Votre nom</span>
            <input
              name="nom"
              required
              maxLength={120}
              autoComplete="name"
              defaultValue={v?.nom ?? ""}
              className={champ}
            />
          </label>
          <label className="block">
            <span className={etiquette}>Votre établissement</span>
            <input
              name="etablissement"
              required
              maxLength={160}
              autoComplete="organization"
              defaultValue={v?.etablissement ?? ""}
              placeholder="Lycée, académie"
              className={champ}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={etiquette}>Votre e-mail, pour la réponse</span>
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              defaultValue={v?.email ?? ""}
              className={champ}
            />
          </label>
          {/* piège à robots : invisible, doit rester vide */}
          <label className="hidden" aria-hidden="true">
            Site web
            <input name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-amber-400/25 bg-amber-950/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
          Ce que nous vous conseillons
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-400">Entreprise</dt>
          <dd className="font-medium text-slate-100">{reco.scenarioTitre}</dd>
          <dt className="text-slate-400">Niveau</dt>
          <dd className="font-medium text-slate-100">
            {reco.niveau} · {reco.niveauNom}
          </dd>
          <dt className="text-slate-400">Durée</dt>
          <dd className="font-medium text-slate-100">
            {reco.tours} tours, un {periodiciteLabel} par tour
          </dd>
          <dt className="text-slate-400">Atelier</dt>
          <dd className="font-medium text-slate-100">
            {reco.atelierCode ? (
              <Link
                href={`/animations/${reco.atelierCode}`}
                className="text-amber-300 underline-offset-4 hover:underline"
              >
                Voir le déroulé prêt à animer
              </Link>
            ) : (
              "Aucun atelier publié pour ce diplôme"
            )}
          </dd>
        </dl>

        <ul className="space-y-2 border-t border-white/10 pt-4 text-sm leading-relaxed text-slate-300">
          {reco.pourquoi.map((raison) => (
            <li key={raison}>· {raison}</li>
          ))}
        </ul>

        {state.ok ? (
          <p
            role="status"
            className="rounded-lg border border-teal-400/30 bg-teal-950/30 px-3 py-2 text-sm text-teal-200"
          >
            ✓ Demande envoyée. Nous vous répondons à {state.ok.email}, avec ce profil et cette
            recommandation sous les yeux.
          </p>
        ) : null}
        {state.error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300"
          >
            {state.error}
          </p>
        ) : null}
        {guardError ? <GuardError message={guardError} /> : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/entreprises#${reco.scenarioCode}`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            La fiche de cette entreprise
          </Link>
          {!state.ok ? (
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
            >
              {pending ? "Envoi…" : "Nous écrire avec ce profil"}
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
