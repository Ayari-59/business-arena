import Link from "next/link";
import { ALL_SITUATIONS, SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { ApercuArene } from "@/components/apercus";
import { PictoSecteur } from "@/components/picto-secteur";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { BandeDeChiffres } from "@/components/bande-de-chiffres";
import { HaloDePage } from "@/components/halo-de-page";

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

/**
 * Les six arguments se lisent en sommaire : un filet, le titre, sa phrase. Ils
 * ont porté un emoji chacun — ⚙️ 🎯 📊 💡 🏫 🏆 — que le dépôt a chassé partout
 * ailleurs pour la même raison : le système les dessine à sa façon, ils
 * changent d'un appareil à l'autre et se brouillent au vidéoprojecteur.
 */
const PILLARS = [
  {
    title: "Moteur économique déterministe",
    text: "Demande par segments, élasticité-prix, capacité, stocks, FRNG, BFR, trésorerie : chaque chiffre est calculé, aucun n'est inventé, et le moteur est tenu par sa suite de tests.",
  },
  {
    title: "Apprentissage par la situation",
    text: "Chaque tour déclenche une situation tirée du contexte de l'entreprise : l'étudiant identifie le modèle pertinent avant de décider, et le débriefing relie le résultat au raisonnement.",
  },
  {
    title: "Tableau de bord en temps réel",
    text: "Tendances, évolution du CA, du résultat et de la trésorerie, parts de marché par segment, classement IPG. Trois onglets : Synthèse, Marché, Finance.",
  },
  {
    title: "Indices progressifs",
    text: "Cinq niveaux d'aide, d'une observation à une méthode. Chaque indice coûte des points : l'autonomie est récompensée, le blocage n'existe pas.",
  },
  {
    title: "Conçu pour la classe",
    text: "Une partie en 30 secondes, les équipes rejoignent par code, vous clôturez les tours. La vue pédagogique montre qui maîtrise chaque notion et qui bluffe.",
  },
  {
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
      <HaloDePage />

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

      {/* La coupure de la page : voir components/bande-de-chiffres.tsx. */}
      <BandeDeChiffres
        chiffres={HERO_STATS.map((s) => ({
          valeur: s.value,
          libelle: s.label,
          detail: s.detail,
        }))}
      />

      {/*
        LES SECTEURS, EN UNE RANGÉE PLUTÔT QU'EN AUTANT DE CARTES.

        Trois rangées de trois cartes, chacune avec son emoji, son nom et son
        libellé de secteur : trois cent quarante pixels pour dire « les voici,
        tous ». La page d'accueil dit la même chose en une seule rangée de
        pictogrammes, dessinés d'un seul trait et lisibles au timbre-poste
        comme au mur ; c'est le même geste, et il tient dans un tiers de la
        place. Les emoji partent avec les cartes.
      */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
          {SCENARIO_CHOICES.length} secteurs, {SCENARIO_CHOICES.length} économies réelles
        </h2>
        <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-9">
          {SCENARIO_CHOICES.map((s) => (
            <li key={s.code} className="flex flex-col items-center gap-2 text-center">
              <PictoSecteur secteur={s.sector} className="h-7 w-7 text-amber-400/80" />
              <span className="text-xs leading-tight text-slate-300">{s.shortName}</span>
            </li>
          ))}
        </ul>
      </section>

      {/*
        SIX ARGUMENTS, EN SOMMAIRE. Ils tenaient dans six cartes à emoji —
        cinq cent quatre-vingts pixels pour six phrases, et six pastilles
        bariolées sur une page laiton. Un filet, le fait en gras, sa précision
        à la suite : c'est la forme qu'ont prise les mêmes listes sur l'accueil
        et sur la page des enseignants.
      */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
          Ce qui rend la simulation possible
        </h2>
        <dl className="grid gap-x-10 gap-y-px sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="border-t border-white/10 py-4">
              <dt className="text-sm font-semibold text-slate-100">{p.title}</dt>
              <dd className="mt-1 text-base leading-relaxed text-slate-400">{p.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Models list */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-50">
          {DECISION_MODELS.length} modèles d&apos;analyse
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-base text-slate-400">
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
                {/* La description d'un modèle est une phrase, pas une
                    étiquette : elle se lit en 14 px comme le reste de la prose
                    de second plan. Le secteur au-dessus, lui, est une
                    étiquette, et reste en 12. */}
                <p className="text-sm leading-relaxed text-slate-400">{m.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/*
        LES QUATRE MENTIONS DESCENDENT SOUS LES BOUTONS. Elles tenaient une
        section à elles, en cartes vertes — cent quatre-vingt-six pixels, et la
        seule couleur verte d'une page laiton. Une objection se lève au moment
        où l'on clique, pas un écran avant.
      */}
      <BandeFinale
        titre="Prêt à tester ?"
        texte="Lancez une partie en 30 secondes, sans compte ni installation."
        mentions={DIFFERENTIATORS}
      >
        <Link href="/jouer" className={bouton({ taille: "l" })}>
          Tester le simulateur
        </Link>
        <Link
          href="/entreprises"
          className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/50"
        >
          Voir les entreprises
        </Link>
      </BandeFinale>
    </main>
  );
}
