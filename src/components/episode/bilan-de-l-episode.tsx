"use client";

import { useMemo } from "react";
import { GRAINES_DU_BILAN, moyenne } from "@/engine/episodes/commun";
import { CAS, analyser, type Cas, type Enchainement } from "@/pedagogy/episodes/bilan";
import type { Episode, PartieJouee } from "@/config/episodes/types";
import { bouton } from "@/components/bouton";
import { niveauParCode } from "@/config/episodes/niveaux";
import { CourbeDesSemaines, reperesDesDecisions } from "./courbe-des-semaines";
import { RetourDeLEpisode } from "./retour-de-l-episode";

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

/**
 * DEUX PARTIES CÔTE À CÔTE.
 *
 * Rejouer n'apprend quelque chose que si l'on voit ce qui a changé. Sous le
 * même hasard, l'écart de résultat est entièrement celui des décisions ; sous
 * un autre, seul l'écart de moyenne sur trente tirages se compare.
 */
function Comparaison({
  ep,
  avant,
  apres,
}: {
  ep: Episode;
  avant: PartieJouee;
  apres: PartieJouee;
}) {
  const [x, y] = useMemo(() => {
    const lire = (p: PartieJouee) => ({
      resultat: ep.simuler(p.chemin, p.graine, p.jours).objectif,
      attendu: moyenne(GRAINES_DU_BILAN.map((g) => ep.simuler(p.chemin, g, p.jours).objectif)),
    });
    return [lire(avant), lire(apres)];
  }, [ep, avant, apres]);
  const kE = ep.bilan.formatObjectif;
  const memeHasard = avant.graine === apres.graine;
  const ecart = (v: number) => `${v >= 0 ? "+" : "−"}${kE(Math.abs(v))}`;
  return (
    <section className="carte grid gap-4 p-5">
      <h2 className="text-lg font-bold text-slate-50">Votre partie précédente, et celle-ci</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
        {memeHasard
          ? "Même hasard pour les deux parties : l'écart de résultat vient entièrement de vos décisions."
          : "Les deux parties n'ont pas eu le même hasard : comparez plutôt la moyenne sur trente tirages, qui ne dépend que de vos décisions."}
        {(avant.niveau ?? "standard") !== (apres.niveau ?? "standard") &&
          ` Niveau ${niveauParCode(avant.niveau).nom} pour la précédente, ${niveauParCode(apres.niveau).nom} pour celle-ci : le niveau change ce que vous saviez, pas le jugement des décisions.`}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 font-medium">Décision</th>
              <th className="pb-2 pr-3 font-medium">Partie précédente</th>
              <th className="pb-2 font-medium">Cette partie</th>
            </tr>
          </thead>
          <tbody>
            {ep.etapes.map((e, d) => {
              const change = avant.chemin[d] !== apres.chemin[d];
              return (
                <tr key={e.moment} className="border-t border-white/5 align-top">
                  <td className="py-2.5 pr-3">
                    <Jeton d={d} />
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{e.options[avant.chemin[d]!]!.t}</td>
                  <td
                    className={`py-2.5 ${change ? "font-semibold text-slate-50" : "text-slate-300"}`}
                  >
                    {change && <span className="sr-only">Changé : </span>}
                    {e.options[apres.chemin[d]!]!.t}
                    {change && (
                      <span
                        aria-hidden="true"
                        className="ml-2 text-xs font-semibold text-amber-300"
                      >
                        changé
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-white/10">
              <td className="py-2.5 pr-3 font-semibold text-slate-200">Résultat</td>
              <td className="py-2.5 pr-3 tabular-nums text-slate-200">
                {kE(x.resultat)} <span className="text-slate-400">· hasard n° {avant.graine}</span>
              </td>
              <td className="py-2.5 tabular-nums text-slate-50">
                {kE(y.resultat)}{" "}
                <span className="font-semibold">({ecart(y.resultat - x.resultat)})</span>
              </td>
            </tr>
            <tr className="border-t border-white/5">
              <td className="py-2.5 pr-3 font-semibold text-slate-200">Moyenne sur 30 tirages</td>
              <td className="py-2.5 pr-3 tabular-nums text-slate-200">{kE(x.attendu)}</td>
              <td className="py-2.5 tabular-nums text-slate-50">
                {kE(y.attendu)}{" "}
                <span className="font-semibold">({ecart(y.attendu - x.attendu)})</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Le nombre de décisions, en toutes lettres. */
/**
 * Quand les décisions, jugées une à une, cachent l'écart à la méthode : on
 * montre ce que reprendre la méthode à chaque étape aurait rapporté.
 */
function LEnchainement({ e, kE }: { e: Enchainement; kE: (v: number) => string }) {
  const signe = (v: number) => `${v >= 0 ? "+" : "−"}${kE(Math.abs(v))}`;
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4">
      <h3 className="font-semibold text-slate-50">Vos décisions s&apos;enchaînent</h3>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
        Chaque décision est jugée dans la situation que les précédentes ont créée, et plusieurs des
        vôtres y répondaient bien. Mais la méthode « {e.methode} » fait {kE(e.ecart)} de plus en
        moyenne
        {e.explique < e.ecart
          ? `, et le détail décision par décision n'en explique que ${kE(e.explique)}`
          : ""}
        . Le reste tient à l&apos;enchaînement : c&apos;est en amont qu&apos;il fallait choisir
        autrement.
      </p>
      <ul className="mt-3 grid gap-1 text-sm text-slate-300">
        {e.reprises.map((r) => (
          <li key={r.d}>
            Reprendre la méthode à partir de la décision {r.d + 1} :{" "}
            <span className="font-semibold tabular-nums text-slate-100">{signe(r.gain)}</span> en
            moyenne
          </li>
        ))}
      </ul>
    </div>
  );
}

const EN_LETTRES = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"];

export function BilanDeLEpisode({
  ep,
  partie,
  cle,
  precedente,
  onAutreHasard,
  onMemeHasard,
}: {
  ep: Episode;
  partie: PartieJouee;
  /** La clé de la partie, pour la garder une seule fois ; `null` : on ne la garde pas. */
  cle: string | null;
  /** La partie jouée juste avant, pour les comparer. */
  precedente: PartieJouee | null;
  onAutreHasard: () => void;
  onMemeHasard: () => void;
}) {
  const a = useMemo(() => analyser(ep, partie), [ep, partie]);
  const t = a.trimestre;
  const constats = useMemo(() => ep.comportements(partie, t), [ep, partie, t]);
  const axe = ep.axe(constats);
  const kE = ep.bilan.formatObjectif;
  const chance = t.objectif - a.attendu;
  const hasard = ep.bilan.hasard(t, partie.graine);

  const barres = [{ nom: "Vous", valeur: t.objectif, vous: true }, ...a.references];
  const max = Math.max(...barres.map((b) => b.valeur));
  const min = Math.min(...barres.map((b) => b.valeur));
  // L'échelle part un peu sous la plus petite valeur : les écarts se voient,
  // et une barre reste visible même pour une valeur négative.
  const plancher = min - 0.03 * Math.max(Math.abs(min), max - min, 1);
  const largeur = (v: number) => 20 + (80 * (v - plancher)) / Math.max(1, max - plancher);
  const tuiles = ep.bilan.tuiles(t);

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-300">
          Bilan de l&apos;épisode · niveau {niveauParCode(partie.niveau).nom} · hasard n°{" "}
          {partie.graine}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 tabular-nums sm:text-4xl">
          {ep.bilan.titre(t)}
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

      {precedente && <Comparaison ep={ep} avant={precedente} apres={partie} />}

      <CourbeDesSemaines
        courbe={ep.courbe}
        titre="Votre trimestre, semaine par semaine"
        semaines={t.semaines}
        jouees={13}
        reperes={reperesDesDecisions(ep, ep.etapes.length)}
        imprevus={ep.imprevus(partie.graine)}
      />
      <section aria-labelledby="hasard-titre" className="grid gap-2">
        <h2
          id="hasard-titre"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
        >
          Ce que le hasard vous a réservé
        </h2>
        <ul className="grid gap-1.5 text-sm text-slate-300">
          {hasard.map((h) => (
            <li key={h.titre}>
              <span className="font-semibold text-slate-100">{h.titre} :</span> {h.texte}
            </li>
          ))}
        </ul>
      </section>

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
        <p className="max-w-2xl text-sm text-slate-400">{ep.bilan.noteDesBarres}</p>
      </section>

      <section className="carte grid gap-4 p-5">
        <h2 className="text-lg font-bold text-slate-50">
          Vos {EN_LETTRES[ep.etapes.length]} décisions : ce qui relevait du choix, ce qui relevait
          du hasard
        </h2>
        <div
          role="table"
          aria-label="Qualité de décision et résultat"
          className="grid grid-cols-[5.5rem_repeat(2,minmax(0,1fr))] gap-1.5 sm:grid-cols-[8.5rem_repeat(2,minmax(0,1fr))]"
        >
          <div role="row" className="contents">
            <div role="presentation" />
            <div role="columnheader" className="self-end text-sm font-semibold text-slate-400">
              Le trimestre lui donne raison
            </div>
            <div role="columnheader" className="self-end text-sm font-semibold text-slate-400">
              Le trimestre lui donne tort
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
        {a.enchainement && <LEnchainement e={a.enchainement} kE={kE} />}
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

      <RetourDeLEpisode ep={ep} partie={partie} cle={cle} />

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
