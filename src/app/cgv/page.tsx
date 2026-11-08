import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { VENDEUR } from "@/config/editeur";
import { CONDITIONS, ELEVES_PAR_CLASSE, LE_COURS_PAR_OFFRE, MENTION_TVA, OFFRES } from "@/config/tarifs";
import {
  DELAI_DE_MISE_EN_DEMEURE_JOURS,
  DISPONIBILITE_ENGAGEE_POURCENT,
  INDEMNITE_DE_RECOUVREMENT_EUROS,
  MULTIPLE_DU_TAUX_LEGAL,
  PLAFOND_DE_RESPONSABILITE_MOIS,
  TRIBUNAL_COMPETENT,
  VALIDITE_DU_DEVIS_JOURS,
  VERSION_DES_CONDITIONS,
} from "@/config/conditions-legales";

export const metadata: Metadata = {
  alternates: { canonical: "/cgv" },
  title: "Conditions générales de vente",
  description:
    "Les conditions de vente de Business Arena : offres, commande sur devis, bon de commande et Chorus Pro, prix, paiement, durée, responsabilité et droit applicable.",
};

/**
 * LES CONDITIONS GÉNÉRALES DE VENTE (audit de l'offre, octobre 2026, P1-3 : les conditions
 * tenaient en neuf phrases sur /tarifs). Page statique : elle lit le vendeur
 * (config/editeur.ts) et les règles de l'offre (config/tarifs.ts), jamais une copie.
 *
 * RIEN N'EST INVENTÉ. Les choix du propriétaire (validité du devis, pénalités, résiliation,
 * disponibilité, plafond de responsabilité, tribunal, novembre 2026) sont dans
 * config/conditions-legales.ts. Garde : tests/architecture/conditions-generales.test.ts.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="carte p-6 sm:p-8">
      <h2 className="text-lg font-bold text-slate-50">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

function CgvPage() {
  const adresse = `${VENDEUR.adresse.rue}, ${VENDEUR.adresse.codePostal} ${VENDEUR.adresse.ville}`;
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Offres et tarifs"
          titre="Conditions générales de vente"
          chapeau={`Ce que signe un établissement, une école ou une entreprise qui commande Business Arena à ${VENDEUR.nom}.`}
        />
        <div className={`${COLONNE_DE_PAGE} space-y-6 pb-12 pt-2`}>
          <Section title="Objet">
            <p>
              Les présentes conditions régissent la vente des licences d&apos;utilisation de Business Arena (le simulateur, le
              cours et les épisodes manager, accessibles en ligne) et des prestations associées, par{" "}
              <strong className="text-slate-200">{VENDEUR.nom}</strong>, nom commercial de {VENDEUR.exploitant}, {VENDEUR.statut},
              SIRET {VENDEUR.siret}, {adresse}, contact : {VENDEUR.contact} (le vendeur), à un client professionnel ou public :
              établissement d&apos;enseignement, école, organisme de formation, entreprise (le client).
            </p>
            <p>Elles s&apos;appliquent à toute commande, sauf conditions particulières écrites au devis, qui priment.</p>
          </Section>

          <Section title="Les offres">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-slate-200">{OFFRES.decouverte.nom}</strong> : sans compte, l&apos;arène en solo.{" "}
                {LE_COURS_PAR_OFFRE.decouverte}
              </li>
              <li>
                <strong className="text-slate-200">{OFFRES.classe.nom}</strong> : un enseignant, un groupe de {ELEVES_PAR_CLASSE}{" "}
                élèves au plus, une partie à la fois, une entreprise et un niveau écrits au devis. {LE_COURS_PAR_OFFRE.classe}
              </li>
              <li>
                <strong className="text-slate-200">{OFFRES.programme.nom}</strong> : l&apos;équipe d&apos;un programme, au nombre
                d&apos;enseignants fixé au devis, une entreprise à tous les niveaux. {LE_COURS_PAR_OFFRE.programme}
              </li>
              <li>
                <strong className="text-slate-200">{OFFRES.campus.nom}</strong> : tout l&apos;établissement, sans limite
                d&apos;enseignants ni de groupes. {LE_COURS_PAR_OFFRE.campus}
              </li>
              <li>
                <strong className="text-slate-200">{OFFRES.episodes.nom}</strong> et prestations humaines (formation, animation,
                lancement, débrief) : à part, sur devis.
              </li>
            </ul>
            <p>
              Le contenu détaillé de chaque offre est celui de la page{" "}
              <Link href="/tarifs" className={LIEN_A_L_ENCRE}>
                Offres
              </Link>{" "}
              au jour du devis, et celui du devis accepté.
            </p>
            <p>
              Essai : quand il est proposé, l&apos;essai est une licence datée, sans paiement ni facture, aux limites de l&apos;offre
              qu&apos;il fait essayer ; il se ferme seul à son terme et n&apos;engage pas le client.
            </p>
          </Section>

          <Section title="La commande">
            <p>
              Toute commande passe par un devis écrit, demandé sur{" "}
              <Link href="/devis" className={LIEN_A_L_ENCRE}>
                la page de devis
              </Link>
              . Le devis précise l&apos;offre, son paramétrage, la durée et le prix ; il est valable {VALIDITE_DU_DEVIS_JOURS} jours.
            </p>
            <p>
              La commande est ferme à réception du devis signé, ou d&apos;un bon de commande qui le reprend. Un acheteur public
              peut émettre un bon de commande et payer par mandat administratif ; les factures aux entités publiques sont déposées
              sur Chorus Pro, où le vendeur s&apos;identifie par son SIRET, {VENDEUR.siret}. La licence est ouverte après la commande ; la facture suit.
            </p>
          </Section>

          <Section title="Prix et TVA">
            <p>
              Les prix sont annuels, établis au devis, en euros. {MENTION_TVA} : le prix du devis est le prix net à payer.
            </p>
          </Section>

          <Section title="Paiement et pénalités de retard">
            <p>
              La facture est payable à {CONDITIONS.delaiFactureJours} jours à compter de sa date, par virement ou par mandat
              administratif. Aucun escompte n&apos;est accordé pour paiement anticipé.
            </p>
            <p>
              Entre professionnels, tout retard de paiement entraîne de plein droit des pénalités de retard égales à {MULTIPLE_DU_TAUX_LEGAL} fois le taux d&apos;intérêt légal
              (article L. 441-10 du Code de commerce), exigibles dès le lendemain de l&apos;échéance, et une indemnité forfaitaire
              pour frais de recouvrement de {INDEMNITE_DE_RECOUVREMENT_EUROS} € (article D. 441-5 du Code de commerce). Pour un acheteur public, les intérêts moratoires et
              l&apos;indemnité forfaitaire sont ceux du Code de la commande publique.
            </p>
          </Section>

          <Section title="Durée et résiliation">
            <p>
              Durée : un an pour les offres {OFFRES.classe.nom} et {OFFRES.programme.nom} et pour les épisodes manager, une année
              scolaire ({CONDITIONS.anneeScolaire.debut} au {CONDITIONS.anneeScolaire.fin}) pour l&apos;offre {OFFRES.campus.nom}.
              Pas de reconduction tacite : le renouvellement passe par un nouveau devis.
            </p>
            <p>
              La licence est due pour toute sa durée : une résiliation en cours d&apos;offre ne donne pas lieu à remboursement.
              Le client peut toutefois résilier sans frais, et être remboursé de la période restante, si le vendeur commet un
              manquement grave qu&apos;il n&apos;a pas corrigé {DELAI_DE_MISE_EN_DEMEURE_JOURS} jours après une mise en demeure
              écrite.
            </p>
            <p>
              À la fin de l&apos;offre, les parties et les résultats restent consultables {CONDITIONS.consultationApresMois} mois,
              relevé de notes compris, exportable en tableur.
            </p>
          </Section>

          <Section title="Données personnelles">
            <p>
              Les données traitées, leurs finalités, leurs durées de conservation, les sous-traitants et les droits des personnes
              sont décrits dans les{" "}
              <Link href="/mentions-legales" className={LIEN_A_L_ENCRE}>
                mentions légales et la page RGPD
              </Link>
              . Les élèves et les étudiants jouent sans nom ni adresse électronique : un code suffit.
            </p>
          </Section>

          <Section title="Hébergement">
            <p>
              L&apos;application s&apos;exécute chez Vercel Inc. dans sa région de Francfort (Allemagne) ; la base de données est
              hébergée par Neon Inc. sur Amazon Web Services, région de Francfort. Le détail, et les transferts hors de
              l&apos;Union, sont dans les{" "}
              <Link href="/mentions-legales" className={LIEN_A_L_ENCRE}>
                mentions légales
              </Link>
              .
            </p>
          </Section>

          <Section title="Responsabilité">
            <p>
              Le service est fourni en ligne ; le vendeur met en œuvre les moyens raisonnables pour le rendre disponible, sans
              garantir une disponibilité sans interruption. Il s&apos;engage sur une disponibilité de {DISPONIBILITE_ENGAGEE_POURCENT} % du temps
              sur l&apos;année de l&apos;offre, hors maintenances annoncées à l&apos;avance.
            </p>
            <p>
              Les entreprises, chiffres et résultats de la simulation sont fictifs et pédagogiques : ils ne constituent pas un
              conseil de gestion. La responsabilité du vendeur, toutes causes confondues, est limitée aux sommes payées par le
              client au titre des {PLAFOND_DE_RESPONSABILITE_MOIS} derniers mois ; elle ne couvre pas les dommages indirects.
              Ce plafond ne s&apos;applique ni à la faute lourde ou dolosive, ni aux dommages corporels.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Le logiciel, les scénarios, le cours, les épisodes, les fiches et les supports restent la propriété du vendeur. La
              licence donne au client, pour sa durée, un droit d&apos;utilisation non exclusif et non cessible, pour ses
              enseignants et ses apprenants, dans le cadre de son activité d&apos;enseignement ou de formation.
            </p>
          </Section>

          <Section title="Droit applicable">
            <p>
              Les présentes conditions sont soumises au droit français. En cas de litige, les parties recherchent d&apos;abord une
              solution amiable. À défaut, le litige entre professionnels est porté devant {TRIBUNAL_COMPETENT}, siège du vendeur.
              Pour un acheteur public, la juridiction est celle que désigne le Code de justice administrative.
            </p>
          </Section>

          <p className="text-center text-xs text-slate-400">
            Version de {VERSION_DES_CONDITIONS}. Les conditions d&apos;utilisation du service sont sur la page{" "}
            <Link href="/cgu" className={LIEN_A_L_ENCRE}>
              CGU
            </Link>
            .
          </p>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

export default avecTypographie(CgvPage);
