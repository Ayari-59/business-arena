import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { ColonneDesEpisodes } from "@/components/page-des-tarifs";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { variablesDuCatalogue } from "@/config/tarifs";
import { vueDesTarifs } from "@/config/catalogue";
import { lireLEtatDuCatalogue } from "@/services/catalogue.service";
import { VENDEUR } from "@/config/editeur";

/**
 * LA PAGE COMMERCIALE DES ENTREPRISES ET DES ORGANISMES DE FORMATION (audit de l'offre, octobre 2026, P1-9 :
 * la proposition aux entreprises n'était lisible qu'en bas de /tarifs). La page lit les formules au
 * catalogue (/admin/offres), comme /tarifs : jamais une copie qui dériverait. Sans prix
 * (tout se chiffre au devis) ; elle n'affirme ni certification ni financement : aucun n'est
 * établi aujourd'hui.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises/offre" },
  title: "Épisodes manager pour les entreprises",
  description:
    "Les épisodes manager pour une entreprise ou un organisme de formation : parcours en autonomie, cohorte animée, guide de débrief. Sur devis.",
};

export default async function OffreEntreprisesPage() {
  const { catalogue, decouverte, affichage } = await lireLEtatDuCatalogue();
  const vue = vueDesTarifs(catalogue, variablesDuCatalogue(decouverte), { prix: affichage.prixPublics });
  const colonnes = vue.episodes?.colonnes.filter((c) => c.public === "entreprises") ?? [];
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Pour les entreprises et les organismes de formation"
          titre="Former des managers à décider"
          chapeau={`${EPISODES.length} épisodes manager : un trimestre dans la peau d'un manager, six décisions, et un bilan qui sépare la qualité des décisions du hasard. Pour vos managers, en autonomie ou en cohorte animée.`}
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

          {colonnes.length > 0 ? (
            <section className="carte p-6 sm:p-8" aria-labelledby="formules">
              <h2 id="formules" className="text-xl font-bold text-slate-50">
                Les formules{vue.episodes ? `, ${vue.episodes.tarif.toLowerCase()}` : ""}
              </h2>
              <div className="mt-4 grid gap-8">
                {colonnes.map((c) => (
                  <ColonneDesEpisodes key={c.code} colonne={c} />
                ))}
              </div>
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
