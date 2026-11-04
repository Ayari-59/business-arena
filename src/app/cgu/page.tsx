import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { VENDEUR } from "@/config/editeur";
import { TRIBUNAL_COMPETENT, VERSION_DES_CONDITIONS } from "@/config/conditions-legales";

export const metadata: Metadata = {
  alternates: { canonical: "/cgu" },
  title: "Conditions générales d'utilisation",
  description:
    "Les règles d'utilisation de Business Arena pour les enseignants, les élèves, les étudiants et les joueurs : accès, comptes et codes, bon usage, disponibilité, propriété intellectuelle, données personnelles et droit applicable.",
};

/**
 * LES CONDITIONS GÉNÉRALES D'UTILISATION (chantier délimité approuvé par le propriétaire,
 * novembre 2026). Elles valent pour toute personne qui utilise le service ; la vente aux
 * établissements relève des CGV (/cgv), les données personnelles des mentions légales
 * (/mentions-legales). Page statique : elle lit l'éditeur (config/editeur.ts) et les choix du
 * propriétaire (config/conditions-legales.ts), jamais une copie. Garde :
 * tests/architecture/conditions-generales.test.ts.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="carte p-6 sm:p-8">
      <h2 className="text-lg font-bold text-slate-50">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

function CguPage() {
  const adresse = `${VENDEUR.adresse.rue}, ${VENDEUR.adresse.codePostal} ${VENDEUR.adresse.ville}`;
  return (
    <>
      <main id="main">
        <EnTeteDePage
          surtitre="Conditions"
          titre="Conditions générales d'utilisation"
          chapeau="Les règles qui valent pour tous ceux qui utilisent Business Arena : enseignants, élèves, étudiants, formateurs et joueurs."
        />
        <div className={`${COLONNE_DE_PAGE} space-y-6 pb-12 pt-2`}>
          <Section title="Objet">
            <p>
              Les présentes conditions fixent les règles d&apos;utilisation de Business Arena (le simulateur, le cours, les
              épisodes manager et les pages du site), édité par <strong className="text-slate-200">{VENDEUR.nom}</strong>,
              nom commercial de {VENDEUR.exploitant}, SIRET {VENDEUR.siret}, {adresse}, contact : {VENDEUR.contact}
              (l&apos;éditeur). Utiliser le service vaut acceptation de ces conditions.
            </p>
            <p>
              La vente des licences aux établissements, écoles et entreprises relève des{" "}
              <Link href="/cgv" className={LIEN_A_L_ENCRE}>
                conditions générales de vente
              </Link>
              . En cas de contradiction, les CGV et le devis accepté l&apos;emportent pour le client qui les a signés.
            </p>
          </Section>

          <Section title="Qui utilise le service">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-slate-200">L&apos;enseignant ou le formateur</strong> a un compte, créé par lui ou par
                son établissement. Il crée les parties et les classes, et en distribue les codes.
              </li>
              <li>
                <strong className="text-slate-200">L&apos;élève, l&apos;étudiant ou l&apos;apprenant</strong> n&apos;a pas de
                compte : il rejoint une partie ou une classe avec le code que lui donne son enseignant, sous un pseudonyme ou un
                prénom.
              </li>
              <li>
                <strong className="text-slate-200">Le joueur en solo</strong> joue sans compte, aux niveaux ouverts à tous.
              </li>
            </ul>
          </Section>

          <Section title="Comptes et codes">
            <p>
              L&apos;enseignant garde ses identifiants pour lui et répond de l&apos;usage de son compte. Il prévient
              l&apos;éditeur sans attendre s&apos;il pense qu&apos;un tiers l&apos;utilise. Le mot de passe oublié se renouvelle
              depuis la page de connexion.
            </p>
            <p>
              Un code de partie ou de classe ne se transmet qu&apos;aux élèves concernés. L&apos;enseignant peut clore une classe
              à tout moment : plus personne ne la rejoint.
            </p>
          </Section>

          <Section title="Bon usage">
            <p>Chaque utilisateur s&apos;engage à :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                choisir un nom d&apos;équipe ou un pseudonyme qui ne soit ni injurieux, ni discriminatoire, ni celui d&apos;une
                autre personne ;
              </li>
              <li>ne pas chercher à contourner les règles du jeu, les codes d&apos;accès ou les limites de l&apos;offre ;</li>
              <li>
                ne pas perturber le service : pas d&apos;envoi massif et automatisé, pas d&apos;essai d&apos;intrusion, pas de
                reproduction du contenu par aspiration ;
              </li>
              <li>
                ne pas écrire de donnée personnelle sensible dans les champs libres : décisions, courriers, questions au
                tuteur.
              </li>
            </ul>
            <p>
              En cas de manquement, l&apos;éditeur peut retirer un nom ou un pseudonyme, ou suspendre un compte.
              Pour un compte, il en prévient d&apos;abord le titulaire, sauf urgence.
            </p>
          </Section>

          <Section title="Mineurs">
            <p>
              Les élèves mineurs utilisent le service dans le cadre de leur enseignement, sous la responsabilité de leur
              enseignant et de leur établissement. Aucune adresse électronique ni date de naissance ne leur est demandée.
            </p>
          </Section>

          <Section title="Disponibilité">
            <p>
              L&apos;éditeur met en œuvre les moyens raisonnables pour que le service soit accessible, sans garantir une
              disponibilité sans interruption. Les maintenances sont annoncées à l&apos;avance quand c&apos;est possible. Pour un
              établissement sous licence, l&apos;engagement de disponibilité est celui des{" "}
              <Link href="/cgv" className={LIEN_A_L_ENCRE}>
                CGV
              </Link>
              .
            </p>
            <p>
              Les entreprises, les chiffres et les résultats de la simulation sont fictifs et pédagogiques : ils ne constituent
              pas un conseil de gestion.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Le logiciel, les scénarios, le cours, les épisodes, les fiches et les supports appartiennent à l&apos;éditeur.
              Leur utilisation est permise dans le cadre de l&apos;enseignement ou de la formation pour lequel le service est
              ouvert. Toute reproduction ou diffusion en dehors de ce cadre demande l&apos;accord écrit de l&apos;éditeur.
            </p>
            <p>
              Ce que l&apos;utilisateur écrit dans le jeu (décisions, courriers, justifications) lui reste. Il permet à
              l&apos;éditeur de le conserver et de l&apos;afficher pour faire fonctionner le service, dans les durées des
              mentions légales.
            </p>
          </Section>

          <Section title="Données personnelles">
            <p>
              Les données traitées, leurs finalités, leurs durées de conservation, les prestataires et les droits des personnes
              sont décrits dans les{" "}
              <Link href="/mentions-legales" className={LIEN_A_L_ENCRE}>
                mentions légales et la page RGPD
              </Link>
              . Le site ne pose aucun traceur publicitaire.
            </p>
          </Section>

          <Section title="Modification des conditions">
            <p>
              L&apos;éditeur peut faire évoluer ces conditions. La version en vigueur est celle publiée sur cette page, avec sa
              date. Une modification importante est annoncée sur le site.
            </p>
          </Section>

          <Section title="Droit applicable">
            <p>
              Les présentes conditions sont soumises au droit français. En cas de litige, les parties recherchent d&apos;abord une
              solution amiable, en écrivant à {VENDEUR.contact}. À défaut, un litige entre professionnels est porté devant{" "}
              {TRIBUNAL_COMPETENT}. Un consommateur garde le droit de saisir la juridiction de son domicile.
            </p>
          </Section>

          <p className="text-center text-xs text-slate-400">Version de {VERSION_DES_CONDITIONS}.</p>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}

export default avecTypographie(CguPage);
