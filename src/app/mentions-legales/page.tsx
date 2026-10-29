import { DUREE_DU_JETON_DITE } from "@/config/mot-de-passe-oublie";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import Link from "next/link";
import { VENDEUR } from "@/config/editeur";
import type { Metadata } from "next";
import {
  DEMANDES_JOURS,
  ENSEIGNANTS_INACTIFS_JOURS,
  EXAMENS_JOURS,
  INVITES_INACTIFS_JOURS,
  IP_DES_PARTIES_SOLO_JOURS,
  PARTIES_ET_RESULTATS_JOURS,
  TENTATIVES_DE_CONNEXION_HEURES,
  enAnnees,
} from "@/config/conservation";
import { QUESTIONS_AU_TUTEUR_PAR_PARTIE } from "@/config/tuteur";

export const metadata: Metadata = {
  alternates: { canonical: "/mentions-legales" },
  title: "Mentions légales & données personnelles",
  description:
    "Éditeur, hébergement, cookies et protection des données : les élèves jouent sans compte, sans e-mail, sans traceur.",
};

/** Mentions légales & RGPD : page statique, sans base de données. */
const EDITEUR = {
  nom: VENDEUR.exploitant,
  nomCommercial: VENDEUR.nom,
  statut: VENDEUR.statut,
  siret: VENDEUR.siret,
  adresse: `${VENDEUR.adresse.rue}, ${VENDEUR.adresse.codePostal} ${VENDEUR.adresse.ville}`,
  contact: VENDEUR.contact,
  directeur: VENDEUR.directeurDeLaPublication,
};

/**
 * LES DURÉES, LUES DANS config/conservation.ts : la page dit ce que la purge de chaque nuit
 * applique (services/purge.service.ts), et rien d'autre.
 */
const ans = (j: number) => {
  const n = enAnnees(j);
  return `${n} an${n > 1 ? "s" : ""}`;
};
const mois = (j: number) => `${Math.round((j * 12) / 365)} mois`;
const DUREES = {
  tentatives: `${TENTATIVES_DE_CONNEXION_HEURES} heures`,
  ipSolo: `${IP_DES_PARTIES_SOLO_JOURS} jours`,
  invites: mois(INVITES_INACTIFS_JOURS),
  parties: ans(PARTIES_ET_RESULTATS_JOURS),
  examens: ans(EXAMENS_JOURS),
  enseignants: ans(ENSEIGNANTS_INACTIFS_JOURS),
  demandes: ans(DEMANDES_JOURS),
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="carte p-6 sm:p-8">
      <h2 className="text-lg font-bold text-slate-50">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

export default function MentionsLegalesPage() {
  return (
    <main id="main" className="min-h-screen bg-slate-950 text-slate-100">
      {/*
        PAS DE DEUXIÈME BARRE DE NAVIGATION. Cette page portait la sienne, logo
        compris, sous l'en-tête du site : deux logos l'un sur l'autre, et un
        « Retour au site » qui doublait le logo de l'en-tête, lequel ramène déjà
        à l'accueil.
      */}
      <EnTeteDePage
        surtitre="Mentions légales & données personnelles"
        titre={"Vos élèves jouent sans compte, sans e\u2011mail, sans traceur"}
        chapeau={
          <>
            Business Arena est conçu pour la classe : la protection des données n&apos;y est pas une
            case à cocher, c&apos;est un choix d&apos;architecture. Cette page dit exactement ce
            que la plateforme collecte, et surtout ce qu&apos;elle ne collecte pas.
          </>
        }
      />

      <div className={`${COLONNE_DE_PAGE} space-y-6 pb-12 pt-2`}>
        <Section title="L'essentiel pour les établissements">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-slate-200">Aucun compte élève.</strong> Les élèves
              rejoignent une partie avec un code et un pseudo librement choisi (qui peut être
              un prénom d&apos;emprunt). Ni e-mail ni date de naissance ne sont demandés. Deux
              exceptions, quand l&apos;enseignant les choisit : l&apos;examen individuel enregistre
              le nom et le numéro d&apos;étudiant du candidat, avec sa note ; une classe du cours
              enregistre le nom que l&apos;élève donne en la rejoignant.
            </li>
            <li>
              <strong className="text-slate-200">Aucun traceur.</strong> Pas de cookies
              publicitaires, pas de mesure d&apos;audience tierce, pas de réseaux sociaux
              embarqués. Deux cookies techniques signés pour les enseignants et les joueurs,
              strictement nécessaires au fonctionnement, exemptés de consentement au sens des lignes directrices de la
              CNIL.
            </li>
            <li>
              <strong className="text-slate-200">Base de données dans l&apos;Union
              européenne.</strong> La base de données et les traitements de l&apos;application sont
              situés à Francfort (Allemagne). Plusieurs prestataires sont des sociétés américaines :
              les transferts hors de l&apos;Union sont détaillés plus bas.
            </li>
            <li>
              <strong className="text-slate-200">Des durées courtes, appliquées chaque nuit.</strong>{" "}
              Une purge automatique supprime chaque nuit ce qui a dépassé sa durée de conservation
              (le tableau ci-dessous).
            </li>
            <li>
              <strong className="text-slate-200">Toutes les données de jeu sont
              fictives</strong> : les entreprises, chiffres et résultats sont générés par la
              simulation.
            </li>
          </ul>
        </Section>

        <Section title="Éditeur du site">
          <p>
            Le site business-arena.fr est édité par{" "}
            <strong className="text-slate-200">{EDITEUR.nom}</strong>, sous le nom commercial{" "}
            <strong className="text-slate-200">{EDITEUR.nomCommercial}</strong>, {EDITEUR.statut}.
          </p>
          <p>
            SIRET : <span className="tabular-nums text-slate-200">{EDITEUR.siret}</span>
            <br />
            Adresse : {EDITEUR.adresse}
            <br />
            Contact : <strong className="text-slate-200">{EDITEUR.contact}</strong>
          </p>
          <p>TVA non applicable, art. 293 B du CGI.</p>
          <p>Directeur de la publication : {EDITEUR.directeur}.</p>
        </Section>

        <Section title="Hébergement">
          <p>
            L&apos;application est hébergée par <strong className="text-slate-200">Vercel
            Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis,
            vercel.com). Les traitements de l&apos;application s&apos;exécutent dans sa région de{" "}
            <strong className="text-slate-200">Francfort (Allemagne)</strong> ; seuls les fichiers
            publics du site (pages, images, styles) sont servis par son réseau mondial.
          </p>
          <p>
            La base de données est hébergée par <strong className="text-slate-200">Neon
            Inc.</strong>, sur l&apos;infrastructure d&apos;Amazon Web Services, région eu-central-1{" "}
            <strong className="text-slate-200">(Francfort, Allemagne)</strong> : elle conserve les
            données persistées (comptes enseignants, parties, résultats de simulation) dans
            l&apos;Union européenne.
          </p>
        </Section>

        <Section title="Données personnelles (RGPD)">
          <p>Les données traitées, leur finalité et leur durée :</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3 font-medium">Qui</th>
                  <th className="pb-2 pr-3 font-medium">Données</th>
                  <th className="pb-2 pr-3 font-medium">Finalité</th>
                  <th className="pb-2 font-medium">Durée</th>
                </tr>
              </thead>
              <tbody className="align-top text-slate-300">
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium text-slate-200">Élèves / joueurs</td>
                  <td className="py-2 pr-3">
                    Pseudo librement choisi ; identifiant technique aléatoire (cookie) ; s&apos;il
                    utilise le tuteur IA, le nombre de questions posées dans la partie (pas leur texte)
                  </td>
                  <td className="py-2 pr-3">
                    Rattacher le joueur à son équipe et à ses parties ; limiter le tuteur IA à{" "}
                    {QUESTIONS_AU_TUTEUR_PAR_PARTIE} questions par partie
                  </td>
                  <td className="py-2">
                    Cookie : 12 mois. L&apos;identité est supprimée après {DUREES.invites} sans
                    activité
                  </td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-ip-solo="">
                  <td className="py-2 pr-3 font-medium text-slate-200">Parties solo</td>
                  <td className="py-2 pr-3">Adresse IP depuis laquelle la partie est créée</td>
                  <td className="py-2 pr-3">
                    Plafonner le nombre de parties créées depuis une même adresse, contre les abus
                  </td>
                  <td className="py-2">{DUREES.ipSolo}, puis l&apos;adresse est effacée</td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-examens="">
                  <td className="py-2 pr-3 font-medium text-slate-200">Candidats à un examen</td>
                  <td className="py-2 pr-3">
                    Nom et numéro d&apos;étudiant (saisis par le candidat, ou reçus de la plateforme de
                    l&apos;établissement), partie jouée, note et détail de la notation
                  </td>
                  <td className="py-2 pr-3">
                    Noter l&apos;examen individuel organisé par l&apos;enseignant (exécution du service
                    demandé par l&apos;établissement)
                  </td>
                  <td className="py-2">{DUREES.examens} après l&apos;examen</td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-cours="">
                  <td className="py-2 pr-3 font-medium text-slate-200">Élèves d&apos;une classe du cours</td>
                  <td className="py-2 pr-3">
                    Nom donné en rejoignant la classe, progression dans les chapitres
                  </td>
                  <td className="py-2 pr-3">Permettre à l&apos;enseignant de suivre sa classe</td>
                  <td className="py-2">
                    Durée de la classe ; l&apos;identité de l&apos;élève est supprimée après{" "}
                    {DUREES.invites} sans activité
                  </td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-enseignants="">
                  <td className="py-2 pr-3 font-medium text-slate-200">Enseignants / personnels</td>
                  <td className="py-2 pr-3">
                    E-mail, nom affiché, mot de passe (haché, jamais stocké en clair),
                    établissement de rattachement, date d&apos;inscription et de dernière connexion,
                    état du compte (actif ou désactivé) ;
                    si vous l&apos;acceptez, la date de votre accord aux nouveautés et la version du
                    texte accepté
                  </td>
                  <td className="py-2 pr-3">
                    Créer et piloter les parties, gérer l&apos;établissement, vous écrire les messages
                    de service (licence, incident) : exécution du service demandé, sans
                    consentement à donner. Envoi des nouveautés, seulement avec votre accord
                    (révocable à tout moment, d&apos;un clic dans chaque e-mail ou depuis votre
                    espace enseignant) : au plus une fois par mois
                  </td>
                  <td className="py-2">
                    Durée du compte. Un compte resté {DUREES.enseignants} sans connexion est supprimé,
                    après un e-mail d&apos;avertissement un mois avant. Pour les nouveautés,
                    jusqu&apos;au retrait du consentement ou à la suppression du compte
                  </td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium text-slate-200">Données de jeu</td>
                  <td className="py-2 pr-3">
                    Décisions, justifications écrites par les équipes, résultats simulés, scores
                    pédagogiques, données fictives d&apos;entreprises virtuelles
                  </td>
                  <td className="py-2 pr-3">Le jeu, le débriefing et la progression pédagogique</td>
                  <td className="py-2">
                    {DUREES.parties} après la fin de la partie (sa dernière activité). Les
                    démonstrations d&apos;épisodes jouées sans licence ne sont pas enregistrées :
                    elles se jouent et se jugent dans le navigateur
                  </td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium text-slate-200">Managers en cohorte</td>
                  <td className="py-2 pr-3">
                    Pseudo librement choisi, code de cohorte, code de reprise, décisions et
                    profil décisionnel
                  </td>
                  <td className="py-2 pr-3">
                    Jouer les épisodes de la cohorte, retrouver son profil sur un autre appareil
                  </td>
                  <td className="py-2">
                    Durée de la cohorte ; les parties d&apos;épisodes, {DUREES.parties} ;
                    l&apos;identité, supprimée après {DUREES.invites} sans activité
                  </td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-lti="">
                  <td className="py-2 pr-3 font-medium text-slate-200">
                    Comptes reçus d&apos;une plateforme d&apos;enseignement (LTI)
                  </td>
                  <td className="py-2 pr-3">
                    Identifiant technique de la personne chez la plateforme, gardé sous forme
                    d&apos;empreinte, et chiffré pour un élève quand la plateforme accorde le retour
                    des notes ; prénom s&apos;il est envoyé (pseudo de l&apos;élève) ;
                    rôle ; titres du cours et de l&apos;activité. Pour un enseignant seulement : nom
                    et courriel si la plateforme les envoie. Aucun courriel d&apos;élève.
                  </td>
                  <td className="py-2 pr-3">
                    Faire entrer la personne dans la partie ou la cohorte choisie par
                    l&apos;enseignant, sans compte ni code ; renvoyer la note d&apos;un examen dans
                    le carnet de notes de la plateforme, quand elle l&apos;accorde (exécution du
                    service demandé par l&apos;établissement)
                  </td>
                  <td className="py-2">Durée du rattachement de la plateforme</td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-renater="">
                  <td className="py-2 pr-3 font-medium text-slate-200">
                    Comptes reçus de la fédération RENATER
                  </td>
                  <td className="py-2 pr-3">
                    Identifiant pseudonyme transmis par l&apos;établissement, gardé seulement sous
                    forme d&apos;empreinte ; statut (étudiant ou personnel) ; établissement. Pour un
                    enseignant ou un personnel seulement : nom affiché et courriel s&apos;ils sont
                    transmis. Aucun nom ni courriel d&apos;étudiant.
                  </td>
                  <td className="py-2 pr-3">
                    Reconnaître la personne et son établissement, appliquer la licence de
                    l&apos;établissement, retrouver les parties de l&apos;étudiant sur tout appareil
                    (exécution du service demandé)
                  </td>
                  <td className="py-2">Durée du compte</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium text-slate-200">Demandes de contact</td>
                  <td className="py-2 pr-3">
                    Nom, établissement ou organisation, e-mail, téléphone (rendez-vous),
                    message, adresse IP (protection contre les envois abusifs)
                  </td>
                  <td className="py-2 pr-3">
                    Répondre à une demande de rendez-vous, de devis ou de simulation
                  </td>
                  <td className="py-2">{DUREES.demandes} après le dernier contact</td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-tentatives="">
                  <td className="py-2 pr-3 font-medium text-slate-200">Tentatives de connexion</td>
                  <td className="py-2 pr-3">
                    E-mail saisi et adresse IP d&apos;une tentative de connexion échouée
                  </td>
                  <td className="py-2 pr-3">Freiner les essais de mots de passe</td>
                  <td className="py-2">{DUREES.tentatives}</td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-reinitialisation="">
                  <td className="py-2 pr-3 font-medium text-slate-200">Mot de passe oublié</td>
                  <td className="py-2 pr-3">
                    Empreinte du lien de réinitialisation envoyé par e-mail (le lien lui-même
                    n&apos;est pas gardé), compte concerné, dates d&apos;envoi et d&apos;usage ;
                    adresse IP de la demande (protection contre les envois abusifs)
                  </td>
                  <td className="py-2 pr-3">Permettre à un enseignant de choisir un nouveau mot de passe</td>
                  <td className="py-2">
                    {DUREE_DU_JETON_DITE} (le lien) ; supprimée à la purge suivante, et avec le compte
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Sous-traitants : Vercel (hébergement de l&apos;application), Neon (base de
            données), Resend (envoi des e-mails), Google (agenda des rendez-vous) et, seulement
            si l&apos;assistant d&apos;IA est activé, Anthropic (réponses de l&apos;assistant).
          </p>
          <p data-assistant-ia="">
            Assistant d&apos;IA : quand il est activé, deux textes partent chez Anthropic PBC, aux
            États-Unis, pour produire une réponse : les justifications écrites par les équipes,
            sous le nom de leur entreprise fictive, quand l&apos;enseignant demande une synthèse ;
            les questions que les élèves posent au tuteur, avec le nom de leur entreprise fictive
            et un résumé chiffré de leur partie. Aucun pseudo, nom ni identifiant d&apos;élève
            n&apos;y est joint, mais ces textes libres partent tels
            quels : les élèves ne doivent pas y écrire de données personnelles. L&apos;enseignant
            peut couper le tuteur pour sa partie, et chaque élève dispose d&apos;au plus{" "}
            {QUESTIONS_AU_TUTEUR_PAR_PARTIE} questions par partie.
          </p>
          <p data-transferts-hors-ue="">
            Transferts hors de l&apos;Union européenne : Vercel Inc., Resend, Google et Anthropic
            sont des sociétés américaines, et Neon Inc. aussi (ses serveurs restent à Francfort).
            Les données qu&apos;ils traitent peuvent donc être accessibles depuis les
            États-Unis. Ces transferts reposent, selon le prestataire, sur les clauses
            contractuelles types de la Commission européenne ou sur le cadre de protection des
            données UE-États-Unis, prévus par leurs conditions de traitement des données.
          </p>
          <p data-federation-renater="">
            Fédération Éducation-Recherche (RENATER) : RENATER n&apos;est pas un sous-traitant de
            Business Arena. La fédération met en relation l&apos;établissement de la personne et
            Business Arena ; c&apos;est l&apos;établissement qui authentifie la personne et décide
            des attributs transmis.
          </p>
          <p data-plateformes-lti="">
            Plateformes LTI (Moodle, Canvas, Blackboard, Brightspace) : elles ne sont pas des
            sous-traitants de Business Arena. Elles appartiennent à l&apos;établissement client,
            qui choisit d&apos;y ajouter l&apos;outil et décide de ce qu&apos;elles transmettent.
          </p>
          <p>
            Aucune donnée n&apos;est vendue, louée, transmise à des tiers à des fins
            commerciales, ni utilisée pour de la publicité. Aucun profilage n&apos;est
            effectué.
          </p>
          <p data-vos-droits="">
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez de droits
            d&apos;accès, de rectification, d&apos;effacement, de portabilité, de limitation et
            d&apos;opposition sur vos données.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Enseignants : dans l&apos;espace enseignant, la page « Mon compte » propose
              « Exporter mes données » (un fichier JSON, pour l&apos;accès et la portabilité) et
              « Supprimer mon compte » (l&apos;effacement, avec vos parties et les données des élèves
              qui y sont rattachées).
            </li>
            <li>
              Élèves, parents, établissements, et pour toute rectification : écrivez à{" "}
              {EDITEUR.contact}, en donnant pour un élève le code de la partie et le pseudo
              utilisé. Un établissement peut demander la suppression de toutes ses données
              (parties, classes, examens, licences, élèves qui n&apos;y étaient rattachés) ; les comptes
              de ses enseignants ne sont pas supprimés pour autant : ils sont détachés de
              l&apos;établissement et chaque enseignant reste libre de supprimer le sien.
            </li>
          </ul>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une
            réclamation à la CNIL (cnil.fr).
          </p>
        </Section>

        <Section title="Cookies">
          <p>Le site dépose uniquement des cookies techniques :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <code className="font-mono text-slate-100">ba_session</code> (signé) : session des enseignants et
              personnels connectés (30 jours) ;
            </li>
            <li>
              <code className="font-mono text-slate-100">ba_guest</code> (signé) : identifiant technique des
              joueurs invités, pour retrouver leurs parties (12 mois) ;
            </li>
            <li>
              <code className="font-mono text-slate-100">ba_lti</code> (signé) et{" "}
              <code className="font-mono text-slate-100">ba_lti_state</code> : l&apos;arrivée
              depuis une plateforme d&apos;enseignement, l&apos;activité lancée (4 heures) et la
              vérification de la connexion (10 minutes) ;
            </li>
            <li>
              <code className="font-mono text-slate-100">ba_saml</code> : la vérification de la
              connexion par l&apos;établissement (RENATER), le temps de l&apos;aller et retour (10
              minutes au plus) ;
            </li>
            <li>
              <code className="font-mono text-slate-100">google_oauth_state</code> : réservé à
              l&apos;administrateur, le temps de relier l&apos;agenda des rendez-vous (10 minutes
              au plus).
            </li>
          </ul>
          <p>
            Strictement nécessaires au service, ils sont exemptés de recueil de consentement
            (article 82 de la loi Informatique et Libertés, lignes directrices CNIL). Aucun
            cookie publicitaire, analytique ou tiers n&apos;est utilisé, c&apos;est pourquoi
            vous ne voyez pas de bandeau cookies.
          </p>
        </Section>

        <Section title="Propriété intellectuelle & responsabilité">
          <p>
            La marque Business Arena, le logo, les contenus pédagogiques (situations, fiches
            notions, courriers) et le moteur de simulation sont la propriété de
            l&apos;éditeur. Les licences des composants open source utilisés sont respectées
            (notamment les polices Barlow et Barlow Condensed, SIL Open Font License).
          </p>
          <p>
            Business Arena est une simulation pédagogique : les entreprises, marchés, chiffres
            et mécanismes économiques y sont volontairement simplifiés à des fins
            d&apos;apprentissage et ne constituent ni un conseil financier, ni une
            représentation d&apos;entreprises réelles. Les comptes de démonstration
            (« @demo.business-arena.fr ») sont fictifs.
          </p>
        </Section>

        <p className="text-center text-xs text-slate-400">
          Dernière mise à jour : octobre 2026 ·{" "}
          <Link href="/" className="underline-offset-4 hover:text-slate-400 hover:underline">
            business-arena.fr
          </Link>
        </p>
      </div>
    </main>
  );
}
