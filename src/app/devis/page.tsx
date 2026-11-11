import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import Link from "next/link";
import { DevisForm } from "@/components/devis-form";
import { PiedDePage } from "@/components/pied-de-page";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { ENTREPRISES, libellesDuDevisDe, MENTION_TVA, NIVEAUX_DE_L_ARENE } from "@/config/tarifs";
import { demandeLeParcoursAuDevis, offresDuDevis } from "@/config/catalogue";
import { PARCOURS_DU_DEVIS, parcoursDuDevis } from "@/config/cours/devis-du-cours";
import { SOURCE_DU_COURS } from "@/config/parametrage-du-devis";
import { ateliersParCombinaison } from "@/config/ateliers-de-la-classe";
import { lireLeCatalogue } from "@/services/catalogue.service";
import { VENDEUR } from "@/config/editeur";
import { LIEN_CONTACT } from "@/config/navigation";

export const metadata: Metadata = {
  alternates: { canonical: "/devis" },
  title: "Demander un devis",
  description:
    "Une demande de devis écrite pour Business Arena : l'offre, l'école, l'établissement ou l'organisation, l'entreprise et le niveau souhaités, le nombre d'enseignants et d'intervenants ou de managers. Réponse par écrit.",
};

/**
 * LA DEMANDE DE DEVIS ÉCRITE.
 *
 * Décision du propriétaire : « la vente se fait sur devis », pour toutes les offres.
 * Chaque carte de /tarifs mène ici avec son offre (`?offre=classe|programme|campus|reseau|
 * episodes|entreprise`, ou toute offre du catalogue de /admin/offres) ; une adresse sans
 * offre, ou avec une offre inconnue, pré-remplit la première de la liste (Classe).
 * Le rendez-vous téléphonique reste proposé, en second.
 *
 * LE DIPLÔME OU LE PARCOURS (audit produit du 10 novembre 2026, P1-4) : une offre qui ouvre le cours
 * à une école le demande, dans la liste que l'enseignant voit en créant sa classe. Une demande qui
 * vient du cours (`?source=cours`) le trouve prérempli quand il est connu (`?parcours=`, ou un
 * diplôme qui n'en a qu'un, `?diplome=`), et n'exige ni l'entreprise ni le niveau de l'arène
 * (config/parametrage-du-devis.ts).
 */
async function DevisPage({
  searchParams,
}: {
  searchParams: Promise<{
    offre?: string;
    entreprise?: string;
    niveau?: string;
    parcours?: string | string[];
    diplome?: string | string[];
    source?: string | string[];
  }>;
}) {
  const { offre, entreprise, niveau, parcours, diplome, source } = await searchParams;
  // Ce qui a déjà été choisi ailleurs (orientation, chapitre réservé), lu contre les registres :
  // une valeur inconnue est ignorée, jamais recopiée (audit produit du 28 octobre 2026, P1-6).
  const entrepriseInitiale = ENTREPRISES.some((e) => e.code === entreprise) ? entreprise! : "";
  const niveauInitial = NIVEAUX_DE_L_ARENE.some((n) => String(n.niveau) === niveau) ? niveau! : "";
  const parcoursInitial = parcoursDuDevis(parcours, diplome) ?? "";
  const offres = offresDuDevis(await lireLeCatalogue()).map((o) => ({
    code: o.code,
    ...libellesDuDevisDe(o),
    ...(demandeLeParcoursAuDevis(o) ? { parcours: true as const } : {}),
  }));
  const offreInitiale = offres.some((o) => o.code === offre) ? offre! : (offres[0]?.code ?? "");
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Offres et tarifs"
          titre="Demander un devis"
          chapeau={`Toutes les offres se vendent sur devis. Dites-nous pour qui, et combien : le devis vous est adressé par écrit, établi par ${VENDEUR.nom}.`}
        />
        <div className={`${COLONNE_DE_PAGE} pb-12`}>
          <DevisForm
            offres={offres}
            offreInitiale={offreInitiale}
            entreprises={ENTREPRISES.map((e) => ({ code: e.code, nom: e.nom }))}
            niveaux={NIVEAUX_DE_L_ARENE}
            vendeur={VENDEUR.nom}
            mentionTva={MENTION_TVA}
            contact={VENDEUR.contact}
            entrepriseInitiale={entrepriseInitiale}
            niveauInitial={niveauInitial}
            parcours={PARCOURS_DU_DEVIS}
            parcoursInitial={parcoursInitial}
            source={source === SOURCE_DU_COURS ? SOURCE_DU_COURS : null}
            ateliers={ateliersParCombinaison()}
          />
          <p className="mt-6 text-sm leading-relaxed text-slate-400">
            Vous préférez en parler de vive voix ?{" "}
            <Link href={LIEN_CONTACT.href} className={LIEN_A_L_ENCRE}>
              Prenez un rendez-vous téléphonique
            </Link>
            . Pour relire les offres :{" "}
            <Link href="/tarifs" className={LIEN_A_L_ENCRE}>
              les tarifs
            </Link>
            . La commande suit nos{" "}
            <Link href="/cgv" className={LIEN_A_L_ENCRE}>
              conditions générales de vente
            </Link>
            .
          </p>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

export default avecTypographie(DevisPage);
