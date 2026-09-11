import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCompetition, type PublicCompetition } from "@/services/competition.service";
import { accentConcours } from "@/config/concours-public";
import { SITE_URL } from "@/config/site";
import { ShareButtons } from "@/components/share-buttons";

export const dynamic = "force-dynamic";

/** Libellé public d'une étape. */
const ETAPE_LABEL: Record<string, string> = {
  qualification: "Qualifications",
  groups: "Groupes",
  knockout: "Phase à élimination",
  semifinal: "Demi-finales",
  final: "Finale",
};

const STATUT_LABEL: Record<string, string> = {
  draft: "En préparation",
  registration: "Inscriptions ouvertes",
  running: "En cours",
  finished: "Terminé",
};

function formatFenetre(startsAt: string | null, endsAt: string | null): string | null {
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    }).format(new Date(iso));
  if (startsAt && endsAt) return `${fmt(startsAt)} → ${fmt(endsAt)}`;
  if (startsAt) return `À partir du ${fmt(startsAt)}`;
  if (endsAt) return `Jusqu'au ${fmt(endsAt)}`;
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const concours = await getPublicCompetition(code);
  if (!concours) {
    return { title: "Concours introuvable", robots: { index: false, follow: false } };
  }
  const description =
    concours.tagline ??
    concours.description?.slice(0, 160) ??
    `Rejoignez le concours ${concours.name} sur Business Arena — simulation de gestion d'entreprise.`;
  return {
    title: concours.name,
    description,
    alternates: { canonical: `${SITE_URL}/concours/${concours.joinCode}` },
    openGraph: {
      title: concours.name,
      description,
      type: "website",
      url: `${SITE_URL}/concours/${concours.joinCode}`,
    },
  };
}

export default async function ConcoursPublicPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const concours: PublicCompetition | null = await getPublicCompetition(code);
  if (!concours) notFound();

  const accent = accentConcours(concours.accent);
  const url = `${SITE_URL}/concours/${concours.joinCode}`;
  const ouvert = concours.status === "registration";
  const programme = concours.stages
    .map((s) => ({ label: ETAPE_LABEL[s.kind] ?? s.kind, fenetre: formatFenetre(s.startsAt, s.endsAt) }))
    .filter((s) => s.fenetre !== null);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:py-16">
      <article className="space-y-6 sm:space-y-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: accent.doux }}
            >
              {concours.organizerLabel ?? "Concours Business Arena"}
            </span>
            <span
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: `${accent.vif}66`, color: accent.doux }}
            >
              {STATUT_LABEL[concours.status] ?? concours.status}
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-slate-50 sm:text-5xl" style={{ textWrap: "balance" }}>
            {concours.name}
          </h1>
          {concours.tagline ? (
            <p className="max-w-2xl text-lg text-slate-300">{concours.tagline}</p>
          ) : null}
          <p className="text-sm text-slate-400">
            {concours.entriesCount > 0
              ? `${concours.entriesCount} ${concours.entriesCount > 1 ? "équipes inscrites" : "équipe inscrite"}`
              : "Soyez la première équipe à vous inscrire."}
          </p>
        </header>

        {/* Inscription */}
        <section
          className="rounded-2xl border p-4 sm:p-6"
          style={{ borderColor: `${accent.vif}40`, background: `${accent.vif}0d` }}
        >
          {ouvert ? (
            <>
              <h2 className="text-lg font-semibold text-slate-100">Inscrivez votre équipe</h2>
              <p className="mt-1 text-sm text-slate-400">
                Code du concours : <span className="font-mono" style={{ color: accent.doux }}>{concours.joinCode}</span>
              </p>
              <Link
                href={`/compete?code=${concours.joinCode}`}
                className="mt-4 inline-block rounded-lg px-6 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                style={{ background: accent.vif }}
              >
                S&apos;inscrire au concours →
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-100">
                {concours.status === "finished" ? "Ce concours est terminé" : "Les inscriptions sont closes"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {concours.status === "finished"
                  ? "Merci à toutes les équipes qui y ont participé."
                  : "Le concours a démarré : il n'est plus possible de s'y inscrire."}
              </p>
            </>
          )}
        </section>

        {/* Programme daté */}
        {programme.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Programme</h2>
            <ul className="space-y-2">
              {programme.map((etape, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span className="font-medium text-slate-200">{etape.label}</span>
                  <span className="text-sm text-slate-400">{etape.fenetre}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Présentation */}
        {concours.description ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">À propos</h2>
            <div className="whitespace-pre-line text-slate-300">{concours.description}</div>
          </section>
        ) : null}

        {/* Partage */}
        <section className="space-y-3 border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Partager l&apos;événement</h2>
          <ShareButtons url={url} title={concours.name} accent={accent.doux} />
        </section>

        <footer className="border-t border-white/10 pt-6 text-sm text-slate-500">
          Organisé sur{" "}
          <Link href="/" className="underline-offset-4 hover:underline" style={{ color: accent.doux }}>
            Business Arena
          </Link>
          {" "}— la simulation de gestion d&apos;entreprise pour la classe.
        </footer>
      </article>
    </main>
  );
}
