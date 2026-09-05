import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformConfig } from "@/services/admin.service";
import { etendueDesDecisions } from "@/config/decisions";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { SCENARIOS } from "@/config/scenarios/registry";
import { LIENS_LEGAUX, NAVIGATION } from "@/config/navigation";
import { DESCRIPTION_ACCUEIL, TITRE_ACCUEIL } from "@/config/seo";

// La landing ne lit que la configuration de plateforme (rien par utilisateur) :
// on la met en cache et on la régénère au plus toutes les 5 min (ISR) plutôt
// que de la recalculer à chaque visite — l'essentiel du trafic public et des
// robots tape ici. (Avant en force-dynamic ; le nonce CSP par requête forçait
// de toute façon tout le site en dynamique, ce n'est plus le cas.)
export const revalidate = 300;

/**
 * Landing page (§34) : moderne, immersive, compréhensible par un étudiant de
 * BTS. La complexité vient du jeu, pas de la page.
 *
 * Volontairement courte : un hero, les chiffres clés, et des renvois vers les
 * pages qui portent le détail (entreprises, fonctionnalités, parcours,
 * concours, espace enseignant). Le lancement d'une partie a sa propre page,
 * /jouer. Tout ce qui vivait ici en double avec ces pages en est retiré.
 */

/** Les portes d'entrée du site, chacune vers la page qui porte le sujet. */
const RENVOIS: {
  icon: string;
  title: string;
  href: string;
  aide: string;
  accent?: boolean;
}[] = [
  {
    icon: "🧭",
    title: "Choisir ma simulation",
    href: "/orientation",
    aide: "Quatre questions, et le réglage qui convient à votre classe s'écrit à mesure, avec ses raisons.",
    accent: true,
  },
  {
    icon: "🏭",
    title: "Les entreprises",
    href: "/entreprises",
    aide: "9 secteurs, 9 économies réelles : leur marché, leurs contraintes, ce qu'on y apprend.",
  },
  {
    icon: "⚙️",
    title: "Fonctionnalités",
    href: "/fonctionnalites",
    aide: "Le moteur économique, les 18 modèles d'analyse, les indices progressifs, le piège du tour 4.",
  },
  {
    icon: "🎓",
    title: "Le parcours d'une classe",
    href: "/parcours",
    aide: "De la première décision au dernier bilan, avec les réglages conseillés par diplôme.",
  },
  {
    icon: "🏫",
    title: "Espace enseignant",
    href: "/teacher/login",
    aide: "Créez une partie multi-équipes, pilotez les tours, suivez la maîtrise de chaque notion.",
  },
  {
    icon: "🏆",
    title: "Business Arena Championship",
    href: "/compete",
    aide: "Groupes tirés au sort, décisions verrouillées, qualification au BPI, finale et podium.",
  },
];

function MiniKpi({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`text-sm font-semibold ${
          tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-red-400" : "text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * La page d'accueil porte le titre entier du site (pas de gabarit) : c'est
 * elle qu'un lien partagé ou un moteur de recherche présentent.
 */
export const metadata: Metadata = {
  title: { absolute: TITRE_ACCUEIL },
  description: DESCRIPTION_ACCUEIL,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const config = await getPlatformConfig();
  // Le nombre de décisions se compte sur le registre des leviers : l'écrire
  // ici le figerait, et il change dès qu'un niveau ouvre une décision de plus.
  const decisions = etendueDesDecisions();
  return (
    <main id="main" className="relative overflow-hidden">
      {/* halo décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      {config.announcement ? (
        <div className="border-b border-amber-400/20 bg-amber-950/30 px-6 py-2 text-center text-sm text-amber-200">
          📣 {config.announcement}
        </div>
      ) : null}

      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:py-20">
        {/* La colonne est un conteneur de requête : le titre se dimensionne à SA
            largeur (unités cqw), pas à celle de l'écran. Il tient donc sur une
            seule ligne aussi bien en pleine largeur (mobile) qu'en demi-colonne
            (desktop), sans jamais déborder. */}
        <div style={{ containerType: "inline-size" }}>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Simulation · Apprentissage · Décision · Compétition
          </p>
          {/* whitespace-nowrap + taille fluide en cqw : chaque phrase sur une
              ligne, quel que soit le support ; le <br/> sépare les deux lignes. */}
          <h1 className="mt-4 whitespace-nowrap text-[clamp(1rem,6.8cqw,3rem)] font-bold leading-tight tracking-tight text-slate-50">
            Dirigez une entreprise.
            <br />
            <span className="text-amber-400">Apprenez à décider.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
            Un atelier, un hôtel, un chantier, une flotte de camions :{" "}
            {SCENARIOS.length} secteurs, {SCENARIOS.length} économies réelles. Fixez vos prix,
            approvisionnez, recrutez, affrontez la concurrence. Situation après situation,
            découvrez les modèles de gestion qui font les bonnes décisions.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jouer"
              className="rounded-lg bg-amber-500 px-6 py-3 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              Tester le simulateur
            </Link>
            <Link
              href="/entreprises"
              className="rounded-lg border border-white/15 px-6 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
            >
              Voir les {SCENARIOS.length} entreprises
            </Link>
            <Link
              href="/teacher/login"
              className="rounded-lg border border-white/15 px-6 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
            >
              Je suis enseignant
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Sans compte, sans installation. Vos parties restent liées à ce navigateur.
          </p>
          <p className="mt-4 rounded-lg border border-sky-400/25 bg-sky-950/20 px-4 py-3 text-xs leading-relaxed text-sky-200/90">
            <strong className="font-semibold text-sky-300">Version bêta.</strong> La plateforme
            est pleinement utilisable en classe : le moteur économique est testé et les parties
            se déroulent de bout en bout. Les scénarios, les contenus pédagogiques et
            l&apos;interface continuent d&apos;évoluer, et certains réglages seront affinés au
            fil des retours. Si quelque chose vous surprend ou vous manque, écrivez-nous. C&apos;est
            exactement ce dont nous avons besoin.
          </p>
        </div>

        {/* aperçu du cockpit (illustration statique du jeu) */}
        <div className="relative">
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-2xl shadow-amber-400/5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <p className="text-xs font-semibold text-slate-300">NOVA · Tour 4 / 6</p>
              <span className="rounded-full border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-xs text-red-300">
                ⚠ trésorerie sous tension
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniKpi label="Chiffre d'affaires" value="346 920 €" tone="good" />
              <MiniKpi label="Résultat net" value="+10 110 €" tone="good" />
              <MiniKpi label="Trésorerie nette" value="−758 €" tone="bad" />
              <MiniKpi label="BFR" value="84 805 €" />
            </div>
            <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-950/20 p-3">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
                Alerte comptable
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                Votre entreprise gagne de l&apos;argent mais n&apos;en a plus en caisse.
                Identifiez les causes possibles.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-slate-400">
                  Diagnostic
                </span>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-slate-400">
                  Connaissances
                </span>
                <span className="rounded-full border border-amber-400/40 px-2.5 py-1 text-amber-300">
                  💡 Indice 1 (−5 %)
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-400">
              <span>Classement BPI</span>
              <span>
                <span className="text-amber-300">#2 NOVA 58,3</span>
                <span className="ml-2 text-slate-600">#1 Auris 61,8</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Bande chiffres ---------- */}
      <section className="border-y border-white/5 bg-slate-900/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 text-center sm:grid-cols-4">
          {[
            [
              `${decisions.minimum} à ${decisions.maximum} décisions`,
              "par tour, selon le niveau",
            ],
            [`${CONCEPTS.length} fiches notions`, "du CA au FRNG/BFR"],
            [`${DECISION_MODELS.length} modèles`, "d'aide à la décision"],
            ["6 dimensions", "de performance (BPI)"],
          ].map(([big, small]) => (
            <div key={big}>
              <p className="text-2xl font-bold text-amber-400">{big}</p>
              <p className="mt-1 text-xs text-slate-500">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Explorer : renvois vers les pages dédiées ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-50">Par où commencer ?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-400">
          Chaque page va droit au but. Choisissez la vôtre.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RENVOIS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className={`group flex flex-col rounded-2xl border bg-slate-900 p-5 transition ${
                r.accent
                  ? "border-amber-400/40 hover:border-amber-400/70"
                  : "border-white/10 hover:border-amber-400/30"
              }`}
            >
              <p className="text-2xl">{r.icon}</p>
              <h3 className="mt-2 flex items-center gap-1.5 text-base font-semibold text-slate-100">
                {r.title}
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.aide}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-slate-600">
          <p>
            BUSINESS <span className="text-amber-400/70">ARENA</span> · simulation
            d&apos;entreprise, apprentissage de la décision.
          </p>
          {/* Le pied de page ne recopie plus le menu : il lit le même plan.
              La liste écrite à la main avait déjà pris du retard, la page qui
              aide à choisir sa simulation n'y figurait pas. */}
          <div className="flex flex-wrap gap-4">
            {[...NAVIGATION.flatMap((g) => g.liens), ...LIENS_LEGAUX].map((lien) => (
              <Link key={lien.href} href={lien.href} className="hover:text-slate-400">
                {lien.libelle}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
