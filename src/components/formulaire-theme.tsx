"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { bouton } from "@/components/bouton";
import { SubmitButton } from "@/components/submit-button";
import { BANDES, PAGES_A_BANDES, bandesDeLaPage } from "@/config/bandes";
import { validerContrastes } from "@/config/theme-du-site";
import {
  enregistrerThemeAction,
  retablirThemeAction,
  type EtatTheme,
} from "@/app/admin/theme/actions";

/**
 * LE RÉGLAGE DES BANDES, AVEC SES RÈGLES SOUS LES YEUX.
 *
 * Les règles du contre-jour (deux bandes au plus, jamais côte à côte, au moins
 * une coupure) sont les mêmes ici et à l'enregistrement : c'est le même module
 * qui les vérifie des deux côtés. Ici elles GUIDENT — l'administrateur voit le
 * refus au moment où il coche, avant d'avoir cliqué — et là-bas elles PROTÈGENT,
 * puisqu'un formulaire se forge.
 *
 * L'APERÇU NE DIT PAS TOUT PAR LA COULEUR. Chaque page est une colonne de blocs,
 * dans l'ordre où les bandes se suivent : plein pour un contre-jour, creux
 * sinon. Mais c'est la liste de cases, avec les noms, qui porte l'information ;
 * l'aperçu n'est que le moyen de voir d'un coup si deux bandes se touchent.
 */

function Apercu({
  page,
  etat,
}: {
  page: string;
  etat: Record<string, boolean>;
}) {
  return (
    <div aria-hidden className="flex w-6 shrink-0 flex-col gap-1">
      {bandesDeLaPage(page).map((b) => (
        <div
          key={b.id}
          className={`h-6 rounded-sm ${etat[b.id] ? "bg-amber-400/80" : "border border-white/20"}`}
        />
      ))}
    </div>
  );
}

export function FormulaireTheme({
  initial,
}: {
  initial: Record<string, boolean>;
}) {
  const [serveur, enregistrer] = useActionState<EtatTheme, FormData>(
    enregistrerThemeAction,
    {
      erreurs: [],
      enregistre: false,
      etat: initial,
    },
  );
  const [etat, setEtat] = useState(initial);
  const [retablissement, lancer] = useTransition();
  const [retabli, setRetabli] = useState(false);

  // Les mêmes règles qu'à l'enregistrement : c'est le même module.
  const erreurs = useMemo(() => validerContrastes(etat), [etat]);

  // Le message de réussite ne vaut que tant que l'écran montre ce qui a été
  // enregistré : dès qu'on coche autre chose, il est périmé.
  const memeEtat = (a: Record<string, boolean>, b: Record<string, boolean>) =>
    BANDES.every((x) => a[x.id] === b[x.id]);
  const enregistreMaintenant =
    serveur.enregistre && memeEtat(serveur.etat, etat);
  const ecarts = BANDES.filter(
    (b) => etat[b.id] !== b.contrasteParDefaut,
  ).length;

  return (
    <form action={enregistrer} className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        {PAGES_A_BANDES.map(({ page, nom, partielle }) => (
          <fieldset key={page} className="carte p-5">
            <legend className="sr-only">Bandes de la page {nom}</legend>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-100">{nom}</h2>
              <Link
                href={page}
                target="_blank"
                className="text-xs text-slate-400 underline-offset-4 hover:text-amber-300 hover:underline"
              >
                Voir la page
              </Link>
            </div>
            {partielle ? (
              <p className="mt-1 text-xs text-slate-400">
                Page de lecture : seule sa bande finale est une bande.
              </p>
            ) : null}
            <div className="mt-4 flex gap-4">
              <Apercu page={page} etat={etat} />
              <ul className="min-w-0 flex-1 space-y-1">
                {bandesDeLaPage(page).map((b) => (
                  <li key={b.id}>
                    <label className="flex min-h-6 cursor-pointer items-center gap-2.5 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        name={`bande:${b.id}`}
                        checked={etat[b.id] ?? false}
                        onChange={(e) => {
                          setRetabli(false);
                          setEtat((courant) => ({
                            ...courant,
                            [b.id]: e.target.checked,
                          }));
                        }}
                        className="h-4 w-4 shrink-0 accent-amber-400"
                      />
                      <span className="min-w-0">
                        {b.nom}
                        {b.contrasteParDefaut ? (
                          <span className="ml-2 text-xs text-slate-400">
                            contre-jour d&apos;origine
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </fieldset>
        ))}
      </div>

      {erreurs.length > 0 ? (
        <div
          role="alert"
          className="rounded-xl border border-red-400/30 bg-red-950/20 p-4"
        >
          <p className="text-sm font-semibold text-red-200">
            Ce réglage ne peut pas être enregistré.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-200">
            {erreurs.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {serveur.erreurs.length > 0 && erreurs.length === 0 ? (
        <p role="alert" className="text-sm text-red-300">
          {serveur.erreurs.join(" ")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton
          className={bouton({ taille: "m" })}
          pendingLabel="Enregistrement…"
          disabled={erreurs.length > 0}
        >
          Enregistrer
        </SubmitButton>
        <button
          type="button"
          disabled={retablissement || ecarts === 0}
          onClick={() =>
            lancer(async () => {
              const r = await retablirThemeAction();
              setEtat(r.etat);
              setRetabli(true);
            })
          }
          className={`${bouton({ variante: "secondaire", taille: "m" })} disabled:opacity-40`}
        >
          Rétablir l&apos;état d&apos;origine
        </button>
        <p aria-live="polite" className="text-sm text-slate-400">
          {retabli
            ? "État d'origine rétabli."
            : enregistreMaintenant
              ? "Enregistré. Les pages se mettent à jour à leur prochain affichage."
              : ecarts === 0
                ? "Aucun écart avec l'état d'origine."
                : `${ecarts} bande${ecarts > 1 ? "s" : ""} différent${ecarts > 1 ? "t" : ""} de l'état d'origine.`}
        </p>
      </div>
    </form>
  );
}
