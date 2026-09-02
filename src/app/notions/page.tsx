import type { Metadata } from "next";
import Link from "next/link";
import { CONCEPTS } from "@/config/pedagogy/concepts";

const DOMAIN_LABELS: Record<string, string> = {
  market: "Marché",
  commercial: "Commercial",
  costs: "Coûts",
  margins: "Marges",
  thresholds: "Seuils",
  production: "Production",
  finance: "Finance",
  profitability: "Rentabilité",
};

export const metadata: Metadata = {
  title: "Fiches notions de gestion",
  description:
    "Seuil de rentabilité, BFR, trésorerie nette, marge sur coût variable : les notions du programme, reliées à ce que l'arène fait vivre.",
  alternates: { canonical: "/notions" },
};

export default function ConceptsPage() {
  const domains = [...new Set(CONCEPTS.map((c) => c.domain))];
  return (
    <main id="main" className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
        <h1 className="mt-1 text-2xl font-bold">Fiches notions</h1>
        <p className="mt-2 text-sm text-slate-400">
          Les notions de gestion communes à tous les secteurs du jeu, de l&apos;atelier au
          chantier. Trois niveaux de lecture : l&apos;intuition, la méthode, la formule.
        </p>
        <Link href="/" className="mt-2 inline-block text-xs text-slate-500 underline-offset-4 hover:underline">
          ← Retour à l&apos;accueil
        </Link>
      </header>
      {domains.map((domain) => (
        <section key={domain}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            {DOMAIN_LABELS[domain] ?? domain}
          </h2>
          <div className="space-y-3">
            {CONCEPTS.filter((c) => c.domain === domain).map((c) => (
              <details
                key={c.code}
                id={c.code}
                className="group rounded-xl border border-white/10 bg-slate-900 open:border-amber-400/30"
              >
                <summary className="cursor-pointer list-none px-4 py-3">
                  <span className="text-sm font-semibold text-slate-100">{c.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{c.definition}</span>
                </summary>
                <div className="space-y-2 border-t border-white/5 px-4 py-3 text-sm text-slate-300">
                  <p><span className="font-semibold text-amber-300">L&apos;intuition.</span> {c.intuition}</p>
                  <p><span className="font-semibold text-amber-300">La méthode.</span> {c.method}</p>
                  {c.formula ? (
                    <p className="rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200">
                      {c.formula}
                    </p>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
