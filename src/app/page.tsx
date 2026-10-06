import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformConfig } from "@/services/admin.service";
import { etendueDesDecisions } from "@/config/decisions";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { PictoSecteur } from "@/components/picto-secteur";
import { Icone } from "@/components/icone";
import { DESCRIPTION_ACCUEIL, TITRE_ACCUEIL } from "@/config/seo";
import { bouton } from "@/components/bouton";
import { TEMPS_DU_TOUR } from "@/config/temps-du-tour";
import { DonneesStructurees } from "@/components/donnees-structurees";
import { Bande } from "@/components/bande";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { HaloDePage } from "@/components/halo-de-page";
import { QuiFaitQuoi } from "@/components/qui-fait-quoi";
import { BPI_V2_DIMENSIONS } from "@/scoring/bpi";
import { PiedDePage } from "@/components/pied-de-page";
import { ReprendreALAccueil } from "@/components/reprendre-a-laccueil";

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
    title: "Votre référentiel, bloc par bloc",
    href: "/parcours",
    aide: "Pour chaque diplôme servi : les blocs du programme que l'atelier met en jeu, la séance où chacun se travaille, et ce qui reste effleuré.",
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
      className={`absolute w-[52%] overflow-hidden rounded-xl border bg-slate-900 shadow-2xl ${pose} ${
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
/**
 * CE QUE L'ÉLÈVE APPREND, ET COMMENT ON LE SAIT.
 *
 * La colonne de l'accroche s'arrêtait à « Sans compte, sans installation »
 * pendant que celle des captures continuait sur deux cents pixels : un vide
 * en bas à gauche du premier écran, à l'endroit le plus lu de la page.
 *
 * CE N'EST PAS LA BOUCLE UNE SECONDE FOIS. Les six temps, en face, disent
 * comment un tour FONCTIONNE ; ces trois lignes disent ce que l'élève en
 * RETIRE, et chacune porte un fait que la chaîne ne dit pas — que le
 * diagnostic vient avant la décision et non après, qu'un modèle trompeur est
 * noté comme tel, que la note est écrite avant de connaître le résultat.
 * Trois, et non cinq ou six : une seconde liste de même longueur, en face de
 * la première, se lirait comme un doublon quelle que soit sa matière.
 *
 * RIEN N'EST PROMIS QUI NE SOIT DANS LE PRODUIT. On coche les causes
 * plausibles avant la feuille de décision ; « quel modèle mobiliser » est l'une
 * des trois questions du QCM et la maîtrise décisionnelle est l'une des six
 * dimensions de l'indice ; la note d'avant est exigée au premier tour et
 * revient à l'équipe au tour suivant, à côté du constat.
 */
const CE_QUE_L_ELEVE_APPREND = [
  {
    verbe: "Diagnostiquer avant d'agir",
    quoi: "On coche les causes plausibles avant que la feuille de décision s'ouvre.",
  },
  {
    verbe: "Mobiliser le bon modèle",
    quoi: "Un modèle trompeur ne rapporte presque rien : c'est une des six dimensions de l'indice.",
  },
  {
    verbe: "Poser une hypothèse",
    quoi: "L'équipe écrit ce qu'elle attend de ses choix. Au tour suivant, elle la relit face au résultat.",
  },
];

function MainDeCartes() {
  return (
    /*
      LA MAIN N'EST PLUS DÉCALÉE. Elle l'a été de dix-neuf pixels, le temps
      que le titre vive dans la colonne d'à côté : il fallait alors que le haut
      des cartes tombe sur le haut de « Dirigez une entreprise » plutôt que sur
      le surtitre. Le titre est passé en pleine largeur au-dessus des deux
      colonnes, et il n'y a plus rien à aligner.

      ELLE GRANDIT, EN REVANCHE. Figée à 440 px, elle occupait un quart d'un
      écran de 1728 et le reste était de la marge.
    */
    <figure className="m-0">
      <div className="relative mx-auto aspect-[9/8] w-full max-w-[440px] lg:max-w-none">
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
        LA LÉGENDE DIT CE QUE L'IMAGE NE PEUT PAS DIRE : que les trois écrans
        sont ceux d'UN MÊME TOUR. Le verdict montré est celui du tour qu'on
        voit se décider sur la carte d'à côté, et c'est ce qui fait de trois
        images une démonstration plutôt qu'une galerie.

        Les six temps ont vécu ici quelques heures. Ils sont descendus juste
        sous le premier écran : nommer la boucle est une chose, et le premier
        écran en portait déjà quatre.
      */}
      <figcaption className="mt-6 text-center text-sm leading-relaxed text-slate-400">
        Trois écrans d&apos;un même tour : l&apos;arène, la feuille de décision,
        le verdict.
      </figcaption>
    </figure>
  );
}

export default async function Home() {
  const config = await getPlatformConfig();
  // Quelles bandes sont à contre-jour : le réglage de l'admin, ou l'état d'origine.
  const c = (id: string) => contrasteDeLaBande(config.theme, id);
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
        {config.announcement ? (
          <div className="flex items-center justify-center gap-2 border-b border-amber-400/20 bg-amber-950/30 px-6 py-2 text-center text-sm text-amber-200">
            <Icone nom="communication" className="h-4 w-4 shrink-0 text-amber-400" />
            {config.announcement}
          </div>
        ) : null}

        {/* ---------- Hero ---------- */}
        {/*
          LE PREMIER ÉCRAN PREND LA NUIT.

          Mesuré avant d'y toucher : le titre faisait 38,5 px à 1280 comme à
          1728 — identique, parce qu'il se dimensionnait en unités de sa
          COLONNE et devait tenir sur une ligne dans une demi-largeur ; les
          captures étaient figées à 440 px ; et vingt blocs de texte se
          partageaient les neuf cents premiers pixels. Une page dont la marque
          s'appelle « Nuit & Laiton » ne montrait sa nuit qu'au tiers de sa
          hauteur, à mille quatre cents pixels du haut.

          TROIS CHANGEMENTS, ET UN SEUL PROCÉDÉ NOUVEAU — AUCUN.

          · Le sol. `contre-jour` retourne l'échelle pour ce bloc seul : encre
            sur une page de papier, papier sur une page de nuit. Le procédé
            existe, il est engendré et gardé ; le hero est simplement le
            premier endroit où il sert à ouvrir plutôt qu'à conclure.
          · Le titre passe en pleine largeur et se dimensionne sur l'ÉCRAN, de
            36 à 72 px. Il ne se replie qu'en dessous de 640 px, où aucune
            largeur ne tiendrait ses deux phrases sur deux lignes.
          · Les deux blocs qui encombraient — les six temps, ce que l'élève
            apprend — descendent juste dessous, côte à côte. Rien n'est perdu,
            tout descend d'un cran.

          LE HALO ENTRE DANS LE BLOC. Posé sur le `main`, il lisait la teinte
          de la PAGE et aurait éclairé la nuit d'une lueur de papier ; à
          l'intérieur, il lit celle du contre-jour.
        */}
        <Bande
          id="accueil.hero"
          contraste={c("accueil.hero")}
          exterieur="relative overflow-hidden"
          interieur="relative mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-20 lg:pb-24"
          interieurContraste="relative mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-20 lg:pb-24"
          avant={<HaloDePage />}
        >
          {/*
              LE SURTITRE DISAIT QUATRE MOTS-CLÉS — « Simulation · Apprentissage ·
              Décision · Compétition » — qui pouvaient coiffer n'importe quel
              produit. Il dit maintenant ce qu'est la chose et pour qui elle est.
              Le filet qui le précède est la seule décoration de la page : il
              reparaît en tête de chaque section.
            */}
          {/*
              Sur téléphone, l'annonce espacée à 0,3 em se coupait en deux
              lignes (« POUR LA / CLASSE ») : elle se resserre en étiquette et
              laisse tomber son filet sous 640 pixels, et tient sur une ligne.
            */}
          <p className="flex items-center gap-3 text-xs uppercase tracking-etiquette text-amber-400 sm:tracking-annonce">
            <span aria-hidden className="hidden h-px w-8 bg-amber-400/40 sm:block" />
            Simulation de gestion, pour la classe
          </p>
          {/*
              LE TITRE ET LA MAIN PARTENT DE LA MÊME LIGNE.

              Le titre a occupé toute la largeur, et la main tombait dessous :
              une colonne de texte de deux cent cinquante pixels en face d'une
              image de six cents, donc trois cent cinquante pixels de vide en
              bas à gauche. Les deux partagent maintenant la ligne du haut et
              se centrent l'un sur l'autre.

              CE QUE CELA COÛTE, ET C'EST ASSUMÉ. Un titre de 72 px demande
              860 px pour sa plus longue phrase : il ne tient pas dans une
              demi-largeur. En partageant la ligne, il retombe à 48. C'est
              encore vingt-cinq pour cent de plus que les 38,5 px figés d'avant,
              et cette fois il GRANDIT avec l'écran.

              IL SE DIMENSIONNE SUR SA COLONNE, ET NON SUR L'ÉCRAN. La nuance a
              coûté un aller-retour. Sur l'écran, la taille ne sait rien de la
              place disponible : à 390 px de large, la colonne fait 342 px et le
              titre en demandait 36 — il se repliait, et « Dirigez une
              entreprise. » tombait sur deux lignes. En unités de la colonne
              (`cqw`), la taille suit la place : 30 px sur un téléphone, 48 sur
              un grand écran, une ligne par phrase partout.

              Le coefficient n'est pas choisi au jugé : la plus longue phrase
              mesure 0,465 em par caractère dans cette graisse, soit 10,7 fois
              la taille pour ses vingt-trois signes. 8,8 cqw laisse donc six pour
              cent de marge. tests/e2e/parcours.e2e.ts mesure la largeur RÉELLE
              du texte contre celle de sa colonne, à 390 px comme à 1728 —
              c'est cette mesure à 390 qui manquait, et c'est par là que le
              défaut est passé.
            */}
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
            <div style={{ containerType: "inline-size" }}>
              <h1 className="whitespace-nowrap text-[clamp(1.5rem,8.8cqw,3rem)] font-bold leading-[1.04] tracking-tight text-slate-50">
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
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-slate-300">
                {SCENARIO_CHOICES.length} métiers, un marché qui répond, six
                tours pour comprendre. Vous fixez les prix, la production et les
                budgets ; les résultats disent ce que ces choix valaient.
              </p>
              {/*
                  UNE SEULE ACTION. Trois boutons de même taille se disputaient l'œil, et
                  deux d'entre eux se coupaient en deux lignes. « Commencer une partie »
                  reste un bouton ; « Je suis enseignant » redevient ce qu'il est, un
                  lien ; et « voir les entreprises » descend dans la bande qui les
                  montre, juste dessous — un bouton qui promet des métiers vaut moins que
                  les métiers eux-mêmes.
                */}
              <div data-cta-principal className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
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
              {/* Celui qui revient retrouve sa dernière partie, en une ligne sous les
                  boutons : l'accueil reste statique et celui de tout le monde ; l'îlot
                  lit le cookie de l'appareil et ne rend rien s'il n'y a rien à reprendre. */}
              <ReprendreALAccueil />
              <p className="mt-5 text-sm text-slate-400">
                Sans compte, sans installation. Vos parties restent liées à ce
                navigateur.
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
          </div>
        </Bande>

        {/* ---------- La boucle, et ce qu'on en retire ---------- */}
        {/*
          LES DEUX BLOCS QUI ENCOMBRAIENT LE PREMIER ÉCRAN, côte à côte juste
          dessous. À gauche comment un tour FONCTIONNE, à droite ce que l'élève
          en RETIRE : deux questions différentes, et c'est pour cela qu'elles
          tiennent ensemble sans se répéter.
        */}
        {/* L'air de cette bande n'est pas qu'une question de goût : elle sépare
            le premier écran à contre-jour de la bande des chiffres, qui l'est
            aussi. Il faut une fenêtre PLEINE entre les deux, sans quoi il
            existe une position de défilement où les deux se voient et
            s'annulent — tests/e2e/contre-jour.e2e.ts la mesure. */}
        <Bande
          id="accueil.boucle"
          contraste={c("accueil.boucle")}
          interieur="mx-auto max-w-6xl px-6 py-16 lg:py-24"
          labelledby="la-boucle"
        >
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
            <div>
              <h2
                id="la-boucle"
                className="flex items-center gap-3 text-xs uppercase tracking-annonce text-slate-400"
              >
                <span aria-hidden className="h-px w-8 bg-amber-400/40" />
                Les six temps d&apos;un tour
              </h2>
              {/*
                LA CHAÎNE NE PORTE PAS DE NUMÉROS, bien qu'elle soit ordonnée :
                les cartes au-dessus n'en portent pas non plus, et deux comptes
                sur un même écran se contrediraient. Elle casse en trois et
                trois par une largeur maximale plutôt qu'au hasard de la place :
                deux lignes de même longueur se lisent comme un dessin, quatre
                plus deux se lisent comme un débordement.
              */}
              {/* SUR TÉLÉPHONE, la chaîne se lit comme une liste : un numéro, le
                  temps, la phrase qui dit ce qui s'y passe. Les phrases sont celles
                  du registre (config/temps-du-tour), pas des textes de plus. Les trois
                  écrans d'aperçu sont, sur téléphone, trop loin pour se contredire
                  avec ces numéros ; au-delà de `sm`, la chaîne est celle d'avant. */}
              <ol className="mt-5 divide-y divide-white/10 border-y border-white/10 sm:hidden">
                {TEMPS_DU_TOUR.map((t, i) => (
                  <li key={t.nom} className="flex items-baseline gap-4 py-3">
                    <span aria-hidden className="w-6 shrink-0 text-sm font-semibold tabular-nums text-amber-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base leading-snug text-slate-400">
                      <strong className="font-semibold uppercase tracking-etiquette text-slate-100">
                        {t.nom}
                      </strong>
                      <span className="sr-only"> : </span>
                      <span className="block">{t.quoi}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <ol className="mt-6 hidden max-w-[21rem] flex-wrap items-center gap-x-3 gap-y-2 sm:flex">
                {TEMPS_DU_TOUR.map((t, i) => (
                  <li key={t.nom} className="flex items-center gap-3">
                    {/* La phrase complète reste accessible : l'infobulle pour la
                        souris, le texte caché pour une synthèse vocale. Un mot
                        seul ne dit pas ce qui se passe à ce moment-là. */}
                    <span
                      title={t.quoi}
                      className="text-xs font-semibold uppercase tracking-etiquette text-slate-300"
                    >
                      {t.nom}
                      <span className="sr-only"> : {t.quoi}</span>
                    </span>
                    {/* La flèche suit son temps au lieu de précéder le suivant :
                        sur un téléphone la chaîne passe à la ligne, et une
                        flèche posée avant se retrouvait seule en tête de
                        deuxième ligne. */}
                    {i < TEMPS_DU_TOUR.length - 1 ? (
                      <span aria-hidden className="text-sm text-amber-400/60">
                        →
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
                Dans cet ordre, à chaque tour. Les trois écrans ci-dessus en
                déroulent trois, sur un tour de NOVA.
              </p>
              {/* Le guide détaille chacun de ces temps, et l'ancre vise « Côté
                  élèves : jouer un tour » — la section qui déroule la boucle —
                  et non le haut d'un guide de cinq mètres. */}
              <p className="mt-4">
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
            </div>

            <div>
              <h2
                id="apprend"
                className="flex items-center gap-3 text-xs uppercase tracking-annonce text-slate-400"
              >
                <span aria-hidden className="h-px w-8 bg-amber-400/40" />
                Ce que l&apos;élève apprend
              </h2>
              <ul className="mt-6 space-y-4">
                {CE_QUE_L_ELEVE_APPREND.map((c) => (
                  <li
                    key={c.verbe}
                    // Sur téléphone, chaque idée est une carte compacte : le verbe en tête, la phrase dessous.
                    className="flex gap-3 max-sm:flex-col max-sm:gap-1 max-sm:rounded-xl max-sm:border max-sm:border-white/10 max-sm:bg-slate-900/50 max-sm:p-4"
                  >
                    <span
                      aria-hidden
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400 max-sm:hidden"
                    />
                    <p className="text-base leading-relaxed text-slate-400">
                      <span className="font-semibold text-slate-200 max-sm:block max-sm:text-lg">
                        {c.verbe}.
                      </span>{" "}
                      {c.quoi}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Bande>

        {/* ---------- Les métiers, montrés ---------- */}
        {/*
          LE PRODUIT ANNONCE SES SECTEURS DEPUIS LE HAUT DE LA PAGE, et ne les
          montrait nulle part : il fallait cliquer pour savoir de quoi on parle.
          Les voici, avec les pictogrammes que l'arène emploie déjà — dessinés
          d'un seul trait, donc lisibles au timbre-poste comme au mur.
        */}
        <Bande
          id="accueil.metiers"
          contraste={c("accueil.metiers")}
          exterieur="border-y border-white/5"
          fond="bg-slate-900/40"
          interieur="mx-auto max-w-6xl px-6 py-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="flex items-center gap-3 text-xs uppercase tracking-annonce text-slate-400">
              <span aria-hidden className="h-px w-8 bg-amber-400/40" />
              {SCENARIO_CHOICES.length} métiers, {SCENARIO_CHOICES.length}{" "}
              économies
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
              <li
                key={s.code}
                className="flex flex-col items-center gap-2 text-center"
              >
                <PictoSecteur
                  secteur={s.sector}
                  className="h-7 w-7 text-amber-400/80"
                />
                <span className="text-xs leading-tight text-slate-300">
                  {s.shortName}
                </span>
              </li>
            ))}
          </ul>
        </Bande>

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
        <QuiFaitQuoi contraste={c("accueil.roles")} />

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
        <Bande
          id="accueil.chiffres"
          contraste={c("accueil.chiffres")}
          interieur="mx-auto max-w-6xl px-6 py-12 sm:py-16"
        >
          <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {[
              [
                "par tour, selon le niveau",
                `${decisions.minimum} à ${decisions.maximum}`,
                "décisions",
              ],
              [
                "du CA au FRNG et au BFR",
                `${CONCEPTS.length}`,
                "fiches notions",
              ],
              ["d'aide à la décision", `${DECISION_MODELS.length}`, "modèles"],
              [
                "de performance, l'indice IPG",
                `${BPI_V2_DIMENSIONS.length}`,
                "dimensions",
              ],
            ].map(([libelle, nombre, quoi]) => (
              <div
                key={quoi}
                className="px-4 sm:border-l sm:border-white/10 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="text-xs uppercase tracking-surtitre text-slate-400">
                  {libelle}
                </dt>
                <dd className="mt-2">
                  <span className="font-display text-3xl font-semibold text-amber-400">
                    {nombre}
                  </span>{" "}
                  <span className="text-base text-slate-200">{quoi}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Bande>

        {/* ---------- Explorer : renvois vers les pages dédiées ---------- */}
        <Bande
          id="accueil.commencer"
          contraste={c("accueil.commencer")}
          interieur="mx-auto max-w-6xl px-6 py-12 sm:py-16"
        >
          <h2 className="flex items-center gap-3 text-xs uppercase tracking-annonce text-slate-400">
            <span aria-hidden className="h-px w-8 bg-amber-400/40" />
            Par où commencer
          </h2>
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
                className={`group block border-t py-4 transition-colors sm:py-5 ${
                  r.accent
                    ? "border-amber-400/60"
                    : "border-white/10 hover:border-amber-400/40"
                }`}
              >
                <h3 className="flex items-baseline gap-2 font-display text-lg font-semibold text-slate-100 transition-colors group-hover:text-amber-200">
                  {r.title}
                  <span
                    aria-hidden
                    className="text-sm transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </h3>
                <p className="mt-2 text-base leading-relaxed text-slate-400">
                  {r.aide}
                </p>
              </Link>
            ))}
          </div>
        </Bande>
      </main>
      <PiedDePage />
    </>
  );
}
