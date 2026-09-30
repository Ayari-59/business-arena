import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformConfig } from "@/services/admin.service";
import { etendueDesDecisions } from "@/config/decisions";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { PictoSecteur } from "@/components/picto-secteur";
import { DESCRIPTION_ACCUEIL, TITRE_ACCUEIL } from "@/config/seo";
import { bouton } from "@/components/bouton";
import { TEMPS_DU_TOUR } from "@/config/temps-du-tour";
import { DonneesStructurees } from "@/components/donnees-structurees";
import { HaloDePage } from "@/components/halo-de-page";
import { QuiFaitQuoi } from "@/components/qui-fait-quoi";
import { BPI_V2_DIMENSIONS } from "@/scoring/bpi";
import { PiedDePage } from "@/components/pied-de-page";

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
    // Écrit à la main, ce nombre disait 18 quand la bande de chiffres de la même
    // page en affichait 20, lus dans le registre. Deux chiffres pour une seule
    // chose, à huit cents pixels d'écart.
    aide: `Le moteur économique, les ${DECISION_MODELS.length} modèles d'analyse, les indices progressifs, le piège du tour 4.`,
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
 * LE FORMAT DES TROIS CAPTURES — 800 × 1120, la forme d'une carte à jouer.
 *
 * Les trois écrans sont recadrés à la même taille, et c'est ce qui permet de
 * les poser en main de cartes : trois images de hauteurs différentes ne
 * forment pas un éventail, elles forment un escalier. Les dimensions sont
 * écrites dans la page, sous forme de rapport — sans elles, la place n'est pas
 * réservée et le texte saute quand les fichiers arrivent. Les six fichiers
 * (trois écrans × deux thèmes) ont ce format.
 */
const CARTE = { largeur: 800, hauteur: 1120 };

/**
 * UNE CARTE DE LA MAIN : la capture, posée et tournée.
 *
 * ELLE EXISTE EN DEUX EXEMPLAIRES, ET C'EST LA PAGE QUI CHOISIT. Une capture
 * sombre sur une page sombre est un rectangle d'encre dans de l'encre ; sur la
 * page claire qu'on sert maintenant, la même image est devenue un ÉCRAN, un
 * objet qui s'allume au milieu du papier. On a donc pris les trois écrans une
 * seconde fois, dans l'autre thème, sur la même partie et au même cadrage : la
 * page sombre montre les captures claires, et l'effet se retourne.
 *
 * Le fichier n'est pas une balise `img` mais un FOND (voir `.capture-decran`
 * dans globals.css) : c'est ce qui permet d'en avoir deux sans les charger
 * tous les deux. Le cadre annonce donc lui-même ce qu'il montre — `role="img"`
 * et son texte — puisqu'un fond n'a pas de texte de remplacement. Et sa forme
 * vient du rapport des deux dimensions, non d'une image qu'on attendrait :
 * la place est réservée avant que le fichier arrive.
 *
 * PAS DE DÉGRADÉ EN BAS, contrairement au cadrage qu'ont longtemps porté ces
 * captures : une carte a un bord franc, et un bas qui s'éteint laisserait voir
 * la carte de derrière à travers celle de devant.
 *
 * Les deux cartes du fond sont assourdies (bordure plus pâle, opacité) : c'est
 * ce qui fait une profondeur, sans quoi trois images de même contraste se
 * disputent l'œil.
 */
function CarteEnMain({
  nom,
  alt,
  pose,
  fond = false,
}: {
  /** Le nom de l'écran : `x.webp` est sa prise sombre, `x-clair.webp` sa claire. */
  nom: string;
  alt: string;
  /** Position et angle dans le cadre de la main. */
  pose: string;
  fond?: boolean;
}) {
  return (
    <div
      className={`absolute w-[52%] overflow-hidden rounded-2xl border bg-slate-900 shadow-2xl ${pose} ${
        fond
          ? "border-white/5 opacity-60 shadow-slate-950/60"
          : "border-white/15 shadow-slate-950/70"
      }`}
    >
      <div
        role="img"
        aria-label={alt}
        className="capture-decran w-full"
        style={
          {
            aspectRatio: `${CARTE.largeur} / ${CARTE.hauteur}`,
            "--ecran-sur-page-claire": `url(/apercus/${nom}.webp)`,
            "--ecran-sur-page-sombre": `url(/apercus/${nom}-clair.webp)`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/**
 * LES TROIS ÉCRANS, TENUS COMME UNE MAIN DE CARTES.
 *
 * L'en-tête ne montrait qu'un écran, et très haut : une colonne d'image de
 * 560 pixels contre un bloc de texte de 380, le déséquilibre se voyait. Les
 * trois captures, désormais au même format, se posent en éventail — et la
 * hauteur de l'éventail se règle enfin sur le texte d'à côté.
 *
 * LE CADRE PORTE UN RAPPORT DE FORME (9/8) plutôt qu'une hauteur d'image : la
 * main occupe donc une hauteur connue d'avance, celle qu'on lui donne, et non
 * celle que voudrait la plus haute des trois images.
 *
 * L'ÉVENTAIL EST FIXE, PAS TIRÉ AU SORT. Un ordre aléatoire aurait deux
 * défauts, l'un technique et l'autre de fond : le serveur et le navigateur
 * tireraient deux mains différentes, et la page se repeindrait sous l'œil du
 * visiteur ; et le produit changerait de visage d'une visite à l'autre. La
 * main choisie dit d'ailleurs quelque chose — devant, l'écran où l'élève
 * passe son temps ; derrière, les deux moments d'un tour, dans l'ordre où on
 * les joue : on décide, puis on lit le verdict.
 *
 * LES TROIS CARTES SONT DÉCRITES. Elles ne l'étaient pas toutes : les deux du
 * fond portaient un texte de remplacement vide, parce qu'une section plus bas
 * montrait les mêmes écrans en grand avec leur description, et les faire lire
 * deux fois n'apprenait rien. Cette section n'existe plus. Qui ne voit pas la
 * page n'a donc plus que ces trois phrases pour savoir ce que montre
 * l'application : elles disent les chiffres qu'on y lit, pas « capture
 * d'écran ».
 */
function MainDeCartes() {
  return (
    <figure className="m-0">
      <div className="relative mx-auto aspect-[9/8] w-full max-w-[440px]">
        <CarteEnMain
          nom="decider"
          fond
          pose="left-[2%] top-[11%] -rotate-[9deg]"
          alt="L'écran de décision : prix de vente 74 € par enceinte, plan de production 4 500 enceintes, capacité machine 7 000 et main-d'œuvre 7 200 par tour, goulot équilibré, puis le choix du fournisseur."
        />
        <CarteEnMain
          nom="resultats"
          fond
          pose="left-[46%] top-[11%] rotate-[9deg]"
          alt="Le verdict du tour 3 : 58 188 € de bénéfice, 39 241 € de plus qu'au tour précédent, 1re sur 3 équipes, et deux réussites obtenues."
        />
        <CarteEnMain
          nom="arene"
          pose="left-[24%] top-[4%]"
          alt="L'arène d'une équipe au quatrième tour : chiffre d'affaires 399 919 €, résultat 58 188 €, trésorerie 89 653 €, et le tour en cours à jouer."
        />
      </div>
      {/*
        LA MAIN EST LA BOUCLE, ET C'EST ELLE QUI LA NOMME.

        Les six temps ont vécu quelques heures dans une section à eux, « Un
        tour, de bout en bout » : un titre, une phrase, une démonstration
        animée de trois panneaux, six cents pixels de défilement pour dire ce
        que la main de cartes montrait DÉJÀ trois écrans plus haut. Un produit
        qui se montre deux fois se montre mal.

        Les trois cartes sont exactement trois de ces six temps — l'arène où la
        situation arrive, la feuille où l'on décide, le verdict qui tombe — et
        ce sont de vraies captures, prises sur une partie jouée. Il ne manquait
        que les mots. Les voici sous elles, et la légende dit lesquels des six
        sont à l'écran plutôt que de laisser croire qu'ils y sont tous.

        LA CHAÎNE NE PORTE PAS DE NUMÉROS, bien qu'elle soit ordonnée : les
        cartes ne sont pas numérotées non plus, et deux comptes sur un même
        écran se contrediraient.

        ELLE CASSE EN TROIS ET TROIS, par une largeur maximale plutôt qu'au
        hasard de la place disponible. Laissée libre, elle tombait en quatre
        mots puis deux dans la colonne de l'accroche, et en trois lignes
        inégales sur un téléphone. Deux lignes de même longueur se lisent
        comme un dessin ; quatre plus deux se lisent comme un débordement.
      */}
      <figcaption className="mt-6">
        <ol className="mx-auto flex max-w-[21rem] flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {TEMPS_DU_TOUR.map((t, i) => (
            <li key={t.nom} className="flex items-center gap-3">
              {/* La phrase complète reste accessible : l'infobulle pour la
                  souris, le texte caché pour une synthèse vocale. Un mot seul
                  ne dit pas ce qui se passe à ce moment-là. */}
              <span
                title={t.quoi}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300"
              >
                {t.nom}
                <span className="sr-only"> : {t.quoi}</span>
              </span>
              {/* La flèche suit son temps au lieu de précéder le suivant : sur
                  un téléphone la chaîne passe à la ligne, et une flèche posée
                  avant se retrouvait seule en tête de deuxième ligne. Placée
                  après, elle termine la ligne — ce qui est justement ce qu'une
                  flèche veut dire. */}
              {i < TEMPS_DU_TOUR.length - 1 ? (
                <span aria-hidden className="text-sm text-amber-400/60">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-400">
          Les six temps d&apos;un tour. Les trois écrans ci-dessus en montrent trois, pris
          d&apos;un même tour : l&apos;arène, la feuille de décision, le verdict.
        </p>
        {/* Le guide détaille chacun de ces temps, et l'ancre vise « Côté
            élèves : jouer un tour » — la section qui déroule la boucle — et non
            le haut d'un guide de cinq mètres. Le libellé nomme cette section :
            ses sections sont des accordéons, l'ancre dépose sur le titre et son
            chapeau, le détail s'ouvre d'un clic. Promettre « le détail » eût
            été promettre l'écran suivant. */}
        <p className="mt-3 text-center">
          <Link
            href="/guide#eleves"
            className="group text-sm font-semibold text-amber-400 transition-colors hover:text-amber-300"
          >
            Comment se joue un tour
            <span
              aria-hidden
              className="ml-1.5 inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </p>
      </figcaption>
    </figure>
  );
}

export default async function Home() {
  const config = await getPlatformConfig();
  // Le nombre de décisions se compte sur le registre des leviers : l'écrire
  // ici le figerait, et il change dès qu'un niveau ouvre une décision de plus.
  const decisions = etendueDesDecisions();
  return (
    <>
      {/* Ce que le site dit de lui-même à une machine. Posé sur la seule page
          d'accueil : c'est l'entité « site » et l'entité « éditeur » qu'on
          déclare, une fois, pas une par page. */}
      <DonneesStructurees />
      <main id="main" className="relative overflow-hidden">
        <HaloDePage />

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
            {/* Le laiton s'écrit plein. À 90 % il ne s'adoucissait pas, il
                fabriquait une CINQUIÈME valeur de laiton sur une page qui vient
                d'en ramener quatre à deux, pour une différence qu'on ne voit
                pas. */}
            <p className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-amber-400">
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
            DES CAPTURES DE L'APPLICATION, ET NON DES ÉCRANS DESSINÉS.

            Cette colonne a porté trois choses successives. D'abord un cockpit
            dessiné à la main, avec des chiffres inventés — « chiffre d'affaires
            346 920 € » — : il promettait une simulation sans en faire tourner
            une. Puis un tour jouable, qui tenait la promesse mais faisait de
            l'accueil un mini-jeu. Maintenant les écrans réels.

            ILS SONT PRIS SUR L'APPLICATION, pas redessinés : la partie a été
            jouée, les chiffres sont ceux que le moteur a calculés. C'est la seule
            façon qu'une capture ne mente pas — et la raison pour laquelle on ne
            retouche pas les montants pour les rendre flatteurs.

            Le format sert aussi à dire quelque chose : c'est un téléphone, parce
            que c'est là que l'élève joue.
          */}
          <MainDeCartes />
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

        {/* ---------- Qui fait quoi ---------- */}
        {/*
          LE TROISIÈME NIVEAU N'EXISTAIT NULLE PART SUR CETTE PAGE.

          Deux boutons dans l'accroche, « Commencer une partie » et « Je suis
          enseignant » : l'élève et l'enseignant étaient là, l'établissement
          manquait. Il fallait déplier une section du guide pour apprendre
          qu'un lycée ou un campus a son espace d'administration, ses codes
          d'invitation et ses concours.

          La bande des chiffres sépare celle-ci de « Par où commencer » : l'une
          répond « qui suis-je ici », l'autre « où vais-je », et deux listes de
          liens qui se suivent n'en font plus qu'une.
        */}
        <QuiFaitQuoi />

        {/* ---------- Les chiffres de la maison ---------- */}
        {/*
          QUATRE NOMBRES EN AMBRE, TOUS DE LA MÊME TAILLE : on ne savait pas
          lequel comptait, et rien ne les séparait. Le nombre passe au serif — la
          voix des titres de la maison —, son libellé le précède en capitales
          fines, et un filet sépare les colonnes. L'ambre ne sert plus qu'à ce
          qu'on doit retenir.

          LA COUPURE DE LA PAGE, ET SON SEUL BLOC À CONTRE-JOUR. L'accueil est
          clair du haut jusqu'au pied, avec une seule bande à peine teintée —
          celle des métiers — pour toute respiration ; une page qui ne change
          jamais de sol n'a pas de colonne vertébrale. La rangée était par
          ailleurs la section la plus orpheline : prise entre deux voisines, sans
          identité propre, elle a vu sa marge basse rognée pour qu'on ne voie pas
          qu'elle flottait. Lui donner un sol, c'est lui donner la raison d'être
          qu'elle n'avait pas — et ce sont les chiffres qu'on doit retenir de la
          page.

          POURQUOI ICI ET NON SOUS L'EN-TÊTE. Le haut de page porte déjà trois
          écrans sombres, la main de cartes. Une coupure posée juste dessous
          donnerait deux masses sombres à la même hauteur, et ni l'une ni l'autre
          ne ressortirait : le contraste attire l'œil parce qu'il est unique sur
          L'ÉCRAN, pas sur la page. À neuf cents pixels du haut, les captures ont
          quitté la fenêtre quand la bande arrive.

          Pas de filet sur ses arêtes : un changement de sol se voit tout seul, et
          la bande des métiers en porte déjà un juste au-dessus.
        */}
        <section className="contre-jour bg-slate-950">
          <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
            <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
              {[
                ["par tour, selon le niveau", `${decisions.minimum} à ${decisions.maximum}`, "décisions"],
                ["du CA au FRNG et au BFR", `${CONCEPTS.length}`, "fiches notions"],
                ["d'aide à la décision", `${DECISION_MODELS.length}`, "modèles"],
                ["de performance, l'indice IPG", `${BPI_V2_DIMENSIONS.length}`, "dimensions"],
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

      </main>
      <PiedDePage />
    </>
  );
}
