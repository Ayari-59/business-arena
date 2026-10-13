import type { Metadata } from "next";
import Link from "next/link";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { GUIDES, cheminDuGuide, dureeDeLecture, guideResolu } from "@/config/guides";
import { valeursDesJetons } from "@/config/guides/jetons";
import { lireLeCatalogue } from "@/services/catalogue.service";

export const metadata: Metadata = {
  alternates: { canonical: "/guides" },
  title: "Guides de prise en main",
  description:
    "Quatre guides de prise en main, un par public : enseignant, étudiant, référent établissement et formateur en entreprise. Les étapes dans l'ordre, avec les écrans réels, et une version PDF.",
};

/**
 * LES GUIDES DE PRISE EN MAIN : UNE CARTE PAR PUBLIC.
 *
 * Une page sobre : à qui s'adresse chaque guide, ce qu'on sait faire à la fin, et le
 * temps de lecture (compté sur le texte du guide). Les règles du jeu restent à /guide,
 * le fonctionnement de l'évaluation au manuel, l'intégration technique à /integration :
 * les guides y renvoient sans les recopier.
 */
export default async function GuidesPage() {
  const valeurs = valeursDesJetons(await lireLeCatalogue());
  return (
    <>
      <main id="main" className="pb-16">
        <EnTeteDePage
          surtitre="Aide"
          titre="Guides de prise en main"
          chapeau="Un guide par public, les étapes dans l'ordre réel, avec les écrans tels que vous les verrez. Chacun s'imprime, pour être joint à un devis ou distribué en formation."
        />
        <div className={`${COLONNE_DE_PAGE} grid gap-8`}>
          <ul className="grid gap-5 sm:grid-cols-2" data-cartes-des-guides="">
            {GUIDES.map((brut) => {
              const g = guideResolu(brut, valeurs);
              return (
                <li key={g.public} className="carte flex flex-col p-5 sm:p-6" data-carte-du-guide={g.public}>
                  <p className="surtitre text-slate-400">{g.nomDuPublic}</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-50">
                    <Link href={cheminDuGuide(g.public)} className="hover:underline hover:underline-offset-4">
                      {g.titre}
                    </Link>
                  </h2>
                  <dl className="mt-3 grid gap-3 text-base leading-relaxed">
                    <div>
                      <dt className="text-sm font-semibold text-slate-400">Pour qui</dt>
                      <dd className="text-slate-300">{g.pourQui}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-slate-400">À la fin</dt>
                      <dd className="text-slate-300">{g.resultat}</dd>
                    </div>
                  </dl>
                  <p className="mt-auto flex flex-wrap items-baseline justify-between gap-3 pt-5">
                    <Link href={cheminDuGuide(g.public)} className={LIEN_A_L_ENCRE}>
                      Lire le guide
                    </Link>
                    <span className="text-sm text-slate-400">
                      {g.etapes.length} étapes · environ {dureeDeLecture(brut)} min
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>

          <section aria-labelledby="ailleurs" className="carte p-5 sm:p-6">
            <h2 id="ailleurs" className="text-lg font-bold text-slate-50">
              Ce que les guides ne répètent pas
            </h2>
            <ul className="mt-3 grid gap-2 text-base leading-relaxed text-slate-300">
              <li>
                Les règles du jeu, le courrier, le score et les concours :{" "}
                <Link href="/guide" className={LIEN_A_L_ENCRE}>
                  le guide du jeu
                </Link>
                .
              </li>
              <li>
                Comment l&apos;application évalue, niveau par niveau :{" "}
                <Link href="/manuel" className={LIEN_A_L_ENCRE}>
                  le manuel de l&apos;enseignant
                </Link>
                .
              </li>
              <li>
                Les adresses techniques pour Moodle et RENATER :{" "}
                <Link href="/integration" className={LIEN_A_L_ENCRE}>
                  la page d&apos;intégration
                </Link>
                .
              </li>
              <li>
                Les notions mobilisées par le jeu :{" "}
                <Link href="/notions" className={LIEN_A_L_ENCRE}>
                  les fiches notions
                </Link>
                .
              </li>
            </ul>
          </section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
