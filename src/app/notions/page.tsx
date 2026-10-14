import type { Metadata } from "next";
import Link from "next/link";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { SCENARIO_CHOICES, familyOf } from "@/config/scenarios/registry";
import { nomEntreprise } from "@/config/scenarios/presentation";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { PiedDePage } from "@/components/pied-de-page";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { Chevron } from "@/components/repliable";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { getPlatformConfig } from "@/services/admin.service";

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

export default async function ConceptsPage() {
  // Quelles bandes sont à contre-jour : le réglage de l'admin, ou l'état d'origine.
  const { theme } = await getPlatformConfig();
  const c = (id: string) => contrasteDeLaBande(theme, id);
  const domains = [...new Set(CONCEPTS.map((c) => c.domain))];
  return (
    <>
      <main id="main">
        {/*
          LE GABARIT DES PAGES INTÉRIEURES (audit P2-17). La page gardait celui
          d'avant : un titre de 24 px sous « Business Arena », un « ← Retour à
          l'accueil » que le logo de l'en-tête rend déjà, des définitions en
          12 px gris, des lignes sans chevron et des formules en police de code.
        */}
        <EnTeteDePage
          surtitre="Notions de gestion"
          titre="Fiches notions"
          chapeau={
            <>
              Les notions de gestion communes à tous les secteurs du jeu, de l&apos;atelier au
              chantier. Trois niveaux de lecture : l&apos;intuition, la méthode, la formule.
            </>
          }
        />
        <div className={`${COLONNE_DE_PAGE} space-y-10 pb-16 pt-2`}>
          {domains.map((domain) => (
            <section key={domain} aria-labelledby={`domaine-${domain}`}>
              <h2
                id={`domaine-${domain}`}
                className="mb-3 text-xs font-semibold uppercase tracking-annonce text-slate-400"
              >
                {DOMAIN_LABELS[domain] ?? domain}
              </h2>
              <div className="space-y-2">
                {CONCEPTS.filter((c) => c.domain === domain).map((c) => (
                  <details
                    key={c.code}
                    id={c.code}
                    className="group carte scroll-mt-24 transition-colors hover:border-white/25"
                  >
                    {/* Le nom, puis sa définition en clair dessous, et le
                        chevron qui dit que la fiche s'ouvre. */}
                    <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden sm:px-5">
                      <Chevron className="mt-1 text-slate-400" />
                      <span className="min-w-0">
                        <span className="block text-base font-semibold text-slate-100">
                          {c.name}
                        </span>
                        <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                          {c.definition}
                        </span>
                      </span>
                    </summary>
                    <div className="space-y-3 border-t border-white/10 px-4 py-4 text-base leading-relaxed text-slate-300 sm:px-5 sm:pl-12">
                      <p>
                        <span className="font-semibold text-slate-100">L&apos;intuition.</span>{" "}
                        {c.intuition}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-100">La méthode.</span> {c.method}
                      </p>
                      {c.formula ? (
                        /* LA FORMULE SE COMPOSE COMME UN CHIFFRE DU SITE : en
                           Barlow, chiffres tabulaires, dans un encadré à filet.
                           La police de code la donnait pour une ligne de
                           programme à recopier. */
                        <p className="formule rounded-md border border-white/15 border-l-2 border-l-slate-400 bg-slate-950 px-4 py-2.5 text-base font-medium tabular-nums text-slate-100">
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
                                  className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
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
        </div>
      </main>
      {/* La page n'avait pas de bande finale, seule des six pages publiques
          longues à s'arrêter net sur sa dernière fiche. */}
      <BandeFinale
        id="notions.finale"
        contraste={c("notions.finale")}
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
