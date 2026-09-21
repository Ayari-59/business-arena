"use client";

import { useState } from "react";
import {
  trancherSubventionAction,
  type TrancherSubventionState,
} from "@/app/teacher/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { sansMolette } from "@/components/sans-molette";
import { formatEuro } from "@/lib/format";
import type { TeacherGameView } from "@/services/game.service";

const initial: TrancherSubventionState = { error: null };

type Demande = TeacherGameView["aidRequests"][number];

/**
 * LE GUICHET DE L'ANIMATEUR.
 *
 * Une équipe en cessation de paiements, dont la banque ne prête plus et dont
 * les associés ont vidé leur enveloppe, dépose ici un dossier : un montant, un
 * motif. C'est le seul endroit du jeu où une décision n'est prise ni par une
 * équipe ni par le moteur, mais par une personne — et c'est le point : une
 * aide de dernier recours qui s'obtiendrait en cochant une case ne serait pas
 * une aide, ce serait un bouton « annuler la faillite ».
 *
 * Le panneau ne s'affiche que s'il y a quelque chose à lire. Les dossiers en
 * attente passent devant, parce qu'ils sont la seule chose qui demande un geste
 * pendant la séance ; les réponses déjà données restent en dessous, pour la
 * mémoire de la partie et pour le débriefing.
 */
export function SubventionsPanel({
  gameId,
  demandes,
}: {
  gameId: string;
  demandes: Demande[];
}) {
  if (demandes.length === 0) return null;
  const enAttente = demandes.filter((d) => d.statut === "pending");
  const tranchees = demandes.filter((d) => d.statut !== "pending");

  return (
    <section className="carte p-3 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-100">
        <span aria-hidden className="mr-1.5">🆘</span>
        Demandes de subvention exceptionnelle
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Une équipe ne dépose un dossier que lorsqu&apos;elle est au pied du mur : sa banque a
        cessé de prêter et l&apos;enveloppe de ses associés est vide. À vous de décider si son
        histoire vaut une aide — en totalité, en partie, ou pas du tout.
      </p>

      {enAttente.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {enAttente.map((d) => (
            <li key={d.id}>
              <Instruction gameId={gameId} demande={d} />
            </li>
          ))}
        </ul>
      ) : null}

      {tranchees.length > 0 ? (
        <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
          {tranchees.map((d) => (
            <li key={d.id} className="text-xs leading-relaxed text-slate-400">
              <span className="font-medium text-slate-300">{d.teamName}</span> · tour{" "}
              {d.roundIndex} ·{" "}
              {d.statut === "granted" ? (
                <span className="text-emerald-400">
                  accordée {formatEuro(d.montantAccorde ?? 0)}
                </span>
              ) : (
                <span className="text-rose-400">refusée</span>
              )}{" "}
              (demandait {formatEuro(d.montant)})
              {d.note ? ` — « ${d.note} »` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Un dossier et les deux réponses possibles. */
function Instruction({ gameId, demande }: { gameId: string; demande: Demande }) {
  const action = trancherSubventionAction.bind(null, gameId);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(action, initial, {
    label: "réponse à la demande",
  });
  const [montant, setMontant] = useState(Math.round(demande.montant));

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-amber-400/30 bg-amber-950/10 px-3 py-3"
    >
      <input type="hidden" name="requestId" value={demande.id} />
      <p className="text-sm font-semibold text-amber-200">
        {demande.teamName} demande {formatEuro(demande.montant)} · tour {demande.roundIndex}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">« {demande.motif} »</p>
      {!demande.encoreUtile ? (
        // Accorder après la clôture ne ferait rien entrer nulle part : la
        // subvention s'encaisse à la résolution du tour demandé. Le dire vaut
        // mieux que laisser cliquer dans le vide.
        <p className="mt-2 text-xs leading-relaxed text-rose-300">
          Le tour {demande.roundIndex} est déjà clos : la subvention n&apos;y serait plus
          encaissée. Vous pouvez encore refuser, pour que l&apos;équipe ait sa réponse.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="w-[160px]">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Montant accordé
          </span>
          <span className="mt-1 flex items-center gap-2 rounded-lg border border-white/5 bg-slate-950 px-2 py-2 focus-within:border-amber-400/60">
            <input
              type="number"
              onWheel={sansMolette}
              name="montant"
              value={montant}
              onChange={(e) => setMontant(Number(e.currentTarget.value))}
              step={1}
              min={0}
              max={Math.round(demande.montant)}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none"
            />
            <span className="shrink-0 text-xs text-slate-400">€</span>
          </span>
        </label>
        <label className="min-w-[200px] flex-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-400">
            Votre mot à l&apos;équipe (facultatif)
          </span>
          <input
            name="note"
            maxLength={1000}
            placeholder="Ex. : accordé une fois, pas deux."
            className="mt-1 w-full rounded-lg border border-white/5 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          name="accord"
          value="1"
          disabled={pending || !demande.encoreUtile}
          aria-busy={pending}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Accorder {formatEuro(montant)}
        </button>
        <button
          type="submit"
          name="accord"
          value="0"
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-rose-400/50 hover:text-rose-200 disabled:cursor-progress disabled:opacity-70"
        >
          Refuser
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
