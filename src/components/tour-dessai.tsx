"use client";

import { bouton } from "@/components/bouton";
import { useState } from "react";
import Link from "next/link";
import { jouerUnTourDessaiAction, type EssaiState } from "@/app/actions";
import { BORNES } from "@/pedagogy/tour-dessai";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import { formatEuro } from "@/lib/format";
import { sansMolette } from "@/components/sans-molette";

/**
 * UN TOUR JOUABLE, DANS LA PAGE D'ACCUEIL.
 *
 * La place était tenue par un cockpit dessiné : « chiffre d'affaires
 * 346 920 € », « #2 NOVA 58,3 ». Des chiffres inventés, qui promettaient une
 * simulation sans en faire tourner une. Un visiteur qui voulait savoir ce que
 * c'était devait créer une partie pour le découvrir — et la moitié s'arrêtait
 * là.
 *
 * Deux décisions, le vrai moteur, les chiffres qui en sortent. Le prix fixe la
 * demande, le plan fixe ce qu'on peut servir, et l'atelier a un plafond que les
 * curseurs laissent dépasser exprès : le découvrir en deux secondes vaut mieux
 * que le lire.
 *
 * RIEN N'EST ENREGISTRÉ et rien n'est à créer : pas de compte, pas de partie,
 * pas d'identité. Le tour est calculé et oublié.
 *
 * LES CURSEURS ANNONCENT LEUR VALEUR AVANT L'ENVOI. Un `range` dont on ne lit
 * pas le chiffre ne se règle pas : l'état local est là pour l'afficher, la
 * décision part quand même dans le formulaire.
 */

const initial: EssaiState = { tour: null, lecons: [] };

export function TourDessai() {
  const [prix, setPrix] = useState<number>(BORNES.prix.defaut);
  const [production, setProduction] = useState<number>(BORNES.production.defaut);
  const { state, formAction, pending, formRef, guardError } = useGuardedAction(
    jouerUnTourDessaiAction,
    initial,
    { label: "tour d'essai" },
  );
  const t = state.tour;
  const nombre = (n: number) => Math.round(n).toLocaleString("fr-FR");

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-amber-400/5 sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-white/5 pb-3">
        <p className="text-xs font-semibold text-slate-300">
          NOVA · atelier d&apos;enceintes · tour 1
        </p>
        <p className="text-xs text-slate-400">Sans compte, rien n&apos;est enregistré</p>
      </div>

      <p className="mt-3 text-base leading-relaxed text-slate-300">
        Vous dirigez l&apos;atelier. Fixez votre prix et ce que vous produisez : le marché
        répondra.
      </p>

      <div className="mt-4 space-y-4">
        <Curseur
          nom="prix"
          etiquette="Prix de vente"
          valeur={prix}
          surValeur={setPrix}
          bornes={BORNES.prix}
          affichage={`${prix} €`}
          aide="Plus haut, moins de clients. Plus bas, ils se pressent."
        />
        <Curseur
          nom="production"
          etiquette="Plan de production"
          valeur={production}
          surValeur={setProduction}
          bornes={BORNES.production}
          affichage={`${nombre(production)} enceintes`}
          aide="Ce que vous demandez à l'atelier de sortir ce tour-ci."
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className={`${bouton({ taille: "l" })} mt-4 w-full`}
      >
        {pending ? "Simulation en cours…" : t ? "Rejouer ce tour" : "Simuler ce tour"}
      </button>

      {/*
        LE RÉSULTAT REMPLACE L'ATTENTE, IL NE LA POUSSE PAS PLUS BAS. La région
        est annoncée à la voix : la page ne bouge pas, seuls les chiffres
        changent, et sans cela un lecteur d'écran ne saurait pas que le tour a
        été joué.
      */}
      <div role="status" aria-live="polite" className="mt-4">
        {t ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Chiffre
                etiquette="Chiffre d'affaires"
                valeur={formatEuro(t.chiffreDaffaires)}
              />
              <Chiffre
                etiquette="Résultat net"
                valeur={`${t.resultat >= 0 ? "+" : "−"}${formatEuro(Math.abs(t.resultat))}`}
                ton={t.resultat >= 0 ? "bon" : "mauvais"}
              />
              <Chiffre
                etiquette="Trésorerie nette"
                valeur={`${t.tresorerie >= 0 ? "+" : "−"}${formatEuro(Math.abs(t.tresorerie))}`}
                ton={t.tresorerie >= 0 ? "neutre" : "mauvais"}
              />
              <Chiffre
                etiquette="Enceintes vendues"
                valeur={`${nombre(t.vendu)} / ${nombre(t.demande)} demandées`}
              />
            </div>
            <ul className="mt-3 space-y-1.5">
              {state.lecons.map((l) => (
                <li
                  key={l.texte}
                  className={`rounded-lg border px-3 py-2 text-sm leading-relaxed ${
                    l.ton === "bon"
                      ? "border-emerald-400/25 bg-emerald-950/20 text-emerald-100"
                      : l.ton === "mauvais"
                        ? "border-amber-400/25 bg-amber-950/20 text-amber-100"
                        : "border-white/10 bg-slate-950 text-slate-300"
                  }`}
                >
                  {l.texte}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400">
              C&apos;est un tour sur six.{" "}
              <Link
                href="/jouer"
                className="text-amber-300 underline-offset-4 hover:text-amber-200 hover:underline"
              >
                Jouer la partie entière
              </Link>{" "}
              — vous y déciderez aussi des budgets, des recrutements et des investissements.
            </p>
          </>
        ) : (
          <p className="text-base leading-relaxed text-slate-400">
            Le moteur est celui de la classe : mêmes décisions, mêmes comptes. Vos chiffres
            s&apos;afficheront ici.
          </p>
        )}
      </div>

      {guardError ? (
        <div className="mt-2">
          <GuardError message={guardError} />
        </div>
      ) : null}
    </form>
  );
}

function Curseur({
  nom,
  etiquette,
  valeur,
  surValeur,
  bornes,
  affichage,
  aide,
}: {
  nom: string;
  etiquette: string;
  valeur: number;
  surValeur: (v: number) => void;
  bornes: { min: number; max: number; pas: number };
  affichage: string;
  aide: string;
}) {
  return (
    <div>
      <label className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-sm font-medium text-slate-200">{etiquette}</span>
        <span className="font-mono text-sm tabular-nums text-amber-300">{affichage}</span>
        <input
          type="range"
          onWheel={sansMolette}
          name={nom}
          min={bornes.min}
          max={bornes.max}
          step={bornes.pas}
          value={valeur}
          onChange={(e) => surValeur(Number(e.target.value))}
          className="mt-1.5 w-full accent-amber-400"
        />
      </label>
      <p className="mt-1 text-sm leading-relaxed text-slate-400">{aide}</p>
    </div>
  );
}

function Chiffre({
  etiquette,
  valeur,
  ton = "neutre",
}: {
  etiquette: string;
  valeur: string;
  ton?: "bon" | "mauvais" | "neutre";
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
      <p className="text-xs text-slate-400">{etiquette}</p>
      <p
        className={`mt-0.5 font-mono text-sm tabular-nums ${
          ton === "bon" ? "text-emerald-300" : ton === "mauvais" ? "text-rose-300" : "text-slate-100"
        }`}
      >
        {valeur}
      </p>
    </div>
  );
}
