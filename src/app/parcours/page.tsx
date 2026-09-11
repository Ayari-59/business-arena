import Link from "next/link";
import type { Metadata } from "next";
import { PARCOURS } from "@/config/parcours";
import { SiteLogo } from "@/components/site-logo";

export const metadata: Metadata = {
  alternates: { canonical: "/parcours" },
  title: "Parcours par diplôme",
  description:
    "STMG, BTS MCO, NDRC, CG : la correspondance entre votre référentiel et ce que vos étudiants vivent dans l'arène, avec les réglages de partie conseillés.",
};

/** Parcours par diplôme : page statique, pilotée par src/config/parcours.ts. */

const FIT_BADGE: Record<string, { label: string; className: string }> = {
  coeur: { label: "cœur du jeu", className: "border-emerald-400/40 text-emerald-300" },
  couvert: { label: "couvert", className: "border-sky-400/40 text-sky-300" },
  partiel: { label: "partiel", className: "border-slate-400/40 text-slate-400" },
};

export default function ParcoursPage() {
  return (
    <main id="main" className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/">
          <SiteLogo />
        </Link>
        <div className="flex items-center gap-5 text-sm text-slate-400">
          <Link href="/guide" className="hover:text-slate-200">
            Guide
          </Link>
          <Link href="/teacher/login" className="hover:text-slate-200">
            Enseignants
          </Link>
          <Link
            href="/jouer"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Jouer
          </Link>
        </div>
      </nav>

      <header className="mx-auto max-w-4xl px-6 pb-4 pt-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Parcours par diplôme</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
          Votre référentiel, vécu dans l&apos;arène
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
          Business Arena a été construit par un enseignant pour faire le pont entre les notions du
          programme et la pratique. Chaque parcours ci-dessous donne les réglages de partie
          conseillés et une correspondance bloc par bloc honnête, y compris sur ce que le jeu
          ne couvre pas.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {PARCOURS.map((p) => (
            <a
              key={p.code}
              href={`#${p.code}`}
              className="rounded-full border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
            >
              {p.emoji} {p.name}
            </a>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        {PARCOURS.map((p) => (
          <section
            key={p.code}
            id={p.code}
            className="scroll-mt-24 rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400">{p.fullName}</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-50">
              {p.emoji} {p.name}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{p.pitch}</p>

            <div className="mt-5 rounded-xl border border-amber-400/20 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                Réglages conseillés à la création
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Niveau {p.recommended.level} · {p.recommended.levelName} ·{" "}
                {p.recommended.periodicityLabel} · TVA{" "}
                {p.recommended.vat ? "activée (20 %)" : "désactivée"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{p.recommended.notes}</p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-3 font-medium">Référentiel</th>
                    <th className="pb-2 pr-3 font-medium">Notions</th>
                    <th className="pb-2 pr-3 font-medium">Dans l&apos;arène</th>
                    <th className="pb-2 font-medium">Adéquation</th>
                  </tr>
                </thead>
                <tbody className="align-top text-slate-300">
                  {p.blocs.map((b) => (
                    <tr key={b.referentiel} className="border-t border-white/5">
                      <td className="py-3 pr-3 font-medium text-slate-200">{b.referentiel}</td>
                      <td className="py-3 pr-3 text-xs leading-relaxed text-slate-400">
                        {b.notions}
                      </td>
                      <td className="py-3 pr-3 text-xs leading-relaxed">{b.enJeu}</td>
                      <td className="py-3">
                        <span
                          className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${FIT_BADGE[b.fit]!.className}`}
                        >
                          {FIT_BADGE[b.fit]!.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {p.limite ? (
              <p className="mt-4 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-xs leading-relaxed text-slate-400">
                ⚖️ Limite assumée : {p.limite}
              </p>
            ) : null}
          </section>
        ))}

        <section className="rounded-2xl border border-amber-400/30 bg-slate-900 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-50">
            Votre diplôme n&apos;est pas dans la liste ?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            BUT GEA, DCG, bachelors… les mêmes mécaniques servent d&apos;autres référentiels :
            écrivez-nous, le parcours s&apos;ajoute en quelques jours.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/teacher/login"
              className="rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Créer ma première partie
            </Link>
            <Link
              href="/guide"
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-300"
            >
              Guide de prise en main
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
