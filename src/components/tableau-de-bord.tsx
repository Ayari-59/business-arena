import type { ReactNode } from "react";
import { formatDecimal, formatEuro, ordinal } from "@/lib/format";
import { PastilleDeRang } from "@/components/rang";
import { ChiffreQuiArrive } from "@/components/chiffre-qui-arrive";

/**
 * L'ARDOISE DU DIRIGEANT : OÙ EN EST MON ENTREPRISE, ET DANS QUEL SENS ELLE VA.
 *
 * L'élève avait ses chiffres, mais un tour à la fois : pour savoir si sa
 * trésorerie se redressait ou s'enfonçait, il fallait déplier trois tours et
 * comparer de tête. Trois tuiles le disaient ensuite d'un coup ; elles
 * s'arrêtaient aux trois quarts de la largeur, leurs valeurs tenaient en 16 px
 * dans des tuiles de 125 px, et l'œil voyait d'abord le cadre orange du tour.
 *
 * C'EST LE TABLEAU DE BORD D'UN DIRIGEANT. Un bandeau marine pleine largeur,
 * en tête de l'arène, à chaque étape du tour : l'entreprise et le tour, puis
 * les quatre chiffres qu'on regarde en conseil (chiffre d'affaires, résultat,
 * trésorerie, rang), en 32 à 40 px, en chiffres tabulaires. Tout le reste
 * (situation, feuille de décision, analyses) reste sur le papier, dessous.
 *
 * CE SONT LES CHIFFRES DE LA MAISON. Chiffre d'affaires, résultat net,
 * trésorerie : exactement le trio que la ligne de résumé de chaque tour porte
 * déjà. Le rang est celui du classement révélé, en or : c'est une distinction.
 * L'IPG l'accompagne, en petit ; il n'a pas d'historique par tour, il n'a donc
 * pas de courbe.
 *
 * LA COULEUR NE DÉCIDE DE RIEN TOUTE SEULE. Le vert et le rouge d'un résultat
 * se confondent pour une partie des daltoniens (mesuré : 4,6 d'écart perçu en
 * deutéranopie, là où huit sont demandés). Le signe est donc écrit dans le
 * nombre (« −27 198 € »), l'écart porte une flèche ET son signe, et la couleur
 * ne fait que confirmer. Le vert et le rouge ne disent que l'ÉCART (et le
 * résultat, qui est un gain ou une perte) ; la courbe est une donnée, en bleu
 * donnée ; la trésorerie est un niveau, à l'encre, sauf en découvert.
 *
 * UNE COURBE D'UN POINT N'EST PAS UNE COURBE. Au premier tour clos, la valeur
 * seule et « premier tour » ; la courbe arrive avec le deuxième point. Avant
 * tout tour clos, l'ardoise dit l'entreprise et le tour, et une ligne : pas un
 * tableau de tirets.
 */

export interface TourChiffre {
  round: number;
  libelle: string;
  ca: number;
  resultat: number;
  tresorerie: number;
}

/** Ce que l'ardoise dit d'elle-même : l'entreprise, le tour, le rang. */
export interface EnTeteDeLArdoise {
  /** Le nom de l'entreprise jouée : « NOVA ». */
  entreprise: string;
  /** « Tour 3/6 », « Trimestre 3/6 ». */
  tour: string;
  /** Une ligne de contexte sous le nom : l'équipe, le métier, le niveau. */
  sousTitre?: string | null;
  /** Le rang au classement révélé ; absent tant que le rideau est baissé. */
  rang?: { place: number; sur: number } | null;
  /** Ce qu'on dit du rang quand il n'est pas révélé. */
  rangVoile?: string | null;
  ipg?: number | null;
}

type Sens = "monte" | "baisse" | "stable" | null;

function ecartDe(valeurs: number[]): { ecart: number | null; sens: Sens } {
  const derniere = valeurs.at(-1) ?? 0;
  const avant = valeurs.length > 1 ? valeurs.at(-2)! : null;
  if (avant === null) return { ecart: null, sens: null };
  const ecart = derniere - avant;
  if (Math.round(ecart) === 0) return { ecart: 0, sens: "stable" };
  return { ecart, sens: ecart > 0 ? "monte" : "baisse" };
}

/** Un montant signé : « +12 000 € », « −294 € ». */
export function euroSigne(v: number): string {
  return `${Math.round(v) > 0 ? "+" : ""}${formatEuro(v)}`;
}

/**
 * La courbe d'une grandeur, à la teinte du métier, avec un point par tour.
 *
 * C'est la courbe de CETTE entreprise : la teinte de son métier l'identifie
 * (lot 5A), là où le bleu donnée disait seulement « une donnée ». Hors d'une
 * partie, elle retombe sur l'encre de la donnée.
 */
function Courbe({
  valeurs,
  libelles,
  titreLong,
  avecZero,
}: {
  valeurs: number[];
  libelles: string[];
  titreLong: string;
  avecZero: boolean;
}) {
  // En coordonnées 0→100 sur la largeur et 0→24 en hauteur. Une échelle par
  // chiffre : ces trois grandeurs n'ont pas le même ordre de grandeur.
  let min = Math.min(...valeurs, avecZero ? 0 : Math.min(...valeurs));
  let max = Math.max(...valeurs, avecZero ? 0 : Math.max(...valeurs));
  // Un écart d'un euro sur 300 000 ne se dessine pas en pente : l'échelle ne
  // descend pas sous 5 % de la grandeur, et une courbe stable reste plate.
  const plancher = Math.max(1, 0.05 * Math.max(Math.abs(min), Math.abs(max)));
  if (max - min < plancher) {
    const milieu = (max + min) / 2;
    min = milieu - plancher / 2;
    max = milieu + plancher / 2;
  }
  const etendue = max - min;
  const points = valeurs.map((v, i) => ({
    x: valeurs.length === 1 ? 50 : (i / (valeurs.length - 1)) * 100,
    y: 22 - ((v - min) / etendue) * 20,
  }));
  const ligne = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const yZero = 22 - ((0 - min) / etendue) * 20;
  const bout = points.at(-1)!;
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className="mt-2 h-6 w-full sm:h-8"
      role="img"
      aria-label={`${titreLong}, tour par tour : ${valeurs
        .map((v, i) => `${libelles[i]} ${Math.round(v)}`)
        .join(", ")}`}
    >
      {/* La ligne de zéro, fine et discrète : elle dit de quel côté on est. */}
      {avecZero && yZero > 0 && yZero < 24 ? (
        <line
          x1="0"
          x2="100"
          y1={yZero}
          y2={yZero}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-white/20"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {/* LA COURBE EST CELLE DE L'ENTREPRISE, À LA TEINTE DE SON MÉTIER. Elle
          était verte ou rouge selon le signe du dernier point (elle disait un
          résultat avec une donnée), puis en bleu donnée (elle ne disait plus
          de qui elle parlait). */}
      <polyline
        points={ligne}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="text-[color:var(--metier,var(--donnee))]"
      />
      <circle
        cx={bout.x}
        cy={bout.y}
        r="2.5"
        className="stroke-slate-950 text-[color:var(--metier,var(--donnee))]"
        fill="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="6" fill="transparent">
          {/* UNE SEULE CHAÎNE dans un <title> : React rend vide, côté serveur,
              un titre à plusieurs enfants (l'erreur d'hydratation #418). */}
          <title>{`${libelles[i]} : ${formatEuro(valeurs[i]!)}`}</title>
        </circle>
      ))}
    </svg>
  );
}

/**
 * Le corps des chiffres de l'ardoise : de 32 px (téléphone) à 40 px (grand
 * écran), suivant la largeur. Un `clamp()`, pas une taille de plus.
 */
const GRAND_CHIFFRE =
  "font-display text-[clamp(2rem,1.6rem_+_1.2vw,2.5rem)] font-semibold leading-none tabular-nums";

/** Un chiffre de l'ardoise : son intitulé, sa valeur, l'écart, la courbe. */
function Chiffre({
  titre,
  titreLong,
  valeurs,
  libelles,
  teinte,
  avecZero,
}: {
  titre: string;
  /** L'intitulé entier, pour l'infobulle et pour les lecteurs d'écran. */
  titreLong: string;
  valeurs: number[];
  libelles: string[];
  /**
   * `encre` pour une grandeur (le chiffre d'affaires), `signe` pour un résultat
   * (vert ou rouge), `niveau` pour la trésorerie (l'encre, le rouge en
   * découvert seulement).
   */
  teinte: "encre" | "signe" | "niveau";
  avecZero: boolean;
}) {
  const derniere = valeurs.at(-1) ?? 0;
  const { ecart, sens } = ecartDe(valeurs);
  const couleur =
    teinte === "encre" || (teinte === "niveau" && derniere >= 0)
      ? "text-slate-50"
      : derniere >= 0
        ? "text-emerald-300"
        : "text-red-300";
  return (
    <div className="min-w-0 border-white/10 sm:border-l sm:pl-4">
      <dt
        className="truncate text-xs font-semibold uppercase tracking-etiquette text-slate-400"
        title={titreLong}
      >
        {titre}
      </dt>
      <dd className={`chiffre-cle mt-1.5 whitespace-nowrap ${GRAND_CHIFFRE} ${couleur}`}>
        {/* Le chiffre MONTE quand il vient de changer (lot 5B). */}
        <ChiffreQuiArrive
          valeur={derniere}
          plume={teinte === "signe" ? "euro-signe" : "euro"}
          memoire={`ardoise:${titre}`}
        />
      </dd>
      {/* L'ÉCART, AVEC SON SIGNE ÉCRIT. La flèche seule serait un signal de
          couleur et de forme ; le signe le dit en toutes lettres, et « stable »
          évite le « −0 € » qu'un écart nul afficherait. */}
      {sens === null ? (
        <dd className="mt-1.5 text-sm text-slate-400">premier tour</dd>
      ) : sens === "stable" ? (
        <dd className="mt-1.5 text-sm text-slate-400">stable</dd>
      ) : (
        <dd
          className={`mt-1.5 whitespace-nowrap text-sm font-semibold tabular-nums ${
            sens === "monte" ? "text-emerald-300" : "text-red-300"
          }`}
        >
          <span aria-hidden>{sens === "monte" ? "▲" : "▼"}</span> {euroSigne(ecart!)}
          <span className="sr-only"> par rapport au tour précédent</span>
        </dd>
      )}
      {valeurs.length >= 2 ? (
        <dd>
          <Courbe valeurs={valeurs} libelles={libelles} titreLong={titreLong} avecZero={avecZero} />
        </dd>
      ) : null}
    </div>
  );
}

/** Le rang, en or : la pastille du métal et la place écrite. */
function Rang({ entete }: { entete: EnTeteDeLArdoise }) {
  const { rang, rangVoile, ipg } = entete;
  if (!rang && !rangVoile) return null;
  return (
    <div className="min-w-0 border-white/10 sm:border-l sm:pl-4">
      <dt className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">Rang</dt>
      {rang ? (
        <dd className={`mt-1.5 flex items-center gap-2 whitespace-nowrap ${GRAND_CHIFFRE}`}>
          <PastilleDeRang rang={rang.place} moi doublon className="text-xl" />
          <span className="texte-or">
            {ordinal(rang.place)}
            <span className="text-lg font-medium text-slate-300"> sur {rang.sur}</span>
          </span>
        </dd>
      ) : (
        <dd className="mt-2 text-sm leading-snug text-slate-300">{rangVoile}</dd>
      )}
      {ipg !== null && ipg !== undefined ? (
        <dd className="mt-1.5 text-sm tabular-nums text-slate-400">IPG {formatDecimal(ipg, 0)}</dd>
      ) : null}
    </div>
  );
}

export function TableauDeBord({
  tours,
  entete = null,
  visage = null,
  children,
}: {
  tours: TourChiffre[];
  /** L'entreprise, le tour et le rang. Sans eux, l'ardoise n'a que ses chiffres. */
  entete?: EnTeteDeLArdoise | null;
  /** Le visage du secteur, devant le nom : la tuile et son pictogramme. */
  visage?: ReactNode;
  /** Ce qui se pose sous le nom : l'échéance, la frise des tours. */
  children?: ReactNode;
}) {
  // Rien à montrer, rien à afficher : sans tour clos ni entreprise, pas de
  // bandeau vide qui prendrait la place du jeu.
  if (tours.length === 0 && !entete) return null;
  const libelles = tours.map((t) => t.libelle);
  const avecRang = Boolean(entete && (entete.rang || entete.rangVoile));
  return (
    <section
      id="ardoise-du-dirigeant"
      aria-label="Tableau de bord du dirigeant"
      // UN ÉCRAN DE CHIFFRES, EN TÊTE DU PAPIER, sur toute la largeur de
      // l'arène : la rangée de tuiles s'arrêtait aux trois quarts et se lisait
      // comme une section parmi d'autres.
      // LOT 6A : l'ardoise porte l'arête du métier (un filet de 2 px dans sa
      // teinte, « neuf entreprises, neuf lumières ») et une lumière de scène
      // retenue, au lieu de l'aplat plat d'avant.
      className="ardoise arete-metier lumiere-de-scene rounded-xl bg-slate-950 px-4 py-4 text-slate-100 sm:px-6 sm:py-5"
    >
      <div
        className={`grid gap-x-6 gap-y-4 ${entete ? "lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-start" : ""}`}
      >
        {entete ? (
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-surtitre text-slate-400">
              Tableau de bord du dirigeant
            </p>
            <p className="mt-1 flex items-center gap-2.5 font-display text-2xl font-semibold leading-tight text-slate-50 sm:text-3xl">
              {visage}
              <span className="min-w-0">
                {entete.entreprise}
                <span aria-hidden className="text-slate-400">
                  {" · "}
                </span>
                <span className="sr-only">, </span>
                <span className="whitespace-nowrap tabular-nums">{entete.tour}</span>
              </span>
            </p>
            {entete.sousTitre ? (
              <p className="mt-0.5 truncate text-sm text-slate-300">{entete.sousTitre}</p>
            ) : null}
            {children ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">{children}</div>
            ) : null}
          </div>
        ) : null}
        {tours.length > 0 ? (
          <dl
            className={`grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-0 ${
              avecRang ? "sm:grid-cols-4" : "sm:grid-cols-3"
            }`}
          >
            <Chiffre
              titre="CA"
              titreLong="Chiffre d'affaires"
              valeurs={tours.map((t) => t.ca)}
              libelles={libelles}
              teinte="encre"
              avecZero={false}
            />
            <Chiffre
              titre="Résultat"
              titreLong="Résultat net"
              valeurs={tours.map((t) => t.resultat)}
              libelles={libelles}
              teinte="signe"
              avecZero
            />
            <Chiffre
              titre="Trésorerie"
              titreLong="Trésorerie nette"
              valeurs={tours.map((t) => t.tresorerie)}
              libelles={libelles}
              teinte="niveau"
              avecZero
            />
            {entete ? <Rang entete={entete} /> : null}
          </dl>
        ) : (
          // AVANT LE PREMIER VERDICT : une ligne, pas quatre tirets.
          <p className="max-w-xl text-base leading-relaxed text-slate-300 lg:self-center">
            Chiffre d&apos;affaires, résultat, trésorerie et rang s&apos;afficheront ici dès que le
            marché aura répondu à vos premières décisions.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * L'ARDOISE REPLIÉE : UNE LIGNE, CA · Rés. · Tréso. · Rang.
 *
 * Ce que l'ardoise devient quand on défile : les mêmes chiffres, sans courbe
 * ni intitulé long, sur une ligne d'environ 33 px qui reste en haut de
 * l'écran (voir `ardoise-repliee.tsx`, qui la montre et la cache). Le signe
 * reste écrit ; l'écart se lit sur l'ardoise.
 */
export function LigneDeLArdoise({
  tours,
  entete,
}: {
  tours: TourChiffre[];
  entete: EnTeteDeLArdoise;
}) {
  const dernier = tours.at(-1);
  const item = "flex shrink-0 items-baseline gap-1 whitespace-nowrap";
  const etiquette = "text-xs font-semibold text-slate-400";
  return (
    <p className="flex min-w-0 items-center gap-x-3 overflow-hidden text-sm tabular-nums sm:gap-x-5">
      <span className="hidden shrink-0 items-baseline gap-1.5 font-display text-base font-semibold text-slate-50 sm:inline-flex">
        {/* Le repère d'appartenance : la teinte du métier, devant le nom. */}
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--metier,var(--donnee))]"
        />
        {entete.entreprise} · {entete.tour}
      </span>
      {dernier ? (
        <>
          <span className={item}>
            <span className={etiquette}>CA</span>
            <span className="font-semibold text-slate-50">{formatEuro(dernier.ca)}</span>
          </span>
          <span className={item}>
            <span className={etiquette}>Rés.</span>
            <span
              className={`font-semibold ${dernier.resultat >= 0 ? "text-emerald-300" : "text-red-300"}`}
            >
              {euroSigne(dernier.resultat)}
            </span>
          </span>
          <span className={item}>
            <span className={etiquette}>Tréso.</span>
            <span
              className={`font-semibold ${dernier.tresorerie >= 0 ? "text-slate-50" : "text-red-300"}`}
            >
              {formatEuro(dernier.tresorerie)}
            </span>
          </span>
          {entete.rang ? (
            <span className={`${item} items-center`}>
              <span className={`${etiquette} hidden sm:inline`}>Rang</span>
              <span className="texte-or font-semibold">
                {ordinal(entete.rang.place)}/{entete.rang.sur}
              </span>
            </span>
          ) : null}
        </>
      ) : (
        <span className="truncate font-display text-base font-semibold text-slate-50 sm:hidden">
          {entete.entreprise} · {entete.tour}
        </span>
      )}
    </p>
  );
}
