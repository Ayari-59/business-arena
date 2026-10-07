import type { Metadata } from "next";
import Link from "next/link";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { COMPETENCES } from "@/config/episodes/competences";
import { EPISODES } from "@/pedagogy/episodes/registre";
import { bouton } from "@/components/bouton";
import { Bande } from "@/components/bande";
import { BandeDeChiffres } from "@/components/bande-de-chiffres";
import { BandeFinale } from "@/components/bande-finale";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { getPlatformConfig } from "@/services/admin.service";

export const metadata: Metadata = {
  alternates: { canonical: "/ecoles" },
  title: "Écoles de commerce et universités",
  description:
    "Une partie d'entreprise en équipes pour le bachelor, des épisodes manager pour le master et la formation continue, et dix compétences mesurées à verser au dossier d'accréditation.",
};

/**
 * LES ÉCOLES DE COMMERCE ET LES UNIVERSITÉS.
 *
 * La page tient ensemble les deux produits : l'arène, pour qui apprend la
 * gestion d'une entreprise, et les épisodes, pour qui apprend à manager. Une
 * école a les deux publics — le bachelor, puis le master et la formation
 * continue — et c'est ce qui fait d'elle le pont vers les entreprises.
 *
 * Rien n'y est promis qui ne soit dans le produit ; ce qui ne l'est pas encore
 * (l'anglais, la connexion à une plateforme de cours) est dit comme tel.
 */

const FORMATS = [
  {
    public: "Bachelor",
    nom: "L'arène",
    resume: "Des équipes dirigent une entreprise, tour après tour.",
    faits: [
      "Prix, production, recrutement, financement : chaque équipe décide, le marché tranche.",
      `${SCENARIO_CHOICES.length} entreprises jouables, de l'industrie au conseil, chacune avec son économie.`,
      "L'enseignant ouvre et clôt les tours, projette le classement et voit qui maîtrise chaque notion.",
      "D'une séance de deux heures à un semestre.",
    ],
    lien: { href: "/fonctionnalites", libelle: "Voir l'arène" },
  },
  {
    public: "Master et formation continue",
    nom: "Les épisodes manager",
    resume: "Chacun tient un poste de manager pendant un trimestre.",
    faits: [
      "Six décisions, des imprévus, une vingtaine de minutes, trois niveaux de difficulté.",
      "Le bilan rejoue chaque choix sous trente tirages du même hasard : ce qui relevait du choix, ce qui relevait de la chance.",
      "Un profil décisionnel qui se construit d'épisode en épisode, et recommande les suivants.",
      "En autonomie, ou en cohorte avec des débriefs collectifs.",
    ],
    lien: { href: "/entreprises/episode", libelle: "Jouer un épisode" },
  },
];

const PREUVES = [
  {
    titre: "Chaque décision est rattachée à ses compétences",
    texte:
      "Une décision d'épisode mobilise une ou deux des dix compétences ; c'est elle, et non un questionnaire, qui nourrit le score.",
  },
  {
    titre: "Un score n'est donné qu'avec sa marge",
    texte:
      "Chaque compétence porte un intervalle : on voit ce qui est établi, et ce qui ne l'est pas encore faute de décisions.",
  },
  {
    titre: "La progression se mesure, elle ne se déclare pas",
    texte:
      "Un épisode d'entrée et un épisode de contrôle, joués au même niveau, encadrent le parcours : l'écart est la mesure.",
  },
  {
    titre: "La promotion se lit en agrégats",
    texte:
      "La vue de la cohorte montre la répartition des choix et des compétences, à partir de cinq participants, sans exposer un profil.",
  },
];

/** Un parcours en cohorte, tel que le guide d'animation le déroule. */
const PARCOURS = [
  {
    quand: "Semaine 1",
    quoi: "Le lancement",
    texte:
      "Une heure et demie : chacun rejoint la cohorte par un code, et joue l'épisode d'entrée.",
  },
  {
    quand: "Semaines 2 à 7",
    quoi: "Un épisode par semaine",
    texte:
      "En autonomie, choisi d'après son propre bilan. Vingt minutes, sur ordinateur ou téléphone.",
  },
  {
    quand: "Toutes les deux semaines",
    quoi: "Un débrief d'une heure",
    texte:
      "Tout le groupe a joué le même trimestre sous le même hasard : on discute des deux décisions qui l'ont le plus partagé.",
  },
  {
    quand: "Semaine 8",
    quoi: "Le contrôle et la clôture",
    texte:
      "L'épisode de contrôle, puis chacun lit son profil et choisit une compétence à travailler.",
  },
];

const QUESTIONS = [
  {
    q: "Les épisodes existent-ils en anglais ?",
    r: "Pas encore. Ils sont écrits en français ; une version anglaise est à l'étude pour les programmes internationaux.",
  },
  {
    q: "Peut-on les relier à Moodle ou à Blackboard ?",
    r: "Pas encore : les participants rejoignent par un code, sans compte. La connexion à une plateforme de cours est à l'étude ; le relevé de notes de l'arène s'exporte déjà.",
  },
  {
    q: "Quelles données sont collectées ?",
    r: "Aucun compte étudiant, aucune adresse : un code de cohorte et un pseudonyme. Les données sont hébergées dans l'Union européenne.",
  },
  {
    q: "Combien de temps pour l'enseignant ?",
    r: "Une partie ou une cohorte se crée en quelques minutes ; chaque épisode a son guide de débrief, avec la décision qui fait débattre.",
  },
];

export default async function EcolesPage() {
  // Quelles bandes sont à contre-jour : le réglage de l'admin, ou l'état d'origine.
  const { theme } = await getPlatformConfig();
  const c = (id: string) => contrasteDeLaBande(theme, id);
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <HaloDePage />

        <Bande
          id="ecoles.accroche"
          contraste={c("ecoles.accroche")}
          interieur="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center"
        >
          <p className="text-xs uppercase tracking-annonce text-amber-400">
            Écoles de commerce et universités
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Former des managers qui <span className="text-amber-400">décident</span>, et le prouver
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Une partie d&apos;entreprise en équipes pour le bachelor, des épisodes manager pour le
            master et la formation continue. Chaque décision est rejouée sous trente tirages du
            hasard, et chaque étudiant repart avec un profil de dix compétences, preuves à
            l&apos;appui.
          </p>
          <div
            data-cta-principal
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link href="/rendez-vous" className={bouton({ taille: "l" })}>
              Organiser un essai avec une promotion
            </Link>
            <Link
              href="/entreprises/episode"
              className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
            >
              Jouer un épisode
            </Link>
          </div>
        </Bande>

        <BandeDeChiffres
          id="ecoles.chiffres"
          contraste={c("ecoles.chiffres")}
          chiffres={[
            {
              valeur: `${EPISODES.length}`,
              libelle: "épisodes manager",
              detail: "Vendre, piloter les chiffres, manager une équipe, conduire le changement…",
            },
            {
              valeur: `${COMPETENCES.length}`,
              libelle: "compétences mesurées",
              detail: "De « S'informer avant d'agir » à « Piloter par les faits, et les dire »",
            },
            {
              valeur: `${SCENARIO_CHOICES.length}`,
              libelle: "entreprises jouables",
              detail: "Pour la partie en équipes : industrie, commerce, hôtellerie, conseil…",
            },
          ]}
        />

        <Bande
          id="ecoles.formats"
          contraste={c("ecoles.formats")}
          interieur="mx-auto max-w-6xl px-6 py-16"
          labelledby="formats"
        >
          <h2 id="formats" className="text-center text-2xl font-bold text-slate-50">
            Deux formats, un même cursus
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-slate-400">
            On apprend d&apos;abord à faire tourner une entreprise, puis à y tenir un poste.
          </p>
          <div className="mt-10 grid gap-x-12 gap-y-12 md:grid-cols-2">
            {FORMATS.map((f) => (
              <div key={f.nom} className="border-t border-white/10 pt-5">
                <p className="text-xs uppercase tracking-surtitre text-amber-300">{f.public}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-slate-100">{f.nom}</h3>
                <p className="mt-1 text-base leading-relaxed text-slate-300">{f.resume}</p>
                <ul className="mt-4 space-y-2">
                  {f.faits.map((x) => (
                    <li
                      key={x}
                      className="relative pl-4 text-base leading-relaxed text-slate-400 before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-amber-400/70"
                    >
                      {x}
                    </li>
                  ))}
                </ul>
                <Link
                  href={f.lien.href}
                  className="mt-5 inline-block text-sm font-semibold text-amber-300 underline-offset-4 hover:underline"
                >
                  {f.lien.libelle} →
                </Link>
              </div>
            ))}
          </div>
        </Bande>

        <Bande
          id="ecoles.accreditation"
          contraste={c("ecoles.accreditation")}
          interieur="mx-auto max-w-6xl px-6 py-16"
          labelledby="accreditation"
        >
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-xs uppercase tracking-surtitre text-amber-300">
                AACSB, EQUIS, Qualiopi
              </p>
              <h2
                id="accreditation"
                className="mt-2 font-display text-3xl font-semibold leading-tight text-slate-50"
              >
                Ce que vous pourrez montrer à un jury d&apos;accréditation
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Les accréditations demandent la preuve que les étudiants acquièrent les compétences
                visées par le programme. Les épisodes la produisent à chaque partie, sans
                questionnaire de plus.
              </p>
              <dl className="mt-6">
                {PREUVES.map((p) => (
                  <div key={p.titre} className="border-t border-white/10 py-4">
                    <dt className="text-sm font-semibold text-slate-100">{p.titre}</dt>
                    <dd className="mt-1 text-base leading-relaxed text-slate-400">{p.texte}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="carte self-start p-6">
              <p className="text-xs uppercase tracking-etiquette text-slate-400">
                Les dix compétences du profil décisionnel
              </p>
              <ol className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {COMPETENCES.map((c, i) => (
                  <li key={c.code} className="flex gap-3 text-base leading-snug text-slate-200">
                    <span className="w-5 shrink-0 text-right tabular-nums text-amber-300">
                      {i + 1}
                    </span>
                    {c.nom}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Bande>

        <Bande
          id="ecoles.parcours"
          contraste={c("ecoles.parcours")}
          interieur="mx-auto max-w-6xl px-6"
          labelledby="parcours"
        >
          <h2 id="parcours" className="text-center text-2xl font-bold text-slate-50">
            Un parcours de huit semaines, en cohorte
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-slate-400">
            Pour un module de master ou un programme de formation continue : environ huit heures et
            demie par participant, dont trois en autonomie.
          </p>
          <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {PARCOURS.map((e) => (
              <li key={e.quand} className="border-t border-white/15 pt-4">
                <p className="text-xs uppercase tracking-etiquette text-amber-300">{e.quand}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-100">{e.quoi}</h3>
                <p className="mt-1 text-base leading-relaxed text-slate-400">{e.texte}</p>
              </li>
            ))}
          </ol>
        </Bande>

        <Bande
          id="ecoles.questions"
          contraste={c("ecoles.questions")}
          interieur="mx-auto max-w-5xl px-6 py-16"
          labelledby="questions"
        >
          <h2 id="questions" className="mb-8 text-center text-2xl font-bold text-slate-50">
            Les questions qu&apos;on nous pose
          </h2>
          <dl className="grid gap-x-10 gap-y-px sm:grid-cols-2">
            {QUESTIONS.map((x) => (
              <div key={x.q} className="border-t border-white/10 py-4">
                <dt className="text-sm font-semibold text-slate-100">{x.q}</dt>
                <dd className="mt-1 text-base leading-relaxed text-slate-400">{x.r}</dd>
              </div>
            ))}
          </dl>
        </Bande>

        <BandeFinale
          id="ecoles.finale"
          contraste={c("ecoles.finale")}
          titre="Essayez avec une promotion"
          texte="Un essai se monte en une semaine : une cohorte, un épisode d'entrée, un débrief. On regarde ensuite avec vous ce que vous montreriez à un jury."
          mentions={[
            {
              label: "Sans compte étudiant",
              desc: "Un code de cohorte et un pseudonyme suffisent",
            },
            { label: "Hébergé dans l'UE", desc: "Base de données à Francfort" },
            { label: "En français", desc: "Une version anglaise est à l'étude" },
          ]}
        >
          <Link href="/rendez-vous" className={bouton({ taille: "l" })}>
            Prendre rendez-vous
          </Link>
          <Link
            href="/entreprises/episode"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
          >
            Jouer un épisode
          </Link>
        </BandeFinale>
      </main>
      <PiedDePage />
    </>
  );
}
