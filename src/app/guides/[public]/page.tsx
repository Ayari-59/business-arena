import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { BoutonPdf } from "@/components/guides/bouton-pdf";
import { EtapeDuGuideRendue } from "@/components/guides/etape-du-guide";
import {
  GUIDES,
  cheminDuGuide,
  dateDeVersion,
  dureeDeLecture,
  guideDe,
  guideResolu,
  type PublicDuGuide,
} from "@/config/guides";
import { valeursDesJetons } from "@/config/guides/jetons";
import { SITE_URL } from "@/config/site";
import { lireLeCatalogue } from "@/services/catalogue.service";

/**
 * UN GUIDE DE PRISE EN MAIN : /guides/enseignant, /guides/etudiant,
 * /guides/etablissement, /guides/formateur.
 *
 * « En 5 minutes » d'abord, le chemin le plus court jusqu'au premier résultat ; puis les
 * étapes dans l'ordre réel, chacune avec sa capture ; puis « Aller plus loin » et les
 * questions fréquentes. La même page s'imprime en A4 (feuille « LES GUIDES, À
 * L'IMPRESSION » de globals.css, et l'en-tête de page posé ici) : c'est la version PDF
 * à joindre à un devis ou à une formation.
 *
 * Le texte vient du registre (config/guides) ; ce qui se compte se lit dans la
 * configuration et dans le catalogue des offres, jamais dans la prose.
 */

export const dynamicParams = false;

export function generateStaticParams(): { public: PublicDuGuide }[] {
  return GUIDES.map((g) => ({ public: g.public }));
}

/** L'action principale de chaque guide : le seul bouton plein de la page. */
const ACTION: Record<PublicDuGuide, { href: string; libelle: string }> = {
  enseignant: { href: "/teacher/login", libelle: "Ouvrir l'espace enseignant" },
  etudiant: { href: "/join", libelle: "Rejoindre une partie" },
  etablissement: { href: "/integration", libelle: "Ouvrir la page d'intégration" },
  formateur: { href: "/entreprises/episode", libelle: "Voir les épisodes manager" },
};

export async function generateMetadata({ params }: { params: Promise<{ public: string }> }): Promise<Metadata> {
  const g = guideDe((await params).public);
  if (!g) return {};
  return {
    title: g.titre,
    description: g.description,
    alternates: { canonical: cheminDuGuide(g.public) },
    openGraph: { title: g.titre, description: g.description, url: cheminDuGuide(g.public) },
  };
}

/** Un texte entre guillemets pour une règle CSS `content`. */
const enChaineCss = (t: string) => `"${t.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

export default async function GuidePage({ params }: { params: Promise<{ public: string }> }) {
  const brut = guideDe((await params).public);
  if (!brut) notFound();
  const g = guideResolu(brut, valeursDesJetons(await lireLeCatalogue()));
  const autres = GUIDES.filter((x) => x.public !== g.public);
  const action = ACTION[g.public];
  const enTeteImprime = `Business Arena · ${g.titre} · version du ${dateDeVersion(g)}`;

  return (
    <>
      {/* L'en-tête et le pied de chaque page imprimée : la marque, le guide, sa version,
          et le folio. Posés en marge de page (Chromium sait les dessiner), ils ne
          prennent rien au contenu. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print{@page{@top-left{content:${enChaineCss(enTeteImprime)};}@bottom-right{content:"Page " counter(page) " sur " counter(pages);}@bottom-left{content:${enChaineCss(new URL(cheminDuGuide(g.public), SITE_URL).href.replace(/^https?:\/\//, ""))};}}}`,
        }}
      />
      <main id="main" data-guide-imprimable={g.public} className="guide-imprimable pb-16">
        <EnTeteDePage surtitre={g.surtitre} titre={g.titre} chapeau={g.chapeau}>
          <p className="mt-4 text-sm text-slate-400" data-meta-du-guide="">
            Lecture : environ {dureeDeLecture(brut)} min · version du {dateDeVersion(g)}
          </p>
          <div className="mt-5 flex flex-wrap items-start gap-4">
            <BoutonPdf />
            <Link href="/guides" className={`${bouton({ variante: "lien" })} print:hidden`}>
              Tous les guides
            </Link>
          </div>
        </EnTeteDePage>

        <div className={`${COLONNE_DE_PAGE} grid gap-8`}>
          <section aria-labelledby="cinq-minutes" className="carte p-5 sm:p-7" data-en-cinq-minutes="">
            <h2 id="cinq-minutes" className="text-xl font-bold text-slate-50 sm:text-2xl">
              En 5 minutes
            </h2>
            <p className="mt-2 text-base text-slate-400">Le chemin le plus court jusqu&apos;au premier résultat.</p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-slate-200">
              {g.enCinqMinutes.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <p className="mt-5 print:hidden">
              <Link href={action.href} className={bouton({ taille: "l" })}>
                {action.libelle}
              </Link>
            </p>
          </section>

          <nav aria-label="Les étapes du guide" className="print:hidden">
            <h2 className="surtitre text-slate-400">Les étapes</h2>
            <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-base sm:grid-cols-2">
              {g.etapes.map((e, i) => (
                <li key={e.id} className="flex gap-2">
                  <span className="tabular-nums text-slate-400">{i + 1}.</span>
                  <a href={`#${e.id}`} className={LIEN_A_L_ENCRE}>
                    {e.titre}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <ol className="grid gap-8" aria-label="Étapes">
            {g.etapes.map((e, i) => (
              <EtapeDuGuideRendue key={e.id} numero={i + 1} etape={e} publicDuGuide={g.public} />
            ))}
          </ol>

          <section aria-labelledby="plus-loin" className="saut-de-page">
            <h2 id="plus-loin" className="text-xl font-bold text-slate-50 sm:text-2xl">
              Aller plus loin
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {g.plusLoin.map((p) => (
                <li key={p.titre} className="carte p-5">
                  <h3 className="text-base font-semibold text-slate-100">{p.titre}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-slate-300">{p.texte}</p>
                  <p className="mt-3">
                    <Link href={p.lien.href} className={LIEN_A_L_ENCRE}>
                      {p.lien.libelle}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="questions" data-faq-du-guide="">
            <h2 id="questions" className="text-xl font-bold text-slate-50 sm:text-2xl">
              Questions fréquentes
            </h2>
            <dl className="mt-4 grid gap-5">
              {g.faq.map((q) => (
                <div key={q.question} className="question-du-guide">
                  <dt className="text-base font-semibold text-slate-100">{q.question}</dt>
                  <dd className="mt-1 text-base leading-relaxed text-slate-300">
                    {q.reponse}
                    {q.lien ? (
                      <>
                        {" "}
                        <Link href={q.lien.href} className={LIEN_A_L_ENCRE}>
                          {q.lien.libelle}
                        </Link>
                      </>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <nav aria-label="Les autres guides" className="print:hidden">
            <h2 className="surtitre text-slate-400">Les autres guides</h2>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-base">
              {autres.map((a) => (
                <li key={a.public}>
                  <Link href={cheminDuGuide(a.public)} className={LIEN_A_L_ENCRE}>
                    {a.titre}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
