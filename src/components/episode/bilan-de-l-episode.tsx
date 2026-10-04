"use client";

import { useMemo } from "react";
import {
  BUDGET_REMISES,
  DSO_SEUIL,
  OBJECTIF_CA,
  OBJECTIF_MARGE,
} from "@/engine/episodes/trimestre-qui-derape";
import {
  CAS,
  analyser,
  axeDeTravail,
  comportements,
  type Cas,
  type PartieJouee,
} from "@/pedagogy/episodes/bilan-du-trimestre";
import { bouton } from "@/components/bouton";
import { kE, nombre, taux } from "./format-episode";

/**
 * LE BILAN DE L'ÉPISODE.
 *
 * Il s'ouvre sur le résultat, parce que c'est ce que le joueur attend, mais il
 * le remet aussitôt à sa place : la moyenne de ses choix sur trente tirages,
 * et ce que le hasard lui a apporté ou coûté. Le reste de la page sert à
 * séparer les deux, décision par décision.
 */

const FOND_DES_CAS: Record<Cas, string> = {
  "bonne-fav": "bg-emerald-400/10 border-emerald-400/25",
  "bonne-defav": "bg-slate-950 border-white/10",
  "faible-fav": "bg-amber-400/10 border-amber-400/25",
  "faible-defav": "bg-rose-400/10 border-rose-400/25",
};

function Jeton({ d, titre }: { d: number; titre?: string }) {
  return (
    <span
      title={titre}
      className="inline-grid h-6 min-w-8 place-items-center rounded-md bg-slate-700 px-1.5 text-xs font-semibold tabular-nums text-slate-50"
    >
      D{d + 1}
    </span>
  );
}

export function BilanDeLEpisode({
  partie,
  onAutreHasard,
  onMemeHasard,
}: {
  partie: PartieJouee;
  onAutreHasard: () => void;
  onMemeHasard: () => void;
}) {
  const a = useMemo(() => analyser(partie), [partie]);
  const t = a.trimestre;
  const constats = useMemo(() => comportements(partie, t), [partie, t]);
  const axe = axeDeTravail(constats);
  const tauxDeMarge = t.marge / t.ca;
  const chance = t.objectif - a.attendu;

  const barres = [{ nom: "Vous", valeur: t.objectif, vous: true }, ...a.references];
  const max = Math.max(...barres.map((b) => b.valeur));
  const min = Math.min(...barres.map((b) => b.valeur));
  const largeur = (v: number) => 20 + (80 * (v - min * 0.97)) / Math.max(1, max - min * 0.97);

  const tuiles = [
    {
      nom: "Chiffre d'affaires",
      valeur: kE(t.ca),
      aide: "objectif 1 200 k€",
      tenu: t.ca >= OBJECTIF_CA,
    },
    {
      nom: "Marge brute",
      valeur: taux(tauxDeMarge),
      aide: "mandat : 30 % au moins",
      tenu: tauxDeMarge >= OBJECTIF_MARGE,
    },
    {
      nom: "Délai de paiement",
      valeur: `${nombre(t.dsoFin, 0)} j`,
      aide: t.penalite > 0 ? `pénalité ${kE(t.penalite)}` : "sous les 55 jours",
      tenu: t.dsoFin <= DSO_SEUIL,
    },
    {
      nom: "Remises accordées",
      valeur: kE(t.remises),
      aide: "budget 40 k€",
      tenu: t.remises <= BUDGET_REMISES,
    },
  ];

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-300">
          Bilan de l&apos;épisode · hasard n° {partie.graine}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 tabular-nums sm:text-4xl">
          {kE(t.objectif)} de marge, pénalités déduites
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
          Avec vos choix, la moyenne sur trente tirages du hasard est de {kE(a.attendu)}. Ce
          trimestre-ci, le hasard vous a {chance >= 0 ? "apporté" : "coûté"} {kE(Math.abs(chance))}.
          C&apos;est la qualité de vos décisions qui compte, pas ce hasard.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tuiles.map((u) => (
          <li
            key={u.nom}
            className={`carte border-t-2 p-3.5 ${u.tenu ? "border-t-emerald-400" : "border-t-rose-400"}`}
          >
            <p className="text-sm text-slate-400">{u.nom}</p>
            <p className="font-display text-xl font-semibold tabular-nums text-slate-50">
              {u.valeur}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span
                className={`rounded-full px-2 font-semibold ${
                  u.tenu ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
                }`}
              >
                {u.tenu ? "tenu" : "manqué"}
              </span>
              {u.aide}
            </p>
          </li>
        ))}
      </ul>

      <section className="carte grid gap-4 p-5">
        <h2 className="text-lg font-bold text-slate-50">
          Le même trimestre, le même hasard, d&apos;autres manières de décider
        </h2>
        <ul className="grid gap-2.5">
          {barres.map((b) => (
            <li
              key={b.nom}
              className="grid grid-cols-[7rem_minmax(0,1fr)_4rem] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_4.5rem]"
            >
              <span
                className={`text-sm ${"vous" in b ? "font-semibold text-slate-50" : "text-slate-300"}`}
              >
                {b.nom}
              </span>
              <span className="h-3.5 overflow-hidden rounded bg-slate-800">
                <span
                  className={`block h-full rounded ${"vous" in b ? "bg-amber-400" : "bg-slate-500"}`}
                  style={{ width: `${largeur(b.valeur)}%` }}
                />
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-slate-100">
                {kE(b.valeur)}
              </span>
            </li>
          ))}
        </ul>
        <p className="max-w-2xl text-sm text-slate-400">
          Marge brute du trimestre moins la pénalité de délai de paiement, sous le hasard que vous
          avez joué. L&apos;échelle ne part pas de zéro.
        </p>
      </section>

      <section className="carte grid gap-4 p-5">
        <h2 className="text-lg font-bold text-slate-50">
          Vos cinq décisions : ce qui relevait du choix, ce qui relevait du hasard
        </h2>
        <div
          role="table"
          aria-label="Qualité de décision et résultat"
          className="grid grid-cols-[5.5rem_repeat(2,minmax(0,1fr))] gap-1.5 sm:grid-cols-[8.5rem_repeat(2,minmax(0,1fr))]"
        >
          <div role="row" className="contents">
            <div role="presentation" />
            <div role="columnheader" className="self-end text-sm font-semibold text-slate-400">
              Résultat favorable
            </div>
            <div role="columnheader" className="self-end text-sm font-semibold text-slate-400">
              Résultat défavorable
            </div>
          </div>
          {(["bonne", "faible"] as const).map((q) => (
            <div role="row" key={q} className="contents">
              <div role="rowheader" className="self-center text-sm font-semibold text-slate-400">
                {q === "bonne" ? "Bonne décision" : "Décision faible"}
              </div>
              {(["fav", "defav"] as const).map((f) => {
                const cle = `${q}-${f}` as Cas;
                const ici = a.decisions.filter((x) => x.cas === cle);
                return (
                  <div
                    role="cell"
                    key={cle}
                    className={`grid min-h-24 content-start gap-0.5 rounded-lg border p-3 ${FOND_DES_CAS[cle]}`}
                  >
                    <span className="font-semibold text-slate-50">{CAS[cle].nom}</span>
                    <span className="text-xs text-slate-400">{CAS[cle].aide}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {ici.map((x) => (
                        <Jeton key={x.d} d={x.d} titre={x.e.options[x.pris.option]!.t} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-3 font-medium">Décision</th>
                <th className="pb-2 pr-3 font-medium">Votre choix</th>
                <th className="pb-2 pr-3 font-medium">Rang</th>
                <th className="pb-2 pr-3 font-medium">Meilleure option, en moyenne</th>
                <th className="pb-2 pr-3 text-right font-medium">Écart attendu</th>
                <th className="pb-2 text-right font-medium">Pire cas, écart au plus sûr</th>
              </tr>
            </thead>
            <tbody>
              {a.decisions.map((x) => (
                <tr key={x.d} className="border-t border-white/5 align-top">
                  <td className="py-2.5 pr-3 text-slate-300">
                    <span className="flex items-center gap-2">
                      <Jeton d={x.d} />
                      {x.e.moment}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-200">{x.e.options[x.pris.option]!.t}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-slate-300">
                    {x.rang} sur {x.n}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    {x.rang === 1 ? "votre choix" : x.e.options[x.meilleur.option]!.t}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right tabular-nums text-slate-200">
                    {x.rang === 1 ? "—" : `−${kE(x.meilleur.attendu - x.pris.attendu)}`}
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right tabular-nums text-slate-200">
                    {x.plusSur.p10 - x.pris.p10 < 500
                      ? "le plus sûr"
                      : `−${kE(x.plusSur.p10 - x.pris.p10)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-2xl text-sm text-slate-400">
          Chaque décision est rejouée sous trente tirages du hasard, vos autres choix inchangés. «
          Pire cas » : le résultat du trimestre dans les 10 % de tirages les moins favorables,
          comparé à l&apos;option qui protège le mieux.
        </p>
      </section>

      <section className="carte grid gap-3 p-5">
        <h2 className="text-lg font-bold text-slate-50">Comportements observés</h2>
        <ul className="grid gap-2">
          {constats.map((c) => (
            <li
              key={c.texte}
              className={`max-w-3xl rounded-r-lg border-l-2 bg-slate-950 py-2.5 pl-3.5 pr-3 text-sm leading-relaxed text-slate-200 ${
                c.score >= 1
                  ? "border-emerald-400"
                  : c.score > 0
                    ? "border-amber-400"
                    : "border-rose-400"
              }`}
            >
              <span className="sr-only">
                {c.score >= 1 ? "Acquis : " : c.score > 0 ? "En partie : " : "À travailler : "}
              </span>
              {c.texte}
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300">
            Votre axe de travail
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-slate-50">{axe.titre}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{axe.texte}</p>
        </div>
      </section>

      <p className="max-w-2xl text-sm text-slate-400">
        Dans la version pour les entreprises, ce bilan n&apos;est visible que par la personne qui
        joue. Le responsable formation ne voit que les résultats de la cohorte, à partir de cinq
        personnes.
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onAutreHasard} className={bouton({ taille: "l" })}>
          Rejouer sous un autre hasard
        </button>
        <button
          type="button"
          onClick={onMemeHasard}
          className={bouton({ variante: "secondaire", taille: "l" })}
        >
          Recommencer avec le même hasard
        </button>
      </div>
    </div>
  );
}
