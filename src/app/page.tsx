import Link from "next/link";
import { startGameAction } from "./actions";
import { getPlatformConfig } from "@/services/admin.service";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { DEFAULT_SCENARIO_CODE, SCENARIOS, SECTOR_LABELS } from "@/config/scenarios/registry";
import {
  ACCENTS_SECTEUR,
  classesVignetteFinale,
  EMBLEMES_SECTEUR,
  nomEntreprise,
  promesseEntreprise,
} from "@/config/scenarios/presentation";
import { SubmitButton } from "@/components/submit-button";

export const dynamic = "force-dynamic";

/**
 * Landing page (§34) : moderne, immersive, compréhensible par un étudiant de
 * BTS. La complexité vient du jeu, pas de la page. Statique + formulaire de
 * lancement (server action) — aucune logique métier ici.
 */

const LOOP = [
  "Situation",
  "Problème",
  "Diagnostic",
  "Modèle",
  "Décision",
  "Simulation",
  "Résultat",
  "Apprentissage",
];

const FEATURES = [
  {
    icon: "⚙️",
    title: "Un vrai moteur économique",
    text: "Demande par segments, élasticité-prix, prix psychologiques, capacité de production, stocks, FRNG, BFR, trésorerie : chaque chiffre est calculé par un moteur déterministe et testé. Aucun n'est inventé.",
  },
  {
    icon: "🎯",
    title: "Le bon modèle, pas juste le bon chiffre",
    text: "Face à chaque situation, choisissez parmi 18 modèles d'analyse (seuil de rentabilité, coûts pertinents, FRNG/BFR, VAN…). Une décision juste avec un raisonnement faux rapporte moins qu'une décision argumentée.",
  },
  {
    icon: "💡",
    title: "Des indices, pas des solutions",
    text: "Bloqué ? Cinq niveaux d'aide progressifs : une observation, une question, un concept, un modèle, une méthode. Chaque indice coûte des points, car l'autonomie est récompensée.",
  },
  {
    icon: "📉",
    title: "Le piège du tour 4",
    text: "Votre chiffre d'affaires explose, votre résultat progresse… et votre banquier s'inquiète. Vivez la crise de trésorerie de croissance avant de la subir en entreprise.",
  },
  {
    icon: "🏫",
    title: "Pensé pour la classe",
    text: "Créez une partie en 30 secondes : vos équipes rejoignent par code, valident leurs décisions, vous clôturez les tours. Et la vue pédagogique vous dit qui maîtrise le BFR et qui bluffe.",
  },
  {
    icon: "🏆",
    title: "Business Arena Championship",
    text: "Groupes tirés au sort, décisions verrouillées, indices limités, qualification au score composite, finale et podium. Le concours de gestion, prêt à l'emploi.",
  },
];

const AUDIENCES = [
  "BTS",
  "Bachelor",
  "BUT GEA",
  "Licence",
  "DCG · DSCG",
  "Écoles de commerce",
  "Formation professionnelle",
  "Managers",
];

function MiniKpi({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ secteur?: string }>;
}) {
  const config = await getPlatformConfig();
  // La page des entreprises renvoie ici avec son métier en poche : le
  // sélecteur doit s'ouvrir dessus, sinon le clic n'a servi à rien.
  const { secteur } = await searchParams;
  const scenarioChoisi = SCENARIOS.some((s) => s.code === secteur)
    ? secteur!
    : DEFAULT_SCENARIO_CODE;
  return (
    <main className="relative overflow-hidden">
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
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Simulation · Apprentissage · Décision · Compétition
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
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
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#jouer"
              className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              Lancer une partie gratuite
            </a>
            <Link
              href="/entreprises"
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
            >
              Voir les {SCENARIOS.length} entreprises
            </Link>
            <Link
              href="/teacher/login"
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
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
              <p className="text-xs font-semibold text-slate-300">NOVA · Trimestre 4 / 6</p>
              <span className="rounded-full border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-[10px] text-red-300">
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
              <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400">
                Situation du tour
              </p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                Votre entreprise gagne de l&apos;argent mais n&apos;en a plus en caisse.
                Identifiez les causes possibles.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-slate-400">
                  1 · Diagnostic
                </span>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-slate-400">
                  2 · Choix du modèle
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
            ["6 tours", "mois, trimestres ou années"],
            ["24 concepts", "du CA au FRNG/BFR"],
            ["18 modèles", "d'aide à la décision"],
            ["7 dimensions", "de performance (BPI)"],
          ].map(([big, small]) => (
            <div key={big}>
              <p className="text-2xl font-bold text-amber-400">{big}</p>
              <p className="mt-1 text-xs text-slate-500">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Les entreprises ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-50">
          {SCENARIOS.length} entreprises, {SCENARIOS.length} façons de perdre de
          l&apos;argent
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-400">
          Une chambre vide ce soir est perdue pour toujours. Une enceinte invendue attend en
          réserve, mais elle a déjà coûté sa trésorerie. Le compte de résultat est le même
          partout ; ce qui change, c&apos;est la contrainte qui décide de tout.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((d) => {
            const a = ACCENTS_SECTEUR[d.sector];
            return (
              <Link
                key={d.code}
                href={`/entreprises#${d.code}`}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-5 transition ${a.bord}`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition-opacity duration-500 ${a.halo} opacity-50 group-hover:opacity-100`}
                />
                <span className="relative flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {EMBLEMES_SECTEUR[d.sector]}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${a.puce}`}
                  >
                    {SECTOR_LABELS[d.sector]}
                  </span>
                </span>
                <h3 className="relative mt-3 text-lg font-bold text-slate-50">
                  {nomEntreprise(d)}
                </h3>
                <p className={`relative text-xs font-medium ${a.texte}`}>
                  {promesseEntreprise(d) ?? d.tagline}
                </p>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-400">{d.tagline}</p>
                <p className="relative mt-3 text-[11px] text-slate-600">
                  Vous y vendez des {d.vocabulary.units} · {d.situations.length} situations à
                  traiter
                </p>
              </Link>
            );
          })}
          <Link
            href="/entreprises"
            className={`group flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-5 text-center transition hover:border-amber-400/50 ${classesVignetteFinale(
              SCENARIOS.length,
            )}`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              Toutes les fiches
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
            <span className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-500">
              Le premier arbitrage de chaque métier, ses indicateurs, et le tableau qui les met
              côte à côte.
            </span>
          </Link>
        </div>
      </section>

      {/* ---------- La boucle ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-50">
          Pas d&apos;exercices. Des situations.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-400">
          Business Arena ne vous demande jamais « calculez le BFR ». Vous vivez une situation
          d&apos;entreprise, vous cherchez, vous choisissez un modèle d&apos;analyse, vous
          décidez, et la simulation vous répond. Le concept s&apos;apprend parce qu&apos;il a
          servi.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {LOOP.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span
                className={`rounded-full px-4 py-1.5 text-sm ${
                  i === 3 || i === 7
                    ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40"
                    : "bg-slate-900 text-slate-300 ring-1 ring-white/10"
                }`}
              >
                {step}
              </span>
              {i < LOOP.length - 1 ? <span className="text-slate-600">→</span> : null}
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Piliers ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-white/10 bg-slate-900 p-5 transition hover:border-amber-400/30"
            >
              <p className="text-2xl">{f.icon}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Publics ---------- */}
      <section className="border-y border-white/5 bg-slate-900/50 px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Du premier bilan au comité de direction
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {AUDIENCES.map((a) => (
              <span
                key={a}
                className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-slate-300"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Jouer ---------- */}
      <section id="jouer" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-16">
        {/*
          Colonnes centrées l'une sur l'autre : le texte est bien plus court que
          le formulaire, et les aligner par le haut laissait un vide sous lui.
          La colonne de droite passe à 460 px, faute de quoi le libellé du
          niveau se faisait couper par le rendu natif du sélecteur.
        */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_460px] lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Lancez votre première partie</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
              Choisissez l&apos;un des {SCENARIOS.length} métiers, puis menez six tours face à
              des concurrents qui ne vous feront aucun cadeau. Prix, volumes, marketing,
              qualité, financement : chaque décision compte, et la crise de trésorerie réserve
              une leçon que peu voient venir.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li>· Niveau Découverte : aucune connaissance préalable requise</li>
              <li>· Débriefing corrigé à chaque tour, fiches concepts intégrées</li>
              <li>· Votre profil de compétences progresse à chaque situation traitée</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href="/entreprises" className="text-amber-300 underline-offset-4 hover:underline">
                Découvrir les {SCENARIOS.length} entreprises
              </Link>
              <Link href="/join" className="text-amber-300 underline-offset-4 hover:underline">
                J&apos;ai un code (élève)
              </Link>
              <Link href="/guide" className="text-slate-400 underline-offset-4 hover:underline">
                Guide
              </Link>
              <Link href="/profile" className="text-slate-400 underline-offset-4 hover:underline">
                Mon profil
              </Link>
            </div>
          </div>

          {!config.allowPublicPlay ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 text-sm text-slate-400">
              Les parties publiques sont momentanément désactivées. Élèves : utilisez le code
              donné par votre enseignant sur{" "}
              <Link href="/join" className="text-amber-300 underline-offset-4 hover:underline">
                /join
              </Link>
              .
            </div>
          ) : (
          <form
            action={startGameAction}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-xl shadow-black/30 ring-1 ring-white/5"
          >
            <h3 className="text-sm font-semibold text-slate-100">Configurer la partie</h3>
            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Secteur d&apos;activité
              </span>
              <select
                name="scenarioCode"
                defaultValue={scenarioChoisi}
                className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {SECTOR_LABELS[s.sector]} · {s.tagline}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="mt-4">
              <legend className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Périodicité : chaque tour représente…
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ["month", "Un mois", "délais redoutables"],
                    ["quarter", "Un trimestre", "le rythme classique"],
                    ["year", "Une année", "vision long terme"],
                  ] as const
                ).map(([value, label, hint]) => (
                  <label
                    key={value}
                    className="cursor-pointer rounded-lg border border-white/10 bg-slate-950 px-2 py-3 text-center transition hover:border-white/25 has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 has-[:checked]:ring-1 has-[:checked]:ring-amber-400/30"
                  >
                    <input
                      type="radio"
                      name="periodicity"
                      value={value}
                      defaultChecked={value === "quarter"}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium text-slate-100">{label}</span>
                    {/*
                      Hauteur réservée à deux lignes : sans elle, le sous-titre le plus
                      long passait à la ligne et décalait le titre de sa tuile par
                      rapport aux deux autres.
                    */}
                    <span className="mt-1 flex min-h-[1.75rem] items-start justify-center text-[11px] leading-tight text-slate-500">
                      {hint}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Entreprises sur le marché
              </span>
              <select
                name="companiesCount"
                defaultValue={3}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
              >
                <option value={2}>2 · duel face à un seul concurrent</option>
                <option value={3}>3 · le marché classique (recommandé)</option>
                <option value={4}>4 · marché disputé</option>
                <option value={6}>6 · forte concurrence</option>
                <option value={8}>8 · guerre de tous contre tous</option>
              </select>
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Niveau de difficulté
              </span>
              <select
                name="level"
                defaultValue={3}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400/60"
              >
                {DIFFICULTY_PRESETS.map((p) => (
                  <option key={p.level} value={p.level}>
                    {p.level} · {p.name}
                  </option>
                ))}
              </select>
              {/*
                Le libellé complet se faisait couper par le rendu natif du sélecteur.
                Les noms sont lus des préréglages : ils ne peuvent pas se désaccorder
                de ce que la partie ouvrira vraiment.
              */}
              <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">
                De {DIFFICULTY_PRESETS[0]!.name} à{" "}
                {DIFFICULTY_PRESETS[DIFFICULTY_PRESETS.length - 1]!.name}, chaque cran
                ouvre de nouvelles décisions et retire des indices.
              </span>
            </label>
            <SubmitButton
              pendingLabel="Création de la partie…"
              className="mt-5 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              Lancer la partie
            </SubmitButton>
          </form>
          )}
        </div>
      </section>

      {/* ---------- Enseignants & concours ---------- */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-slate-900 to-sky-950/20 p-6">
            <p className="text-2xl">🏫</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Pour vos classes</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Créez une partie multi-équipes, partagez un code, pilotez les tours. La vue
              pédagogique vous montre la maîtrise de chaque concept, les indices consommés et
              les modèles mal choisis. De quoi préparer la séance suivante.
            </p>
            <Link
              href="/teacher/login"
              className="mt-4 inline-block rounded-lg border border-sky-400/40 px-5 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/10"
            >
              Ouvrir l&apos;espace enseignant →
            </Link>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-slate-900 to-amber-950/20 p-6">
            <p className="text-2xl">🏆</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Business Arena Championship
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Organisez un concours : inscriptions par code, groupes tirés au sort, décisions
              verrouillées, qualification au BPI, finale et podium. Entre classes, entre
              établissements, à vous de voir grand.
            </p>
            <Link
              href="/compete"
              className="mt-4 inline-block rounded-lg border border-amber-400/40 px-5 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/10"
            >
              Rejoindre un concours →
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-slate-600">
          <p>
            BUSINESS <span className="text-amber-400/70">ARENA</span> · simulation
            d&apos;entreprise, apprentissage de la décision.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/parcours" className="hover:text-slate-400">
              Parcours
            </Link>
            <Link href="/guide" className="hover:text-slate-400">
              Guide
            </Link>
            <Link href="/concepts" className="hover:text-slate-400">
              Fiches concepts
            </Link>
            <Link href="/teacher/login" className="hover:text-slate-400">
              Enseignants
            </Link>
            <Link href="/compete" className="hover:text-slate-400">
              Concours
            </Link>
            <Link href="/mentions-legales" className="hover:text-slate-400">
              Mentions légales & RGPD
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
