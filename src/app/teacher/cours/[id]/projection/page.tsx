import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { classeDeLEnseignant } from "@/services/cours.service";
import { casDeLEntreprise } from "@/config/cours/cas";
import { CHAPITRES, chapitreParCode } from "@/config/cours/registre";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { projectionDeLEtape } from "@/pedagogy/cours/projection";
import { compter } from "@/lib/format";
import { Rafraichir } from "@/components/cours/rafraichir";
import { ENTREPRISES } from "@/app/cours/entreprises";

export const metadata: Metadata = {
  title: "Projection du cours",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Les secondes entre deux relectures : la classe répond, le mur suit. */
const RELECTURE = 5;

/**
 * UNE ÉTAPE DU COURS, AU MUR.
 *
 * L'enseignant projette l'étape où en est la classe : la question, puis ce que les élèves
 * ont répondu, en direct. Pour une question à choix, combien ont choisi chaque réponse ; la
 * bonne ne s'éclaire que sur « Montrer la réponse », pour laisser la classe en débattre.
 * Pour les autres, les remarques du correcteur qui reviennent le plus. Aucun nom d'élève :
 * la page se lit devant tous. Rien ne se calcule ici : `pedagogy/cours/projection.ts` compte.
 */
export default async function ProjectionDuCours({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chapitre?: string; etape?: string; reponse?: string }>;
}) {
  const [{ id }, { chapitre: demande, etape: demandee, reponse }] = await Promise.all([params, searchParams]);
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const choisi = chapitreParCode(demande ?? "") ?? CHAPITRES[0]!;
  const lu = /^[0-9a-f-]{36}$/.test(id) ? await classeDeLEnseignant(session.userId, id, choisi.code) : null;
  if (!lu) notFound();
  const { classe, progressions } = lu;

  // L'entreprise de la projection : celle de la classe, sinon celle que jouent le plus
  // d'élèves, sinon la première du chapitre. Les autres se comptent avec elle.
  const permises = (code: string) =>
    ENTREPRISES.some((e) => e.code === code) && (!choisi.entreprises || choisi.entreprises.codes.includes(code));
  const parEntreprise = new Map<string, number>();
  for (const p of progressions) if (permises(p.entreprise)) parEntreprise.set(p.entreprise, (parEntreprise.get(p.entreprise) ?? 0) + 1);
  const laPlusJouee = [...parEntreprise.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  const code =
    (classe.entreprise && permises(classe.entreprise) ? classe.entreprise : undefined) ??
    laPlusJouee ??
    choisi.entreprises?.codes[0] ??
    ENTREPRISES[0]!.code;
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(choisi, cas);
  const notees = chapitre.etapes.filter((e) => e.type !== "lecture");
  const etape = notees.find((e) => e.id === demandee) ?? notees[0];
  if (!etape) notFound();
  const vue = projectionDeLEtape({
    chapitre: choisi,
    cas,
    id: etape.id,
    progressions,
    casDe: (c) => (permises(c) ? casDeLEntreprise(c) : null),
  });
  if (!vue) notFound();

  const rang = notees.indexOf(etape);
  const montrer = reponse === "1";
  const adresse = (e: { id: string } | undefined, avecReponse = false) =>
    e
      ? `/teacher/cours/${classe.id}/projection?chapitre=${choisi.code}&etape=${e.id}${avecReponse ? "&reponse=1" : ""}`
      : null;
  const precedente = adresse(notees[rang - 1]);
  const suivante = adresse(notees[rang + 1]);
  const melange = parEntreprise.size > 1 || (parEntreprise.size === 1 && !parEntreprise.has(code));
  const nomDe = ENTREPRISES.find((e) => e.code === code)?.nom ?? code;
  const plusGrand = Math.max(1, ...(vue.reponses ?? []).map((r) => r.eleves));
  const compteurs = [
    { libelle: "du premier coup", valeur: vue.premierCoup, teinte: "bg-emerald-500" },
    { libelle: "après une erreur", valeur: vue.apresErreur, teinte: "bg-emerald-300" },
    { libelle: "avec la correction", valeur: vue.aidees, teinte: "bg-slate-400" },
    { libelle: "en train de chercher", valeur: vue.enCours, teinte: "bg-amber-400" },
  ];

  return (
    <main id="main" className="ardoise min-h-screen bg-slate-950 text-slate-100">
      <Rafraichir secondes={RELECTURE} />
      <div className="flex min-h-screen flex-col gap-[clamp(0.75rem,2.5vh,2.5rem)] px-4 py-4 sm:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Projection">
          {precedente ? (
            <Link href={precedente} className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 transition hover:text-slate-100">
              ← Étape précédente
            </Link>
          ) : null}
          {suivante ? (
            <Link href={suivante} className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 transition hover:text-slate-100">
              Étape suivante →
            </Link>
          ) : null}
          <Link
            href={`/teacher/cours/${classe.id}?chapitre=${choisi.code}`}
            className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-slate-400 transition hover:text-slate-200"
          >
            ← Ma classe
          </Link>
        </nav>

        <header className="grid gap-[clamp(0.25rem,1vh,1rem)]">
          <p className="text-[clamp(0.8rem,1.4vw,1.2rem)] font-semibold uppercase tracking-annonce text-slate-400">
            {choisi.titre} · étape {vue.numero} sur {vue.total}
          </p>
          <h1 className="text-balance text-[clamp(1.6rem,4vw,3.4rem)] font-bold leading-tight text-slate-50" data-etape-projetee={vue.id}>
            {vue.titre}
          </h1>
          <p className="max-w-[60ch] text-[clamp(1.05rem,2.2vw,1.9rem)] leading-snug text-slate-200">{vue.question}</p>
          {melange ? (
            <p className="text-[clamp(0.8rem,1.3vw,1.1rem)] text-slate-400">
              Montants de {nomDe} ; chaque élève a vu ceux de son entreprise, les réponses se comptent ensemble.
            </p>
          ) : null}
        </header>

        {vue.reponses ? (
          <section aria-label="Les réponses de la classe" className="grid gap-[clamp(0.4rem,1.4vh,1.2rem)]">
            <ol className="grid gap-[clamp(0.4rem,1.4vh,1.2rem)]" data-reponses-projetees="">
              {vue.reponses.map((r) => {
                const juste = montrer && r.juste;
                return (
                  <li
                    key={r.texte}
                    data-reponse={r.texte}
                    data-eleves={r.eleves}
                    data-juste={montrer ? String(r.juste) : undefined}
                    className={`relative overflow-hidden rounded-xl border px-4 py-3 ${juste ? "border-white/10 border-l-4 border-l-emerald-400" : "border-white/10"} ${montrer && !r.juste ? "opacity-60" : ""}`}
                  >
                    <span
                      aria-hidden
                      className={`absolute inset-y-0 left-0 transition-[width] duration-[var(--duree-chiffre)] ease-out motion-reduce:transition-none ${juste ? "bg-white/20" : "bg-white/10"}`}
                      style={{ width: `${(r.eleves / plusGrand) * 100}%` }}
                    />
                    <span className="relative flex items-baseline justify-between gap-4 text-[clamp(1rem,2vw,1.7rem)]">
                      <span className="text-slate-100">
                        {juste ? <span className="mr-2 font-bold text-emerald-300">✓</span> : null}
                        {r.texte}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-50">{compter(r.eleves, "élève")}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <p>
              <Link
                href={adresse(etape, !montrer)!}
                className="inline-block rounded-lg border border-white/20 px-4 py-2 text-[clamp(0.9rem,1.4vw,1.2rem)] font-semibold text-slate-100 transition hover:border-white/40"
              >
                {montrer ? "Cacher la réponse" : "Montrer la réponse"}
              </Link>
            </p>
          </section>
        ) : (
          <section aria-label="Ce que le correcteur a relevé" className="grid gap-[clamp(0.4rem,1.4vh,1.2rem)]">
            {vue.remarques.length > 0 ? (
              <ol className="grid gap-[clamp(0.4rem,1.4vh,1.2rem)]" data-remarques-projetees="">
                {vue.remarques.map((r) => (
                  <li key={r.texte} className="flex gap-4 rounded-xl border border-white/10 px-4 py-3 text-[clamp(1rem,1.9vw,1.6rem)]">
                    <span className="shrink-0 font-semibold tabular-nums text-slate-50">{compter(r.eleves, "élève")}</span>
                    <span className="text-slate-200">{r.texte}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[clamp(1rem,1.9vw,1.6rem)] text-slate-400">Aucune erreur relevée pour l&apos;instant.</p>
            )}
          </section>
        )}

        <section aria-label="Où en est la classe" className="mt-auto grid gap-2">
          <p className="text-[clamp(0.9rem,1.6vw,1.4rem)] text-slate-300" data-atteinte={vue.atteinte}>
            {vue.atteinte} sur {compter(vue.eleves, "élève")} ont atteint l&apos;étape
          </p>
          <div className="flex h-[clamp(0.75rem,2vh,1.5rem)] gap-0.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
            {compteurs.map((c) =>
              c.valeur > 0 ? <span key={c.libelle} className={c.teinte} style={{ flexGrow: c.valeur }} /> : null,
            )}
            {vue.eleves - vue.atteinte > 0 ? <span style={{ flexGrow: vue.eleves - vue.atteinte }} /> : null}
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[clamp(0.8rem,1.4vw,1.2rem)] text-slate-300">
            {compteurs.map((c) => (
              <li key={c.libelle} className="flex items-center gap-2" data-compteur={c.libelle}>
                <span aria-hidden className={`inline-block h-3 w-3 rounded-full ${c.teinte}`} />
                <span className="font-semibold tabular-nums text-slate-50">{c.valeur}</span> {c.libelle}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
