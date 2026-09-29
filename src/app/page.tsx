import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformConfig } from "@/services/admin.service";
import { etendueDesDecisions } from "@/config/decisions";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { PictoSecteur } from "@/components/picto-secteur";
import { LIENS_LEGAUX, NAVIGATION } from "@/config/navigation";
import { DESCRIPTION_ACCUEIL, TITRE_ACCUEIL } from "@/config/seo";
import { bouton } from "@/components/bouton";

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

/**
 * Les portes d'entrée du site, chacune vers la page qui porte le sujet.
 *
 * PLUS D'EMOJI. Chaque carte en portait un — 🧭 🏭 ⚙️ 🎓 🏫 🏆 — alors que le
 * dépôt les a chassés partout ailleurs pour la même raison : le système les
 * dessine à sa façon, ils sont différents d'un appareil à l'autre, en couleurs
 * étrangères à la maison, et brouillés au vidéoprojecteur. Six pastilles
 * bariolées en haut d'une page par ailleurs laiton et encre, c'était le seul
 * endroit du site qui jurait.
 *
 * Ce qui les remplace ne se dessine pas : un filet, un titre en serif, une
 * phrase. Un sommaire de revue, pas une grille d'icônes.
 */
const RENVOIS: {
  title: string;
  href: string;
  aide: string;
  accent?: boolean;
}[] = [
  {
    title: "Choisir ma simulation",
    href: "/orientation",
    aide: "Quatre questions, et le réglage qui convient à votre classe s'écrit à mesure, avec ses raisons.",
    accent: true,
  },
  {
    title: "Les entreprises",
    href: "/entreprises",
    aide: `${SCENARIO_CHOICES.length} secteurs, ${SCENARIO_CHOICES.length} économies réelles : leur marché, leurs contraintes, ce qu'on y apprend.`,
  },
  {
    title: "Fonctionnalités",
    href: "/fonctionnalites",
    aide: "Le moteur économique, les 18 modèles d'analyse, les indices progressifs, le piège du tour 4.",
  },
  {
    title: "Le parcours d'une classe",
    href: "/parcours",
    aide: "De la première décision au dernier bilan, avec les réglages conseillés par diplôme.",
  },
  {
    title: "Espace enseignant",
    href: "/teacher/login",
    aide: "Créez une partie multi-équipes, pilotez les tours, suivez la maîtrise de chaque notion.",
  },
  {
    title: "Business Arena Championship",
    href: "/compete",
    aide: "Groupes tirés au sort, décisions verrouillées, qualification à l'IPG, finale et podium.",
  },
];

/**
 * La page d'accueil porte le titre entier du site (pas de gabarit) : c'est
 * elle qu'un lien partagé ou un moteur de recherche présentent.
 */
export const metadata: Metadata = {
  title: { absolute: TITRE_ACCUEIL },
  description: DESCRIPTION_ACCUEIL,
  alternates: { canonical: "/" },
};

/**
 * UNE CAPTURE DE L'APPLICATION, ENCADRÉE.
 *
 * Trois écrans réels vivent sur cette page, et ils se posent de la même façon :
 * dimensions écrites (sans elles, la page saute au chargement), texte de
 * remplacement qui dit ce qu'on y voit, et une légende qui dit à quoi il sert.
 * Les deux captures du bas se chargent paresseusement — elles sont sous la
 * ligne de flottaison —, celle de l'en-tête non.
 */
function Capture({
  src,
  alt,
  legende,
  largeur = 800,
  hauteur = 800,
  immediate = false,
  className = "",
  classeCadre = "",
}: {
  src: string;
  alt: string;
  legende: string;
  largeur?: number;
  hauteur?: number;
  immediate?: boolean;
  className?: string;
  /** Pour borner le CADRE sans rétrécir la légende avec lui. */
  classeCadre?: string;
}) {
  return (
    <figure className={`m-0 ${className}`}>
      {/*
        LE BAS DE L'IMAGE S'ÉTEINT plutôt que de se couper net. Une capture est
        un morceau d'écran : coupée à la règle, elle a l'air d'un bug — le
        premier cadrage tranchait au milieu d'une ligne « Tour 2 ». Le dégradé
        dit que l'écran continue, et il emporte la bordure avec lui, sinon un
        trait flotterait sous du vide.
      */}
      <div
        className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/40 [mask-image:linear-gradient(to_bottom,#000_86%,transparent_100%)] ${classeCadre}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          width={largeur}
          height={hauteur}
          loading={immediate ? "eager" : "lazy"}
          decoding="async"
          alt={alt}
          className="block w-full"
        />
      </div>
      <figcaption className="mt-3 text-center text-sm leading-relaxed text-slate-400">
        {legende}
      </figcaption>
    </figure>
  );
}

/**
 * UN TEMPS DU TOUR : son numéro, son titre, sa phrase, et l'écran qui va avec.
 *
 * L'alternance gauche/droite n'est pas un effet : elle dit qu'il y a une
 * SUITE. Deux images côte à côte sous un même titre ne disaient pas dans quel
 * ordre les regarder.
 */
function Temps({
  numero,
  titre,
  texte,
  inverse = false,
  children,
}: {
  numero: string;
  titre: string;
  texte: string;
  /** Deuxième temps : l'écran passe à gauche, le texte à droite. */
  inverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
      <div className={inverse ? "sm:order-2" : undefined}>
        <p className="font-display text-sm tracking-[0.3em] text-amber-400/70">{numero}</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-slate-50">{titre}</h3>
        <p className="mt-3 text-base leading-relaxed text-slate-300">{texte}</p>
      </div>
      <div className={inverse ? "sm:order-1" : undefined}>{children}</div>
    </div>
  );
}

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
      {/*
        LE HAUT DE PAGE TENAIT SUR UN CENTRAGE VERTICAL, et c'est ce qui le
        faisait flotter : la colonne de texte, plus courte que la capture,
        descendait au milieu, laissant deux cents pixels de nuit au-dessus du
        titre. Les deux colonnes partent maintenant de la même ligne.

        UNE SEULE ACTION. Trois boutons de même taille se disputaient l'œil, et
        deux d'entre eux se coupaient en deux lignes. « Commencer une partie »
        reste un bouton ; « Je suis enseignant » redevient ce qu'il est, un
        lien ; et « voir les entreprises » descend dans la bande qui les
        montre, juste dessous — un bouton qui promet des métiers vaut moins que
        les métiers eux-mêmes.
      */}
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-6 pb-12 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20">
        {/* La colonne est un conteneur de requête : le titre se dimensionne à SA
            largeur (unités cqw), pas à celle de l'écran. Il tient donc sur une
            seule ligne aussi bien en pleine largeur (mobile) qu'en demi-colonne
            (desktop), sans jamais déborder. */}
        <div style={{ containerType: "inline-size" }}>
          {/*
            LE SURTITRE DISAIT QUATRE MOTS-CLÉS — « Simulation · Apprentissage ·
            Décision · Compétition » — qui pouvaient coiffer n'importe quel
            produit. Il dit maintenant ce qu'est la chose et pour qui elle est.
            Le filet qui le précède est la seule décoration de la page : il
            reparaît en tête de chaque section.
          */}
          <p className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-amber-400/90">
            <span aria-hidden className="h-px w-8 bg-amber-400/40" />
            Simulation de gestion, pour la classe
          </p>
          {/* whitespace-nowrap + taille fluide en cqw : chaque phrase sur une
              ligne, quel que soit le support ; le <br/> sépare les deux lignes. */}
          <h1 className="mt-5 whitespace-nowrap text-[clamp(1rem,7cqw,3.25rem)] font-bold leading-[1.05] tracking-tight text-slate-50">
            Dirigez une entreprise.
            <br />
            <span className="text-amber-400">Apprenez à décider.</span>
          </h1>
          {/*
            L'accroche faisait quatre lignes et énumérait tout : les secteurs,
            les décisions, les modèles. On garde ce qui se retient — le nombre
            de métiers, le fait que le marché répond, la durée d'une partie — et
            le reste est montré plus bas plutôt que promis ici.
          */}
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
            {SCENARIO_CHOICES.length} métiers, un marché qui répond, six tours pour
            comprendre. Vous fixez les prix, la production et les budgets ; les
            résultats disent ce que ces choix valaient.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/jouer" className={bouton({ taille: "l" })}>
              Commencer une partie
            </Link>
            <Link
              href="/teacher/login"
              className="text-sm font-semibold text-slate-200 underline decoration-amber-400/50 decoration-2 underline-offset-[6px] transition hover:text-amber-200 hover:decoration-amber-400"
            >
              Je suis enseignant
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-400">
            Sans compte, sans installation. Vos parties restent liées à ce navigateur.
          </p>
        </div>

        {/*
          UNE CAPTURE DE L'APPLICATION, ET NON UN ÉCRAN DESSINÉ.

          Cette colonne a porté trois choses successives. D'abord un cockpit
          dessiné à la main, avec des chiffres inventés — « chiffre d'affaires
          346 920 € » — : il promettait une simulation sans en faire tourner
          une. Puis un tour jouable, qui tenait la promesse mais faisait de
          l'accueil un mini-jeu. Maintenant l'écran réel.

          ELLE EST PRISE SUR L'APPLICATION, pas redessinée : la partie a été
          jouée, les chiffres sont ceux que le moteur a calculés. C'est la seule
          façon qu'une capture ne mente pas — et la raison pour laquelle on ne
          retouche pas les montants pour les rendre flatteurs.

          Le format sert aussi à dire quelque chose : c'est un téléphone, parce
          que c'est là que l'élève joue.
        */}
        <Capture
          src="/apercus/arene.webp"
          hauteur={1400}
          immediate
          classeCadre="mx-auto max-w-[320px]"
          alt="L'arène d'une équipe au quatrième tour : chiffre d'affaires 399 919 €, résultat 58 188 €, trésorerie 89 653 €, et le tour en cours à jouer."
          legende="L'arène d'une équipe, sur le téléphone d'un élève."
        />
      </section>

      {/* ---------- Les métiers, montrés ---------- */}
      {/*
        LE PRODUIT ANNONCE SES SECTEURS DEPUIS LE HAUT DE LA PAGE, et ne les
        montrait nulle part : il fallait cliquer pour savoir de quoi on parle.
        Les voici, avec les pictogrammes que l'arène emploie déjà — dessinés
        d'un seul trait, donc lisibles au timbre-poste comme au mur.
      */}
      <section className="border-y border-white/5 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
              <span aria-hidden className="h-px w-8 bg-amber-400/40" />
              {SCENARIO_CHOICES.length} métiers, {SCENARIO_CHOICES.length} économies
            </h2>
            <Link
              href="/entreprises"
              className="text-sm font-medium text-slate-300 underline decoration-white/20 underline-offset-4 transition hover:text-amber-200 hover:decoration-amber-400/60"
            >
              Voir les entreprises
            </Link>
          </div>
          <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5 lg:grid-cols-9">
            {SCENARIO_CHOICES.map((s) => (
              <li key={s.code} className="flex flex-col items-center gap-2 text-center">
                <PictoSecteur secteur={s.sector} className="h-7 w-7 text-amber-400/80" />
                <span className="text-xs leading-tight text-slate-300">{s.shortName}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Les chiffres de la maison ---------- */}
      {/*
        QUATRE NOMBRES EN AMBRE, TOUS DE LA MÊME TAILLE : on ne savait pas
        lequel comptait, et rien ne les séparait. Le nombre passe au serif — la
        voix des titres de la maison —, son libellé le précède en capitales
        fines, et un filet sépare les colonnes. L'ambre ne sert plus qu'à ce
        qu'on doit retenir.
      */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
          {[
            ["par tour, selon le niveau", `${decisions.minimum} à ${decisions.maximum}`, "décisions"],
            ["du CA au FRNG et au BFR", `${CONCEPTS.length}`, "fiches notions"],
            ["d'aide à la décision", `${DECISION_MODELS.length}`, "modèles"],
            ["de performance, l'indice IPG", "6", "dimensions"],
          ].map(([libelle, nombre, quoi]) => (
            <div key={quoi} className="px-4 sm:border-l sm:border-white/10 sm:first:border-l-0 sm:first:pl-0">
              <dt className="text-xs uppercase tracking-[0.18em] text-slate-400">{libelle}</dt>
              <dd className="mt-2">
                <span className="font-display text-3xl font-semibold text-amber-400">{nombre}</span>{" "}
                <span className="text-base text-slate-200">{quoi}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Un tour, en deux temps ---------- */}
      {/*
        L'EN-TÊTE MONTRE L'ARÈNE ; ICI, CE QU'ON Y FAIT. Un tour se joue en deux
        temps — on engage des décisions, puis on lit ce qu'elles ont produit —
        et c'est cette boucle que la page doit faire comprendre sans
        l'expliquer. Les deux captures viennent de LA MÊME partie que celle de
        l'en-tête : les 58 188 € du verdict sont le résultat du tour qu'on voit
        se décider juste avant.

        DEUX TEMPS NUMÉROTÉS, EN ALTERNANCE, plutôt que deux images côte à côte
        sous un titre : la séquence se lit, là où la paire ne disait pas dans
        quel ordre regarder.
      */}
      <section className="border-y border-white/5 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <h2 className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
            <span aria-hidden className="h-px w-8 bg-amber-400/40" />
            Un tour, en deux temps
          </h2>
          <p className="mt-4 max-w-2xl font-display text-3xl leading-tight text-slate-50">
            Décider, puis comprendre.
          </p>
          <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-16">
            <Temps
              numero="01"
              titre="On engage"
              texte="Un prix, un volume, des budgets, un fournisseur. L'atelier a une capacité : le volume réel s'y heurte, et c'est là que la décision commence."
            >
              <Capture
                src="/apercus/decider.webp"
                alt="L'écran de décision : prix de vente 74 € par enceinte, plan de production 4 500 enceintes, capacité machine 7 000 et main-d'œuvre 7 200 par tour, goulot équilibré, puis le choix du fournisseur."
                legende="L'écran de décision, tel que l'équipe le remplit."
              />
            </Temps>
            <Temps
              numero="02"
              titre="On comprend"
              inverse
              texte="À la clôture, le verdict ne donne pas seulement le résultat : il dit ce qui l'a fait, de combien il bouge, et ce que l'équipe a réussi en chemin."
            >
              <Capture
                src="/apercus/resultats.webp"
                alt="Le verdict du tour 3 : 58 188 € de bénéfice, 39 241 € de plus qu'au tour précédent, 1re sur 3 équipes, et deux réussites obtenues."
                legende="Le verdict du tour, sur la même partie."
              />
            </Temps>
          </div>
        </div>
      </section>

      {/* ---------- Explorer : renvois vers les pages dédiées ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <h2 className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
          <span aria-hidden className="h-px w-8 bg-amber-400/40" />
          Par où commencer
        </h2>
        <p className="mt-4 max-w-2xl font-display text-3xl leading-tight text-slate-50">
          Chaque page va droit au but.
        </p>
        {/*
          UN SOMMAIRE, PAS UNE GRILLE D'ICÔNES. Les cartes portaient un emoji en
          tête ; elles portent maintenant un filet qui s'allume au survol, un
          titre en serif et sa phrase. La première — celle qui aide à choisir —
          garde son filet laiton allumé : c'est la seule qu'on recommande.
        */}
        <div className="mt-8 grid gap-x-8 gap-y-px sm:grid-cols-2 lg:grid-cols-3">
          {RENVOIS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className={`group block border-t py-5 transition-colors ${
                r.accent
                  ? "border-amber-400/60"
                  : "border-white/10 hover:border-amber-400/40"
              }`}
            >
              <h3 className="flex items-baseline gap-2 font-display text-lg font-semibold text-slate-100 transition-colors group-hover:text-amber-200">
                {r.title}
                <span aria-hidden className="text-sm transition-transform group-hover:translate-x-1">
                  →
                </span>
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-400">{r.aide}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-slate-400">
          <p>
            BUSINESS <span className="accent-arena">ARENA</span> · simulation
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
