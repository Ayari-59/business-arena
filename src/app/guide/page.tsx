import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guide de prise en main — BUSINESS ARENA",
  description:
    "Démarrer en 2 minutes : lancer une partie, rejoindre une classe, animer un tour, tirer les cartes événements et lire ses résultats.",
};

/** Guide de prise en main : statique, sans base de données — toujours disponible. */

const SECTIONS = [
  { id: "demarrer", label: "⚡ En 2 minutes" },
  { id: "eleves", label: "🎮 Côté élèves" },
  { id: "enseignants", label: "🧑‍🏫 Côté enseignants" },
  { id: "cartes", label: "🃏 Les cartes" },
  { id: "bpi", label: "📊 Le score BPI" },
  { id: "etablissements", label: "🏛️ Établissements" },
  { id: "faq", label: "❓ Questions fréquentes" },
];

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/40 text-xs font-bold text-amber-300">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-slate-400">{children}</div>
      </div>
    </li>
  );
}

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-slate-50">{title}</h2>
      {intro ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{intro}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo vectoriel statique */}
          <img src="/brand/logo.svg" alt="Business Arena" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-5 text-sm text-slate-400">
          <Link href="/parcours" className="hover:text-slate-200">
            Parcours
          </Link>
          <Link href="/join" className="hover:text-slate-200">
            J&apos;ai un code
          </Link>
          <Link href="/teacher/login" className="hover:text-slate-200">
            Enseignants
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Jouer
          </Link>
        </div>
      </nav>

      <header className="mx-auto max-w-4xl px-6 pb-4 pt-8">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Guide de prise en main</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
          Tout ce qu&apos;il faut pour votre première partie
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
          Business Arena ne vous demande jamais « calculez le BFR » : vous vivez des situations,
          vous décidez, la simulation répond — et les concepts arrivent au moment où vous en avez
          besoin. Ce guide couvre les trois façons d&apos;entrer dans l&apos;arène : en solo, en
          classe, en établissement.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
            >
              {s.label}
            </a>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <Section
          id="demarrer"
          title="⚡ Démarrer en 2 minutes"
          intro="Deux portes d'entrée selon qui vous êtes."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-amber-300">Je veux essayer, tout de suite</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Depuis l&apos;<Link href="/" className="text-amber-300 underline-offset-4 hover:underline">accueil</Link>,
                choisissez la périodicité (mois, trimestre ou année) et le nombre de concurrents,
                puis <strong className="text-slate-200">Lancer la partie</strong>. Aucun compte
                requis : vous dirigez NOVA immédiatement, en six tours, face à des concurrents
                pilotés par l&apos;ordinateur.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-amber-300">Je suis élève, j&apos;ai un code</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Rendez-vous sur <Link href="/join" className="text-amber-300 underline-offset-4 hover:underline">/join</Link>,
                saisissez le code à 6 caractères donné par votre enseignant et un pseudo :
                vous rejoignez l&apos;équipe de votre classe. Pas de mot de passe à retenir.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="eleves"
          title="🎮 Côté élèves — jouer un tour"
          intro="Chaque tour suit la même boucle : une situation vous arrive, vous la diagnostiquez, vous mobilisez vos connaissances, vous décidez — puis la simulation rend son verdict."
        >
          <ol className="space-y-5">
            <Step n={1} title="Lisez la situation du tour">
              Pas d&apos;énoncé d&apos;exercice : un problème d&apos;entreprise (« la trésorerie se
              tend », « un concurrent casse les prix »). À vous de comprendre ce qui se joue.
            </Step>
            <Step n={2} title="Diagnostiquez, puis répondez au QCM">
              Cochez les causes plausibles, puis 3 questions sous la même forme : deux
              mobilisent les notions en jeu (seuil de rentabilité, BFR, élasticité-prix…),
              la troisième vous demande <strong className="text-slate-200">quel modèle
              d&apos;analyse mobiliser</strong> — un modèle trompeur rapporte presque rien,
              c&apos;est la compétence que le jeu mesure. Correction expliquée au débriefing.
            </Step>
            <Step n={3} title="Besoin d'aide ? Débloquez des indices">
              Cinq niveaux, dans l&apos;ordre, du simple recadrage jusqu&apos;à la méthode
              détaillée. Chaque indice coûte une part du score pédagogique de la situation
              (jamais vos résultats économiques) — apprendre à demander juste ce qu&apos;il faut
              fait partie du jeu.
            </Step>
            <Step n={4} title="Prenez vos décisions">
              Prix, production, marketing, qualité, maintenance — puis, selon le niveau :
              financement (emprunt, augmentation de capital), trésorerie (escompte,
              affacturage), assurance catastrophe, ressources humaines (embaucher, former,
              rémunérer) et investissement en capacité (en service au tour suivant).
              Attention : les échéances d&apos;emprunt sont <strong className="text-slate-200">
              prélevées automatiquement</strong>, que la caisse soit pleine ou vide — et
              au-delà du découvert autorisé, la banque cède vos créances d&apos;office. En mode
              classe, vos décisions restent modifiables jusqu&apos;à la clôture du tour par
              l&apos;enseignant.
            </Step>
            <Step n={5} title="Lisez vos résultats comme un dirigeant">
              Chiffre d&apos;affaires, résultat net, part de marché — mais surtout la ligne de
              vie : <strong className="text-slate-200">Trésorerie nette = FRNG − BFR</strong>.
              Le débriefing corrigé vous montre ce qu&apos;il fallait voir, et vos fiches
              concepts se déverrouillent au fil des situations vécues.
            </Step>
          </ol>
        </Section>

        <Section
          id="enseignants"
          title="🧑‍🏫 Côté enseignants — animer une classe"
          intro="De la création de la partie à la clôture des tours, tout se pilote depuis votre espace."
        >
          <ol className="space-y-5">
            <Step n={1} title="Créez votre compte">
              Sur <Link href="/teacher/login" className="text-amber-300 underline-offset-4 hover:underline">l&apos;espace enseignant</Link>,
              inscrivez-vous avec votre e-mail — directement, ou avec le code d&apos;invitation
              fourni par votre établissement s&apos;il est déployé sur la plateforme.
            </Step>
            <Step n={2} title="Créez une partie de classe — et réglez-la finement">
              Choisissez la périodicité, le nombre d&apos;équipes (1 à 8), les concurrents
              automatiques et le <strong className="text-slate-200">niveau de difficulté</strong> :
              de Découverte (prix, production, marketing, tous les indices) à Executive (toutes
              les décisions, aucun indice, événements doublés). Le panneau{" "}
              <strong className="text-slate-200">Paramètres économiques</strong> permet en plus
              de moduler l&apos;impôt, la TVA, les taux d&apos;emprunt et de découvert, le délai
              fournisseurs, les charges de structure et les coûts unitaires — pour coller à
              votre progression. La plateforme génère un{" "}
              <strong className="text-slate-200">code d&apos;invitation à 6 caractères</strong> :
              affichez-le, vos élèves rejoignent sur /join.
            </Step>
            <Step n={3} title="Laissez les équipes jouer le tour">
              Votre tableau de bord montre en temps réel qui a validé ses décisions. Une équipe
              silencieuse n&apos;est jamais bloquante : à la clôture, ses dernières décisions
              sont reconduites.
            </Step>
            <Step n={4} title="Pimentez avec une carte événement (mode apprentissage)">
              Tirez une carte au hasard ou jouez-en une choisie — pour toute la classe ou contre
              une seule équipe. La carte est annoncée à tous et s&apos;applique à la clôture.
              Voir la section suivante pour le deck physique.
            </Step>
            <Step n={5} title="Clôturez le tour">
              Un clic : la simulation calcule tous les résultats, le débriefing pédagogique se
              génère, le classement BPI se met à jour, le tour suivant s&apos;ouvre. Votre vue
              pédagogique agrège diagnostics, résultats des QCM, indices consommés et maîtrise
              des concepts par équipe.
            </Step>
            <Step n={6} title="Finissez l'année en championnat">
              Créez un concours : inscriptions par code, groupes tirés au sort (tirage seedé,
              auditable), parties en mode compétition — décisions verrouillées après validation,
              indices limités au niveau 3, aucun tirage manuel de cartes. Qualification au BPI,
              finale, podium.
            </Step>
          </ol>
        </Section>

        <Section
          id="cartes"
          title="🃏 Les cartes événements"
          intro="L'habillage théâtral du moteur : chaque carte est un événement économique réel de la simulation."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-400/20 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-amber-300">🌍 Cartes marché</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Frappent toute la classe : flambée des matières, buzz, conjoncture, taux,
                catastrophe naturelle… Maximum 2 par tour.
              </p>
            </div>
            <div className="rounded-xl border border-sky-400/20 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-sky-300">🎯 Cartes équipe</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Ciblent une seule entreprise : panne, cyberattaque, commande exceptionnelle,
                banquier compréhensif… Une carte par équipe et par tour.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Pour un vrai tirage en classe,{" "}
            <Link
              href="/teacher/cards/print"
              className="text-amber-300 underline-offset-4 hover:underline"
            >
              imprimez le deck physique
            </Link>{" "}
            (A4, dos et face à plier, sans recto-verso) : faites tirer la carte à la main, puis
            saisissez-la dans le deck numérique pour qu&apos;elle s&apos;applique à la
            simulation. Certaines cartes se couvrent par l&apos;assurance — vos élèves
            découvriront l&apos;arbitrage tout seuls.
          </p>
        </Section>

        <Section
          id="bpi"
          title="📊 Le Business Performance Index"
          intro="Le classement ne récompense pas que le profit : le BPI (0-100) pondère 7 dimensions."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Dimension</th>
                  <th className="pb-2 pr-3 text-right font-medium">Poids</th>
                  <th className="pb-2 font-medium">Ce qu&apos;elle mesure</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {[
                  ["Économique", "30 %", "résultat d'exploitation, chiffre d'affaires"],
                  ["Financière", "20 %", "trésorerie nette, équilibre FRNG/BFR"],
                  ["Commerciale", "15 %", "part de marché, service de la demande"],
                  ["Opérationnelle", "10 %", "utilisation des capacités, ruptures"],
                  ["Rentabilité", "10 %", "rentabilité des capitaux (ROE)"],
                  ["Stratégie", "10 %", "cohérence et anticipation des décisions"],
                  ["Maîtrise des modèles", "5 %", "bons diagnostics, QCM réussis, sobriété en indices"],
                ].map(([d, w, m]) => (
                  <tr key={d} className="border-t border-white/5">
                    <td className="py-2 pr-3">{d}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-amber-300">{w}</td>
                    <td className="py-2 text-slate-400">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Les derniers tours pèsent plus lourd — un mauvais départ se rattrape. La décomposition
            complète est visible par chaque équipe : le score explique, il ne sanctionne pas.
          </p>
        </Section>

        <Section
          id="etablissements"
          title="🏛️ Côté établissements"
          intro="Déployez Business Arena à l'échelle d'un lycée, d'un campus ou d'un réseau."
        >
          <ol className="space-y-5">
            <Step n={1} title="Un espace d'administration par établissement">
              L&apos;admin d&apos;établissement voit ses enseignants, ses élèves, ses parties et
              ses concours ; il génère des <strong className="text-slate-200">codes
              d&apos;invitation enseignants</strong> pour rattacher son équipe.
            </Step>
            <Step n={2} title="Un monde de démonstration en un clic">
              Depuis l&apos;administration générale, générez le monde démo : un établissement
              complet, deux comptes (direction + enseignant), une partie jouée sur 3 tours et un
              concours prêt à lancer — idéal pour une présentation en conseil pédagogique. Les
              identifiants s&apos;affichent sur la page de connexion enseignant.
            </Step>
            <Step n={3} title="Des réglages de plateforme">
              Parties publiques, auto-inscription des enseignants, annonce globale : tout se
              règle depuis l&apos;espace d&apos;administration générale.
            </Step>
          </ol>
        </Section>

        <Section id="faq" title="❓ Questions fréquentes">
          <dl className="space-y-5">
            {[
              [
                "Mes élèves ont-ils besoin d'un compte ?",
                "Non. Un code de partie et un pseudo suffisent : la session est conservée sur leur navigateur. Aucune donnée personnelle n'est requise côté élève.",
              ],
              [
                "Une équipe n'a pas validé ses décisions avant la clôture ?",
                "Ses dernières décisions connues sont reconduites automatiquement — la partie n'est jamais bloquée, et l'équipe le voit dans son débriefing.",
              ],
              [
                "Les indices pénalisent-ils les résultats de l'entreprise ?",
                "Jamais. Ils ne coûtent que des points pédagogiques sur la situation concernée — l'économie de la simulation reste rigoureusement équitable.",
              ],
              [
                "Le tirage de cartes est-il équitable en concours ?",
                "En mode compétition, le tirage manuel est désactivé : seuls les événements tirés par le générateur aléatoire seedé (auditable, identique pour un même scénario) font foi.",
              ],
              [
                "Puis-je changer la durée d'un tour ?",
                "Oui, à la création de chaque partie : un tour = un mois, un trimestre ou une année. Toute l'économie du scénario est redimensionnée en conséquence.",
              ],
              [
                "Que règlent les niveaux de difficulté ?",
                "Six niveaux, de Découverte à Executive : les décisions ouvertes (la finance et l'assurance arrivent au niveau Pilotage), le plafond d'indices (de 5 à zéro) et la fréquence des événements aléatoires. Et le panneau avancé permet de moduler impôt, TVA, taux, délais et coûts — rien n'est figé.",
              ],
              [
                "Combien ça coûte ?",
                "Business Arena est un projet d'enseignant, construit pour la classe. Contactez-nous pour un déploiement en établissement.",
              ],
            ].map(([q, a]) => (
              <div key={q}>
                <dt className="text-sm font-semibold text-slate-100">{q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-400">{a}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <section className="rounded-2xl border border-amber-400/30 bg-slate-900 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-50">Prêt à entrer dans l&apos;arène ?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Lancez une partie solo pour vous faire la main, ou créez votre première partie de
            classe — six tours suffisent pour que le BFR devienne inoubliable.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Jouer maintenant
            </Link>
            <Link
              href="/teacher/login"
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-300"
            >
              Espace enseignant
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
