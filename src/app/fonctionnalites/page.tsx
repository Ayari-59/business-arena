import Link from "next/link";
import { ALL_SITUATIONS, SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { ApercuArene } from "@/components/apercus";
import { PictoSecteur } from "@/components/picto-secteur";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { BandeDeChiffres } from "@/components/bande-de-chiffres";
import { PiedDePage } from "@/components/pied-de-page";
import { EnTeteDePage } from "@/components/en-tete-de-page";
import { Bande } from "@/components/bande";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { getPlatformConfig } from "@/services/admin.service";
import { RepliableSurTelephone } from "@/components/repliable-sur-telephone";

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

export default async function FonctionnalitesPage() {
  // Quelles bandes sont à contre-jour : le réglage de l'admin, ou l'état d'origine.
  const { theme } = await getPlatformConfig();
  const c = (id: string) => contrasteDeLaBande(theme, id);
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <Bande
          id="fonctionnalites.accroche"
          contraste={c("fonctionnalites.accroche")}
          interieur="pb-2"
        >
          <EnTeteDePage
            surtitre="Plateforme de simulation de gestion"
            titre={
              <>
                Tout ce qu&apos;il faut pour <span>apprendre à décider</span>
              </>
            }
            chapeau={
              <>
                Un moteur économique réaliste, des situations pédagogiques contextuelles, des
                modèles d&apos;analyse à mobiliser : Business Arena met la gestion d&apos;entreprise
                entre les mains de vos étudiants.
              </>
            }
          />
        </Bande>

        {/*
          LE TITRE D'ABORD, PUIS L'ÉCRAN.
          Quinze cartes de fonctionnalités et zéro image : on lisait une liste de
          promesses sans jamais voir l'outil. L'écran de l'élève vient donc sous
          l'accroche, avant la liste : un repère suffit, la galerie est sur
          « Pour les enseignants ». Il a ouvert la page, collé à l'en-tête, et le
          titre n'arrivait qu'à 600 px : une page s'ouvre sur ce qu'elle est.
        */}
        <Bande
          id="fonctionnalites.intro"
          contraste={c("fonctionnalites.intro")}
          interieur="mx-auto max-w-4xl px-6 pb-12 pt-10"
        >
          <div className="mx-auto max-w-sm">
            <ApercuArene />
          </div>
        </Bande>

        {/* La coupure de la page : voir components/bande-de-chiffres.tsx. */}
        <BandeDeChiffres
          id="fonctionnalites.chiffres"
          contraste={c("fonctionnalites.chiffres")}
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
        {/*
          LA PAGE NE MENAIT NULLE PART. Deux liens pour sept cent trente-cinq
          mots et trois mille pixels, et ces deux-là étaient les boutons de la
          bande finale : le corps de la page n'en portait aucun. Elle nommait
          ses secteurs, ses situations et ses modèles d'analyse sans qu'aucun
          ne soit cliquable, alors que les fiches existent.

          Les pictogrammes mènent maintenant à la fiche de leur métier, comme
          sur l'accueil — à ceci près que l'accueil, lui, met le renvoi à côté
          du titre : ici chaque métier a son ancre, donc chaque pictogramme
          peut viser la sienne.
        */}
        <Bande
          id="fonctionnalites.secteurs"
          contraste={c("fonctionnalites.secteurs")}
          interieur="mx-auto max-w-5xl px-6 pb-16"
        >
          <div className="mb-6 flex flex-wrap items-baseline justify-center gap-x-6 gap-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {SCENARIO_CHOICES.length} secteurs, {SCENARIO_CHOICES.length} économies réelles
            </h2>
            <Link
              href="/entreprises"
              className="text-sm font-medium text-slate-300 underline decoration-white/20 underline-offset-4 transition hover:text-amber-200 hover:decoration-amber-400/60"
            >
              Voir les fiches
            </Link>
          </div>
          <ul className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-9">
            {SCENARIO_CHOICES.map((s) => (
              <li key={s.code}>
                <Link
                  href={`/entreprises#${s.code}`}
                  className="group flex flex-col items-center gap-2 text-center"
                >
                  <PictoSecteur
                    secteur={s.sector}
                    className="h-7 w-7 text-amber-400/80 transition-colors group-hover:text-amber-300"
                  />
                  <span className="text-xs leading-tight text-slate-300 transition-colors group-hover:text-amber-200">
                    {s.shortName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Bande>

        {/*
          SIX ARGUMENTS, EN SOMMAIRE. Ils tenaient dans six cartes à emoji —
          cinq cent quatre-vingts pixels pour six phrases, et six pastilles
          bariolées sur une page laiton. Un filet, le fait en gras, sa précision
          à la suite : c'est la forme qu'ont prise les mêmes listes sur l'accueil
          et sur la page des enseignants.
        */}
        <Bande
          id="fonctionnalites.moteur"
          contraste={c("fonctionnalites.moteur")}
          interieur="mx-auto max-w-5xl px-6 pb-16"
        >
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-50">
            Ce qui rend la simulation possible
          </h2>
          <dl className="grid gap-x-10 gap-y-px sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div key={p.title} className="border-t border-white/10 py-4">
                <dt className="titre-carte text-slate-100">{p.title}</dt>
                <dd className="mt-1 text-base leading-relaxed text-slate-400">{p.text}</dd>
              </div>
            ))}
          </dl>
        </Bande>

        {/* Models list */}
        <Bande
          id="fonctionnalites.modeles"
          contraste={c("fonctionnalites.modeles")}
          interieur="mx-auto max-w-5xl px-6 pb-16"
        >
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-50">
            {DECISION_MODELS.length} modèles d&apos;analyse
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-base text-slate-400">
            Chaque situation mobilise un ou plusieurs de ces modèles. L&apos;étudiant
            doit identifier le bon cadre avant de trancher. Les notions qu&apos;ils
            emploient ont chacune{" "}
            <Link
              href="/notions"
              className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              leur fiche
            </Link>
            .
          </p>
          {/* Sur téléphone, vingt cartes empilées faisaient 2 500 px : la liste
              s'ouvre à la demande ; au-delà de `sm`, elle est affichée comme avant. */}
          <RepliableSurTelephone resume="Afficher les modèles d'analyse">
          <div className="mt-3 grid gap-2 sm:mt-0 sm:grid-cols-2 lg:grid-cols-3">
            {DECISION_MODELS.map((m) => (
              <div
                key={m.code}
                className="flex items-start gap-2 rounded-lg border border-white/5 bg-slate-950 px-3 py-2.5"
              >
                <span className="mt-0.5 text-xs text-slate-400">●</span>
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
          </RepliableSurTelephone>
        </Bande>

        {/*
          LES QUATRE MENTIONS DESCENDENT SOUS LES BOUTONS. Elles tenaient une
          section à elles, en cartes vertes — cent quatre-vingt-six pixels, et la
          seule couleur verte d'une page laiton. Une objection se lève au moment
          où l'on clique, pas un écran avant.
        */}
        <BandeFinale
          id="fonctionnalites.finale"
          contraste={c("fonctionnalites.finale")}
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
      <PiedDePage />
    </>
  );
}
