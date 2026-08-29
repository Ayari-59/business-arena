import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ATELIERS, atelierByCode, dureeTotaleHeures } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { scenarioByCode, SECTOR_LABELS } from "@/config/scenarios/registry";
import { PrintButton } from "@/components/print-button";

/** Les ateliers sont une donnée figée : leurs pages se rendent à la construction. */
export function generateStaticParams() {
  return ATELIERS.map((a) => ({ code: a.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const a = atelierByCode.get(code);
  if (!a) return { title: "Atelier introuvable · BUSINESS ARENA" };
  return { title: `${a.titre} · ${a.diplome}`, description: a.resume };
}

/**
 * LA FICHE D'UN ATELIER.
 *
 * Deux usages, et la page sert les deux : la lire à l'écran pour se décider,
 * l'imprimer pour l'avoir sur la table pendant la séance. D'où les styles
 * `print:` partout, et l'en-tête du site déjà masqué à l'impression.
 *
 * Tout ce qui est affiché est CALCULÉ à partir de la donnée de l'atelier : les
 * durées, le nombre de séances, la liste des livrables. Aucun total recopié ne
 * peut donc contredire le déroulé qu'il résume.
 */

function minutesEnTexte(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m}`;
}

function Section({
  id,
  titre,
  children,
}: {
  id: string;
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24">
      <h2 className="text-lg font-bold text-slate-100 print:text-black">{titre}</h2>
      {children}
    </section>
  );
}

const SOMMAIRE = [
  ["contexte", "Contexte pédagogique"],
  ["technique", "Fiche technique"],
  ["partie", "La partie à créer"],
  ["formats", "Trois façons de le placer"],
  ["deroule", "Déroulé séance par séance"],
  ["livrables", "Livrables attendus"],
  ["evaluation", "Modalités d'évaluation"],
  ["prolongements", "Prolongements"],
  ["faq", "Questions d'enseignants"],
] as const;

export default async function AtelierPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const atelier = atelierByCode.get(code);
  if (!atelier) notFound();

  const scenario = scenarioByCode(atelier.reglages.scenarioCode);
  const niveau = DIFFICULTY_PRESETS.find((p) => p.level === atelier.reglages.niveau);
  const processus = [...new Set(atelier.seances.flatMap((s) => s.processus))].sort();

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_220px] print:block print:max-w-none print:px-0 print:py-0 print:text-black">
      <main className="min-w-0">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500 print:hidden">
          <Link href="/ateliers" className="hover:text-slate-300">
            Ateliers professionnels
          </Link>{" "}
          / {atelier.diplome}
        </p>

        <header className="mt-4 border-b border-white/10 pb-6 print:border-black/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 print:text-black">
            Atelier professionnel · {atelier.diplome} · {atelier.annee}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 print:text-black">
            {atelier.titre}
          </h1>
          <p className="mt-3 text-base italic leading-relaxed text-slate-300 print:text-black">
            {atelier.pitch}
          </p>
          <div className="mt-4 print:hidden">
            <PrintButton label="Imprimer cette fiche" />
          </div>
        </header>

        {/* À retenir : les faits que l'enseignant veut avant de lire le reste. */}
        <div className="mt-8 break-inside-avoid rounded-xl border-l-2 border-amber-400 bg-amber-950/10 px-5 py-4 print:border-black/40 print:bg-transparent">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300 print:text-black">
            À retenir
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-300 print:text-black">
            <li>
              · <strong className="text-slate-100 print:text-black">{atelier.format}</strong>, soit{" "}
              {dureeTotaleHeures(atelier)} heures, une partie de {atelier.seances.length} tours,
              un tour par séance.
            </li>
            <li>
              · Processus mobilisés :{" "}
              <strong className="text-slate-100 print:text-black">
                {processus.map((p) => p.split("·")[0]!.trim()).join(", ")}
              </strong>
              .
            </li>
            <li>
              · Une équipe rend{" "}
              <strong className="text-slate-100 print:text-black">
                {atelier.seances.length} livrables
              </strong>{" "}
              et verse {atelier.seances.length} traces à son passeport professionnel.
            </li>
            <li>
              · Entreprise :{" "}
              <strong className="text-slate-100 print:text-black">{scenario.playerTeamName}</strong>{" "}
              ({SECTOR_LABELS[scenario.sector].toLowerCase()}), {atelier.reglages.equipes} équipes de
              trois élèves.
            </li>
            <li>
              · Exigence : <strong className="text-slate-100 print:text-black">{atelier.difficulteLabel}</strong>,
              aucun prérequis de jeu pour l&apos;enseignant.
            </li>
          </ul>
        </div>

        <Section id="contexte" titre="Contexte pédagogique">
          <p className="mt-2 text-sm leading-relaxed text-slate-400 print:text-black">
            {atelier.pourquoi}
          </p>
        </Section>

        <Section id="technique" titre="Fiche technique">
          <div className="mt-3 overflow-x-auto rounded-xl border border-white/10 print:border-black/20">
            <table className="w-full text-sm">
              <tbody>
                {(
                  [
                    ["Diplôme", `${atelier.diplome}, ${atelier.annee.toLowerCase()}`],
                    ["Entreprise dirigée", scenario.title],
                    ["Secteur", SECTOR_LABELS[scenario.sector]],
                    ["Ce que l'entreprise vend", scenario.vocabulary.units],
                    ["Périodicité", atelier.reglages.periodiciteLabel],
                    [
                      "Niveau du jeu",
                      `${atelier.reglages.niveau} · ${atelier.reglages.niveauNom}`,
                    ],
                    ["Nombre de séances", `${atelier.seances.length}`],
                    ["Volume horaire", `${dureeTotaleHeures(atelier)} heures`],
                    ["Effectif conseillé", `${atelier.reglages.equipes} équipes de trois élèves`],
                    ["Concurrents machine", `${atelier.reglages.bots}`],
                    ["Exigence", atelier.difficulteLabel],
                  ] as const
                ).map(([k, v]) => (
                  <tr key={k} className="border-t border-white/5 first:border-t-0 print:border-black/10">
                    <th
                      scope="row"
                      className="w-56 px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500"
                    >
                      {k}
                    </th>
                    <td className="px-4 py-2 text-slate-200 print:text-black">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="partie" titre="La partie à créer, une fois pour tout l'atelier">
          <div className="mt-3 break-inside-avoid rounded-xl border border-amber-400/25 bg-amber-950/10 p-5 print:border-black/30 print:bg-transparent">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {(
                [
                  ["Entreprise", scenario.title],
                  ["Périodicité", atelier.reglages.periodiciteLabel],
                  [
                    "Niveau",
                    `${atelier.reglages.niveau} · ${atelier.reglages.niveauNom}${niveau ? ` : ${niveau.tagline}` : ""}`,
                  ],
                  ["Équipes", `${atelier.reglages.equipes} équipes d'élèves`],
                  ["Concurrents", `${atelier.reglages.bots} pilotés par la machine`],
                  ["TVA", atelier.reglages.tva ? "activée à 20 %" : "désactivée"],
                  ["Monde variable", atelier.reglages.mondeVariable ? "activé" : "décoché"],
                  ["Questions", atelier.reglages.quizMode],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="w-32 shrink-0 text-xs uppercase tracking-wide text-slate-500">
                    {k}
                  </dt>
                  <dd className="text-slate-200 print:text-black">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-slate-400 print:text-black">
              {atelier.reglages.notes}
            </p>
            <Link
              href="/teacher"
              className="mt-4 inline-block rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 print:hidden"
            >
              Créer la partie dans mon espace enseignant
            </Link>
          </div>
        </Section>

        <Section id="formats" titre="Trois façons de le placer dans l'année">
          <p className="mt-2 text-sm leading-relaxed text-slate-400 print:text-black">
            Le contenu ne change pas, seul le découpage change. Prenez celui qui correspond à votre
            emploi du temps.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {atelier.formats.map((f) => (
              <div
                key={f.nom}
                className="break-inside-avoid rounded-xl border border-white/10 bg-slate-900 p-4 print:border-black/20 print:bg-transparent"
              >
                <h3 className="text-sm font-semibold text-slate-100 print:text-black">{f.nom}</h3>
                <p className="mt-1 text-xs text-amber-300/80 print:text-black">{f.quand}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400 print:text-black">
                  {f.comment}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="deroule" titre="Déroulé séance par séance">
          <ol className="mt-4 space-y-6 border-l border-white/10 pl-6 print:border-black/20">
            {atelier.seances.map((s) => (
              <li key={s.numero} className="relative break-inside-avoid">
                <span
                  aria-hidden
                  className="absolute -left-[31px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/50 bg-slate-950 text-[10px] font-bold text-amber-300 print:border-black/40 print:bg-white print:text-black"
                >
                  {s.numero}
                </span>
                <article className="rounded-xl border border-white/10 bg-slate-900 p-5 print:border-black/20 print:bg-transparent">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-xl font-bold text-slate-50 print:text-black">{s.titre}</h3>
                    <span className="text-xs text-slate-500">
                      {minutesEnTexte(s.dureeMinutes)}
                      {s.tourJoue !== null ? ` · tour ${s.tourJoue} joué en séance` : ""}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300 print:text-black">
                    <strong className="text-slate-100 print:text-black">Objectif. </strong>
                    {s.objectif}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.processus.map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 print:border-black/20 print:text-black"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                        Compétences travaillées
                      </h4>
                      <ul className="mt-1.5 space-y-1 text-sm text-slate-300 print:text-black">
                        {s.competences.map((c) => (
                          <li key={c}>· {c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                        Notions mobilisées
                      </h4>
                      <p className="mt-1.5 text-sm text-slate-400 print:text-black">
                        {s.notions.join(", ")}.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/5 bg-slate-950/60 p-3 print:border-black/15 print:bg-transparent">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                      Ce que vous préparez avant
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-300 print:text-black">
                      {s.preparation}
                    </p>
                  </div>

                  <h4 className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                    Minutage
                  </h4>
                  <ol className="mt-1.5 space-y-2">
                    {s.deroule.map((phase) => (
                      <li key={phase.titre} className="flex gap-3 text-sm">
                        <span className="w-14 shrink-0 pt-0.5 text-right text-xs tabular-nums text-amber-300/80 print:text-black">
                          {phase.minutes} min
                        </span>
                        <span>
                          <strong className="text-slate-100 print:text-black">
                            {phase.titre}.{" "}
                          </strong>
                          <span className="leading-relaxed text-slate-400 print:text-black">
                            {phase.detail}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-emerald-400/20 bg-emerald-950/10 p-3 print:border-black/15 print:bg-transparent">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 print:text-black">
                        Livrable de la séance
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-300 print:text-black">
                        {s.livrable}
                      </p>
                    </div>
                    <div className="rounded-lg border border-sky-400/20 bg-sky-950/10 p-3 print:border-black/15 print:bg-transparent">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-sky-300/80 print:text-black">
                        Trace pour le passeport professionnel
                      </h4>
                      <p className="mt-1.5 text-sm italic leading-relaxed text-slate-300 print:text-black">
                        « {s.tracePasseport} »
                      </p>
                    </div>
                  </div>

                  <h4 className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-600">
                    Ce qui est évalué
                  </h4>
                  <ul className="mt-1.5 space-y-1 text-sm text-slate-400 print:text-black">
                    {s.evaluation.map((c) => (
                      <li key={c}>· {c}</li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="livrables" titre="Livrables attendus, dans l'ordre">
          <p className="mt-2 text-sm leading-relaxed text-slate-400 print:text-black">
            De quoi construire votre grille : la liste est celle des séances, elle ne peut pas en
            différer.
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300 print:text-black">
            {atelier.seances.map((s) => (
              <li key={s.numero}>
                <strong className="text-slate-100 print:text-black">Séance {s.numero}. </strong>
                {s.livrable}
              </li>
            ))}
          </ol>
        </Section>

        <Section id="evaluation" titre="Modalités d'évaluation">
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-400 print:text-black">
            {atelier.evaluationFinale.map((e) => (
              <li key={e}>· {e}</li>
            ))}
          </ul>
        </Section>

        <Section id="prolongements" titre="Prolongements">
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-400 print:text-black">
            {atelier.prolongements.map((e) => (
              <li key={e}>· {e}</li>
            ))}
          </ul>
        </Section>

        <Section id="faq" titre="Questions d'enseignants">
          <div className="mt-3 space-y-2">
            {atelier.faq.map((f) => (
              <details
                key={f.question}
                className="break-inside-avoid rounded-lg border border-white/10 bg-slate-900 px-4 py-3 print:border-black/20 print:bg-transparent"
                // À l'impression, une réponse repliée est une réponse perdue.
                open
              >
                <summary className="cursor-pointer text-sm font-medium text-slate-100 print:text-black">
                  {f.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-400 print:text-black">
                  {f.reponse}
                </p>
              </details>
            ))}
          </div>
        </Section>

        <p className="mt-10 text-xs leading-relaxed text-slate-600 print:text-black">
          Les processus cités sont nommés comme le référentiel du diplôme les nomme. Le
          rapprochement entre une séance et un processus est une proposition, à ajuster à la
          progression de votre établissement et aux compétences que votre équipe évalue.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 text-sm print:hidden">
          <Link href="/ateliers" className="text-slate-400 underline-offset-4 hover:underline">
            Tous les ateliers
          </Link>
          <Link href="/entreprises" className="text-slate-400 underline-offset-4 hover:underline">
            Les sept entreprises
          </Link>
          <Link href="/parcours" className="text-slate-400 underline-offset-4 hover:underline">
            Alignement sur les référentiels
          </Link>
        </div>
      </main>

      <aside className="hidden lg:block print:hidden">
        <nav className="sticky top-8 border-l border-white/10 pl-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
            Sommaire
          </p>
          <ul className="mt-3 space-y-2 text-xs">
            {SOMMAIRE.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-slate-500 transition hover:text-amber-300">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
