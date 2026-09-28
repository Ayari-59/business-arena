import Link from "next/link";
import { ALL_SITUATIONS, SCENARIO_CHOICES, SECTOR_LABELS } from "@/config/scenarios/registry";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { ApercuArene } from "@/components/apercus";
import { bouton } from "@/components/bouton";

export const metadata = {
  alternates: { canonical: "/fonctionnalites" },
  title: "Fonctionnalités",
  description: `${SCENARIO_CHOICES.length} scénarios sectoriels, ${ALL_SITUATIONS.length} situations pédagogiques, ${DECISION_MODELS.length} modèles d'analyse : tout ce que la plateforme met entre les mains de vos étudiants.`,
};

const HERO_STATS = [
  { value: String(SCENARIO_CHOICES.length), label: "scénarios sectoriels", detail: "Industrie, commerce, hôtellerie, restauration, e-commerce, conseil, fitness, BTP, transport" },
  { value: String(ALL_SITUATIONS.length), label: "situations pédagogiques", detail: "Déclenchées par le contexte de chaque tour, adaptées au secteur et à la difficulté" },
  { value: String(DECISION_MODELS.length), label: "modèles d'analyse", detail: "Seuil de rentabilité, coûts pertinents, FRNG/BFR, VAN, TRI, arbre de décision…" },
];

const PILLARS = [
  {
    icon: "⚙️",
    title: "Moteur économique déterministe",
    text: "Demande par segments, élasticité-prix, capacité, stocks, FRNG, BFR, trésorerie : chaque chiffre est calculé, aucun n'est inventé, et le moteur est tenu par sa suite de tests.",
  },
  {
    icon: "🎯",
    title: "Apprentissage par la situation",
    text: "Chaque tour déclenche une situation tirée du contexte de l'entreprise : l'étudiant identifie le modèle pertinent avant de décider, et le débriefing relie le résultat au raisonnement.",
  },
  {
    icon: "📊",
    title: "Tableau de bord en temps réel",
    text: "Tendances, évolution du CA, du résultat et de la trésorerie, parts de marché par segment, classement IPG. Trois onglets : Synthèse, Marché, Finance.",
  },
  {
    icon: "💡",
    title: "Indices progressifs",
    text: "Cinq niveaux d'aide, d'une observation à une méthode. Chaque indice coûte des points : l'autonomie est récompensée, le blocage n'existe pas.",
  },
  {
    icon: "🏫",
    title: "Conçu pour la classe",
    text: "Une partie en 30 secondes, les équipes rejoignent par code, vous clôturez les tours. La vue pédagogique montre qui maîtrise chaque notion et qui bluffe.",
  },
  {
    icon: "🏆",
    title: "Business Arena Championship",
    text: "Groupes tirés au sort, décisions verrouillées, indices limités, qualification au score composite : le concours de gestion, prêt à l'emploi.",
  },
];

const DIFFERENTIATORS = [
  { label: "Sans compte", desc: "Aucune inscription requise pour les étudiants" },
  { label: "Sans installation", desc: "Fonctionne dans le navigateur, sur tout appareil" },
  { label: "Essai gratuit", desc: "Découvrez tous les scénarios et fonctionnalités sans engagement" },
  { label: "Testé", desc: "Moteur déterministe, tenu par sa suite de tests" },
];

export default function FonctionnalitesPage() {
  return (
    <main id="main" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      {/* Hero */}
      {/*
        MONTRER, PUIS ÉNUMÉRER.
        Quinze cartes de fonctionnalités et zéro image : on lisait une liste de
        promesses sans jamais voir l'outil. L'écran de l'élève passe devant la
        liste — un repère suffit, la galerie est sur « Pour les enseignants ».
      */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <div className="mx-auto max-w-sm">
          <ApercuArene />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
          Plateforme de simulation de gestion
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          Tout ce qu&apos;il faut pour{" "}
          <span className="text-amber-400">apprendre à décider</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
          Un moteur économique réaliste, des situations pédagogiques contextuelles,
          des modèles d&apos;analyse à mobiliser : Business Arena met la gestion
          d&apos;entreprise entre les mains de vos étudiants.
        </p>
      </section>

      {/* Hero numbers */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {HERO_STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-amber-400/20 bg-slate-900/80 px-6 py-8 text-center"
            >
              <p className="text-5xl font-bold tabular-nums text-amber-400">{s.value}</p>
              <p className="mt-2 text-sm font-semibold text-slate-200">{s.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors grid */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
          {SCENARIO_CHOICES.length} secteurs, {SCENARIO_CHOICES.length} économies réelles
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {SCENARIO_CHOICES.map((s) => (
            <div
              key={s.code}
              className="flex items-center gap-3 carte px-4 py-3"
            >
              <span className="text-2xl">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200">{s.title}</p>
                <p className="text-xs text-slate-400">{SECTOR_LABELS[s.sector]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
          Ce qui rend la simulation possible
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="carte p-5"
            >
              <p className="text-2xl">{p.icon}</p>
              <h3 className="mt-3 text-sm font-semibold text-slate-100">{p.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Models list */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-50">
          {DECISION_MODELS.length} modèles d&apos;analyse
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-sm text-slate-400">
          Chaque situation mobilise un ou plusieurs de ces modèles. L&apos;étudiant
          doit identifier le bon cadre avant de trancher.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DECISION_MODELS.map((m) => (
            <div
              key={m.code}
              className="flex items-start gap-2 rounded-lg border border-white/5 bg-slate-950 px-3 py-2.5"
            >
              <span className="mt-0.5 text-xs text-amber-400">●</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">{m.name}</p>
                <p className="text-xs text-slate-400">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Differentiators */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DIFFERENTIATORS.map((d) => (
            <div
              key={d.label}
              className="rounded-xl border border-emerald-400/20 bg-emerald-950/20 px-4 py-4 text-center"
            >
              <p className="text-sm font-semibold text-emerald-400">{d.label}</p>
              <p className="mt-1 text-xs text-slate-400">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold text-slate-50">
          Prêt à tester ?
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Lancez une partie en 30 secondes, sans compte ni installation.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/jouer"
            className={bouton({ taille: "l" })}
          >
            Tester le simulateur
          </Link>
          <Link
            href="/entreprises"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
          >
            Voir les entreprises
          </Link>
        </div>
      </section>
    </main>
  );
}
