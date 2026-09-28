import type { Metadata } from "next";
import Link from "next/link";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import { REFERENTIELS_NON_VERIFIES } from "@/config/ateliers/referentiels";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { ApercuArene, ApercuPilotage, ApercuProjection } from "@/components/apercus";
import { DemoDuTour } from "@/components/demo-du-tour";
import { PreuvesDusageBande } from "@/components/preuves-dusage";
import { preuvesDusage } from "@/services/preuves-dusage.service";
import { bouton } from "@/components/bouton";

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
  { value: `${SCENARIO_CHOICES.length}`, label: "secteurs jouables", detail: "Industrie, commerce, hôtellerie, e-commerce, conseil, BTP, transport…" },
  { value: `${ATELIERS.length}`, label: "ateliers clés en main", detail: "Déroulés de séance minutés, livrables et grilles d'évaluation compris" },
  { value: `${DIPLOMES.length}`, label: "diplômes visés", detail: "Du lycée à l'expertise comptable, chacun adossé à son référentiel" },
];

const PEDAGOGIE = [
  {
    icon: "🎯",
    title: "On mesure une décision, pas un clic",
    text: "Les valeurs sont pré-remplies, mais le score distingue l'équipe qui a changé un chiffre de celle qui a validé sans réfléchir.",
  },
  {
    icon: "🧭",
    title: "Le modèle avant la réponse",
    text: "Chaque tour pose une situation tirée du contexte de l'entreprise : l'élève identifie le cadre d'analyse avant de trancher, comme en épreuve.",
  },
  {
    icon: "🔁",
    title: "Le débriefing relie résultat et raisonnement",
    text: "Le tableau de bord montre pourquoi une décision a produit son résultat, et le monde variable distingue un bon choix d'un coup de chance.",
  },
  {
    icon: "📓",
    title: "Rien ne se joue sans laisser d'écrit",
    text: "Chaque séance produit un livrable et sa grille, à verser au dossier de l'élève. Un business game qui ne laisse que des souvenirs ne remplit pas un dossier.",
  },
];

const CLASSE = [
  { icon: "⏱️", title: "Une partie en 30 secondes", text: "Un secteur, un niveau, un nombre d'équipes. Les élèves rejoignent par un code." },
  { icon: "👀", title: "La vue pédagogique", text: "Qui maîtrise chaque notion et qui valide au hasard, équipe par équipe, avant le débriefing." },
  { icon: "🎚️", title: "Six niveaux paramétrables", text: "De « Découverte » à « Executive » : les leviers s'ouvrent un à un, sans toucher au moteur." },
  { icon: "🏆", title: "Le concours prêt à l'emploi", text: "Groupes tirés au sort, indices limités, classement composite : un inter-classes clé en main." },
];

const ETAPES = [
  { n: "1", title: "Choisir la simulation", text: "Quatre questions sur votre classe, et le réglage qui convient s'écrit à mesure." },
  { n: "2", title: "Créer la partie", text: "La partie se crée, et vous obtenez un code à projeter." },
  { n: "3", title: "Faire jouer", text: "Les équipes rendent, vous clôturez, les résultats tombent, la situation suivante s'ouvre." },
  { n: "4", title: "Débriefer et évaluer", text: "Le tableau de bord nourrit le débriefing ; les traces alimentent le dossier." },
];

const CONFIANCE = [
  { label: "Sans compte élève", desc: "Les élèves rejoignent par un code, aucune donnée personnelle exigée" },
  { label: "Dans le navigateur", desc: "Rien à installer, sur ordinateur comme sur téléphone" },
  { label: "Essai gratuit", desc: "Prenez en main les secteurs, ateliers et concours sans engagement" },
  { label: "Référentiels lus sur le texte", desc: "Chaque atelier cite sa provenance ; ce qui n'a pas été vérifié le dit" },
];

export default async function EnseignantsPage() {
  // Comptés dans la base, jamais rédigés — et tus tant qu'ils ne prouvent rien.
  const preuves = await preuvesDusage();
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
            className={bouton({ taille: "l" })}
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
        {/*
          Le manuel se lit SANS COMPTE. Qui veut savoir comment l'outil évalue
          avant d'y exposer une classe doit pouvoir le lire tout de suite : un
          enseignant qui hésite, un collègue à qui l'on envoie un lien, un corps
          d'inspection à qui on l'a présenté.
        */}
        <p className="mt-4 text-base text-slate-400">
          <Link href="/manuel" className="text-amber-300 underline-offset-4 hover:underline">
            Lire le manuel de l&apos;enseignant
          </Link>{" "}
          · sans compte : ce que mesure l&apos;indice IPG, les niveaux, les barèmes.
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
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/*
        MONTRER AVANT D'EXPLIQUER.
        Cette page expliquait l'outil en 1 294 mots et quatre mètres de
        défilement sans jamais le montrer : mesurée, elle ne portait aucune
        image. L'enseignant qui hésite ne cherche pas une explication de plus,
        il cherche à voir les trois écrans qu'il aura sous les yeux.
      */}
      <section aria-labelledby="ecrans" className="mx-auto max-w-5xl px-6 pb-16">
        <h2 id="ecrans" className="mb-8 text-center text-2xl font-bold text-slate-50">
          Trois écrans, et c&apos;est tout
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ApercuArene />
          <ApercuProjection />
          <ApercuPilotage className="sm:col-span-2 lg:col-span-1" />
        </div>
      </section>

      {/*
        ET CE QUE LES TROIS ÉCRANS SE PASSENT.
        Les aperçus montrent les écrans ; ils ne montrent pas la BOUCLE, qui
        est ce qu'on vient chercher : lire une situation, trancher, subir le
        chiffre, et recommencer avec ce qu'on vient d'apprendre. Douze
        secondes en CSS, sans vidéo ni script — la politique de sécurité du
        site n'autoriserait pas un hébergeur vidéo, et une boucle dessinée ne
        pèse rien.
      */}
      <section aria-labelledby="boucle" className="mx-auto max-w-3xl px-6 pb-16">
        <h2 id="boucle" className="mb-2 text-center text-2xl font-bold text-slate-50">
          Un tour, de bout en bout
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-base text-slate-400">
          C&apos;est cette boucle que vos élèves répètent six fois dans une partie.
        </p>
        <DemoDuTour />
      </section>

      {/* Pédagogie */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
          Pourquoi vos élèves apprennent vraiment
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {PEDAGOGIE.map((p) => (
            <div key={p.title} className="carte p-5">
              <p className="text-2xl">{p.icon}</p>
              <h3 className="mt-3 text-sm font-semibold text-slate-100">{p.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-slate-400">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ateliers */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-50">
          Des ateliers clés en main, par diplôme
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-base text-slate-400">
          {ATELIERS.length} déroulés prêts à animer, {HEURES_TOTALES} heures de séance au total,
          chacun adossé à son référentiel et livré avec ses livrables et sa grille d&apos;évaluation.
        </p>
        {/*
          QUINZE ATELIERS DÉTAILLÉS SUR UNE PAGE DE PRÉSENTATION.
          Le catalogue complet a sa page, /animations, et c'est là qu'on
          choisit : ici, quatre suffisent à montrer de quoi il s'agit, et le
          lien mène au reste. Un mètre et demi de défilement en moins.
        */}
        <div className="grid gap-3 sm:grid-cols-2">
          {ATELIERS.slice(0, 4).map((a) => (
            <Link
              key={a.code}
              href={`/animations/${a.code}`}
              className="group flex flex-col carte p-4 transition hover:border-amber-400/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-xs font-semibold text-amber-300">
                  {a.diplome}
                </span>
                <span className="text-xs text-slate-400">{a.format}</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-slate-100 group-hover:text-amber-200">
                {a.titre}
              </h3>
              <p className="mt-1 text-base leading-relaxed text-slate-400">{a.resume}</p>
              <p className="mt-3 text-xs text-slate-400">
                {a.nature} · {a.difficulteLabel}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link
            href="/animations"
            className="inline-block rounded-lg border border-amber-400/40 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/10"
          >
            Voir les {ATELIERS.length} ateliers →
          </Link>
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-400">
          Chaque atelier cite les unités ou blocs de son référentiel avec la provenance de la
          liste. {REFERENTIELS_NON_VERIFIES.length} d&apos;entre eux (BTS MHR et BUT GEA) restent à
          confronter à leur texte officiel, et l&apos;indiquent plutôt que de le taire.
        </p>
      </section>

      {/* En classe */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">En classe, concrètement</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CLASSE.map((c) => (
            <div key={c.title} className="carte p-5">
              <p className="text-2xl">{c.icon}</p>
              <h3 className="mt-3 text-sm font-semibold text-slate-100">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{c.text}</p>
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
            <li key={e.n} className="flex gap-4 carte p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-slate-950">
                {e.n}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{e.title}</h3>
                <p className="mt-1 text-base leading-relaxed text-slate-400">{e.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/*
        QUATRE CARTES POUR QUATRE MENTIONS.
        Elles disaient chacune un fait d'une ligne dans une carte de 90 px de
        haut : un quart de mètre de défilement pour ce qui tient sur une
        rangée. Le fait reste, la carte part.
      */}
      {/*
        CE QUI S'EST JOUÉ, AVANT CE QU'ON PROMET. Les pastilles qui suivent sont
        des engagements — sans compte élève, rien à installer ; elles disent ce
        que le produit fait. Les totaux, eux, disent ce qu'il a déjà servi, et
        c'est la seule chose de cette page qu'un lecteur n'a pas à croire sur
        parole. Ils ne s'affichent qu'au-dessus d'un plancher : un compteur
        famélique prouverait l'inverse.
      */}
      <PreuvesDusageBande preuves={preuves} />

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-16">
        <ul className="flex flex-wrap justify-center gap-2">
          {CONFIANCE.map((d) => (
            <li
              key={d.label}
              title={d.desc}
              className="rounded-full border border-emerald-400/25 bg-emerald-950/20 px-4 py-1.5 text-sm text-emerald-300"
            >
              <span aria-hidden>✓</span> {d.label}
              <span className="sr-only"> : {d.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold text-slate-50">Prêt à faire jouer votre classe ?</h2>
        <p className="mt-3 text-base text-slate-400">
          Commencez par le réglage qui vous convient, ou ouvrez directement votre espace.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/orientation"
            className={bouton({ taille: "l" })}
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
