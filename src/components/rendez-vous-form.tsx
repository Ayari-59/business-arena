"use client";

import { useState } from "react";
import Link from "next/link";
import type { JourDeCreneaux } from "@/lib/creneaux";
import { DUREE_MINUTES } from "@/config/rendez-vous";
import { reserverRendezVousAction, type RendezVousFormState } from "@/app/rendez-vous/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";

/**
 * Le formulaire de rendez-vous téléphonique.
 *
 * À gauche, un calendrier : les semaines en lignes, du lundi au dimanche,
 * sur la période que la page couvre, sans rien à faire défiler. Les jours qui
 * ont des créneaux sont les seuls cliquables ; rien n'est choisi d'avance,
 * c'est à la personne de désigner son jour, puis son heure. Le créneau retenu
 * va dans un champ caché que l'action relit. À droite, qui appeler et à quel
 * numéro. Une fois réservé, le créneau se dit en toutes lettres et le bouton
 * s'efface : on ne réserve pas deux fois par un double clic.
 */
const ETAT_INITIAL: RendezVousFormState = { error: null, ok: null, values: null };

const ENTETES = ["L", "M", "M", "J", "V", "S", "D"];
const nomDuMois = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", month: "long", year: "numeric" });
const moisCourt = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", month: "short" });

/** Une date civile « 2026-09-18 » lue à midi UTC : l'arithmétique de jours y est sûre. */
const aMidi = (date: string) => new Date(`${date}T12:00:00Z`);
const plusJours = (date: string, n: number) =>
  new Date(aMidi(date).getTime() + n * 86_400_000).toISOString().slice(0, 10);
/** Le lundi de la semaine d'une date (dimanche = 0 → six jours en arrière). */
const lundiDe = (date: string) => plusJours(date, -((aMidi(date).getUTCDay() + 6) % 7));

interface Case {
  date: string;
  numero: number;
  premierDuMois: boolean;
  /** Hors période : avant aujourd'hui ou après l'horizon. */
  horsPeriode: boolean;
}

/** Les cases du calendrier, semaines complètes, du lundi qui précède la période au dimanche qui la suit. */
function casesDuCalendrier(periode: { debut: string; fin: string }): Case[] {
  const cases: Case[] = [];
  const debut = lundiDe(periode.debut);
  const fin = plusJours(lundiDe(periode.fin), 6);
  for (let d = debut; d <= fin; d = plusJours(d, 1)) {
    const date = aMidi(d);
    cases.push({
      date: d,
      numero: date.getUTCDate(),
      premierDuMois: date.getUTCDate() === 1,
      horsPeriode: d < periode.debut || d > periode.fin,
    });
  }
  return cases;
}

/** « septembre 2026 », ou « septembre – octobre 2026 » quand la période en chevauche deux. */
function titreDuCalendrier(periode: { debut: string; fin: string }): string {
  const a = aMidi(periode.debut);
  const b = aMidi(periode.fin);
  if (a.getUTCMonth() === b.getUTCMonth()) return nomDuMois.format(a);
  const moisA = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", month: "long" }).format(a);
  return `${moisA} – ${nomDuMois.format(b)}`;
}

export function RendezVousForm({
  jours,
  periode,
  initial = ETAT_INITIAL,
}: {
  jours: JourDeCreneaux[];
  periode: { debut: string; fin: string };
  initial?: RendezVousFormState;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    reserverRendezVousAction,
    initial,
    { label: "rendez-vous téléphonique" },
  );
  const v = state.values;
  const parDate = new Map(jours.map((j) => [j.date, j]));
  // Rien n'est choisi d'avance ; seule une saisie rejouée après un échec l'est.
  const rejoue = v?.creneau && jours.find((j) => j.creneaux.some((c) => c.iso === v.creneau));
  const [jour, setJour] = useState<string | null>(rejoue ? rejoue.date : null);
  const [creneau, setCreneau] = useState<string | null>(rejoue ? v!.creneau! : null);
  const jourChoisi = jour ? (parDate.get(jour) ?? null) : null;
  const heureChoisie = jourChoisi?.creneaux.find((c) => c.iso === creneau)?.heure ?? null;

  const champ =
    "mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60";
  const etiquette = "text-xs font-medium uppercase tracking-wide text-slate-400";

  if (state.ok) {
    return (
      <div className="carte space-y-4 p-6">
        <p
          role="status"
          className="rounded-lg border border-teal-400/30 bg-teal-950/30 px-3 py-3 text-sm leading-relaxed text-teal-200"
        >
          ✓ Rendez-vous confirmé : <strong className="font-semibold">{state.ok.quand}</strong>. Nous vous
          appelons au numéro indiqué ; une confirmation part à {state.ok.email}
          {state.ok.dansAgenda ? ", suivie d'une invitation d'agenda" : ""}.
        </p>
        <p className="text-sm text-slate-400">
          Un empêchement ? Répondez à la confirmation, le créneau se déplace sans façon.
        </p>
        <Link href="/orientation" className="text-sm text-amber-300 underline-offset-4 hover:underline">
          En attendant, voir quelle simulation conviendrait à votre classe
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
      <input type="hidden" name="creneau" value={creneau ?? ""} />

      <div className="carte min-w-0 space-y-5 p-6">
        {jours.length === 0 ? (
          <p className="text-sm leading-relaxed text-slate-400">
            Aucun créneau libre dans les trois prochaines semaines. Écrivez-nous depuis la{" "}
            <Link href="/orientation" className="text-amber-300 underline-offset-4 hover:underline">
              page d&apos;orientation
            </Link>
            , nous vous proposerons un moment.
          </p>
        ) : (
          <>
            <fieldset className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <legend className={etiquette}>Le jour</legend>
                <span className="text-sm capitalize text-slate-300">{titreDuCalendrier(periode)}</span>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center" role="grid" aria-label="Calendrier des créneaux">
                {ENTETES.map((h, i) => (
                  <span key={i} className="text-xs font-medium text-slate-500" aria-hidden="true">
                    {h}
                  </span>
                ))}
                {casesDuCalendrier(periode).map((c) => {
                  const j = c.horsPeriode ? undefined : parDate.get(c.date);
                  const actif = c.date === jour;
                  const etiquetteJour = c.premierDuMois ? `${c.numero} ${moisCourt.format(aMidi(c.date))}` : String(c.numero);
                  if (!j) {
                    return (
                      <span
                        key={c.date}
                        className={`flex h-10 items-center justify-center rounded-lg text-sm tabular-nums ${
                          c.horsPeriode ? "text-slate-700" : "text-slate-600 line-through decoration-slate-700"
                        }`}
                        aria-hidden="true"
                      >
                        {etiquetteJour}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={c.date}
                      type="button"
                      onClick={() => {
                        setJour(c.date);
                        setCreneau(null);
                      }}
                      aria-pressed={actif}
                      aria-label={`${j.libelle}, ${j.creneaux.length} créneaux`}
                      className={`flex h-10 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums transition ${
                        actif
                          ? "border-amber-400/70 bg-amber-950/30 text-amber-100"
                          : "border-white/10 bg-slate-950 text-slate-100 hover:border-amber-400/40"
                      }`}
                    >
                      {etiquetteJour}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {jourChoisi ? (
              <fieldset>
                <legend className={etiquette}>L&apos;heure · {jourChoisi.libelle}</legend>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {jourChoisi.creneaux.map((c) => {
                    const actif = c.iso === creneau;
                    return (
                      <button
                        key={c.iso}
                        type="button"
                        onClick={() => setCreneau(c.iso)}
                        aria-pressed={actif}
                        className={`rounded-lg border px-2 py-2 text-sm tabular-nums transition ${
                          actif
                            ? "border-amber-400/60 bg-amber-950/20 text-slate-100"
                            : "border-white/10 bg-slate-950 text-slate-300 hover:border-white/25"
                        }`}
                      >
                        {c.heure}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <p className="text-sm text-slate-400">Choisissez un jour : ses heures libres s&apos;affichent ici.</p>
            )}

            <p className="border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-500">
              Heure de Paris. Un appel dure {DUREE_MINUTES} minutes ; les créneaux se règlent sur
              l&apos;agenda de la personne qui vous appelle, ce qui y est occupé n&apos;est pas proposé.
            </p>
          </>
        )}
      </div>

      <div className="min-w-0 space-y-4 rounded-2xl border border-amber-400/25 bg-amber-950/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Qui appeler</p>
        <p className="text-sm text-slate-300" aria-live="polite">
          {heureChoisie && jourChoisi ? (
            <>
              Créneau retenu : <strong className="font-semibold text-slate-100">{jourChoisi.libelle} à {heureChoisie}</strong>
            </>
          ) : (
            "Choisissez d'abord un jour et une heure."
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={etiquette}>Votre nom</span>
            <input name="nom" required maxLength={120} autoComplete="name" defaultValue={v?.nom ?? ""} className={champ} />
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
          <label className="block">
            <span className={etiquette}>Le numéro où vous appeler</span>
            <input
              name="telephone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              defaultValue={v?.telephone ?? ""}
              placeholder="06 12 34 56 78"
              className={champ}
            />
          </label>
          <label className="block">
            <span className={etiquette}>Votre e-mail, pour la confirmation</span>
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
          <label className="block sm:col-span-2">
            <span className={etiquette}>De quoi voulez-vous parler ?</span>
            <textarea
              name="message"
              defaultValue={v?.message ?? ""}
              rows={3}
              maxLength={800}
              placeholder="Votre classe, ce que vous avez déjà essayé, la question qui vous fait hésiter…"
              className={champ}
            />
            <span className="mt-1 block text-xs text-slate-400">Facultatif, mais l&apos;appel commence mieux.</span>
          </label>
          {/* piège à robots : invisible, doit rester vide */}
          <label className="hidden" aria-hidden="true">
            Site web
            <input name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {state.error ? (
          <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}
        {guardError ? <GuardError message={guardError} /> : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending || !creneau}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Réservation…" : "Réserver ce créneau"}
          </button>
          <span className="text-xs text-slate-500">
            Vos coordonnées ne servent qu&apos;à cet appel.
          </span>
        </div>
      </div>
    </form>
  );
}
