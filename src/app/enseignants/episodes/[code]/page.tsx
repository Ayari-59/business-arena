import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { FICHES, ficheParCode, hasardDeLaClasse, lienDeLaClasse } from "@/config/episodes/fiches";
import { formationParCode } from "@/config/formations";
import { episodeParCode } from "@/pedagogy/episodes/registre";

/** Les fiches sont une donnée figée : leurs pages se rendent à la construction. */
export function generateStaticParams() {
  return FICHES.map((f) => ({ code: f.code }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const ep = episodeParCode(code);
  if (!ep || !ficheParCode(code)) return { title: "Fiche introuvable" };
  return {
    alternates: { canonical: `/enseignants/episodes/${code}` },
    title: `Fiche enseignant · ${ep.titre}`,
    description: `Conduire l'épisode ${ep.numero} en classe : déroulé de deux heures, corrigé du calcul, réflexes attendus, questions de débrief.`,
    robots: { index: false, follow: false },
  };
}

const nombre = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

/**
 * LA FICHE ENSEIGNANT D'UN ÉPISODE.
 *
 * Tout ce qu'il faut pour conduire la séance : ce que l'épisode enseigne, le
 * lien que la classe ouvre, le déroulé minuté, le corrigé du calcul de la
 * semaine 1, les réflexes que l'enseignant verra et les questions qui les
 * font parler. Le corrigé et les réflexes sont ceux du modèle de l'épisode :
 * un test le vérifie.
 */
export default async function FichePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const fiche = ficheParCode(code);
  const ep = episodeParCode(code);
  if (!fiche || !ep) notFound();
  const lien = lienDeLaClasse(code);
  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <article className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <p className="text-xs uppercase tracking-annonce text-slate-400">
            <Link href="/enseignants" className="hover:text-slate-300">
              Enseignants
            </Link>{" "}
            /{" "}
            <Link href="/enseignants/episodes" className="hover:text-slate-300">
              Épisodes en classe
            </Link>
          </p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-etiquette text-amber-300">
            Fiche enseignant · Épisode {ep.numero}
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            {ep.titre}
          </h1>
          <p className="mt-4 text-base text-slate-400">
            {fiche.formations.map((c) => formationParCode(c)?.nom ?? c).join(" · ")}
          </p>
          <ul className="mt-2 text-sm text-slate-400">
            {fiche.programme.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>

          <div className="carte mt-8 p-6">
            <p className="text-sm font-semibold text-slate-200">Le lien à donner à la classe</p>
            <p className="mt-2 break-all font-mono text-base text-slate-100">{lien}</p>
            <p className="mt-2 text-sm text-slate-400">
              Tout le groupe joue le même trimestre, sous le même hasard (n°{" "}
              {hasardDeLaClasse(code)}). Les élèves jouent sans compte ; jouez l&apos;épisode une
              fois avant la séance.{" "}
              <Link
                href={lien}
                className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                Ouvrir l&apos;épisode
              </Link>
            </p>
          </div>

          <Section titre="Ce que l'épisode enseigne">
            <p className="text-base leading-relaxed text-slate-300">{fiche.notion}</p>
            <h3 className="mt-6 text-lg font-semibold text-slate-100">À la fin de la séance</h3>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-base text-slate-300">
              {fiche.objectifs.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-400">
              <span className="font-semibold text-slate-300">Prérequis.</span> {fiche.prerequis}
            </p>
          </Section>

          <Section titre={`La séance, en ${fiche.dureeMinutes / 60} heures`}>
            <ol className="space-y-4">
              {fiche.deroule.map((phase) => (
                <li key={phase.titre} className="flex gap-4">
                  <span className="w-16 shrink-0 tabular-nums text-sm font-semibold text-amber-300">
                    {phase.minutes} min
                  </span>
                  <div>
                    <p className="font-semibold text-slate-100">{phase.titre}</p>
                    <p className="mt-1 text-base leading-relaxed text-slate-300">{phase.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section titre="Le corrigé du calcul de la semaine 1">
            <p className="text-base text-slate-300">
              <span className="font-semibold text-slate-100">La question :</span>{" "}
              {ep.prevision.libelle}.
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-50">
              {nombre(fiche.calcul.reponse)} {ep.prevision.unite}
            </p>
            <ol className="mt-4 list-decimal space-y-1 pl-6 text-base text-slate-300">
              {fiche.calcul.etapes.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ol>
            <h3 className="mt-6 text-lg font-semibold text-slate-100">
              Les erreurs qu&apos;on verra
            </h3>
            <ul className="mt-2 space-y-2">
              {fiche.calcul.erreurs.map((e) => (
                <li key={e.cause} className="text-base text-slate-300">
                  <span className="tabular-nums font-semibold text-slate-100">
                    {nombre(e.valeur)} {ep.prevision.unite}
                  </span>{" "}
                  : {e.cause}
                </li>
              ))}
            </ul>
          </Section>

          <Section titre="Les réflexes que vous verrez">
            <ul className="space-y-5">
              {fiche.reflexes.map((r) => {
                const etape = ep.etapes[r.decision]!;
                return (
                  <li key={`${r.decision}-${r.option}`} className="border-l border-white/5 pl-4">
                    <p className="text-sm font-semibold uppercase tracking-etiquette text-slate-400">
                      Décision {r.decision + 1} · {etape.titre}
                    </p>
                    <p className="mt-1 font-semibold text-slate-100">
                      « {etape.options[r.option]!.t} »
                    </p>
                    <p className="mt-1 text-base text-slate-300">
                      <span className="text-slate-400">Pourquoi c&apos;est tentant :</span>{" "}
                      {r.pourquoi}
                    </p>
                    <p className="mt-1 text-base text-slate-300">
                      <span className="text-slate-400">Ce qui permettait de l&apos;éviter :</span>{" "}
                      {r.ceQuiLeDejoue}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section titre="Les questions du débrief">
            <ol className="list-decimal space-y-2 pl-6 text-base text-slate-300">
              {fiche.debrief.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </Section>

          <Section titre="Pour prolonger, sur papier">
            <p className="text-base leading-relaxed text-slate-300">{fiche.prolongement.enonce}</p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-amber-300">
                Le corrigé
              </summary>
              <p className="mt-2 text-base leading-relaxed text-slate-300">
                {fiche.prolongement.corrige}
              </p>
            </details>
          </Section>

          <Section titre="Ce qu'on évalue">
            <ul className="list-disc space-y-1 pl-6 text-base text-slate-300">
              {fiche.evaluation.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-400">
              Jamais le résultat obtenu dans le jeu : il dépend du hasard, et c&apos;est toute la
              leçon du bilan.
            </p>
          </Section>

          {fiche.vigilance ? (
            <Section titre="À relire avant la séance">
              <p className="text-base leading-relaxed text-slate-300">{fiche.vigilance}</p>
            </Section>
          ) : null}
        </article>
      </main>
      <PiedDePage />
    </>
  );
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-50">{titre}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
