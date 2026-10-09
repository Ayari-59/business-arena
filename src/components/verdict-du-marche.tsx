import type { ReactNode } from "react";
import { ordinal, formatDecimal } from "@/lib/format";
import { PastilleDeRang, metalDuRang } from "@/components/rang";
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
 *   2. LE chiffre, en très grand, blanc cassé, avec sa flèche et son écart
 *      signé en vert ou en rouge francs ; pas de fond teinté ;
 *   3. la cause (le verdict en une phrase, et ce qui a fait le résultat :
 *      lot 6E), puis la place (le rang en or avec sa médaille).
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

function Ecart({ ecart, grand }: { ecart: EcartDuVerdict; grand: boolean }) {
  return (
    <p
      className={`${grand ? "mt-3 text-lg sm:text-xl" : "mt-1 text-sm sm:text-base"} font-semibold tabular-nums ${
        ecart.sens ? TEINTE[ecart.sens] : "text-slate-200"
      }`}
    >
      <span className="whitespace-nowrap">
        {ecart.sens ? <span aria-hidden>{FLECHE[ecart.sens]} </span> : null}
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
  const metal = rang ? metalDuRang(rang.place) : null;
  return (
    <div
      data-verdict-du-marche={forme}
      className={`${animer ? "rituel" : ""} ${
        ecran
          ? "mx-auto w-full max-w-4xl text-center"
          : "grid gap-x-8 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]"
      }`}
    >
      {/* PREMIER TEMPS : ce qu'on révèle. */}
      <div data-temps="1" className={ecran ? "" : "sm:col-span-2"}>
        <p className="text-xs font-semibold uppercase tracking-annonce text-slate-400">
          {surtitre}
        </p>
        {ecran ? (
          <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl">
            {titre}
          </h1>
        ) : (
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight text-slate-50 sm:text-2xl">
            {titre}
          </h2>
        )}
      </div>

      {/* DEUXIÈME TEMPS : le chiffre, et d'où il vient. */}
      <div data-temps="2" role="status" aria-live="polite" className={ecran ? "mt-4 sm:mt-5" : ""}>
        <p className="text-xs font-semibold uppercase tracking-surtitre text-slate-400">
          {chiffre.libelle}
        </p>
        <p
          className={`flex items-center gap-3 font-display font-semibold leading-none tabular-nums text-slate-50 ${
            ecran
              ? "mt-2 justify-center text-7xl"
              : "mt-1 text-[clamp(2rem,1.6rem_+_1.2vw,2.5rem)]"
          }`}
        >
          {chiffre.sens ? (
            <span
              aria-hidden
              className={`${ecran ? "text-4xl sm:text-5xl" : "text-xl"} ${TEINTE[chiffre.sens]}`}
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
              ? "mx-auto mt-5 max-w-4xl border-t border-white/10 pt-4 sm:mt-6"
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
          {explication ? <div className={phrase ? "mt-5" : ""}>{explication}</div> : null}
          {rang ? (
            <p
              className={`${phrase || explication ? (ecran ? "mt-5" : "mt-4") : ""} flex items-center gap-3 font-display font-semibold leading-none tabular-nums ${
                ecran ? "justify-center text-4xl" : "text-2xl"
              }`}
            >
              <PastilleDeRang
                rang={rang.place}
                moi
                doublon
                className={ecran ? "text-3xl" : "text-xl"}
              />
              <span className="texte-or">
                {ordinal(rang.place)} sur {rang.sur}
              </span>
              <span className="sr-only">
                {metal ? `, médaille ${metal === "or" ? "d'or" : `de ${metal}`}` : ""}
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
