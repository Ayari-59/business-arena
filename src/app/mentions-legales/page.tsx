import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales & données personnelles — BUSINESS ARENA",
  description:
    "Éditeur, hébergement, cookies et protection des données : les élèves jouent sans compte, sans e-mail, sans traceur.",
};

/** Mentions légales & RGPD : page statique, sans base de données. */
const EDITEUR = {
  nom: "Mohamed AYARI",
  statut: "enseignant",
  contact: "mohamed.ayari@ac-lille.fr",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8">
      <h2 className="text-lg font-bold text-slate-50">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo vectoriel statique */}
          <img src="/brand/logo.svg" alt="Business Arena" className="h-8 w-auto" />
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
        >
          Retour au site
        </Link>
      </nav>

      <header className="mx-auto max-w-3xl px-6 pb-4 pt-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
          Mentions légales & données personnelles
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50">
          Vos élèves jouent sans compte, sans e-mail, sans traceur
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
          Business Arena est conçu pour la classe : la protection des données n&apos;y est pas
          une case à cocher, c&apos;est un choix d&apos;architecture. Cette page dit exactement
          ce que la plateforme collecte — et surtout ce qu&apos;elle ne collecte pas.
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Section title="🎓 L'essentiel pour les établissements">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-slate-200">Aucun compte élève.</strong> Les élèves
              rejoignent une partie avec un code et un pseudo librement choisi (qui peut être
              un prénom d&apos;emprunt). Ni e-mail, ni nom de famille, ni date de naissance ne
              sont demandés — la plateforme ne peut pas identifier un mineur.
            </li>
            <li>
              <strong className="text-slate-200">Aucun traceur.</strong> Pas de cookies
              publicitaires, pas de mesure d&apos;audience tierce, pas de réseaux sociaux
              embarqués. Deux cookies techniques signés, strictement nécessaires au
              fonctionnement — exemptés de consentement au sens des lignes directrices de la
              CNIL.
            </li>
            <li>
              <strong className="text-slate-200">Base de données dans l&apos;Union
              européenne</strong> (Francfort, Allemagne).
            </li>
            <li>
              <strong className="text-slate-200">Toutes les données de jeu sont
              fictives</strong> : les entreprises, chiffres et résultats sont générés par la
              simulation.
            </li>
          </ul>
        </Section>

        <Section title="📇 Éditeur du site">
          <p>
            Le site business-arena.fr est édité à titre pédagogique par{" "}
            <strong className="text-slate-200">{EDITEUR.nom}</strong> ({EDITEUR.statut}).
          </p>
          <p>
            Contact : <strong className="text-slate-200">{EDITEUR.contact}</strong>
          </p>
          <p>Directeur de la publication : l&apos;éditeur.</p>
        </Section>

        <Section title="🖥️ Hébergement">
          <p>
            L&apos;application est hébergée par <strong className="text-slate-200">Vercel
            Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —
            vercel.com), qui la sert via son réseau mondial.
          </p>
          <p>
            La base de données est hébergée par <strong className="text-slate-200">Neon
            Inc.</strong> sur une infrastructure AWS située en{" "}
            <strong className="text-slate-200">Union européenne (région eu-central-1,
            Francfort, Allemagne)</strong> : les données persistées (comptes enseignants,
            parties, résultats de simulation) sont stockées dans l&apos;UE.
          </p>
        </Section>

        <Section title="🔐 Données personnelles (RGPD)">
          <p>Les données traitées, leur finalité et leur durée :</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
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
                    E-mail, nom affiché, mot de passe (haché — jamais stocké en clair),
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
                    Décisions, résultats simulés, scores pédagogiques — données fictives
                    d&apos;entreprises virtuelles
                  </td>
                  <td className="py-2 pr-3">Le jeu, le débriefing et la progression pédagogique</td>
                  <td className="py-2">Durée des parties</td>
                </tr>
              </tbody>
            </table>
          </div>
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

        <Section title="🍪 Cookies">
          <p>Le site dépose uniquement deux cookies techniques, signés cryptographiquement :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <code className="text-amber-300">ba_session</code> — session des enseignants et
              personnels connectés (30 jours) ;
            </li>
            <li>
              <code className="text-amber-300">ba_guest</code> — identifiant technique des
              joueurs invités, pour retrouver leurs parties (12 mois).
            </li>
          </ul>
          <p>
            Strictement nécessaires au service, ils sont exemptés de recueil de consentement
            (article 82 de la loi Informatique et Libertés, lignes directrices CNIL). Aucun
            cookie publicitaire, analytique ou tiers n&apos;est utilisé — c&apos;est pourquoi
            vous ne voyez pas de bandeau cookies.
          </p>
        </Section>

        <Section title="⚖️ Propriété intellectuelle & responsabilité">
          <p>
            La marque Business Arena, le logo, les contenus pédagogiques (situations, fiches
            concepts, cartes événements) et le moteur de simulation sont la propriété de
            l&apos;éditeur. Les licences des composants open source utilisés sont respectées
            (notamment la police Big Shoulders, SIL Open Font License).
          </p>
          <p>
            Business Arena est une simulation pédagogique : les entreprises, marchés, chiffres
            et mécanismes économiques y sont volontairement simplifiés à des fins
            d&apos;apprentissage et ne constituent ni un conseil financier, ni une
            représentation d&apos;entreprises réelles. Les comptes de démonstration
            (« @demo.business-arena.fr ») sont fictifs.
          </p>
        </Section>

        <p className="text-center text-xs text-slate-600">
          Dernière mise à jour : août 2026 ·{" "}
          <Link href="/" className="underline-offset-4 hover:text-slate-400 hover:underline">
            business-arena.fr
          </Link>
        </p>
      </div>
    </main>
  );
}
