import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformConfig } from "@/services/admin.service";
import { etendueDesDecisions } from "@/config/decisions";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { DECISION_MODELS } from "@/config/pedagogy/models";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { Icone } from "@/components/icone";
import { DESCRIPTION_ACCUEIL, TITRE_ACCUEIL } from "@/config/seo";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { TEMPS_DU_TOUR } from "@/config/temps-du-tour";
import { DonneesStructurees } from "@/components/donnees-structurees";
import { Bande } from "@/components/bande";
import { contrasteDeLaBande } from "@/config/theme-du-site";
import { QuiFaitQuoi } from "@/components/qui-fait-quoi";
import { BPI_V2_DIMENSIONS } from "@/scoring/bpi";
import { PiedDePage } from "@/components/pied-de-page";
import { ReprendreALAccueil } from "@/components/reprendre-a-laccueil";
import { BandeauDeLaPartie, EpisodeEtClassement } from "@/components/accueil-arene";
import { CompositionDesLieux, GrilleDesLieux, LesNeufLieux } from "@/components/lieux-de-la-vitrine";
import { CarrouselDesEcrans } from "@/components/carrousel-des-ecrans";

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
}[] = [
  {
    title: "Choisir ma simulation",
    href: "/orientation",
    aide: "Quatre questions, et le réglage qui convient à votre classe s'écrit à mesure, avec ses raisons.",
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
 * LE FORMAT DES TROIS CAPTURES — 800 × 1120.
 *
 * Les trois écrans sont recadrés à la même taille, et c'est ce qui permet de
 * les poser côte à côte : trois images de hauteurs différentes ne forment pas
 * une rangée, elles forment un escalier. Les dimensions sont
 * écrites dans la page, sous forme de rapport — sans elles, la place n'est pas
 * réservée et le texte saute quand les fichiers arrivent. Les trois fichiers
 * ont ce format.
 */
const CARTE = { largeur: 800, hauteur: 1120 };

/**
 * UN ÉCRAN DU TOUR : la capture, posée droite, sous son nom.
 *
 * UNE SEULE PRISE PAR ÉCRAN. Le site n'a qu'un habillage : la capture montre
 * le papier et ses écrans d'ardoise, ce qu'un élève verra.
 *
 * Le fichier n'est pas une balise `img` mais un FOND (voir `.capture-decran`
 * dans globals.css). Le cadre annonce donc lui-même ce qu'il montre —
 * `role="img"` et son texte — puisqu'un fond n'a pas de texte de
 * remplacement. Et sa forme vient du rapport des deux dimensions, non d'une
 * image qu'on attendrait : la place est réservée avant que le fichier arrive.
 *
 * LE NOM N'EST PAS NUMÉROTÉ. La chaîne des six temps, juste au-dessus, ne
 * l'est pas non plus sur grand écran, et deux comptes qui ne disent pas la
 * même chose sur un même écran se contrediraient.
 *
 * SUR TÉLÉPHONE, LA CAPTURE EST RECADRÉE (lot P6). Entière, à la largeur d'un
 * téléphone, son plus petit texte (12 px dans l'application, 24 px dans le
 * fichier) tombait sous 9 px. Elle est agrandie de 10 % (`zoom`) dans un
 * cadre 4:5, et cadrée sur sa zone la plus parlante (`cadrage`) : les trois
 * chiffres de l'arène, la vente et la capacité de la décision, le verdict.
 */
function EcranDuTour({
  nom,
  titre,
  alt,
  cadrage,
}: {
  nom: string;
  titre: string;
  alt: string;
  /** La position du fond sur téléphone (« 50% 0% » : le haut de la capture). */
  cadrage: string;
}) {
  return (
    <li className="flex w-full shrink-0 snap-start flex-col gap-3 sm:w-auto">
      <p className="text-sm font-semibold text-slate-200">{titre}</p>
      <div className="overflow-hidden rounded-md border border-white/15 bg-slate-900">
        <div
          role="img"
          aria-label={alt}
          data-recadrage=""
          className="capture-decran w-full"
          style={
            {
              aspectRatio: `${CARTE.largeur} / ${CARTE.hauteur}`,
              "--ecran": `url(/apercus/${nom}.webp)`,
              "--cadrage-telephone": cadrage,
            } as React.CSSProperties
          }
        />
      </div>
    </li>
  );
}

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

/**
 * LES TROIS ÉCRANS D'UN TOUR, POSÉS DROITS SUR UNE ARDOISE.
 *
 * ILS ÉTAIENT TENUS EN MAIN DE CARTES : trois captures en éventail, tournées
 * de neuf degrés, les deux du fond assourdies. C'était le dernier dessin de
 * l'ancien habillage, et à côté des arêtes franches de « L'arène » il se
 * lisait comme une pièce d'une autre page. Les écrans sont maintenant posés
 * comme l'arène pose ses chiffres : droits, alignés, sur le marine.
 *
 * L'ARDOISE PREND TOUTE LA LARGEUR, sous les deux listes, au lieu d'une
 * demi-colonne : trois écrans dans une colonne de cinq cents pixels ne se
 * lisaient pas. Elle porte la classe `ardoise`, qui rend au marine son
 * échelle sur une bande claire.
 *
 * L'ORDRE EST CELUI DE LA LÉGENDE : l'écran où l'élève passe son temps, puis
 * les deux moments d'un tour dans l'ordre où on les joue — on décide, puis on
 * lit le verdict. Sur téléphone, les trois écrans défilent de côté dans leur
 * propre cadre, un à la fois, la page ne bouge pas (`CarrouselDesEcrans`).
 *
 * LES TROIS ÉCRANS SONT DÉCRITS. Qui ne voit pas la page n'a que ces trois
 * phrases pour savoir ce que montre l'application : elles disent les chiffres
 * qu'on y lit, pas « capture d'écran ».
 */
function TroisEcrans() {
  return (
    <figure className="ardoise m-0 mt-14 rounded-md border-t-[3px] border-slate-500 bg-slate-950 p-4 sm:p-8">
      {/* SUR TÉLÉPHONE, LES TROIS ÉCRANS REVIENNENT, UN À LA FOIS (lot P6).
          L'audit P2-09 les avait réduits au seul verdict : à 78 % de la
          largeur, le texte des captures tombait à six pixels, et le geste de
          côté n'était pas deviné. Le propriétaire veut les trois. Chaque
          écran prend toute la largeur du cadre (rien du suivant ne dépasse),
          recadré et agrandi pour que son texte se lise (≥ 9 px apparents),
          et le geste se dit sous le cadre : flèches, points et « 1 / 3 ».
          Au-delà, les trois écrans se posent côte à côte. */}
      <CarrouselDesEcrans titres={["L'arène", "La décision", "Le verdict"]}>
        <EcranDuTour
          nom="arene"
          titre="L'arène"
          cadrage="50% 0%"
          alt="L'arène d'une équipe au quatrième tour : chiffre d'affaires 319 914 €, résultat 32 942 €, trésorerie 89 869 €, et le tour en cours à jouer."
        />
        <EcranDuTour
          nom="decider"
          titre="La décision"
          cadrage="50% 19%"
          alt="L'écran de décision : prix de vente 74 € par enceinte, plan de production 3 800 enceintes, capacité machine 7 000 et main-d'œuvre 7 200 par tour, goulot équilibré."
        />
        <EcranDuTour
          nom="resultats"
          titre="Le verdict"
          cadrage="50% 100%"
          alt="Le verdict du tour 3 : 32 942 € de bénéfice, 11 977 € de plus qu'au tour précédent, 1re sur 3 équipes avec un IPG de 58, et deux réussites obtenues."
        />
      </CarrouselDesEcrans>
      {/*
        LA LÉGENDE DIT CE QUE L'IMAGE NE PEUT PAS DIRE : que les trois écrans
        sont ceux d'UN MÊME TOUR. Le verdict montré est celui du tour qu'on
        voit se décider sur l'écran d'à côté, et c'est ce qui fait de trois
        images une démonstration plutôt qu'une galerie.
      */}
      <figcaption className="mt-5 text-sm leading-relaxed text-slate-300">
        Trois écrans d&apos;un même tour : l&apos;arène, la feuille de décision, le verdict.
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
          <div className="voile-neutre flex items-center justify-center gap-2 border-b border-white/10 px-6 py-2 text-center text-sm text-slate-200">
            <Icone nom="communication" className="h-4 w-4 shrink-0 text-slate-300" />
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
          · Le titre passe en pleine largeur et se dimensionne sur sa colonne
            (voir plus bas).
          · Les deux blocs qui encombraient, les six temps et ce que l'élève
            apprend, descendent plus bas, côte à côte. Rien n'est perdu, tout
            descend d'un cran.

          LA MAIN DE CARTES EN EST SORTIE. Le héros de la maquette « L'arène »
          ne porte que du texte : la pastille, le titre, l'accroche, les deux
          boutons. Les trois captures descendent dans la bande qui déroule un
          tour, où elles illustrent ce qu'on y lit.

          LE HALO ENTRE DANS LE BLOC. Posé sur le `main`, il lisait la teinte
          de la PAGE et aurait éclairé la nuit d'une lueur de papier ; à
          l'intérieur, il lit celle du contre-jour.
        */}
        <Bande
          id="accueil.hero"
          contraste={c("accueil.hero")}
          exterieur="relative overflow-hidden"
          interieur="relative mx-auto max-w-6xl px-6 pb-12 pt-10 sm:pt-14 lg:pb-16"
          interieurContraste="relative mx-auto max-w-6xl px-6 pb-12 pt-10 sm:pt-14 lg:pb-16"
        >
          {/*
            LOT P2 : LES LIEUX À DROITE DU TITRE. Le héros a été un titre seul,
            avec le grand anneau décoratif coupé du coin haut droit
            (`HaloDePage`) pour toute image : l'audit le relevait comme « un
            ornement sans rôle », et aucune image du produit n'était visible
            au-dessus de la ligne de flottaison. L'anneau est retiré ; à sa
            place, sur ordinateur, la composition des lieux (une grande photo,
            trois petites, chacune légendée). Le titre reste à gauche, premier
            dans l'ordre du document et premier lu ; le héros garde sa hauteur
            (pas de plein écran). Sur téléphone, les lieux passent sous les
            boutons, en bande de vignettes.
          */}
          <div className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-12">
            <div className="min-w-0">
          {/*
              LE SURTITRE DISAIT QUATRE MOTS-CLÉS — « Simulation · Apprentissage ·
              Décision · Compétition » — qui pouvaient coiffer n'importe quel
              produit. Il dit maintenant ce qu'est la chose et pour qui elle est.
            */}
          {/* LA PASTILLE DE CONTEXTE. Elle a été l'étiquette orange de la
              maquette, inclinée comme un dossard. Lot P1 : une pastille sobre,
              droite, à filet fin ; l'orange est réservé à l'action. */}
          <p>
            <span className="surtitre-arene">Simulation de gestion, pour la classe</span>
          </p>
          {/*
              LE TITRE SE DIMENSIONNE SUR SA COLONNE, ET NON SUR L'ÉCRAN. Sur
              l'écran, la taille ne sait rien de la place disponible : à 390 px
              de large, la colonne fait 342 px, et un titre trop grand y tombait
              sur deux lignes par phrase. En unités de la colonne (`cqw`), la
              taille suit la place : une ligne par phrase partout.

              Le coefficient n'est pas choisi au jugé. Lot P1 : le titre est en
              Barlow 700, droit, casse de phrase ; la plus longue phrase,
              « Dirigez une entreprise. », mesure 9,7 fois la taille pour ses
              vingt-trois signes (0,42 em par signe, mesuré dans le navigateur).
              Lot P2 : la colonne n'est plus toute la largeur du héros mais sa
              moitié gauche (la composition des lieux prend la droite) ; à
              9,5 cqw, la phrase occupe 92 % de sa colonne, sans jamais la
              toucher : 33 px sur un téléphone, 48 px à 1024, 58 px au-delà de
              1200. tests/e2e/parcours.e2e.ts mesure la largeur RÉELLE du texte
              contre celle de sa colonne, à 390 px comme à 1728, et vérifie
              qu'il grandit de 1024 à 1728.
            */}
          <div className="mt-6" style={{ containerType: "inline-size" }}>
            <h1 className="whitespace-nowrap text-[clamp(1.75rem,9.5cqw,5.5rem)] font-bold leading-[1.05] text-slate-50">
              Dirigez une entreprise.
              <br />
              {/* L'ORANGE DU HÉROS, EXCEPTION NOMMÉE ET UNIQUE (lot P2, décision
                  du propriétaire). La seconde ligne avait gardé l'orange de la
                  marque jusqu'au lot P1, qui l'avait passée à l'encre claire :
                  l'orange ne dit plus que l'action. Le propriétaire la rend à
                  l'orange : c'est la signature de la marque, une fois, sur la
                  vitrine. Elle reste en casse de phrase, droite, en Barlow.
                  `text-amber-400` est l'orange d'action #ff8a1f sur le marine
                  (6,5:1 sur #0b2545) et l'encre brûlée #a35200 sur le papier
                  (5,2:1 sur la page), si l'administrateur remet le héros au
                  clair. L'attribut la nomme : les gardes `orange-de-l-action`
                  et `couleurs-fonctionnelles` ne la laissent passer qu'ici, et
                  une seule fois dans tout le site. */}
              <span data-exception-orange="heros-de-la-vitrine" className="text-amber-400">
                Apprenez à décider.
              </span>
            </h1>
          </div>
          {/*
              L'accroche faisait quatre lignes et énumérait tout : les secteurs,
              les décisions, les modèles. On garde ce qui se retient (le nombre
              de métiers, le fait que le marché répond, la durée d'une partie) et
              le reste est montré plus bas plutôt que promis ici.
            */}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            {SCENARIO_CHOICES.length} métiers, un marché qui répond, six tours pour comprendre. Vous
            fixez les prix, la production et les budgets ; les résultats disent ce que ces choix
            valaient.
          </p>
          {/*
              DEUX BOUTONS, ET UN SEUL PLEIN. « Tester le simulateur » est
              l'action de la page : l'orange vif. « Je suis enseignant » est
              l'autre porte d'entrée : le bouton SECONDAIRE, un filet fin, de la
              même hauteur, du même rayon et de la même graisse que le plein
              (lot P1).

              Le libellé du bouton plein a été « Commencer une partie » (la
              maquette disait « Entrer dans l'arène ») ; il est « Tester le
              simulateur » depuis le lot P6 : tests/e2e/contraste.e2e.ts le
              cherche pour mesurer sa lisibilité.
            */}
          {/* LOT P6 : « TESTER LE SIMULATEUR », ET DEUX BOUTONS ALIGNÉS.
              « Commencer une partie » donnait l'impression que tout était
              gratuit (le propriétaire) : le bouton dit ce qu'on y fait, un
              essai, et mène au même endroit (/jouer). Ses doubles de la
              vitrine (la barre d'action du téléphone) disent la même chose.
              Les deux boutons étaient empilés en largeurs inégales sur un
              téléphone : ils prennent désormais la largeur de la colonne,
              mêmes bords à gauche et à droite, même hauteur ; au-delà, côte à
              côte, en deux colonnes égales (grille), même hauteur. Mesuré à
              390 et 360 px (tests/e2e/mise-en-scene.e2e.ts). */}
          <div
            data-cta-principal
            className="mt-8 grid grid-cols-1 gap-3 sm:inline-grid sm:grid-cols-2 sm:gap-4"
          >
            <Link href="/jouer" className={`${bouton({ taille: "l" })} w-full`}>
              Tester le simulateur
            </Link>
            <Link href="/teacher/login" className={`${bouton({ variante: "secondaire", taille: "l" })} w-full`}>
              Je suis enseignant
            </Link>
          </div>
          {/* Celui qui revient retrouve sa dernière partie, en une ligne sous les
              boutons : l'accueil reste statique et celui de tout le monde ; l'îlot
              lit le cookie de l'appareil et ne rend rien s'il n'y a rien à reprendre. */}
          <ReprendreALAccueil />
          {/* LOT P6 : LA LIGNE NE PROMET PLUS LA GRATUITÉ. « Sans compte, sans
              installation » laissait croire que tout était offert. Elle dit
              ce qui l'est (une partie d'essai, en solo) et comment l'arène se
              prend pour une classe : en licence d'établissement, dont on
              parle de vive voix (/rendez-vous : trente minutes au téléphone ;
              aucune page du site ne publie de prix, et celle-ci n'en invente
              aucun). Le lien est à l'encre, souligné (variante `lien`). */}
          <p className="mt-5 text-sm leading-relaxed text-slate-400">
            Une partie d&apos;essai en solo, sans compte ni installation. Pour vos classes,
            l&apos;arène se prend en{" "}
            <Link href="/rendez-vous" className={`${LIEN_A_L_ENCRE} whitespace-nowrap`}>
              licence établissement
            </Link>
            .
          </p>
          {/* Sous `lg`, les neuf lieux en grille de 3 × 3, sous les boutons. */}
          <GrilleDesLieux className="mt-7 lg:hidden" />
            </div>
            <CompositionDesLieux className="hidden lg:grid" />
          </div>
        </Bande>

        {/* ---------- La partie d'exemple, puis un épisode et le classement ---------- */}
        {/*
          SOUS LE HÉROS, LE TABLEAU DES SCORES. La maquette enchaîne le marine
          du titre, un bandeau blanc de quatre chiffres posé sur un filet marine,
          puis une carte d'épisode et le classement de la partie. Les deux bandes
          sont claires : la première touche le héros, et deux tableaux ne se
          touchent jamais (config/bandes.ts).
        */}
        <BandeauDeLaPartie contraste={c("accueil.partie")} />
        <EpisodeEtClassement contraste={c("accueil.episode")} />

        {/* ---------- La boucle, et ce qu'on en retire ---------- */}
        {/*
          LES DEUX BLOCS QUI ENCOMBRAIENT LE PREMIER ÉCRAN, l'un sous l'autre,
          et en face les trois écrans d'un tour. En haut comment un tour
          FONCTIONNE, dessous ce que l'élève en RETIRE : deux questions
          différentes, et c'est pour cela qu'elles tiennent ensemble sans se
          répéter.
        */}
        <Bande
          id="accueil.boucle"
          contraste={c("accueil.boucle")}
          interieur="mx-auto max-w-6xl px-6 py-16 lg:py-24"
          labelledby="la-boucle"
        >
          {/*
            LES TROIS CAPTURES SONT ICI. Elles ouvraient la page, dans le héros ;
            la maquette « L'arène » garde le héros au texte et montre l'arène
            plus bas, là où l'on explique ce qui se passe dans un tour. Les deux
            listes se partagent la largeur, et l'ardoise des trois écrans passe
            dessous, sur toute la largeur.
          */}
          <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
            <div>
              <h2
                id="la-boucle"
                className="surtitre flex items-center gap-3"
              >
                <span aria-hidden className="h-px w-8 bg-slate-400" />
                Les six temps d&apos;un tour
              </h2>
              {/*
                LA CHAÎNE NE PORTE PAS DE NUMÉROS, bien qu'elle soit ordonnée :
                les cartes d'à côté n'en portent pas non plus, et deux comptes
                sur un même écran se contrediraient. Elle casse en trois et
                trois par une largeur maximale plutôt qu'au hasard de la place :
                deux lignes de même longueur se lisent comme un dessin, quatre
                plus deux se lisent comme un débordement.
              */}
              {/* SUR TÉLÉPHONE, la chaîne se lit comme une liste : un numéro, le
                  temps, la phrase qui dit ce qui s'y passe. Les phrases sont celles
                  du registre (config/temps-du-tour), pas des textes de plus. Les trois
                  écrans d'aperçu, qui suivent, ne portent aucun numéro qui
                  contredirait ceux-ci ; au-delà de `sm`, la chaîne est celle d'avant. */}
              <ol className="mt-5 divide-y divide-white/10 border-y border-white/10 sm:hidden">
                {TEMPS_DU_TOUR.map((t, i) => (
                  <li key={t.nom} className="flex items-baseline gap-4 py-3">
                    <span aria-hidden className="w-6 shrink-0 text-sm font-semibold tabular-nums text-slate-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base leading-snug text-slate-400">
                      <strong className="font-semibold text-slate-100">
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
                      className="libelle text-slate-200"
                    >
                      {t.nom}
                      <span className="sr-only"> : {t.quoi}</span>
                    </span>
                    {/* La flèche suit son temps au lieu de précéder le suivant :
                        sur un téléphone la chaîne passe à la ligne, et une
                        flèche posée avant se retrouvait seule en tête de
                        deuxième ligne. */}
                    {i < TEMPS_DU_TOUR.length - 1 ? (
                      <span aria-hidden className="text-sm text-slate-400">
                        →
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
                Dans cet ordre, à chaque tour. Les trois écrans montrés ici en déroulent trois, sur
                un tour de NOVA.
              </p>
              {/* Le guide détaille chacun de ces temps, et l'ancre vise « Côté
                  élèves : jouer un tour » — la section qui déroule la boucle —
                  et non le haut d'un guide de cinq mètres. */}
              <p className="mt-4">
                <Link
                  href="/guide#eleves"
                  className="group text-sm font-semibold text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
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
                className="surtitre flex items-center gap-3"
              >
                <span aria-hidden className="h-px w-8 bg-slate-400" />
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
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400 max-sm:hidden"
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

          <TroisEcrans />
        </Bande>

        {/* ---------- Les métiers, montrés ---------- */}
        {/*
          LE PRODUIT ANNONCE SES SECTEURS DEPUIS LE HAUT DE LA PAGE, et ne les
          montrait nulle part : il fallait cliquer pour savoir de quoi on parle.
          Ils ont été montrés en pictogrammes au trait ; lot P2, ce sont leurs
          LIEUX, les neuf photographies traitées que l'arène pose au premier
          tour, chacune avec le nom de l'entreprise et son métier dans sa teinte.
          Sous la ligne de flottaison : les vignettes sont la réduite, chargée à
          l'approche de l'écran.
        */}
        <Bande
          id="accueil.metiers"
          contraste={c("accueil.metiers")}
          interieur="mx-auto max-w-6xl px-6 py-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 className="surtitre flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-slate-400" />
              {SCENARIO_CHOICES.length} métiers, {SCENARIO_CHOICES.length}{" "}
              économies
            </h2>
            <Link
              href="/entreprises"
              className="text-sm font-medium text-slate-300 underline decoration-white/20 underline-offset-4 transition hover:text-slate-50 hover:decoration-current"
            >
              Voir les entreprises
            </Link>
          </div>
          <LesNeufLieux />
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
        {/* LE BANDEAU DE CHIFFRES-CLÉS. Dans l'arène, la bande est blanche et
            posée sur un filet marine de trois pixels, comme le bandeau de la
            maquette : le marine est déjà en tête de page. Remise à contre-jour
            par l'administrateur, elle redevient le tableau. */}
        <Bande
          id="accueil.chiffres"
          contraste={c("accueil.chiffres")}
          fond="bandeau-chiffres"
          interieur="mx-auto max-w-6xl px-6 py-12 sm:py-16"
        >
          {/*
            LE CHIFFRE D'ABORD, puis ce qu'il compte. Le libellé passait devant,
            en capitales espacées : sur téléphone il prenait une ou deux lignes
            selon sa longueur, et les quatre chiffres tombaient à des hauteurs
            différentes. Posés en tête, ils s'alignent quoi qu'il arrive au
            texte dessous. Le `dt` reste avant le `dd` dans le code (l'ordre
            d'une liste de définitions) ; c'est l'affichage qui les retourne.
          */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {[
              [
                `${decisions.minimum} à ${decisions.maximum}`,
                "décisions",
                "par tour, selon le niveau",
              ],
              [`${CONCEPTS.length}`, "fiches notions", "du CA au FRNG et au BFR"],
              [`${DECISION_MODELS.length}`, "modèles", "d'aide à la décision"],
              [`${BPI_V2_DIMENSIONS.length}`, "dimensions", "de performance, l'indice IPG"],
            ].map(([nombre, quoi, libelle]) => (
              <div
                key={quoi}
                className="flex flex-col-reverse justify-end gap-2 sm:border-l sm:border-white/10 sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
              >
                <dt className="text-sm leading-snug text-slate-400">
                  <span className="font-semibold text-slate-100">{quoi}</span> {libelle}
                </dt>
                <dd className="whitespace-nowrap font-display text-4xl font-extrabold leading-none text-slate-50">
                  {nombre}
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
          <h2 className="surtitre flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-slate-400" />
            Par où commencer
          </h2>
          {/*
            UN SOMMAIRE, PAS UNE GRILLE D'ICÔNES. Les cartes portaient un emoji en
            tête ; elles portent maintenant un filet qui s'allume au survol, un
            titre en serif et sa phrase. Toutes ont le même filet gris : il ne
            s'allume qu'au survol ou au focus. La première, celle qui aide à
            choisir, n'est plus allumée d'office : un filet orange au repos se
            lisait comme une carte déjà choisie.
          */}
          <div className="mt-8 grid gap-x-8 gap-y-px sm:grid-cols-2 lg:grid-cols-3">
            {RENVOIS.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group block border-t border-white/10 py-4 transition-colors hover:border-white/40 focus-visible:border-white/40 sm:py-5"
              >
                <h3 className="flex items-baseline gap-2 text-lg font-semibold text-slate-100 transition-colors group-hover:text-slate-50">
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
