import type { Metadata } from "next";
import Link from "next/link";
import { bouton } from "@/components/bouton";
import { PiedDePage } from "@/components/pied-de-page";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { CHAPITRES, PALIERS, PARCOURS, PROGRAMME } from "@/config/cours/registre";
import { ENTREPRISES } from "./entreprises";

export const metadata: Metadata = {
  title: "Le cours par la simulation : comptabilité et contrôle de gestion",
  description:
    "Un cas d'entreprise simulé, guidé étape par étape : l'élève passe lui-même les écritures, répond aux questions et construit son compte de résultat et son bilan.",
  alternates: { canonical: "/cours" },
};

/**
 * LE COURS PAR LA SIMULATION (décision du propriétaire, octobre 2026).
 *
 * Deux parcours, la comptabilité générale et le contrôle de gestion, en quatre
 * paliers du lycée au DCG. Chaque chapitre est un cas simulé que l'élève suit pas
 * à pas : il passe les écritures, répond, calcule, et la simulation lui montre ce
 * que chaque opération change dans les comptes de l'entreprise qu'il a choisie.
 *
 * Le premier chapitre est libre ; la suite est réservée aux établissements sous
 * licence. La carte du cours dit ce qui vient, palier par palier.
 */
export default function CoursPage() {
  const pilote = CHAPITRES.find((c) => c.libre)!;
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Le cours par la simulation"
          titre="Comptabilité et contrôle de gestion, sur un cas qui vit"
          chapeau={
            <>
              Un cas d&apos;entreprise simulé, guidé étape par étape. L&apos;élève passe lui-même les écritures,
              répond aux questions, et voit à chaque fois ce que l&apos;opération change dans les comptes. Seul ou en
              classe, dans l&apos;entreprise du jeu que vous choisissez.
            </>
          }
        />
        <div className={`${COLONNE_DE_PAGE} grid gap-12 pb-16 pt-2`}>
          <section aria-labelledby="pilote" className="carte grid gap-5 p-5 sm:p-6">
            <div className="grid gap-1">
              <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
                Premier chapitre · libre d&apos;accès
              </p>
              <h2 id="pilote" className="text-2xl font-bold text-slate-50">
                {pilote.titre}
              </h2>
              <p className="text-base leading-relaxed text-slate-300">{pilote.accroche}</p>
            </div>
            <ul className="grid list-disc gap-1 pl-5 text-sm text-slate-300">
              {pilote.objectifs.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-slate-100">Choisissez l&apos;entreprise du cas</p>
              <ul className="grid gap-2 sm:grid-cols-3">
                {ENTREPRISES.map((e) => (
                  <li key={e.code}>
                    <Link
                      href={`/cours/${pilote.code}?entreprise=${e.code}`}
                      style={{ borderLeftColor: `var(--secteur-${e.teinte})` }}
                      className="flex min-h-14 flex-col justify-center rounded-lg border border-l-4 border-white/10 px-3 py-2 transition hover:border-white/30"
                    >
                      <span className="font-semibold text-slate-100">{e.nom}</span>
                      <span className="text-xs text-slate-400">{e.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <p className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <Link href={`/cours/${pilote.code}?entreprise=${ENTREPRISES[0]!.code}`} className={bouton({ taille: "m" })}>
                Commencer avec {ENTREPRISES[0]!.nom}
              </Link>
              <Link
                href={`/cours/${pilote.code}?entreprise=${ENTREPRISES[0]!.code}&classe`}
                className={bouton({ variante: "secondaire", taille: "m" })}
              >
                Projeter en classe
              </Link>
            </p>
          </section>

          <section aria-labelledby="carte" className="grid gap-6">
            <div className="grid gap-1">
              <h2 id="carte" className="text-2xl font-bold text-slate-50">
                La carte du cours
              </h2>
              <p className="text-base text-slate-300">
                Quatre paliers, du lycée au DCG. Le premier chapitre est libre ; la suite du cours est réservée aux
                établissements sous licence, et s&apos;ouvre chapitre après chapitre.
              </p>
            </div>
            {PARCOURS.map((p) => (
              <div key={p.code} className="grid gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{p.titre}</h3>
                  <p className="text-sm text-slate-400">{p.resume}</p>
                </div>
                <ol className="grid gap-2 sm:grid-cols-2">
                  {PALIERS.map((pa) => {
                    const ouverts = CHAPITRES.filter((c) => c.parcours === p.code && c.palier === pa.palier);
                    return (
                      <li key={pa.palier} className="carte grid gap-2 p-4">
                        <p className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold text-slate-100">
                            Palier {pa.palier} · {pa.titre}
                          </span>
                          <span className="text-xs text-slate-400">{pa.public}</span>
                        </p>
                        <ul className="grid gap-1 text-sm text-slate-300">
                          {PROGRAMME[p.code][pa.palier].map((t) => (
                            <li key={t}>{t}</li>
                          ))}
                        </ul>
                        {ouverts.length > 0 ? (
                          <p className="text-sm">
                            {ouverts.map((c) => (
                              <Link
                                key={c.code}
                                href={`/cours/${c.code}?entreprise=${ENTREPRISES[0]!.code}`}
                                className="font-semibold underline underline-offset-4 hover:text-slate-50"
                              >
                                {c.titre}
                              </Link>
                            ))}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">En préparation</p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
