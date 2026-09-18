"use client";

import { useState } from "react";
import { distribuerCourrierAction, type DistributionState } from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { courriersPourCodes } from "@/config/courriers/registre";
import { CourrierRecommande, Enveloppe } from "@/components/courrier";

const initial: DistributionState = { error: null, codeDistribue: null };

const MAX_EN_ATTENTE = 4;
const MAX_MARCHE = 2;

/**
 * LE COURRIER DU JOUR, ENTRE LES MAINS DE L'ENSEIGNANT (mode apprentissage).
 *
 * Deux piles distinctes, comme sur le bureau d'un secrétariat : les courriers
 * adressés au marché, que toute la classe reçoit, et les plis adressés à une
 * entreprise. Le courrier est annoncé aux équipes et appliqué à la clôture du
 * tour.
 */
export function DistributionCourrier({
  gameId,
  courriersEnAttente,
  teams,
  scenarioEventCodes,
  scenarioCode,
}: {
  gameId: string;
  courriersEnAttente: { code: string; teamId: string | null; teamName: string | null }[];
  teams: { teamId: string; name: string }[];
  /** Codes d'événements de l'instantané joué : la liasse est celle du secteur. */
  scenarioEventCodes: string[];
  /** Secteur joué — pour imprimer la bonne liasse. */
  scenarioCode: string;
}) {
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    distribuerCourrierAction.bind(null, gameId),
    initial,
    { label: "distribution d'un courrier" },
  );
  const [destinataire, setDestinataire] = useState<string>("");

  const marcheEnAttente = courriersEnAttente.filter((c) => c.teamId === null);
  const dejaServies = new Set(courriersEnAttente.map((c) => c.teamId).filter(Boolean));
  const marchePlein = marcheEnAttente.length >= MAX_MARCHE;
  const toutPlein = courriersEnAttente.length >= MAX_EN_ATTENTE;

  const adresse = destinataire !== "";
  const liasse = courriersPourCodes(scenarioEventCodes);
  const distribuables = liasse.filter(
    (c) =>
      c.scope === (adresse ? "team" : "market") &&
      !courriersEnAttente.some((p) => p.code === c.code),
  );

  return (
    <section className="rounded-xl border border-amber-400/20 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-200">📬 Le courrier à distribuer</h2>
        <a
          href={`/teacher/courriers/print?scenario=${encodeURIComponent(scenarioCode)}`}
          target="_blank"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-400/40 hover:text-amber-300"
        >
          🖨️ Imprimer la liasse
        </a>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Courriers de <strong className="text-slate-300">marché</strong> pour toute la classe, plis{" "}
        <strong className="text-slate-300">adressés</strong> pour une seule entreprise. Annoncés aux
        équipes, appliqués à la clôture du tour. Vous pouvez aussi faire ouvrir les enveloppes
        papier en classe puis saisir ici le courrier distribué. (Mode apprentissage uniquement : en
        compétition, seul le tirage aléatoire du moteur fait foi.)
      </p>

      {courriersEnAttente.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
            Courriers distribués ce tour
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
            {courriersEnAttente.map((courrier, i) => (
              <CourrierRecommande
                key={`${courrier.code}-${courrier.teamId ?? "market"}`}
                code={courrier.code}
                delayMs={i * 450}
                annonce
                destinataire={courrier.teamName ? `→ ${courrier.teamName}` : "Tout le marché"}
              />
            ))}
          </div>
        </div>
      ) : null}

      {!toutPlein ? (
        <form ref={formRef} action={formAction} className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="courrier-destinataire" className="text-xs font-semibold text-slate-400">
              Destinataire
            </label>
            <select
              id="courrier-destinataire"
              name="teamId"
              value={destinataire}
              onChange={(e) => setDestinataire(e.target.value)}
              className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            >
              <option value="" disabled={marchePlein}>
                🌍 Tout le marché (toute la classe){marchePlein ? " · maximum atteint" : ""}
              </option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId} disabled={dejaServies.has(t.teamId)}>
                  🎯 {t.name} (pli adressé)
                  {dejaServies.has(t.teamId) ? " · déjà servie" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* la pile de plis, cachetés : on en prend un au hasard */}
            <button
              type="submit"
              name="eventCode"
              value=""
              disabled={pending || (destinataire === "" && marchePlein)}
              className="group relative h-24 w-36 rounded-lg transition hover:-translate-y-1 disabled:opacity-60"
              title={
                adresse
                  ? "Prendre un pli au hasard dans la liasse des entreprises"
                  : "Prendre un courrier au hasard dans la liasse du marché"
              }
            >
              <Enveloppe
                className="h-full"
                liasse={null}
                destinataire={adresse ? "Une entreprise" : "Tout le marché"}
              />
            </button>
            <span className="text-xs text-slate-400">ou</span>
            <select
              name="eventCode"
              defaultValue=""
              key={adresse ? "team" : "market"}
              className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
            >
              <option value="">Courrier au hasard</option>
              {distribuables.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.emoji} {c.objet}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending || (destinataire === "" && marchePlein)}
              className="rounded-lg border border-amber-400/40 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-60"
            >
              {pending ? "Distribution…" : "Distribuer le courrier"}
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Quatre courriers au maximum par tour : clôturez le tour pour continuer.
        </p>
      )}
      {state.error ? (
        <p className="mt-3 rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      ) : null}
      {guardError ? (
        <div className="mt-3">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </section>
  );
}
