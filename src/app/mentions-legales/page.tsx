import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import Link from "next/link";
import { VENDEUR } from "@/config/editeur";
import type { Metadata } from "next";

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
              un prénom d&apos;emprunt). Ni e-mail, ni nom de famille, ni date de naissance ne
              sont demandés : la plateforme ne peut pas identifier un mineur.
            </li>
            <li>
              <strong className="text-slate-200">Aucun traceur.</strong> Pas de cookies
              publicitaires, pas de mesure d&apos;audience tierce, pas de réseaux sociaux
              embarqués. Deux cookies techniques signés pour les enseignants et les joueurs,
              strictement nécessaires au fonctionnement, exemptés de consentement au sens des lignes directrices de la
              CNIL.
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
            vercel.com), qui la sert via son réseau mondial.
          </p>
          <p>
            La base de données est hébergée par <strong className="text-slate-200">Neon
            Inc.</strong>, sur l&apos;infrastructure d&apos;Amazon Web Services : elle conserve les
            données persistées (comptes enseignants, parties, résultats de simulation).
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
                    Pseudo librement choisi ; identifiant technique aléatoire (cookie)
                  </td>
                  <td className="py-2 pr-3">Rattacher le joueur à son équipe et à ses parties</td>
                  <td className="py-2">Cookie : 12 mois</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium text-slate-200">Enseignants / personnels</td>
                  <td className="py-2 pr-3">
                    E-mail, nom affiché, mot de passe (haché, jamais stocké en clair),
                    établissement de rattachement
                  </td>
                  <td className="py-2 pr-3">
                    Créer et piloter les parties, gérer l&apos;établissement (exécution du
                    service demandé)
                  </td>
                  <td className="py-2">Durée du compte</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium text-slate-200">Données de jeu</td>
                  <td className="py-2 pr-3">
                    Décisions, résultats simulés, scores pédagogiques, données fictives
                    d&apos;entreprises virtuelles
                  </td>
                  <td className="py-2 pr-3">Le jeu, le débriefing et la progression pédagogique</td>
                  <td className="py-2">Durée des parties</td>
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
                  <td className="py-2">Durée de la cohorte</td>
                </tr>
                <tr className="border-t border-white/5" data-ligne-lti="">
                  <td className="py-2 pr-3 font-medium text-slate-200">
                    Comptes reçus d&apos;une plateforme d&apos;enseignement (LTI)
                  </td>
                  <td className="py-2 pr-3">
                    Identifiant technique de la personne chez la plateforme, gardé seulement sous
                    forme d&apos;empreinte ; prénom s&apos;il est envoyé (pseudo de l&apos;élève) ;
                    rôle ; titres du cours et de l&apos;activité. Pour un enseignant seulement : nom
                    et courriel si la plateforme les envoie. Aucun courriel d&apos;élève.
                  </td>
                  <td className="py-2 pr-3">
                    Faire entrer la personne dans la partie ou la cohorte choisie par
                    l&apos;enseignant, sans compte ni code (exécution du service demandé par
                    l&apos;établissement)
                  </td>
                  <td className="py-2">Durée du rattachement de la plateforme</td>
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
                  <td className="py-2">3 ans après le dernier contact</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Sous-traitants : Vercel (hébergement de l&apos;application), Neon (base de
            données), Resend (envoi des e-mails), Google (agenda des rendez-vous) et, seulement
            si l&apos;assistant d&apos;IA est activé, Anthropic (réponses de l&apos;assistant à
            partir des justifications écrites par les joueurs).
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
          <p>
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez de droits
            d&apos;accès, de rectification, d&apos;effacement, de limitation et
            d&apos;opposition sur vos données. Pour les exercer : {EDITEUR.contact}. Vous
            pouvez également saisir la CNIL (cnil.fr).
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
