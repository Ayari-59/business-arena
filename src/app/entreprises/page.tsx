import type { Metadata } from "next";
import Link from "next/link";
import { SCENARIOS, SECTOR_LABELS, type ScenarioDefinition } from "@/config/scenarios/registry";
import {
  ACCENTS_SECTEUR as ACCENTS,
  EMBLEMES_SECTEUR as EMOJIS,
  nomEntreprise as nomSeul,
  promesseEntreprise as promesse,
} from "@/config/scenarios/presentation";

export const metadata: Metadata = {
  title: `Les ${SCENARIOS.length} entreprises · BUSINESS ARENA`,
  description: `Un atelier, un hôtel, un bistrot, un chantier, une flotte de camions. ${SCENARIOS.length} métiers, ${SCENARIOS.length} contraintes, ${SCENARIOS.length} façons de perdre de l'argent.`,
};

/**
 * LES ENTREPRISES.
 *
 * Le sélecteur de la page d'accueil réduisait autant d'économies à autant de
 * lignes d'une liste déroulante. Or ce qui distingue ces entreprises n'est pas leur
 * décor : c'est la contrainte qui décide de tout dans chaque métier. Une
 * chambre vide ce soir est perdue pour toujours ; une enceinte invendue attend
 * en réserve, mais elle a coûté sa trésorerie. Cette page montre cet écart,
 * métier par métier, et le fait tenir dans un tableau à la fin.
 *
 * Tout y est LU du registre : titres, contraintes, arbitrages, indicateurs.
 * Rien n'est recopié, donc rien ne peut mentir quand un scénario change.
 */

function Fiche({ d }: { d: ScenarioDefinition }) {
  const a = ACCENTS[d.sector];
  const v = d.vocabulary;
  return (
    <article
      id={d.code}
      className={`group relative scroll-mt-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition ${a.bord}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl transition-opacity duration-500 ${a.halo} opacity-60 group-hover:opacity-100`}
      />
      <div className={`h-1 w-full ${a.barre}`} />
      <div className="relative p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {EMOJIS[d.sector]}
          </span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${a.puce}`}
          >
            {SECTOR_LABELS[d.sector]}
          </span>
          <span className="text-xs uppercase tracking-wider text-slate-600">
            {d.situations.length} situations · {d.bots.length} concurrents
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-50">{nomSeul(d)}</h2>
        <p className={`text-sm font-medium ${a.texte}`}>{promesse(d) ?? d.tagline}</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{d.briefing}</p>

        {/* La carte d'identité du métier : ce qui change vraiment d'un secteur
            à l'autre, et que le décor seul ne dit pas. */}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Vous vendez", v.units],
            ["Vous fixez", v.priceLabel.toLowerCase()],
            ["L'invendu devient", v.leftoverLabel.toLowerCase()],
            ["Le goulot", `${v.capacityBottleneckLabel.toLowerCase()} ou équipe`],
          ].map(([label, valeur]) => (
            <div key={label} className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-slate-600">{label}</dt>
              <dd className="mt-0.5 text-sm text-slate-200">{valeur}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 rounded-xl border border-white/5 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
            Ce que vous trouvez en arrivant
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{d.context}</p>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
            Le premier arbitrage
          </p>
          <p className="mt-2 text-sm font-medium text-slate-100">{d.dilemma.question}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {d.dilemma.routes.map((r) => (
              <div key={r.label} className="rounded-lg border border-white/5 bg-slate-900/70 p-3">
                <p className={`text-xs font-semibold ${a.texte}`}>{r.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-emerald-300/80">↗ {r.gain}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-rose-300/80">↘ {r.risque}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="text-xs uppercase tracking-wide text-slate-600">
            Ses indicateurs
          </span>
          {d.kpis.slice(0, 5).map((k) => (
            <span
              key={k.key}
              title={k.hint}
              className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400"
            >
              {k.label}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link
            href={`/?secteur=${d.code}#jouer`}
            className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white"
          >
            Diriger {nomSeul(d)}
          </Link>
          <span className="text-xs text-slate-600">
            Vous jouez {d.playerTeamName}, face à {d.bots.length} concurrents
          </span>
        </div>
      </div>
    </article>
  );
}

export default function EntreprisesPage() {
  return (
    <main id="main" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
          {SCENARIOS.length} métiers · {SCENARIOS.length} contraintes
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          Toutes les entreprises gagnent de l&apos;argent de la même façon.
          <br />
          <span className="text-amber-400">Aucune ne le perd pareil.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
          Une chambre vide ce soir est perdue pour toujours. Une enceinte invendue attend en
          réserve, mais elle a déjà coûté sa trésorerie. Une journée de conseil facturée à
          quatre-vingt-dix jours est un bénéfice qu&apos;on ne peut pas dépenser. Le compte de
          résultat est le même partout ; ce qui change, c&apos;est ce qui vous tue.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {SCENARIOS.map((d) => (
            <a
              key={d.code}
              href={`#${d.code}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition hover:brightness-125 ${ACCENTS[d.sector].puce}`}
            >
              {EMOJIS[d.sector]} {nomSeul(d)}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6">
          {SCENARIOS.map((d) => (
            <Fiche key={d.code} d={d} />
          ))}
        </div>
      </section>

      {/* ---------- Le tableau qui met tous les métiers côte à côte ---------- */}
      <section className="border-y border-white/5 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-slate-50">Ce qui change d&apos;un métier à l&apos;autre</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            Même moteur, mêmes états financiers, mêmes six tours. Ce sont les quatre colonnes
            ci-dessous qui font qu&apos;une décision juste dans un métier est une faute dans un
            autre.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Entreprise</th>
                  <th className="pb-2 pr-4 font-medium">Ce qu&apos;elle vend</th>
                  <th className="pb-2 pr-4 font-medium">L&apos;invendu devient</th>
                  <th className="pb-2 pr-4 font-medium">Sa contrainte physique</th>
                  <th className="pb-2 font-medium">Son indicateur roi</th>
                </tr>
              </thead>
              <tbody>
                {SCENARIOS.map((d) => (
                  <tr key={d.code} className="border-t border-white/5">
                    <td className="py-2.5 pr-4">
                      <a
                        href={`#${d.code}`}
                        className={`font-medium ${ACCENTS[d.sector].texte} underline-offset-4 hover:underline`}
                      >
                        {nomSeul(d)}
                      </a>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300">{d.vocabulary.units}</td>
                    <td className="py-2.5 pr-4 text-slate-400">
                      {d.scenario.perishable ? (
                        <span className="text-rose-300/90">
                          {d.vocabulary.leftoverLabel.toLowerCase()} · rien ne se stocke
                        </span>
                      ) : (
                        <span>du {d.vocabulary.leftoverLabel.toLowerCase()}, déjà payé</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{d.vocabulary.capacityLabel}</td>
                    <td className="py-2.5 text-slate-400">{d.kpis[0]?.label ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-600">
            Les activités périssables ne stockent rien : la capacité non vendue est perdue au
            passage du tour. C&apos;est la différence qui sépare un hôtelier d&apos;un
            industriel, et elle change tout le raisonnement sur le prix.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-50">Choisissez votre métier</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
          Six tours, des concurrents qui ne vous feront aucun cadeau, et une situation à traiter
          à chaque tour. Sans compte, sans installation.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/#jouer"
            className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Tester le simulateur
          </Link>
          <Link
            href="/teacher/login"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
          >
            Créer une partie pour ma classe
          </Link>
        </div>
      </section>
    </main>
  );
}
