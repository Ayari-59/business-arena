import type { Metadata } from "next";
import { publicDeLAtelier } from "@/config/formations";
import Link from "next/link";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import {
  ApercuArene,
  ApercuPilotage,
  ApercuProjection,
} from "@/components/apercus";
import { PreuvesDusageBande } from "@/components/preuves-dusage";
import { preuvesDusage } from "@/services/preuves-dusage.service";
import { getPlatformConfig } from "@/services/admin.service";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { BandeDeChiffres } from "@/components/bande-de-chiffres";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";

export const metadata: Metadata = {
  alternates: { canonical: "/enseignants" },
  title: "Pour les enseignants",
  description:
    "Le business game qui mesure une décision, pas un clic, et rend compte au référentiel sans mentir. Ateliers clés en main du STMG au DCG, partie créée en 30 secondes.",
};

/** Les diplômes couverts, dédupliqués depuis le registre des ateliers. */
const DIPLOMES = [...new Set(ATELIERS.map((a) => publicDeLAtelier(a)))];
const HEURES_TOTALES = Math.round(
  ATELIERS.reduce((s, a) => s + dureeTotaleHeures(a), 0),
);

const HERO_STATS = [
  {
    value: `${SCENARIO_CHOICES.length}`,
    label: "secteurs jouables",
    detail:
      "Industrie, commerce, hôtellerie, e-commerce, conseil, BTP, transport…",
  },
  {
    value: `${ATELIERS.length}`,
    label: "ateliers clés en main",
    detail:
      "Déroulés de séance minutés, livrables et grilles d'évaluation compris",
  },
  {
    value: `${DIPLOMES.length}`,
    label: "diplômes visés",
    detail: "Du lycée à l'expertise comptable, chacun adossé à son référentiel",
  },
];

/**
 * Les quatre raisons, et les quatre faits de classe, se lisent en sommaire :
 * un filet, le titre, sa phrase. Ils ont porté un emoji chacun — 🎯 🧭 🔁 📓,
 * ⏱️ 👀 🎚️ 🏆 — que le dépôt a chassé partout ailleurs pour la même raison :
 * le système les dessine à sa façon, ils changent d'un appareil à l'autre, en
 * couleurs étrangères à la maison, et se brouillent au vidéoprojecteur.
 */
const PEDAGOGIE = [
  {
    title: "On mesure une décision, pas un clic",
    text: "Les valeurs sont pré-remplies, mais le score distingue l'équipe qui a changé un chiffre de celle qui a validé sans réfléchir.",
  },
  {
    title: "Le modèle avant la réponse",
    text: "Chaque tour pose une situation tirée du contexte de l'entreprise : l'élève identifie le cadre d'analyse avant de trancher, comme en épreuve.",
  },
  {
    title: "Le débriefing relie résultat et raisonnement",
    text: "Le tableau de bord montre pourquoi une décision a produit son résultat, et le monde variable distingue un bon choix d'un coup de chance.",
  },
  {
    title: "Rien ne se joue sans laisser d'écrit",
    text: "Chaque séance produit un livrable et sa grille, à verser au dossier de l'élève. Un business game qui ne laisse que des souvenirs ne remplit pas un dossier.",
  },
];

/**
 * CE QUE FAIT UN ENSEIGNANT, DANS L'ORDRE OÙ IL LE FAIT.
 *
 * La rangée « En classe, concrètement » alignait quatre capacités sans ordre :
 * la partie en trente secondes, la vue pédagogique, les six niveaux, le
 * concours. Chacune est vraie, et prise ensemble la liste ne disait pas à
 * quel MOMENT chaque chose sert — un enseignant qui découvre le produit se
 * demande d'abord ce qu'il aura à faire avant la séance, pendant, et après.
 *
 * Les mêmes faits se rangent donc en trois temps, et les trous que la liste
 * laissait se voient une fois la grille posée : la durée d'un tour et les
 * scénarios personnels manquaient au premier, la composition des équipes et
 * la clôture au deuxième, les fiches imprimables et le carnet d'usage au
 * troisième.
 *
 * CE N'EST PAS LE DÉROULÉ D'UNE SÉANCE. Celui-là a vécu ici en quatre cartes
 * numérotées, et il en a été retiré parce qu'il redisait le guide en moins
 * bien ; le renvoi au guide reste sous la grille. Ici on dit ce que
 * l'enseignant TIENT, pas comment il anime.
 *
 * Rien n'est promis qui ne soit dans l'espace enseignant : chacune de ces
 * lignes correspond à un écran qui existe.
 */
const TROIS_TEMPS = [
  {
    temps: "Préparer",
    resume: "Le métier, le niveau, la durée.",
    faits: [
      // Le compte et les deux bouts de l'échelle se lisent dans le registre :
      // écrits à la main, ils survivraient à un niveau ajouté ou renommé.
      `${DIFFICULTY_PRESETS.length} niveaux, de ${DIFFICULTY_PRESETS[0]!.name} à ${DIFFICULTY_PRESETS.at(-1)!.name} : les leviers s'ouvrent un à un, sans toucher au moteur.`,
      "Un tour vaut un mois, un trimestre ou une année : toute l'économie du scénario suit.",
      `${ATELIERS.length} ateliers clés en main, ou vos propres scénarios si vous préférez les écrire.`,
    ],
  },
  {
    temps: "Faire jouer",
    resume: "Une partie créée en trente secondes.",
    faits: [
      "Les élèves rejoignent par un code, sans compte : le code répartit, vous déplacez qui vous voulez.",
      "Les cartons d'équipe s'impriment, chacun avec son code en QR.",
      "Vous ouvrez et clôturez les tours, et distribuez le courrier quand la séance le demande.",
      // Le concours vivait dans l'ancienne rangée et n'avait pas à disparaître
      // avec elle : c'est une façon de faire jouer, pas une quatrième chose.
      "Ou le concours entre classes : groupes tirés au sort, indices limités, classement composite.",
    ],
  },
  {
    temps: "Évaluer",
    resume: "Ce que chacun a compris.",
    faits: [
      "La vue pédagogique : qui maîtrise chaque notion, qui valide au hasard, équipe par équipe.",
      "Le relevé de notes, une ligne par élève, et les fiches de séance à imprimer.",
      "Le carnet d'usage : une situation ratée par une classe est un accident, ratée par cinq c'est l'énoncé.",
    ],
  },
];

const CONFIANCE = [
  {
    label: "Sans compte élève",
    desc: "Les élèves rejoignent par un code, aucune donnée personnelle exigée",
  },
  {
    label: "Dans le navigateur",
    desc: "Rien à installer, sur ordinateur comme sur téléphone",
  },
  {
    label: "Essai gratuit",
    desc: "Prenez en main les secteurs, ateliers et concours sans engagement",
  },
  {
    label: "Référentiels lus sur le texte",
    desc: "Chaque atelier cite sa provenance ; ce qui n'a pas été vérifié le dit",
  },
];

export default async function EnseignantsPage() {
  // Comptés dans la base, jamais rédigés — et tus tant qu'ils ne prouvent rien.
  const [preuves, config] = await Promise.all([
    preuvesDusage(),
    getPlatformConfig(),
  ]);
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <HaloDePage />

        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">
            Pour les enseignants
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Vos élèves apprennent à{" "}
            <span className="text-amber-400">décider</span>, pas à cliquer
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Un business game qui mesure une vraie décision, fait identifier le
            bon modèle d&apos;analyse avant de trancher, et rend compte au
            référentiel sans rien surpromettre. Des ateliers clés en main, une
            partie créée en trente secondes.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/orientation" className={bouton({ taille: "l" })}>
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
            <Link
              href="/manuel"
              className="text-amber-300 underline-offset-4 hover:underline"
            >
              Lire le manuel de l&apos;enseignant
            </Link>{" "}
            · sans compte : ce que mesure l&apos;indice IPG, les niveaux, les
            barèmes.
          </p>
        </section>

        {/* La coupure de la page : voir components/bande-de-chiffres.tsx. */}
        <BandeDeChiffres
          chiffres={HERO_STATS.map((s) => ({
            valeur: s.value,
            libelle: s.label,
            detail: s.detail,
          }))}
        />

        {/*
          MONTRER AVANT D'EXPLIQUER.
          Cette page expliquait l'outil en 1 294 mots et quatre mètres de
          défilement sans jamais le montrer : mesurée, elle ne portait aucune
          image. L'enseignant qui hésite ne cherche pas une explication de plus,
          il cherche à voir les trois écrans qu'il aura sous les yeux.
        */}
        <section
          aria-labelledby="ecrans"
          className="mx-auto max-w-5xl px-6 pb-16"
        >
          <h2
            id="ecrans"
            className="mb-8 text-center text-2xl font-bold text-slate-50"
          >
            Trois écrans, et c&apos;est tout
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ApercuArene />
            <ApercuProjection />
            <ApercuPilotage className="sm:col-span-2 lg:col-span-1" />
          </div>
        </section>

        {/*
          MÊME TRAITEMENT QUE « EN CLASSE » : un sommaire, pas une grille de
          cartes. Quatre arguments dans quatre cartes à emoji, c'était cinq cents
          pixels pour quatre phrases, et quatre pastilles bariolées de plus sur
          une page laiton. Les deux listes de cette page se lisent maintenant de
          la même façon — ce qui est aussi une façon de dire qu'elles sont de
          même nature.
        */}
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
            Pourquoi vos élèves apprennent vraiment
          </h2>
          <dl className="grid gap-x-10 gap-y-px sm:grid-cols-2">
            {PEDAGOGIE.map((p) => (
              <div key={p.title} className="border-t border-white/10 py-4">
                <dt className="text-sm font-semibold text-slate-100">
                  {p.title}
                </dt>
                <dd className="mt-1 text-base leading-relaxed text-slate-400">
                  {p.text}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/*
          LES ATELIERS ONT PORTÉ LA DEUXIÈME COUPURE DE CETTE PAGE, et l'ont
          rendue quand la page a raccourci. À quatre mille six cents pixels elle
          avait besoin de trois articulations ; à moins de quatre mille, la
          troisième se retrouvait à cinq cents pixels de la bande finale,
          c'est-à-dire dans la même fenêtre — et deux fonds retournés qui se
          rencontrent ne font pas deux blocs qui se voient, ils en font deux qui
          s'annulent. Ce n'est pas un goût qui a tranché, c'est une mesure
          (tests/e2e/contre-jour.e2e.ts).
        */}
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-50">
            Des ateliers clés en main, par diplôme
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-base text-slate-400">
            {ATELIERS.length} déroulés prêts à animer, {HEURES_TOTALES} heures
            de séance au total, chacun adossé à son référentiel et livré avec
            ses livrables et sa grille d&apos;évaluation.
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
                {/*
                  LE NOM DE L'ATELIER PASSE DEVANT SON RATTACHEMENT. La carte
                  s'ouvrait sur une pastille ambre portant le diplôme, et le
                  titre venait dessous : on lisait « BTS CG » avant de savoir
                  ce que l'atelier fait faire, et deux ateliers d'un même
                  diplôme se présentaient par la même étiquette. Depuis qu'un
                  atelier peut servir plusieurs formations, la pastille ne peut
                  plus tenir lieu de nom.
                */}
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-amber-200">
                  {a.titre}
                </h3>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    {publicDeLAtelier(a)}
                  </span>
                  <span className="text-xs text-slate-400">{a.format}</span>
                </div>
                <p className="mt-1 text-base leading-relaxed text-slate-400">
                  {a.resume}
                </p>
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
        </section>

        {/*
          QUATRE CARTES POUR QUATRE PHRASES.

          Chacune portait un emoji, un titre et une ligne dans une carte de cent
          cinquante pixels : un demi-mètre de défilement pour ce qui tient sur
          deux rangées. Le fait reste, la carte part — et l'emoji avec elle, que
          le dépôt a chassé partout ailleurs pour la même raison : le système le
          dessine à sa façon, et il jure au vidéoprojecteur.

          Ce qui les remplace ne se dessine pas : un filet, le fait en gras, sa
          précision à la suite. Le même sommaire que la page d'accueil.
        */}
        <section
          aria-labelledby="trois-temps"
          className="mx-auto max-w-6xl px-6 pb-16"
        >
          <h2
            id="trois-temps"
            className="text-center text-2xl font-bold text-slate-50"
          >
            Préparer, faire jouer, évaluer
          </h2>
          {/* La phrase que toute la grille sert : le produit ouvre des leviers,
              il ne décide pas à la place de qui enseigne. */}
          <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-slate-400">
            L&apos;enseignant reste maître de la progression pédagogique.
          </p>
          <div className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-3">
            {TROIS_TEMPS.map((t) => (
              <div key={t.temps} className="border-t border-white/10 pt-5">
                <h3 className="font-display text-xl font-semibold text-slate-100">
                  {t.temps}
                </h3>
                <p className="mt-1 text-base leading-relaxed text-slate-300">
                  {t.resume}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {t.faits.map((f) => (
                    <li
                      key={f}
                      className="flex gap-2.5 text-sm leading-relaxed text-slate-400"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/*
            Le déroulé d'une séance vivait ici, en quatre cartes numérotées —
            choisir, créer, faire jouer, débriefer. Il redisait ce que l'en-tête,
            les trois écrans et la rangée ci-dessus ont déjà dit, et il existe
            ailleurs, en plus long et mieux fait : le guide de prise en main. Une
            page de présentation renvoie, elle ne recopie pas.
          */}
          <p className="mt-6 text-center text-base text-slate-400">
            Le déroulé d&apos;une séance, de la création au débriefing, est dans
            le{" "}
            <Link
              href="/guide"
              className="text-amber-300 underline-offset-4 hover:underline"
            >
              guide de prise en main
            </Link>
            .
          </p>
        </section>

        {/*
          CE QU'ON A DÉJÀ SERVI. Les totaux disent ce que le produit a fait, et
          c'est la seule chose de cette page qu'un lecteur n'a pas à croire sur
          parole. Ils ne s'affichent qu'au-dessus d'un plancher : un compteur
          famélique prouverait l'inverse.
        */}
        <PreuvesDusageBande
          preuves={preuves}
          publiees={config.preuvesPubliees}
        />

        {/*
          LES QUATRE ENGAGEMENTS ONT DESCENDU D'UNE SECTION. Ils tenaient en
          pastilles vertes dans un bloc à eux — cent soixante pixels, et la seule
          couleur verte d'une page laiton. Une objection se lève au moment où
          l'on clique, pas deux écrans avant : ils sont maintenant sous les
          boutons, en une ligne.
        */}
        <BandeFinale
          titre="Prêt à faire jouer votre classe ?"
          texte="Commencez par le réglage qui vous convient, ou ouvrez directement votre espace."
          mentions={CONFIANCE}
        >
          <Link href="/orientation" className={bouton({ taille: "l" })}>
            Choisir ma simulation
          </Link>
          <Link
            href="/teacher/login"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
          >
            Ouvrir l&apos;espace enseignant
          </Link>
        </BandeFinale>
      </main>
      <PiedDePage />
    </>
  );
}
