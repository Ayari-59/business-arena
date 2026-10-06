import type { Metadata } from "next";
import { publicDeLAtelier } from "@/config/formations";
import Link from "next/link";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import { scenarioByCode } from "@/config/scenarios/registry";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { RepliableSurTelephone } from "@/components/repliable-sur-telephone";

export const metadata: Metadata = {
  alternates: { canonical: "/animations" },
  title: "Ateliers",
  description:
    "Des déroulés de plusieurs séances, adossés à une partie réelle, avec les livrables attendus, la trace écrite de chaque séance et les critères d'évaluation.",
};

/**
 * LES ATELIERS PROFESSIONNELS.
 *
 * Un enseignant n'adopte pas un jeu d'entreprise parce qu'il est beau : il
 * l'adopte quand il voit ce qu'il en fera lundi matin, ce que les élèves
 * rendront, et sur quoi il les notera. Cette page ne vend rien, elle montre le
 * déroulé.
 */

/**
 * L'EXIGENCE D'UN ATELIER, EN QUATRE CRANS.
 *
 * Elle s'écrivait avec QUATRE FOIS LA MÊME ÉTOILE, les dernières simplement
 * plus pâles. Deux défauts dans un seul dessin, et c'est une mesure qui les a
 * trouvés, pas un œil : les étoiles éteintes tombaient à 1,36 pour 1 sur fond
 * clair et 1,76 sur fond sombre, quand le seuil de lisibilité est à 4,5 —
 * c'est-à-dire qu'elles n'étaient pas visibles du tout. Et le cran se lisait
 * alors PAR LA COULEUR SEULE, ce qui ne marche ni pour un daltonien, ni à
 * l'impression, ni au vidéoprojecteur, qui est l'écran de cette page.
 *
 * Deux glyphes plutôt qu'une, pleine et creuse, à la même encre : l'exigence
 * se lit à la forme, et les quatre crans sont lisibles. C'est déjà ce que font
 * les réussites de l'arène.
 */
function Etoiles({ n }: { n: number }) {
  return (
    <span className="text-amber-400" aria-label={`exigence ${n} sur 4`}>
      {"★".repeat(n)}
      {"☆".repeat(4 - n)}
    </span>
  );
}

/**
 * Les fiches qui ne se conduisent PAS dans une classe.
 *
 * Une immersion de campus se joue en championnat, avec des équipes qui mêlent
 * les filières et des réglages que le produit impose. Noyée dans le tableau,
 * elle se lisait comme un atelier de classe de plus, et un enseignant seul
 * l'aurait ouverte en croyant pouvoir la conduire dans son cours.
 */
const IMMERSIONS = ATELIERS.filter((a) => a.reglages.concours);

export default function AteliersPage() {
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <HaloDePage />

        <section className="mx-auto max-w-4xl px-6 py-14">
          <p className="text-xs uppercase tracking-annonce text-slate-400">
            <Link href="/" className="hover:text-slate-300">
              Accueil
            </Link>{" "}
            / Ateliers
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Des déroulés prêts à animer
          </h1>
          <p className="mt-5 text-lg italic leading-relaxed text-slate-400">
            Un jeu d&apos;entreprise adossé à votre progression. Chaque fiche
            donne le minutage séance par séance, les réglages de la partie, ce
            que les équipes rendent et sur quoi vous les évaluez. Du lycée à
            l&apos;expertise comptable.
          </p>

          <h2 className="mt-12 text-xl font-bold text-slate-100">
            À qui ils s&apos;adressent
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-400">
            À qui veut un point de départ, pas un jeu à apprivoiser seul. Tout
            se modifie : le secteur, le niveau, la durée.
          </p>

          {IMMERSIONS.map((a) => (
            <div
              key={a.code}
              className="mt-6 rounded-xl border border-amber-400/25 bg-amber-950/10 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                Une fiche à part · {a.nature}
              </p>
              <h3 className="mt-2 text-lg font-bold text-slate-50">
                {a.titre}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-300">
                {publicDeLAtelier(a)} dans la même équipe. Un élève par filière,
                un poste de direction chacun. {a.format}, en championnat.
              </p>
              <Link
                href={`/animations/${a.code}`}
                className="mt-3 inline-block text-sm font-semibold text-amber-300 underline-offset-4 hover:underline"
              >
                Voir le déroulé de l&apos;immersion →
              </Link>
            </div>
          ))}

          <h2 className="mt-12 text-xl font-bold text-slate-100">
            Les ateliers disponibles
          </h2>
          {/*
            LE TABLEAU NE PARAÎT QUE LÀ OÙ IL TIENT. Cinq colonnes forcées à
            640 px dans une fenêtre de 390 : la colonne de l'entreprise sortait
            du cadre, coupée en « MAILL… », et la ligne entière se lisait au
            doigt, de gauche à droite.

            IL N'A PAS ÉTÉ EMPILÉ POUR AUTANT, et c'est la découverte faite en
            regardant la page plutôt que le code : les cartes qui le suivent
            portent DÉJÀ les quinze mêmes ateliers, avec l'entreprise, la
            durée, les séances, l'exigence, et en plus le résumé et le lien.
            Empiler le tableau aurait fait défiler deux fois la même chose.

            Ce que le tableau apporte, c'est la COMPARAISON — quinze durées et
            quinze exigences sous le même œil — et cela n'existe qu'à une
            largeur où les colonnes s'alignent. Sous 768 px, les cartes
            suffisent et disent tout.
          */}
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-white/10 md:block">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="border-b border-white/5 bg-slate-900/60 px-4 py-2 text-left text-xs italic text-slate-400">
                Tableau récapitulatif des ateliers publiés.
              </caption>
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  {/*
                    L'ATELIER OUVRE LA LIGNE, PAS SA FORMATION. Le tableau
                    commençait par une colonne « Diplôme », si bien qu'on
                    lisait « BTS CG » puis, à côté, ce que c'était. L'atelier
                    s'identifiait par le diplôme posé devant lui, ce qui
                    n'avait plus de sens du jour où il peut en servir
                    plusieurs : le tournoi inter-filières aurait ouvert sa
                    ligne par quatre sigles.
                  */}
                  <th className="px-4 py-2 font-medium">Atelier</th>
                  <th className="px-4 py-2 font-medium">Formations</th>
                  <th className="px-4 py-2 font-medium">Entreprise</th>
                  <th className="px-4 py-2 font-medium">Durée</th>
                  <th className="px-4 py-2 font-medium">Exigence</th>
                </tr>
              </thead>
              <tbody>
                {ATELIERS.map((a) => (
                  <tr key={a.code} className="border-t border-white/5">
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {a.titre}
                      <span className="block text-xs text-slate-400">
                        {a.nature}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {publicDeLAtelier(a)}
                      <span className="block text-xs text-slate-400">
                        {a.annee}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {scenarioByCode(a.reglages.scenarioCode).playerTeamName}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {a.format}
                      <span className="block text-xs text-slate-400">
                        {dureeTotaleHeures(a)} h au total
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Etoiles n={a.difficulte} />
                      <span className="block text-xs text-slate-400">
                        {a.difficulteLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {ATELIERS.map((a) => (
              <article
                key={a.code}
                className="carte p-5 transition hover:border-amber-400/40"
              >
                {/*
                  LE SURTITRE NE PORTE PLUS LA FORMATION. Il disait « ATELIER
                  PROFESSIONNEL · BTS CG · PREMIÈRE ANNÉE » au-dessus du nom de
                  l'atelier : on lisait son diplôme avant de savoir ce qu'il
                  fait faire. Le rattachement descend parmi les autres faits,
                  où il se lit comme ce qu'il est — une destination, pas une
                  identité.
                */}
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {a.nature}
                </p>
                <h3 className="mt-2 text-lg font-bold text-slate-50">
                  {a.titre}
                </h3>
                <p className="mt-2 text-base italic leading-relaxed text-slate-400">
                  {a.resume}
                </p>
                {/* SUR TÉLÉPHONE, la carte dit l'essentiel : le diplôme, le nombre de
                    séances, la durée. Les autres faits (entreprise, exigence, détail
                    du format) s'ouvrent à la demande ; au-delà de `sm`, tout est affiché. */}
                <p className="mt-3 text-sm font-medium text-slate-200 sm:hidden">
                  {publicDeLAtelier(a)}, {a.annee.toLowerCase()} · {a.seances.length} séances ·{" "}
                  {dureeTotaleHeures(a)} h au total
                </p>
                <RepliableSurTelephone resume="Tous les faits de l'atelier" className="mt-2 sm:mt-0">
                <dl className="mt-4 space-y-1 text-xs">
                  {[
                    [
                      "Formations",
                      `${publicDeLAtelier(a)}, ${a.annee.toLowerCase()}`,
                    ],
                    [
                      "Entreprise",
                      scenarioByCode(a.reglages.scenarioCode).playerTeamName,
                    ],
                    [
                      "Durée",
                      `${a.format}, ${dureeTotaleHeures(a)} h au total`,
                    ],
                    ["Séances", `${a.seances.length}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-4">
                      <dt className="w-20 shrink-0 uppercase tracking-wide text-slate-400">
                        {k}
                      </dt>
                      <dd className="text-slate-300">{v}</dd>
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <dt className="w-20 shrink-0 uppercase tracking-wide text-slate-400">
                      Exigence
                    </dt>
                    <dd>
                      <Etoiles n={a.difficulte} />
                    </dd>
                  </div>
                </dl>
                </RepliableSurTelephone>
                <Link
                  href={`/animations/${a.code}`}
                  className="mt-4 inline-block text-sm font-semibold text-amber-300 underline-offset-4 hover:underline pointer-coarse:flex pointer-coarse:min-h-11 pointer-coarse:items-center"
                >
                  Voir le déroulé →
                </Link>
              </article>
            ))}
          </div>

          <h2 className="mt-14 text-xl font-bold text-slate-100">
            Comment ils sont écrits
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">
            <p>
              Chaque atelier sort d&apos;une partie réellement jouée. Les
              réglages annoncés produisent le déroulé décrit. Les documents
              demandés sont ceux que le jeu met entre les mains des équipes.
            </p>
            <p>
              Chaque diplôme découpe le métier avec ses propres mots : processus
              en BTS CG, blocs de compétences en MCO, NDRC et GPME, thèmes au
              lycée, unités d&apos;enseignement en DCG. Chaque fiche emploie les
              siens.
            </p>
            <p>
              Ces ateliers évoluent avec la plateforme. Ils sont librement
              utilisables en classe.
            </p>
          </div>
        </section>
      </main>
      <PiedDePage />
    </>
  );
}
