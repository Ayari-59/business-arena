import type { ReactNode } from "react";
import { ordinal, formatDecimal } from "@/lib/format";
import { ChiffreQuiArrive } from "@/components/chiffre-qui-arrive";
import type { NomDePlume } from "@/lib/plumes";

/**
 * « LE MARCHÉ RÉPOND » : UN RITUEL, UNE GRAMMAIRE.
 *
 * Le moment qui devait signer la marque était une petite carte de 450 px sur
 * une page claire : un halo pêche, un résultat sur un dégradé rose ou menthe,
 * une pastille vert pâle, et une cascade d'apparitions qui laissait l'écran
 * vide la première demi-seconde. Le fond était juste ; la forme flanchait au
 * seul instant où toute la classe regarde.
 *
 * Trois temps, sur le marine, et rien d'autre :
 *   1. ce qu'on révèle (« Tour 3 · le marché a répondu ») ;
 *   2. LE chiffre, en très grand, son signe écrit, et son écart signé au tour
 *      précédent ; pas de fond teinté. Lot P3 : le grand triangle qui le
 *      précédait sur l'écran du rituel faisait pictogramme d'alerte ; il est
 *      parti. Le signe suffit (« −3 480 € »), la couleur porte le sens (le
 *      chiffre en vert ou en rouge francs, sans halo), et une FLÈCHE FINE, d'un
 *      trait, reste devant l'écart ;
 *   3. la cause (le verdict en une phrase, et ce qui a fait le résultat :
 *      lot 6E), puis la place : le rang écrit UNE fois, en or (« 2e sur 3 »).
 *      Lot P5 : la médaille ronde « 2 » posée à côté le disait deux fois ; elle
 *      est partie. Une médaille ne reste que là où elle est SEULE à dire le rang
 *      (podium, classement en liste).
 * Puis les actions.
 *
 * LA MÊME GRAMMAIRE SERT DEUX FOIS. En plein écran à la fin d'un tour de
 * l'arène (`forme="ecran"`) ; en bande marine en tête de la conséquence d'une
 * décision, dans un épisode (`forme="bande"`) : un chiffre clé, son écart au
 * budget, une phrase. Le composant ne calcule rien : les chiffres et la phrase
 * lui viennent des écrans qui les ont déjà (aucune donnée inventée).
 *
 * LE CHIFFRE ARRIVE, IL NE SE TROUVE PAS LÀ. C'est le moment où le marché
 * répond : le résultat monte depuis celui du tour précédent, et l'écart signé
 * depuis zéro (voir `components/chiffre-qui-arrive.tsx`). Le mouvement ne se
 * joue que si la valeur a changé depuis la dernière fois que cet onglet l'a
 * montrée : un écran rouvert ou rechargé reste immobile. Il faut pour cela que
 * l'appelant donne le NOMBRE à côté de sa mise en forme (`nombre`) ; sans lui,
 * le chiffre s'affiche posé, comme avant.
 *
 * LOT 6E : LA CAUSE S'EST ÉTOFFÉE (la cascade et les causes chiffrées) ; pour
 * que l'action reste dans la fenêtre d'un écran de 1280 × 800, le chiffre se
 * pose à 72 px (le bas de la fourchette 72 à 96 du lot 3A), le rang à 36 px, et
 * l'IPG se lit sur la ligne du rang.
 *
 * LE CONTENU EST COMPLET À L'ÉTAT FINAL, MÊME SANS ANIMATION. Les trois temps
 * ne font qu'apparaître ce qui est déjà dans la page (1,3 s en tout, voir
 * « LOT 3A » dans globals.css) : un lecteur d'écran les lit sans attendre, une
 * capture les trouve tous, les boutons se prennent au clavier dès le premier
 * instant, et qui a demandé moins d'animation voit l'écran entier d'un coup.
 * Le résultat est annoncé poliment (`aria-live="polite"`).
 */

export type SensDUnEcart = "gain" | "perte" | null;

export interface ChiffreDuVerdict {
  /** « Résultat net du tour », « RevPAR, semaines 1 à 2 ». */
  libelle: string;
  /** La valeur déjà formatée, signe compris : « −294 € ». */
  valeur: string;
  /** Le sens de la flèche : un gain monte, une perte descend ; null, pas de flèche. */
  sens: SensDUnEcart;
  /**
   * Le nombre derrière la valeur, et de quoi l'écrire : le NOM d'une plume de
   * la maison (`plume`) depuis un écran de serveur, ou la mise en forme
   * elle-même (`ecrire`) depuis un écran déjà client. Fournis, le chiffre
   * MONTE jusqu'à lui quand il vient de changer ; absents, il se pose.
   */
  nombre?: number;
  plume?: NomDePlume;
  ecrire?: (n: number) => string;
  /** D'où il monte : le même chiffre au tour précédent, zéro par défaut. */
  depuis?: number;
}

export interface EcartDuVerdict {
  /** L'écart signé, déjà formaté : « +4 000 € ». */
  valeur: string;
  /** Le nombre derrière l'écart, et de quoi l'écrire : il monte depuis zéro. */
  nombre?: number;
  plume?: NomDePlume;
  ecrire?: (n: number) => string;
  /** Ce à quoi il se compare : « par rapport au tour précédent », « sur le budget ». */
  mention: string;
  /** Bon ou mauvais : le vert ou le rouge ; null quand le sens n'est pas connu. */
  sens: SensDUnEcart;
}

const TEINTE: Record<"gain" | "perte", string> = {
  gain: "text-emerald-300",
  perte: "text-red-300",
};
const FLECHE: Record<"gain" | "perte", string> = { gain: "▲", perte: "▼" };

/**
 * LA FLÈCHE FINE DE L'ÉCART (lot P3) : un trait d'un pixel et demi, qui prend
 * l'encre de l'écart. Le triangle plein (▲ ▼) pesait autant que le chiffre ;
 * une flèche dit le sens et s'efface derrière le montant. Décorative : le
 * montant signé dit tout.
 */
function FlecheFine({ sens }: { sens: "gain" | "perte" }) {
  return (
    <svg
      aria-hidden
      data-fleche-fine={sens}
      viewBox="0 0 12 16"
      width="0.75em"
      height="1em"
      className="mr-1 inline-block h-[1em] w-[0.75em] align-[-0.125em]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={sens === "gain" ? "M6 14V2.5M2 6.5l4-4 4 4" : "M6 2v11.5M2 9.5l4 4 4-4"} />
    </svg>
  );
}

function Ecart({ ecart, grand }: { ecart: EcartDuVerdict; grand: boolean }) {
  return (
    <p
      className={`${grand ? "mt-3 text-lg sm:text-xl" : "mt-1 text-sm sm:text-base"} font-semibold tabular-nums ${
        ecart.sens ? TEINTE[ecart.sens] : "text-slate-200"
      }`}
    >
      <span className="whitespace-nowrap">
        {ecart.sens ? <FlecheFine sens={ecart.sens} /> : null}
        {/* L'ÉCART MONTE DEPUIS ZÉRO : un écart est une distance parcourue, et
            c'est elle qu'on regarde se parcourir. */}
        {ecart.nombre !== undefined && (ecart.plume || ecart.ecrire) ? (
          <ChiffreQuiArrive
            valeur={ecart.nombre}
            plume={ecart.plume}
            format={ecart.ecrire}
            depuis={0}
            memoire="verdict:ecart"
          />
        ) : (
          ecart.valeur
        )}
      </span>{" "}
      <span className="font-normal text-slate-300">{ecart.mention}</span>
    </p>
  );
}

export function VerdictDuMarche({
  forme,
  surtitre,
  titre,
  chiffre,
  ecart = null,
  rang = null,
  ipg = null,
  phrase = null,
  complement = null,
  explication = null,
  actions = null,
  animer = true,
}: {
  forme: "ecran" | "bande";
  /** Au-dessus du titre, en petites capitales : « NOVA · Verdict du marché ». */
  surtitre: string;
  /** Le premier temps : « Tour 3 · le marché a répondu ». */
  titre: string;
  chiffre: ChiffreDuVerdict;
  ecart?: EcartDuVerdict | null;
  rang?: { place: number; sur: number } | null;
  ipg?: number | null;
  /** Le verdict, en une phrase. */
  phrase?: string | null;
  /** Sous le chiffre, en petit : les autres chiffres du moment (CA, trésorerie). */
  complement?: ReactNode;
  /**
   * CE QUI A FAIT LE RÉSULTAT (lot 6E) : la cascade et les causes chiffrées,
   * lues dans les comptes du tour. Elle vient avec la phrase du verdict, APRÈS
   * le chiffre et AVANT la place : le chiffre, puis la cause, puis le rang.
   */
  explication?: ReactNode;
  actions?: ReactNode;
  /** Les trois temps se jouent ; faux, tout s'affiche d'un coup. */
  animer?: boolean;
}) {
  const ecran = forme === "ecran";
  return (
    <div
      data-verdict-du-marche={forme}
      className={`${animer ? "rituel" : ""} ${
        ecran
          ? // LOT P8 : 64 rem (au lieu de 56) pour que le relevé « ce qui a fait le
            // résultat » ait une piste lisible à côté des causes ; les textes
            // centrés gardent leurs propres largeurs.
            "mx-auto w-full max-w-5xl text-center"
          : "grid gap-x-8 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]"
      }`}
    >
      {/* PREMIER TEMPS : ce qu'on révèle. */}
      <div data-temps="1" className={ecran ? "" : "sm:col-span-2"}>
        <p className="surtitre">
          {surtitre}
        </p>
        {ecran ? (
          <h1 className="mt-2 text-3xl font-bold leading-[1.1] text-slate-50 sm:text-4xl">
            {titre}
          </h1>
        ) : (
          <h2 className="mt-1 text-xl font-semibold leading-tight text-slate-50 sm:text-2xl">
            {titre}
          </h2>
        )}
      </div>

      {/* DEUXIÈME TEMPS : le chiffre, et d'où il vient. */}
      <div data-temps="2" role="status" aria-live="polite" className={ecran ? "mt-4 sm:mt-5" : ""}>
        <p className="libelle">
          {chiffre.libelle}
        </p>
        <p
          data-chiffre-du-verdict=""
          className={`flex items-center gap-3 font-display font-semibold leading-none tabular-nums ${
            ecran
              ? `mt-2 justify-center text-7xl ${chiffre.sens ? TEINTE[chiffre.sens] : "text-slate-50"}`
              : "mt-1 text-[clamp(2rem,1.6rem_+_1.2vw,2.5rem)] text-slate-50"
          }`}
        >
          {/* LE GRAND TRIANGLE N'EST PLUS SUR L'ÉCRAN DU RITUEL (lot P3) : le
              signe et la couleur du chiffre disent le sens. La bande d'un
              épisode garde son petit repère, à la taille du texte. */}
          {chiffre.sens && !ecran ? (
            <span
              aria-hidden
              className={`text-xl ${TEINTE[chiffre.sens]}`}
            >
              {FLECHE[chiffre.sens]}
            </span>
          ) : null}
          <span className="whitespace-nowrap">
            {chiffre.nombre !== undefined && (chiffre.plume || chiffre.ecrire) ? (
              <ChiffreQuiArrive
                valeur={chiffre.nombre}
                plume={chiffre.plume}
                format={chiffre.ecrire}
                depuis={chiffre.depuis ?? 0}
                memoire="verdict:chiffre"
              />
            ) : (
              chiffre.valeur
            )}
          </span>
        </p>
        {ecart ? <Ecart ecart={ecart} grand={ecran} /> : null}
        {complement}
      </div>

      {/* TROISIÈME TEMPS : la cause, puis la place. Le verdict en une phrase et ce
          qui a fait le résultat (lot 6E) viennent AVANT le rang en or : le
          chiffre, puis la cause, puis la place. */}
      {rang || phrase || explication ? (
        <div
          data-temps="3"
          className={
            ecran
              ? "mx-auto mt-5 max-w-5xl border-t border-white/10 pt-4 sm:mt-6"
              : "self-end sm:max-w-sm"
          }
        >
          {phrase ? (
            <p
              className={`${
                ecran ? "mx-auto max-w-3xl text-base leading-relaxed sm:text-lg" : "text-sm leading-relaxed"
              } text-slate-200`}
            >
              {phrase}
            </p>
          ) : null}
          {/* LOT P8 : un cran de moins autour du relevé à l'écran du rituel (sa
              tête et ses six lignes de 28 px), pour que l'action reste là où
              elle était dans la fenêtre. */}
          {explication ? (
            <div className={phrase ? (ecran ? "mt-4" : "mt-5") : ""}>{explication}</div>
          ) : null}
          {rang ? (
            <p
              className={`${phrase || explication ? "mt-4" : ""} flex items-center gap-3 font-display font-semibold leading-none tabular-nums ${
                ecran ? "justify-center text-4xl" : "text-2xl"
              }`}
            >
              {/* LE RANG, DIT UNE FOIS (lot P5) : en or, en toutes lettres. La
                  médaille du podium posée devant le redisait. */}
              <span className="texte-or">
                {ordinal(rang.place)} sur {rang.sur}
              </span>
              {/* Sur l'écran du rituel, l'IPG se lit sur la ligne du rang (lot 6E) :
                  une ligne de moins, pour que l'action reste dans la fenêtre. */}
              {ecran && ipg !== null ? (
                <span className="self-end pb-1 font-sans text-sm font-normal text-slate-400">
                  IPG {formatDecimal(ipg, 0)}
                </span>
              ) : null}
            </p>
          ) : null}
          {rang && ipg !== null && !ecran ? (
            <p className="mt-2 text-sm tabular-nums text-slate-400">IPG {formatDecimal(ipg, 0)}</p>
          ) : null}
        </div>
      ) : null}

      {actions ? (
        <div
          data-temps="4"
          className={
            ecran
              ? "mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"
              : "flex flex-wrap gap-3 sm:col-span-2"
          }
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
