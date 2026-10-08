"use client";

import { bouton } from "@/components/bouton";
import { useEffect, useMemo, useState } from "react";
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
const ETAT_INITIAL: OrientationFormState = {
  error: null,
  ok: null,
  values: null,
};

export function OrientationForm({
  initial = ETAT_INITIAL,
}: {
  initial?: OrientationFormState;
}) {
  const diplomes = diplomesProposes();
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    envoyerDemandeOrientationAction,
    initial,
    { label: "demande de simulation" },
  );
  const v = state.values;
  // Rien n'est choisi d'avance : la recommandation ne s'écrit qu'une fois les
  // trois questions répondues, et seule une saisie rejouée après un échec
  // revient remplie.
  const [diplome, setDiplome] = useState(v?.diplome ?? "");
  const [semestre, setSemestre] = useState<Semestre | null>(
    v?.semestre === "s1" || v?.semestre === "s2" ? v.semestre : null,
  );
  const [objectif, setObjectif] = useState(v?.objectif ?? "");
  const complet = diplome !== "" && semestre !== null && objectif !== "";

  // SUR TÉLÉPHONE, UNE QUESTION À LA FOIS. Quatre étapes puis la recommandation :
  // « 1 / 4 — Quel diplôme préparez-vous ? »… Les champs restent TOUS dans la
  // page (une saisie rejouée après une erreur retrouve ses valeurs, et la
  // recommandation reste calculée d'un seul tenant) ; seul l'affichage change.
  // À partir de `sm`, rien ne se masque : le formulaire est celui d'avant.
  const ETAPE_RESULTAT = 5;
  const [etape, setEtape] = useState<number>(v ? ETAPE_RESULTAT : 1);
  const reponduA = (n: number) =>
    n === 1 ? diplome !== "" : n === 2 ? semestre !== null : n === 3 ? objectif !== "" : true;
  const allerA = (n: number) => {
    setEtape(n);
    // Une nouvelle question s'ouvre en haut de l'écran, pas à mi-hauteur de la précédente.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      requestAnimationFrame(() =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  };
  // Après un envoi, la réponse (confirmation ou erreur) s'affiche en tête : on y remonte.
  useEffect(() => {
    if (!(state.ok || state.error)) return;
    if (window.matchMedia("(max-width: 639px)").matches) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state, formRef]);
  /** Un champ n'est visible, sur téléphone, que le temps de sa question. */
  const aSonEtape = (n: number) => (etape === n ? "" : "max-sm:hidden");
  const question = (n: number, texte: string) => (
    <p className="text-lg font-semibold leading-snug text-slate-50 sm:hidden">
      <span className="text-amber-300">{n} / 4</span> — {texte}
    </p>
  );

  const reco = useMemo(
    () =>
      complet ? recommander({ diplome, semestre: semestre!, objectif }) : null,
    [complet, diplome, semestre, objectif],
  );
  const periodiciteLabel = reco
    ? PERIODICITY_LABELS[reco.periodicite].singular.toLowerCase()
    : "";

  const champ =
    "mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none";
  const etiquette =
    "text-xs font-medium uppercase tracking-wide text-slate-400";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start"
    >
      <div className="carte space-y-4 p-6">
        {/* La progression : « Étape 2 sur 4 » et quatre points. */}
        <div className="flex items-center justify-between gap-3 sm:hidden" aria-live="polite">
          <p className="text-sm font-medium text-slate-300">
            {etape < ETAPE_RESULTAT ? `Étape ${etape} sur 4` : "Votre recommandation"}
          </p>
          <div aria-hidden className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`h-2 w-6 rounded-full ${n <= etape ? "bg-amber-400" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>

        <label className={`block ${aSonEtape(1)}`}>
          {question(1, "Quel diplôme préparez-vous ?")}
          <span className={`${etiquette} max-sm:sr-only`}>Le diplôme préparé</span>
          <select
            name="diplome"
            value={diplome}
            required
            onChange={(e) => setDiplome(e.target.value)}
            className={`${champ} max-sm:mt-3 max-sm:min-h-12 max-sm:text-base`}
          >
            <option value="" disabled>
              Choisir un diplôme…
            </option>
            {diplomes.map((d) => (
              <option key={d.code} value={d.code}>
                {d.libelle}
              </option>
            ))}
          </select>
        </label>

        <fieldset className={aSonEtape(2)}>
          <legend className="w-full">
            {question(2, "Où en êtes-vous ?")}
            <span className={`${etiquette} max-sm:sr-only`}>
              Où vous en êtes dans l&apos;année
            </span>
          </legend>
          <input type="hidden" name="semestre" value={semestre ?? ""} />
          <div className="mt-3 grid gap-2 sm:mt-2 sm:grid-cols-2">
            {(
              [
                [
                  "s1",
                  "Premier semestre",
                  "La classe découvre l'outil et la matière",
                ],
                [
                  "s2",
                  "Second semestre",
                  "Les bases sont posées, on peut ouvrir",
                ],
              ] as const
            ).map(([code, titre, aide]) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSemestre(code);
                  // Un choix à deux boutons n'a pas besoin de « Continuer ».
                  if (etape === 2) allerA(3);
                }}
                aria-pressed={semestre === code}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition max-sm:min-h-14 max-sm:py-3 ${
                  semestre === code
                    ? "border-amber-400/60 bg-amber-950/20 text-slate-100"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:border-white/25"
                }`}
              >
                <span className="block font-medium">{titre}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-slate-400">
                  {aide}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className={`block ${aSonEtape(3)}`}>
          {question(3, "Que souhaitez-vous travailler ?")}
          <span className={`${etiquette} max-sm:sr-only`}>Ce que vous voulez faire travailler</span>
          <select
            name="objectif"
            value={objectif}
            required
            onChange={(e) => setObjectif(e.target.value)}
            className={`${champ} max-sm:mt-3 max-sm:min-h-12 max-sm:text-base`}
          >
            <option value="" disabled>
              Choisir un objectif…
            </option>
            {OBJECTIFS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.libelle}
              </option>
            ))}
          </select>
        </label>

        <label className={`block ${aSonEtape(4)}`}>
          {question(4, "Quel contexte ?")}
          <span className={`${etiquette} max-sm:sr-only`}>Votre contexte, en quelques lignes</span>
          <textarea
            name="message"
            defaultValue={v?.message ?? ""}
            rows={4}
            maxLength={1200}
            placeholder="Effectif, volume horaire, contraintes de salle, ce que vous avez déjà essayé, ce qui vous manque…"
            className={`${champ} max-sm:mt-3 max-sm:text-base`}
          />
          <span className="mt-1 block text-xs text-slate-400">
            Facultatif. C&apos;est ce champ qui nous permet de répondre autre
            chose que la recommandation automatique.
          </span>
        </label>

        {/*
          QUI ÉCRIT. Trois champs, pour pouvoir répondre : un nom, un
          établissement, une adresse. Rien d'autre n'est demandé, rien n'est
          réutilisé ailleurs que pour cette réponse.
        */}
        <div
          className={`grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 ${
            etape === ETAPE_RESULTAT ? "" : "max-sm:hidden"
          }`}
        >
          <p className="text-base font-semibold text-slate-50 sm:hidden sm:col-span-2">
            Pour qu&apos;on vous réponde
          </p>
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
            <input
              name="site"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </label>
        </div>

        {/* Le bouton d'envoi, sur téléphone, sous les coordonnées qu'il envoie. */}
        {etape === ETAPE_RESULTAT && !state.ok ? (
          <button
            type="submit"
            disabled={pending || !complet}
            className={`${bouton()} min-h-12 w-full sm:hidden`}
          >
            {pending ? "Envoi…" : "Nous écrire avec ce profil"}
          </button>
        ) : null}

        {/* LA NAVIGATION DES ÉTAPES, sous le pouce : « Continuer » ne s'allume
            qu'une fois la question répondue, « Retour » ramène à la précédente. */}
        {etape < ETAPE_RESULTAT ? (
          <div className="flex items-center gap-3 sm:hidden">
            {etape > 1 ? (
              <button
                type="button"
                onClick={() => allerA(etape - 1)}
                className="min-h-12 rounded-lg border border-white/15 px-5 text-sm font-medium text-slate-200"
              >
                Retour
              </button>
            ) : null}
            <button
              type="button"
              disabled={!reponduA(etape)}
              onClick={() => allerA(etape + 1)}
              className={`${bouton()} min-h-12 flex-1`}
            >
              {etape === 4 ? "Voir ma recommandation" : "Continuer"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => allerA(1)}
            className="min-h-12 w-full rounded-lg border border-white/15 text-sm font-medium text-slate-200 sm:hidden"
          >
            Modifier mes réponses
          </button>
        )}
      </div>

      <div
        className={`space-y-4 rounded-xl border border-amber-400/25 bg-amber-950/10 p-6 ${
          // Sur téléphone, la recommandation passe AVANT les coordonnées : c'est ce
          // qu'on est venu chercher, et l'on ne donne son e-mail qu'après l'avoir lue.
          etape === ETAPE_RESULTAT ? "max-sm:order-first" : "max-sm:hidden"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
          Ce que nous vous conseillons
        </p>
        {reco ? (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-400">Entreprise</dt>
              <dd className="font-medium text-slate-100">
                {reco.scenarioTitre}
              </dd>
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
                    className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
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
          </>
        ) : (
          <p className="text-base leading-relaxed text-slate-400">
            Répondez aux trois questions : le diplôme, le moment de
            l&apos;année, ce que vous voulez faire travailler. La recommandation
            s&apos;écrit ici, avec ses raisons.
          </p>
        )}

        {state.ok ? (
          <p
            role="status"
            className="rounded-lg encadre-neutre px-3 py-2 text-sm text-slate-100"
          >
            ✓ Demande envoyée. Nous vous répondons à {state.ok.email}, avec ce
            profil et cette recommandation sous les yeux.
          </p>
        ) : null}
        {state.error ? (
          <p
            role="alert"
            className="rounded-lg encadre-perte px-3 py-2 text-sm text-red-300"
          >
            {state.error}
          </p>
        ) : null}
        {guardError ? <GuardError message={guardError} /> : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {reco ? (
            <Link
              href={`/entreprises#${reco.scenarioCode}`}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
            >
              La fiche de cette entreprise
            </Link>
          ) : null}
          {!state.ok ? (
            <button
              type="submit"
              disabled={pending || !complet}
              className={`${bouton()} max-sm:hidden`}
            >
              {pending ? "Envoi…" : "Nous écrire avec ce profil"}
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
