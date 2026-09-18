import {
  BANDE_DU_PLI,
  MENTION_DU_PLI,
  NATURES,
  dureeDuCourrier,
  type CourrierDef,
} from "@/config/courriers/types";
import { courrierParCode, positionDuCourrier, referenceDuCourrier } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE, estUnCourrierDeRoutine } from "@/config/courriers/routine";
import { BrandMark } from "@/components/brand-mark";

/**
 * LE COURRIER DE L'ENTREPRISE : une enveloppe, puis la lettre qu'elle contient.
 *
 * L'animation d'ouverture est du pur théâtre CSS — le tirage réel est fait par
 * le PRNG seedé du moteur, ou décidé par l'enseignant.
 *
 * LE MÊME PAPIER DES DEUX CÔTÉS. L'enveloppe et sa lettre partagent l'ivoire,
 * l'encre, le filet et l'ombre (classe `papier`, globals.css) : ce qui sort de
 * l'enveloppe doit être de la même matière que l'enveloppe. Elles ne diffèrent
 * que par ce qui les distingue vraiment — les marques postales d'un côté, le
 * texte de l'autre — et se répondent sur trois repères posés au même endroit :
 * l'expéditeur en haut à gauche, la référence en bas à droite, la liasse en
 * bas à gauche.
 *
 * TROIS PLIS. Le recommandé porte sa bande rouge sur la tranche, le pli simple
 * n'a rien, la note de service circule dans une pochette interne : ni timbre
 * ni cachet, mais la grille de circulation des enveloppes navette. Un chef
 * d'atelier n'affranchit pas son rapport.
 */

/**
 * Le courrier d'un code, qu'il vienne d'une liasse ou de la routine. Les
 * courriers de routine ne sont pas au registre — ils ne sont jamais tirés —,
 * mais ils se lisent et s'impriment comme les autres.
 */
const routineParCode = new Map(COURRIERS_DE_ROUTINE.map((c) => [c.code, c]));

function courrier(code: string): CourrierDef | undefined {
  return courrierParCode.get(code) ?? routineParCode.get(code);
}

/**
 * L'ENVELOPPE, écrite une fois : l'écran l'anime, le papier l'imprime. C'est
 * ce partage qui garantit que le pli distribué en classe est le même que celui
 * que l'élève ouvre dans l'arène.
 */
export function Enveloppe({
  code,
  liasse,
  destinataire,
  className = "",
}: {
  /** Le courrier contenu, s'il est connu : il donne le timbre et le cachet. */
  code?: string;
  /** La liasse imprimée en pied d'enveloppe. */
  liasse?: string | null;
  /** À qui le pli est adressé : « Tout le marché », « Équipe 3 ». */
  destinataire?: string;
  className?: string;
}) {
  const c = code ? courrier(code) : undefined;
  const nature = c ? NATURES[c.nature] : null;
  const interne = c?.pli === "interne";
  const bande = c ? BANDE_DU_PLI[c.pli] : null;
  const reference = code ? referenceDuCourrier(code) : null;

  return (
    <div className={`papier enveloppe relative rounded-lg p-3 ${className}`}>
      <div className="relative flex h-full min-h-full flex-col">
        {/* tranche gauche : recommandé en rouge, note de service en ardoise */}
        {bande ? (
          <span
            className="enveloppe-bande absolute inset-y-0 left-0 w-5 rounded-sm py-2 text-center text-xs font-bold uppercase text-white"
            style={{ backgroundColor: c!.pli === "recommande" ? "#b91c1c" : "#475569" }}
          >
            {bande.mention}
          </span>
        ) : null}

        <div className={`flex items-start justify-between gap-2 ${bande ? "pl-7" : ""}`}>
          {/* expéditeur et cachet, en haut à gauche */}
          <span className="min-w-0">
            <span className="douce block text-xs font-semibold uppercase leading-snug tracking-wide">
              {c ? c.expediteur : "Business Arena"}
            </span>
            {nature ? (
              <span
                className="mt-1 inline-block -rotate-2 rounded-sm border border-dashed px-1.5 py-0.5 text-xs font-bold uppercase leading-none tracking-wide"
                style={{ borderColor: nature.encre, color: nature.encre }}
              >
                {interne ? "Note de service" : nature.mention}
              </span>
            ) : null}
          </span>
          {/*
            Le timbre, sauf pour la note de service : une enveloppe navette
            n'est jamais affranchie, et c'est à cela qu'on la reconnaît de loin.
          */}
          {interne ? null : (
            <span
              className="enveloppe-timbre flex h-10 w-9 shrink-0 items-center justify-center rounded-[2px] text-lg"
              aria-hidden
            >
              {c ? c.emoji : "✉️"}
            </span>
          )}
        </div>

        {/* la grille de circulation, propre à la pochette interne */}
        {interne ? (
          <div className={`mt-2 ${bande ? "pl-7" : ""}`}>
            <span className="tenue block text-xs uppercase tracking-widest">Circulation</span>
            <span className="enveloppe-circulation mt-1 block h-7 w-full max-w-[11rem]" aria-hidden />
          </div>
        ) : null}

        {/* la fenêtre du destinataire */}
        <div className={`mt-auto ${bande ? "pl-7" : ""}`}>
          <span className="creux filet inline-block rounded-sm border border-dashed px-2.5 py-1.5 text-xs leading-relaxed">
            <span className="tenue block text-xs uppercase tracking-widest">Destinataire</span>
            {destinataire ?? "L'entreprise"}
          </span>
        </div>

        <div className={`mt-2 flex items-end justify-between gap-2 ${bande ? "pl-7" : ""}`}>
          <span className="tenue flex items-center gap-1.5 text-xs uppercase tracking-[0.15em]">
            <BrandMark className="h-3.5 w-3.5" />
            {liasse ?? "Business Arena"}
          </span>
          {reference ? <span className="tenue text-xs tabular-nums">{reference}</span> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * LA LETTRE, écrite une fois elle aussi.
 *
 * La formule d'appel et la politesse sont DESSINÉES, pas stockées : les
 * répéter dans deux cents textes serait deux cents occasions de les écrire
 * différemment. Ne reste dans la donnée que ce qui varie — qui écrit, à quel
 * sujet, pour dire quoi. Une note de service, elle, n'en porte aucune : on
 * n'écrit pas « Madame, Monsieur » à son propre atelier.
 */
export function Lettre({
  code,
  annonce = false,
  destinataire,
  surligne = false,
}: {
  code: string;
  /** Courrier annoncé par l'enseignant, pas encore appliqué. */
  annonce?: boolean;
  destinataire?: string;
  /** Vrai quand le courrier s'adresse à l'entreprise de celui qui le lit. */
  surligne?: boolean;
}) {
  const c = courrier(code);
  if (!c) return null;
  const nature = NATURES[c.nature];
  const position = positionDuCourrier(code);
  const reference = referenceDuCourrier(code);
  const duree = dureeDuCourrier(c);
  const routine = estUnCourrierDeRoutine(code);
  const interne = c.pli === "interne";

  return (
    <div
      className="papier lettre rounded-lg p-3"
      style={
        {
          "--cachet": nature.encre,
          // Le liseré du destinataire est écrit en dur : sur du papier, un
          // jeton de thème s'inverserait avec le site.
          ...(surligne ? { boxShadow: "0 0 0 2px #0369a1" } : {}),
        } as React.CSSProperties
      }
    >
      {/*
        `min-h-full` et non `h-full` : la hauteur est un plancher, pas un
        plafond. Une lettre au corps long grandit avec son contenu au lieu
        d'en laisser déborder la signature ; en rangée, toutes prennent la
        hauteur de la plus haute (globals.css).
      */}
      <div className="flex min-h-full flex-col">
        {/* en-tête : qui écrit, et sous quelle forme */}
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 font-display text-xs font-semibold uppercase leading-snug tracking-wide">
            {c.expediteur}
          </span>
          <span
            className="shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide"
            style={{ borderColor: nature.encre, color: nature.encre }}
          >
            {annonce ? "annoncé" : nature.label}
          </span>
        </div>
        <div className="filet mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b pb-2 text-xs">
          <span
            className={c.pli === "simple" ? "tenue" : "font-semibold"}
            style={c.pli === "recommande" ? { color: "#b91c1c" } : undefined}
          >
            {MENTION_DU_PLI[c.pli]}
          </span>
          {reference ? <span className="tenue tabular-nums">Nos réf. : {reference}</span> : null}
        </div>

        {destinataire ? (
          <span
            className={`mt-2.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-semibold ${
              surligne ? "" : "filet creux tenue"
            }`}
            style={surligne ? { borderColor: "#0369a1", color: "#0369a1" } : undefined}
          >
            {destinataire}
          </span>
        ) : null}

        <p className="mt-2.5 text-sm font-semibold leading-snug">
          <span className="tenue">Objet : </span>
          {c.objet}
        </p>

        {interne ? null : <p className="douce mt-2.5 text-xs italic">Madame, Monsieur,</p>}
        <p className={`douce ${interne ? "mt-2.5" : "mt-1"} text-xs leading-relaxed`}>{c.corps}</p>
        <p className="douce mt-2 text-right text-xs italic leading-snug">
          {interne ? null : (
            <>
              Veuillez agréer nos salutations distinguées.
              <br />
            </>
          )}
          <span className="not-italic">{c.signataire}</span>
        </p>

        {/* ce que l'entreprise doit en faire, et ses pastilles de durée */}
        <div className="creux filet mt-auto rounded-lg border px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-xs font-semibold leading-snug ${routine ? "douce" : ""}`}>
              {routine ? "🗂️" : "⚡"} {c.effet}
            </p>
            {routine ? null : (
              <span
                className="tenue mt-0.5 shrink-0 text-xs tracking-widest"
                aria-label={`${duree} tour${duree > 1 ? "s" : ""}`}
                title={`${duree} tour${duree > 1 ? "s" : ""}`}
              >
                {"●".repeat(duree)}
              </span>
            )}
          </div>
        </div>
        <p className="douce mt-2 text-xs leading-snug">💡 {c.enJeu}</p>

        <div className="filet mt-2 flex items-end justify-between border-t pt-1.5">
          <span className="tenue text-xs uppercase tracking-[0.15em]">
            {position
              ? `${position.liasse} · ${position.index} / ${position.total}`
              : "Courrier de routine"}
          </span>
          <span className="text-base" aria-hidden>
            {c.emoji}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Le pli distribué : l'enveloppe, puis la lettre qui en sort. */
export function CourrierRecommande({
  code,
  delayMs = 0,
  annonce = false,
  destinataire,
  surligne = false,
}: {
  code: string;
  delayMs?: number;
  annonce?: boolean;
  /** Destinataire affiché : « Tout le marché » ou « → Équipe 3 ». */
  destinataire?: string;
  surligne?: boolean;
}) {
  const c = courrier(code);
  if (!c) {
    return (
      <div className="rounded-lg border border-amber-400/20 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
        ✉️ {code}
      </div>
    );
  }
  const position = positionDuCourrier(code);

  return (
    <div className="pli-scene" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="pli-ouverture" style={{ animationDelay: `${delayMs}ms` }}>
        <Enveloppe
          code={code}
          liasse={position?.liasse}
          destinataire={destinataire}
          className="h-full"
        />
        <Lettre code={code} annonce={annonce} destinataire={destinataire} surligne={surligne} />
      </div>
    </div>
  );
}
