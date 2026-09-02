import type { Metadata } from "next";
import Link from "next/link";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import { scenarioByCode } from "@/config/scenarios/registry";

export const metadata: Metadata = {
  title: "Ateliers et animations · BUSINESS ARENA",
  description:
    "Des déroulés de plusieurs séances, adossés à une partie réelle, avec les livrables attendus, la trace écrite de chaque séance et les critères d'évaluation.",
};

/**
 * LES ATELIERS PROFESSIONNELS.
 *
 * Un enseignant n'adopte pas un jeu d'entreprise parce qu'il est beau : il
 * l'adopte quand il voit ce qu'il en fera lundi matin, ce que les élèves
 * rendront, et sur quoi il les notera. Cette page ne vend rien, elle montre le
 * déroulé.
 */

function Etoiles({ n }: { n: number }) {
  return (
    <span className="text-amber-400" aria-label={`exigence ${n} sur 4`}>
      {"★".repeat(n)}
      <span className="text-slate-700">{"★".repeat(4 - n)}</span>
    </span>
  );
}

export default function AteliersPage() {
  return (
    <main id="main" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      <section className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            Accueil
          </Link>{" "}
          / Ateliers et animations
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          Des déroulés prêts à animer
        </h1>
        <p className="mt-5 text-lg italic leading-relaxed text-slate-400">
          Des déroulés de plusieurs séances, écrits pour des enseignants qui veulent adosser un
          jeu d&apos;entreprise à une progression. Chaque fiche donne le déroulé minuté séance
          par séance, les réglages de la partie, ce que les équipes rendent, la trace écrite que
          chaque séance laisse et les critères d&apos;évaluation. Chacune dit à quel niveau elle
          s&apos;adresse, du lycée à l&apos;expertise comptable.
        </p>

        <h2 className="mt-12 text-xl font-bold text-slate-100">À qui ils s&apos;adressent</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Aux enseignants qui cherchent un point de départ structuré plutôt qu&apos;un jeu à
          apprivoiser seuls. Ils ne remplacent pas votre projet pédagogique : ils en proposent une
          trame, que vous adapterez à votre volume horaire, à vos co-animateurs et à votre grille
          d&apos;évaluation. Tout y est modifiable, à commencer par le secteur de
          l&apos;entreprise et le niveau de difficulté.
        </p>

        <h2 className="mt-12 text-xl font-bold text-slate-100">Les ateliers disponibles</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-sm">
            <caption className="border-b border-white/5 bg-slate-900/60 px-4 py-2 text-left text-xs italic text-slate-500">
              Tableau récapitulatif des ateliers publiés.
            </caption>
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2 font-medium">Diplôme</th>
                <th className="px-4 py-2 font-medium">Atelier</th>
                <th className="px-4 py-2 font-medium">Entreprise</th>
                <th className="px-4 py-2 font-medium">Durée</th>
                <th className="px-4 py-2 font-medium">Exigence</th>
              </tr>
            </thead>
            <tbody>
              {ATELIERS.map((a) => (
                <tr key={a.code} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium text-slate-200">
                    {a.diplome}
                    <span className="block text-xs text-slate-500">{a.annee}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.titre}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {scenarioByCode(a.reglages.scenarioCode).playerTeamName}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {a.format}
                    <span className="block text-xs text-slate-600">
                      {dureeTotaleHeures(a)} h au total
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Etoiles n={a.difficulte} />
                    <span className="block text-xs text-slate-500">{a.difficulteLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {ATELIERS.map((a) => (
            <article
              key={a.code}
              className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-amber-400/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                {a.nature} · {a.diplome}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-50">{a.titre}</h3>
              <p className="mt-2 text-sm italic leading-relaxed text-slate-400">{a.resume}</p>
              <dl className="mt-4 space-y-1 text-xs">
                {[
                  ["Entreprise", scenarioByCode(a.reglages.scenarioCode).playerTeamName],
                  ["Durée", a.format],
                  ["Séances", `${a.seances.length}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-4">
                    <dt className="w-20 shrink-0 uppercase tracking-wide text-slate-600">{k}</dt>
                    <dd className="text-slate-300">{v}</dd>
                  </div>
                ))}
                <div className="flex gap-4">
                  <dt className="w-20 shrink-0 uppercase tracking-wide text-slate-600">Exigence</dt>
                  <dd>
                    <Etoiles n={a.difficulte} />
                  </dd>
                </div>
              </dl>
              <Link
                href={`/ateliers/${a.code}`}
                className="mt-4 inline-block text-sm font-semibold text-amber-300 underline-offset-4 hover:underline"
              >
                Voir le déroulé →
              </Link>
            </article>
          ))}
        </div>

        <h2 className="mt-14 text-xl font-bold text-slate-100">Comment ils sont écrits</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
          <p>
            Chaque atelier est construit à partir d&apos;une partie réellement jouable sur la
            plateforme : les réglages annoncés sont ceux qui produisent le déroulé décrit, et les
            documents demandés aux équipes sont ceux que le jeu leur met effectivement entre les
            mains. Nous ne décrivons pas une séance que nous n&apos;aurions pas pu faire tourner.
          </p>
          <p>
            Chaque diplôme découpe le métier avec ses propres mots, processus pour le BTS CG,
            blocs de compétences pour le BTS MCO, activités pour le BTS GPME, unités
            d&apos;enseignement pour le DCG, et chaque fiche emploie ceux de son référentiel. Le
            rapprochement entre une séance et l&apos;un d&apos;eux est en revanche une
            PROPOSITION, pas une lecture officielle du référentiel : à vous de l&apos;ajuster à
            la progression de votre établissement et aux compétences que votre équipe a décidé
            d&apos;évaluer. Si un rapprochement vous paraît discutable, écrivez-nous, c&apos;est
            exactement le retour dont nous avons besoin.
          </p>
          <p>
            La plateforme est en version bêta et ces ateliers évoluent avec elle. Ils sont
            librement utilisables en classe.
          </p>
        </div>
      </section>
    </main>
  );
}
