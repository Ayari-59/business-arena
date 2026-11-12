import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { ColonneDesEpisodes } from "@/components/page-des-tarifs";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { DECISIONS_PAR_EPISODE } from "@/config/episodes/familles";
import { PARCOURS_EN_COHORTE, SEMAINES_DU_PARCOURS, TEMPS_DU_PARCOURS } from "@/config/episodes/parcours-en-cohorte";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { NAVIGATION_ENSEIGNANT } from "@/config/navigation";
import { VENDEUR } from "@/config/editeur";
import type { ColonneDEpisodes } from "@/config/catalogue";

/**
 * LA PAGE COMMERCIALE DES ENTREPRISES ET DES ORGANISMES DE FORMATION, RENDUE (app/entreprises/offre/page.tsx
 * la remplit avec le catalogue en base ; tests/architecture/pages-de-l-offre.test.ts, avec le catalogue par
 * défaut).
 *
 * L'OFFRE SE DÉCIDE SUR CETTE PAGE (décision du propriétaire, 11 novembre 2026 ; audit de l'offre du même
 * jour, P1-4 : ni durée, ni déroulé, ni lieu de travail de l'animateur, ni différence entre les formules) :
 *  · LE DÉROULÉ est le parcours de 8 semaines déjà décrit pour les écoles, lu au même endroit
 *    (config/episodes/parcours-en-cohorte.ts) ;
 *  · LES ANIMATEURS travaillent dans l'espace enseignant, sous la rubrique des cohortes, dont le mot se lit
 *    au plan de l'espace (config/navigation.ts) ;
 *  · CE QUI DISTINGUE LES FORMULES, comme le code l'applique : elles sont le texte d'une seule offre du
 *    catalogue, qui ouvre le module des épisodes sans plafond d'animateurs ni de cohortes
 *    (services/vente.service.ts : une licence sans arène ne porte aucun plafond d'enseignants). Leur
 *    différence est donc seulement commerciale, et la page le dit tel quel.
 * Sans prix (tout se chiffre au devis), et rien sur le financement : aucun n'est établi aujourd'hui.
 */
export function OffreDesEntreprises({
  colonnes,
  tarif,
}: {
  /** Les colonnes « entreprises » de la bande des épisodes, lues au catalogue. */
  colonnes: readonly ColonneDEpisodes[];
  /** « Sur devis ». */
  tarif: string | null;
}) {
  const rubrique = NAVIGATION_ENSEIGNANT.find((p) => p.code === "cohortes")!.libelle;
  const formules = colonnes.flatMap((c) => c.formules);
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Pour les entreprises et les organismes de formation"
          titre="Former des managers à décider"
          chapeau={`${EPISODES.length} épisodes manager : un trimestre dans la peau d'un manager, ${DECISIONS_PAR_EPISODE} décisions, et un bilan qui sépare la qualité des décisions du hasard. Pour vos managers, en autonomie ou en cohorte animée.`}
        />
        <div className={`${COLONNE_DE_PAGE} space-y-8 pb-12`}>
          <section className="carte grid gap-3 p-6 sm:p-8" aria-labelledby="ce-que-c-est">
            <h2 id="ce-que-c-est" className="text-xl font-bold text-slate-50">
              Ce que c&apos;est
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Chaque épisode met le participant à la place d&apos;un manager, dans l&apos;entreprise d&apos;un secteur, pour un
              trimestre : il lit ses sources, décide, et reçoit un bilan. Son profil décisionnel se construit d&apos;épisode en
              épisode et recommande le suivant. Les participants entrent par un code de cohorte, sans compte à créer.
            </p>
            <p className="text-base leading-relaxed text-slate-300">
              {EPISODES_DE_DEMO.length} épisodes de démonstration se jouent gratuitement, sans compte :{" "}
              <Link href="/entreprises/episode" className={LIEN_A_L_ENCRE}>
                voir les épisodes
              </Link>
              .
            </p>
          </section>

          <section className="carte p-6 sm:p-8" aria-labelledby="deroule" data-deroule="">
            <h2 id="deroule" className="text-xl font-bold text-slate-50">
              Le déroulé : {SEMAINES_DU_PARCOURS} semaines, en cohorte
            </h2>
            <p className="mt-2 text-base leading-relaxed text-slate-300">
              Le parcours que le guide d&apos;animation déroule, pour une cohorte de managers : {TEMPS_DU_PARCOURS}.
            </p>
            <ol className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {PARCOURS_EN_COHORTE.map((e) => (
                <li key={e.quand} className="border-t border-white/10 pt-3">
                  <p className="text-xs uppercase tracking-etiquette text-amber-300">{e.quand}</p>
                  <h3 className="titre-carte mt-1 text-slate-100">{e.quoi}</h3>
                  <p className="mt-1 text-base leading-relaxed text-slate-300">{e.texte}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="carte grid gap-3 p-6 sm:p-8" aria-labelledby="animateurs" data-animateurs="">
            <h2 id="animateurs" className="text-xl font-bold text-slate-50">
              Vos animateurs, dans l&apos;espace enseignant
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Vos animateurs travaillent dans l&apos;espace enseignant, rubrique « {rubrique} » : ils y créent chaque cohorte
              (un nom, les épisodes choisis), donnent son code aux participants, la suivent dans la vue de l&apos;animateur et
              ouvrent la fiche de débrief de chaque épisode. Chacun crée son compte avec le code d&apos;invitation de votre
              organisation.
            </p>
            <p>
              <Link href="/teacher/login" className={LIEN_A_L_ENCRE}>
                Ouvrir l&apos;espace enseignant
              </Link>
            </p>
          </section>

          {colonnes.length > 0 ? (
            <section className="carte p-6 sm:p-8" aria-labelledby="formules">
              <h2 id="formules" className="text-xl font-bold text-slate-50">
                Les formules{tarif ? `, ${tarif.toLowerCase()}` : ""}
              </h2>
              <div className="mt-4 grid gap-8">
                {colonnes.map((c) => (
                  <ColonneDesEpisodes key={c.code} colonne={c} />
                ))}
              </div>
              {formules.length > 1 ? (
                <p className="mt-6 text-base leading-relaxed text-slate-300" data-ce-qui-distingue-les-formules="">
                  Les {formules.length} formules ouvrent la même chose dans l&apos;application : les {EPISODES.length} épisodes, des
                  cohortes et des animateurs sans limite, la vue de l&apos;animateur et le profil décisionnel. Ce qui les distingue
                  se fixe au devis, et leur différence est seulement commerciale : le nombre de participants et les prestations
                  humaines (lancement, débrief animé).
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="carte grid gap-3 p-6 sm:p-8" aria-labelledby="devis">
            <h2 id="devis" className="text-xl font-bold text-slate-50">
              Le devis
            </h2>
            <p className="text-base leading-relaxed text-slate-300">
              Le devis fixe la formule, les épisodes, le nombre de participants, la durée, et les prestations humaines souhaitées
              (lancement, débrief animé), qui ne sont jamais incluses d&apos;office. Il est établi par écrit par {VENDEUR.nom}.
            </p>
            <p className="flex flex-wrap gap-3">
              <Link href="/devis?offre=entreprise" className={bouton({ taille: "m" })}>
                Demander un devis
              </Link>
              <Link href="/cgv" className={bouton({ variante: "secondaire", taille: "m" })}>
                Conditions générales de vente
              </Link>
            </p>
          </section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
