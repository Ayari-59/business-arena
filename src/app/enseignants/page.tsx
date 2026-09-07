import type { Metadata } from "next";
import Link from "next/link";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import { REFERENTIELS_NON_VERIFIES } from "@/config/ateliers/referentiels";
import { SCENARIOS } from "@/config/scenarios/registry";

export const metadata: Metadata = {
  alternates: { canonical: "/enseignants" },
  title: "Pour les enseignants",
  description:
    "Le business game qui mesure une décision, pas un clic, et rend compte au référentiel sans mentir. Ateliers clés en main du STMG au DCG, partie créée en 30 secondes.",
};

/** Les diplômes couverts, dédupliqués depuis le registre des ateliers. */
const DIPLOMES = [...new Set(ATELIERS.map((a) => a.diplome))];
const HEURES_TOTALES = Math.round(ATELIERS.reduce((s, a) => s + dureeTotaleHeures(a), 0));

const HERO_STATS = [
  { value: `${SCENARIOS.length}`, label: "secteurs jouables", detail: "Industrie, commerce, hôtellerie, e-commerce, conseil, BTP, transport…" },
  { value: `${ATELIERS.length}`, label: "ateliers clés en main", detail: "Déroulés de séance minutés, livrables et grilles d'évaluation compris" },
  { value: `${DIPLOMES.length}`, label: "diplômes visés", detail: "Du lycée à l'expertise comptable, chacun adossé à son référentiel" },
];

const PEDAGOGIE = [
  {
    icon: "🎯",
    title: "On mesure une décision, pas un clic",
    text: "Les valeurs sont pré-remplies, mais le score distingue l'équipe qui a changé un chiffre de celle qui a validé sans réfléchir. Décider, c'est prendre position, pas cliquer sur « suivant ».",
  },
  {
    icon: "🧭",
    title: "Le modèle avant la réponse",
    text: "Chaque tour pose une situation de gestion tirée du contexte de l'entreprise. L'élève doit identifier le bon cadre d'analyse avant de trancher, comme en épreuve professionnelle.",
  },
  {
    icon: "🔁",
    title: "Le débriefing relie résultat et raisonnement",
    text: "Le tableau de bord ne donne pas qu'un classement : il montre pourquoi une décision a produit son résultat, et le monde variable apprend à distinguer un bon choix d'un simple coup de chance.",
  },
  {
    icon: "📓",
    title: "Rien ne se joue sans laisser d'écrit",
    text: "Chaque séance d'atelier produit une trace à verser au passeport professionnel, un livrable et une grille de correction. Un business game qui ne laisse que des souvenirs ne remplit pas un dossier.",
  },
];

const CLASSE = [
  { icon: "⏱️", title: "Une partie en 30 secondes", text: "Choisissez un secteur, un niveau, le nombre d'équipes. Les élèves rejoignent par un code, sans compte ni installation." },
  { icon: "👀", title: "La vue pédagogique", text: "Vous voyez qui maîtrise chaque notion et qui valide au hasard, équipe par équipe, avant même le débriefing." },
  { icon: "🎚️", title: "Six niveaux paramétrables", text: "De « Découverte » à « Executive » : vous ouvrez les leviers un à un, et réglez la difficulté sans toucher au moteur." },
  { icon: "🏆", title: "Le concours prêt à l'emploi", text: "Groupes tirés au sort, décisions verrouillées, indices limités, classement composite : un concours inter-classes clé en main." },
];

const ETAPES = [
  { n: "1", title: "Choisir la simulation", text: "Quatre questions sur votre classe et votre objectif, et le réglage qui convient s'écrit à mesure, avec ses raisons." },
  { n: "2", title: "Créer la partie", text: "Depuis l'espace enseignant, la partie se crée et vous obtenez un code d'invitation à projeter." },
  { n: "3", title: "Faire jouer", text: "Les équipes rendent leurs décisions, vous clôturez le tour, les résultats tombent et la situation suivante s'ouvre." },
  { n: "4", title: "Débriefer et évaluer", text: "Le tableau de bord et la vue pédagogique nourrissent le débriefing ; les traces alimentent le dossier de chaque élève." },
];

const CONFIANCE = [
  { label: "Sans compte élève", desc: "Les élèves rejoignent par un code, aucune donnée personnelle exigée" },
  { label: "Dans le navigateur", desc: "Rien à installer, sur ordinateur comme sur téléphone" },
  { label: "Essai gratuit", desc: "Prenez en main les secteurs, ateliers et concours sans engagement" },
  { label: "Référentiels lus sur le texte", desc: "Chaque atelier cite sa provenance ; ce qui n'a pas été vérifié le dit" },
];

export default function EnseignantsPage() {
  return (
    <main id="main" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
      />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Pour les enseignants</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          Vos élèves apprennent à <span className="text-amber-400">décider</span>, pas à cliquer
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
          Un business game qui mesure une vraie décision, fait identifier le bon modèle
          d&apos;analyse avant de trancher, et rend compte au référentiel sans rien surpromettre.
          Des ateliers clés en main, une partie créée en trente secondes.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/orientation"
            className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Choisir ma simulation
          </Link>
          <Link
            href="/animations"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
          >
            Voir les ateliers
          </Link>
        </div>
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

      {/* Pédagogie */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
          Pourquoi vos élèves apprennent vraiment
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {PEDAGOGIE.map((p) => (
            <div key={p.title} className="rounded-xl border border-white/10 bg-slate-900 p-5">
              <p className="text-2xl">{p.icon}</p>
              <h3 className="mt-3 text-sm font-semibold text-slate-100">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ateliers */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-50">
          Des ateliers clés en main, par diplôme
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-slate-400">
          {ATELIERS.length} déroulés prêts à animer, {HEURES_TOTALES} heures de séance au total,
          chacun adossé à son référentiel et livré avec ses livrables et sa grille d&apos;évaluation.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ATELIERS.map((a) => (
            <Link
              key={a.code}
              href={`/animations/${a.code}`}
              className="group flex flex-col rounded-xl border border-white/10 bg-slate-900 p-4 transition hover:border-amber-400/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  {a.diplome}
                </span>
                <span className="text-xs text-slate-500">{a.format}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-amber-200">
                {a.titre}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{a.resume}</p>
              <p className="mt-3 text-xs text-slate-500">
                {a.nature} · {a.difficulteLabel}
              </p>
            </Link>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
          Chaque atelier cite les unités ou blocs de son référentiel avec la provenance de la
          liste. Deux d&apos;entre eux ({REFERENTIELS_NON_VERIFIES.length} référentiels : BTS MHR et
          BUT GEA) restent à confronter à leur texte officiel, et l&apos;indiquent plutôt que de le
          taire.
        </p>
      </section>

      {/* En classe */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">En classe, concrètement</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CLASSE.map((c) => (
            <div key={c.title} className="rounded-xl border border-white/10 bg-slate-900 p-5">
              <p className="text-2xl">{c.icon}</p>
              <h3 className="mt-3 text-sm font-semibold text-slate-100">{c.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prise en main */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
          De la découverte à la classe, en quatre temps
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {ETAPES.map((e) => (
            <li key={e.n} className="flex gap-4 rounded-xl border border-white/10 bg-slate-900 p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-slate-950">
                {e.n}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{e.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{e.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Confiance */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CONFIANCE.map((d) => (
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
        <h2 className="text-2xl font-bold text-slate-50">Prêt à faire jouer votre classe ?</h2>
        <p className="mt-3 text-sm text-slate-400">
          Commencez par le réglage qui vous convient, ou ouvrez directement votre espace.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/orientation"
            className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Choisir ma simulation
          </Link>
          <Link
            href="/teacher/login"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
          >
            Ouvrir l&apos;espace enseignant
          </Link>
        </div>
      </section>
    </main>
  );
}
