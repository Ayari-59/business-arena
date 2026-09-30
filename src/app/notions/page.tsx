import type { Metadata } from "next";
import Link from "next/link";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { SCENARIO_CHOICES, familyOf } from "@/config/scenarios/registry";
import { nomEntreprise } from "@/config/scenarios/presentation";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { PiedDePage } from "@/components/pied-de-page";

/** Combien de métiers une fiche nomme avant de dire « et N autres ». */
const METIERS_MONTRES = 3;

/**
 * OÙ CHAQUE NOTION SE RENCONTRE DANS LE JEU.
 *
 * La page portait UN lien pour quatre mille six cents pixels et autant de
 * fiches qu'en compte le registre des notions — et depuis que les entreprises
 * renvoient ici, on y entrait par dix-neuf portes sans en ressortir. Or la
 * question qu'on se pose en lisant une notion est : où la rencontre-t-on ?
 *
 * La réponse est déjà dans le registre, à l'envers : chaque situation déclare
 * les notions qu'elle mobilise. On la retourne. Une notion que personne ne
 * mobilise n'affiche RIEN — un quart d'entre elles sont dans ce cas, et
 * annoncer « aucune entreprise » sur une page de cours n'apprendrait rien à
 * personne.
 */
const METIERS_PAR_NOTION = (() => {
  const tete = (code: string) => familyOf(code)?.head ?? code;
  const par = new Map<string, { code: string; nom: string }[]>();
  for (const d of SCENARIO_CHOICES) {
    const entree = { code: tete(d.code), nom: nomEntreprise(d) };
    for (const s of d.situations) {
      for (const notion of s.conceptCodes ?? []) {
        const deja = par.get(notion) ?? [];
        if (!deja.some((e) => e.code === entree.code)) par.set(notion, [...deja, entree]);
      }
    }
  }
  return par;
})();

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
    <>
      <main id="main" className="mx-auto max-w-3xl space-y-8 p-6">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Business Arena</p>
          <h1 className="mt-1 text-2xl font-bold">Fiches notions</h1>
          <p className="mt-2 text-base text-slate-400">
            Les notions de gestion communes à tous les secteurs du jeu, de l&apos;atelier au
            chantier. Trois niveaux de lecture : l&apos;intuition, la méthode, la formule.
          </p>
          <Link href="/" className="mt-2 inline-block text-xs text-slate-400 underline-offset-4 hover:underline">
            ← Retour à l&apos;accueil
          </Link>
        </header>
        {domains.map((domain) => (
          <section key={domain}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              {DOMAIN_LABELS[domain] ?? domain}
            </h2>
            <div className="space-y-3">
              {CONCEPTS.filter((c) => c.domain === domain).map((c) => (
                <details
                  key={c.code}
                  id={c.code}
                  className="group carte open:border-amber-400/30"
                >
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <span className="text-sm font-semibold text-slate-100">{c.name}</span>
                    <span className="ml-2 text-xs text-slate-400">{c.definition}</span>
                  </summary>
                  <div className="space-y-2 border-t border-white/5 px-4 py-3 text-sm text-slate-300">
                    <p><span className="font-semibold text-amber-300">L&apos;intuition.</span> {c.intuition}</p>
                    <p><span className="font-semibold text-amber-300">La méthode.</span> {c.method}</p>
                    {c.formula ? (
                      <p className="rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200">
                        {c.formula}
                      </p>
                    ) : null}
                    {/* Où on la rencontre : les métiers dont une situation la
                        mobilise, lus dans le registre. Rien quand aucun ne le
                        fait. */}
                    {(METIERS_PAR_NOTION.get(c.code)?.length ?? 0) > 0 ? (
                      <p className="text-sm leading-relaxed text-slate-400">
                        Se rencontre chez{" "}
                        {METIERS_PAR_NOTION.get(c.code)!
                          .slice(0, METIERS_MONTRES)
                          .map((m, i) => (
                            <span key={m.code}>
                              {i > 0 ? ", " : ""}
                              <Link
                                href={`/entreprises#${m.code}`}
                                className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-amber-200 hover:decoration-amber-400/60"
                              >
                                {m.nom}
                              </Link>
                            </span>
                          ))}
                        {METIERS_PAR_NOTION.get(c.code)!.length > METIERS_MONTRES
                          ? ` et ${METIERS_PAR_NOTION.get(c.code)!.length - METIERS_MONTRES} autres`
                          : ""}
                        .
                      </p>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </main>
      {/* La page n'avait pas de bande finale, seule des six pages publiques
          longues à s'arrêter net sur sa dernière fiche. */}
      <BandeFinale
        titre="Ces notions se rencontrent en jouant"
        texte="Une fiche se lit en deux minutes ; elle se retient quand une décision l'a coûté cher. Choisissez un métier et voyez lesquelles il fait travailler."
      >
        <Link href="/jouer" className={bouton({ taille: "l" })}>
          Commencer une partie
        </Link>
        <Link
          href="/entreprises"
          className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
        >
          Voir les entreprises
        </Link>
      </BandeFinale>
      <PiedDePage />
    </>
  );
}
