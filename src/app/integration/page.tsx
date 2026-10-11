import type { Metadata } from "next";
import Link from "next/link";
import { PiedDePage } from "@/components/pied-de-page";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import { SITE_URL } from "@/config/site";
import { adressesDeLOutil, DUREE_JETON_INSCRIPTION_JOURS } from "@/lti/constantes";
import { adressesDuSp, ATTRIBUTS_DEMANDES, entityIdDuSp } from "@/saml/constantes";

export const metadata: Metadata = {
  alternates: { canonical: "/integration" },
  title: "Intégration à Moodle et aux plateformes LTI",
  description:
    "Ajouter la simulation à Moodle, Canvas, Blackboard ou Brightspace comme outil externe LTI 1.3 : l'élève clique dans son cours et arrive dans sa partie, sans compte ni code, sans courriel.",
};

/**
 * LE GUIDE DE L'ÉTABLISSEMENT : AJOUTER BUSINESS ARENA À SA PLATEFORME DE COURS.
 *
 * Écrit pour l'administrateur Moodle d'un lycée ou d'une école, qui n'a ni le temps ni
 * l'envie de lire une norme : la voie courte (inscription dynamique, une adresse à
 * coller), la voie manuelle (les adresses à recopier), ce que l'enseignant et l'élève
 * voient, et ce qui transite. Les adresses se lisent du code (lti/constantes.ts) : elles
 * ne peuvent pas diverger de celles que l'outil sert.
 */

const A = adressesDeLOutil(SITE_URL);
const SP = adressesDuSp(SITE_URL);

function Section({ id, titre, children }: { id: string; titre: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="carte p-5 sm:p-7">
      <h2 id={`${id}-titre`} className="text-xl font-bold text-slate-50">
        {titre}
      </h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-slate-300">{children}</div>
    </section>
  );
}

function Adresse({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="grid gap-0.5 border-t border-white/10 py-2 first:border-t-0 sm:grid-cols-[15rem_1fr] sm:gap-3">
      <dt className="text-sm text-slate-400">{libelle}</dt>
      <dd className="min-w-0 break-all font-mono text-sm text-slate-100">{valeur}</dd>
    </div>
  );
}

export default function IntegrationPage() {
  return (
    <>
      <main id="main" className="pb-16">
        <EnTeteDePage
          surtitre="Intégration LTI 1.3"
          titre="Ajouter Business Arena à Moodle en deux minutes"
          chapeau="Business Arena s'ajoute comme outil externe à Moodle, Canvas, Blackboard ou Brightspace. L'enseignant place une activité dans son cours ; l'élève clique et arrive dans sa partie, sans compte, sans code et sans courriel."
        />
        <div className={`${COLONNE_DE_PAGE} space-y-6`}>
          <Section id="dynamique" titre="La voie courte : coller une adresse">
            <p>
              C&apos;est l&apos;inscription dynamique, prise en charge par Moodle depuis la version 3.10. Nous vous
              envoyons une adresse d&apos;inscription : elle est propre à votre établissement, ne sert qu&apos;une fois
              et reste valable {DUREE_JETON_INSCRIPTION_JOURS} jours.
            </p>
            <ol className="list-decimal space-y-2 pl-6">
              <li>
                Dans Moodle : Administration du site, Plugins, Modules d&apos;activité, Outil externe, Gérer les
                outils.
              </li>
              <li>Collez l&apos;adresse dans le champ « URL de l&apos;outil », puis « Ajouter LTI Advantage ».</li>
              <li>Dans la fenêtre qui s&apos;ouvre, vérifiez le nom de votre établissement et confirmez.</li>
              <li>
                L&apos;outil apparaît « en attente » : activez-le, puis ouvrez sa configuration et réglez le conteneur
                de lancement par défaut sur « Nouvelle fenêtre ».
              </li>
            </ol>
            <p>
              <Link href="/rendez-vous" className={LIEN_A_L_ENCRE}>
                Demander votre adresse d&apos;inscription
              </Link>
            </p>
          </Section>

          <Section id="manuelle" titre="La voie manuelle : recopier les adresses">
            <p>
              Si votre plateforme ne connaît pas l&apos;inscription dynamique, configurez l&apos;outil à la main
              (version LTI 1.3, type de clé publique : adresse de jeu de clés) avec ces adresses :
            </p>
            <dl className="rounded-lg border border-white/10 px-3">
              <Adresse libelle="Adresse de l'outil" valeur={A.lancement} />
              <Adresse libelle="Connexion (login initiation)" valeur={A.connexion} />
              <Adresse libelle="Redirection" valeur={A.redirection} />
              <Adresse libelle="Sélection de contenu" valeur={A.selection} />
              <Adresse libelle="Jeu de clés publiques (JWKS)" valeur={A.jwks} />
            </dl>
            <p>
              Renvoyez-nous ensuite ce que votre plateforme affiche : l&apos;émetteur (« ID de la plateforme »), le
              client_id, le deployment_id et ses trois adresses (authentification, jeton, jeu de clés). Nous les
              rattachons à votre établissement.
            </p>
          </Section>

          <Section id="enseignant" titre="Ce que fait l'enseignant">
            <p>
              Il ajoute une activité « Outil externe » dans son cours et choisit Business Arena. À la première
              ouverture, il choisit ce qu&apos;elle ouvre : une de ses parties de classe, une nouvelle partie, ou une
              cohorte d&apos;épisodes si la licence de l&apos;établissement les inclut. Ensuite, l&apos;activité le
              mène directement au pilotage.
            </p>
            <p>
              Il peut aussi passer par « Sélectionner le contenu » au moment d&apos;ajouter l&apos;activité : la
              liste de ses parties et de ses cohortes s&apos;affiche dans la plateforme.
            </p>
          </Section>

          <Section id="eleve" titre="Ce que voit l'élève">
            <p>
              Il clique sur l&apos;activité et arrive dans la partie, réparti dans une équipe comme avec le code de
              la classe. Si la plateforme envoie son prénom, il sert de pseudo ; sinon, l&apos;élève en choisit un à
              son arrivée. Si l&apos;enseignant n&apos;a pas encore choisi la partie, l&apos;élève le lit, et revient
              plus tard.
            </p>
          </Section>

          <Section id="donnees" titre="Les données qui transitent">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Pour chaque personne, l&apos;identifiant technique que la plateforme lui donne. Nous n&apos;en gardons
                qu&apos;une empreinte chiffrée : il n&apos;est jamais stocké en clair.
              </li>
              <li>Le prénom, si la plateforme l&apos;envoie : il devient le pseudo de l&apos;élève.</li>
              <li>Le rôle dans le cours (enseignant ou élève), le titre du cours et celui de l&apos;activité.</li>
              <li>
                Aucun courriel ni nom de famille d&apos;élève. Pour un enseignant, le nom et le courriel ne sont
                gardés que si la plateforme les envoie.
              </li>
            </ul>
            <p>
              La plateforme reste celle de votre établissement : Business Arena n&apos;y lit rien d&apos;autre. Le
              détail figure dans les{" "}
              <Link href="/mentions-legales" className={LIEN_A_L_ENCRE}>
                mentions légales
              </Link>
              .
            </p>
          </Section>

          <Section id="fenetre" titre="Pourquoi une nouvelle fenêtre">
            <p>
              Le jeu a besoin de tout l&apos;écran, et pour sa sécurité le site refuse de s&apos;afficher à
              l&apos;intérieur d&apos;une autre page. Réglé en « Nouvelle fenêtre », l&apos;outil s&apos;ouvre à côté
              du cours. Réglé autrement, il affiche un bouton « Ouvrir Business Arena » qui fait la même chose.
            </p>
          </Section>

          <Section id="renater" titre="Se connecter avec l'établissement (RENATER)">
            <p>
              Disponible pour les établissements de la Fédération Éducation-Recherche : universités, écoles et
              organismes reliés à RENATER. Sur la page de connexion des enseignants, sur l&apos;entrée par code et
              sur l&apos;invitation d&apos;une cohorte, un bouton « Se connecter avec mon établissement » mène au
              service de découverte de RENATER. On y choisit son établissement, on s&apos;identifie chez lui avec
              ses identifiants habituels, et l&apos;on revient sur Business Arena.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-slate-100">L&apos;enseignant ou le personnel</strong> d&apos;un établissement
                client arrive dans son espace enseignant, rattaché à l&apos;organisation de l&apos;établissement : sa
                licence s&apos;applique telle quelle. Le compte est créé à la première connexion.
              </li>
              <li>
                <strong className="text-slate-100">L&apos;étudiant</strong> retrouve ses parties et sa cohorte sur
                n&apos;importe quel appareil, sans code de reprise. S&apos;il vient d&apos;un code de partie ou
                d&apos;une invitation de cohorte, il y revient pour rejoindre.
              </li>
              <li>
                Un établissement de la fédération qui n&apos;a pas encore d&apos;offre : l&apos;enseignant le lit, avec
                les tarifs et la demande de devis ; l&apos;étudiant joue comme invité.
              </li>
            </ul>
            <p>Les données reçues de l&apos;établissement :</p>
            <ul className="list-disc space-y-2 pl-6">
              {ATTRIBUTS_DEMANDES.map((a) => (
                <li key={a.nom}>
                  <code className="font-mono text-sm text-slate-100">{a.nom}</code> : {a.pourquoi}
                </li>
              ))}
            </ul>
            <p>
              L&apos;identifiant est pseudonyme et propre à Business Arena ; nous n&apos;en gardons qu&apos;une
              empreinte chiffrée. Aucun nom ni courriel d&apos;étudiant n&apos;est conservé. Pour votre service
              informatique, le fournisseur de services :
            </p>
            <dl className="rounded-lg border border-white/10 px-3">
              <Adresse libelle="entityID" valeur={entityIdDuSp(SITE_URL)} />
              <Adresse libelle="Métadonnées" valeur={SP.metadonnees} />
              <Adresse libelle="ACS (HTTP-POST)" valeur={SP.acs} />
            </dl>
          </Section>

          <Section id="licence" titre="Ce que la connexion ouvre">
            <p>
              Ce que couvre la licence de votre établissement, ni plus ni moins : les parties de classe avec une
              offre de l&apos;arène, les cohortes d&apos;épisodes avec les épisodes manager.{" "}
              <Link href="/tarifs" className={LIEN_A_L_ENCRE}>
                Voir les tarifs
              </Link>
            </p>
            <p>
              À venir : le renvoi des notes de fin de partie dans le carnet de notes de la plateforme, et la
              connexion à l&apos;ENT du secondaire (GAR).
            </p>
          </Section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
