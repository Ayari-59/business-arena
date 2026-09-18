import { MENTION_DU_PLI, NATURES, dureeDuCourrier, type CourrierDef } from "@/config/courriers/types";
import { courrierParCode, positionDuCourrier, referenceDuCourrier } from "@/config/courriers/registre";
import { COURRIERS_DE_ROUTINE, estUnCourrierDeRoutine } from "@/config/courriers/routine";
import { BrandMark } from "@/components/brand-mark";

/**
 * LE COURRIER DE L'ENTREPRISE : une enveloppe, puis la lettre qu'elle contient.
 *
 * L'animation d'ouverture est du pur théâtre CSS — le tirage réel est fait par
 * le PRNG seedé du moteur, ou décidé par l'enseignant.
 *
 * ANATOMIE D'UN PLI. L'enveloppe porte ce qu'on lit avant d'ouvrir : le rabat,
 * le timbre, le cachet de la poste, l'expéditeur en haut à gauche, le
 * destinataire dans la fenêtre, la bande rouge du recommandé sur la tranche.
 * La lettre porte ce qu'on lit après : l'en-tête de l'expéditeur, la mention
 * du pli, la référence, l'objet, le corps, la signature — puis, en pied, ce
 * que l'entreprise doit en faire.
 *
 * Ces conventions-là, plus que la couleur, font qu'on tient un courrier et
 * non un encart.
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
  /** À qui le pli est adressé : « Toute la classe », « Équipe 3 ». */
  destinataire?: string;
  className?: string;
}) {
  const c = code ? courrier(code) : undefined;
  const nature = c ? NATURES[c.nature] : null;
  const recommande = c?.pli !== "simple";
  const reference = code ? referenceDuCourrier(code) : null;

  return (
    <div className={`enveloppe rounded-lg p-3 ${className}`}>
      <div className="relative flex h-full min-h-full flex-col">
        {/* tranche gauche : la bande du recommandé */}
        {recommande ? (
          <span className="enveloppe-recommande absolute inset-y-0 left-0 w-5 rounded-sm bg-red-700 py-2 text-center text-xs font-bold uppercase text-white">
            Recommandé A.R.
          </span>
        ) : null}

        <div className={`flex items-start justify-between gap-2 ${recommande ? "pl-7" : ""}`}>
          {/* expéditeur et cachet de la poste, en haut à gauche */}
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase leading-snug tracking-wide opacity-70">
              {c ? c.expediteur : "Business Arena"}
            </span>
            {nature ? (
              <span
                className="mt-1 inline-block -rotate-2 rounded-sm border border-dashed px-1.5 py-0.5 text-xs font-bold uppercase leading-none tracking-wide"
                style={{ borderColor: nature.accent, color: nature.accent }}
              >
                {nature.mention}
              </span>
            ) : null}
          </span>
          {/* le timbre */}
          <span
            className="enveloppe-timbre flex h-10 w-9 shrink-0 items-center justify-center rounded-[2px] text-lg"
            aria-hidden
          >
            {c ? c.emoji : "✉️"}
          </span>
        </div>

        {/* la fenêtre du destinataire */}
        <div className={`mt-auto ${recommande ? "pl-7" : ""}`}>
          <span className="inline-block rounded-sm border border-dashed border-current/30 bg-white/60 px-2.5 py-1.5 text-xs leading-relaxed">
            <span className="block text-xs uppercase tracking-widest opacity-50">
              Destinataire
            </span>
            {destinataire ?? "L'entreprise"}
          </span>
        </div>

        <div className={`mt-2 flex items-end justify-between gap-2 ${recommande ? "pl-7" : ""}`}>
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] opacity-50">
            <BrandMark className="h-3.5 w-3.5" />
            {liasse ?? "Business Arena"}
          </span>
          {reference ? (
            <span className="text-xs tabular-nums opacity-50">{reference}</span>
          ) : null}
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
 * sujet, pour dire quoi.
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

  return (
    <div
      className={`lettre rounded-lg border-2 bg-slate-900 p-2 ${nature.className.split(" ")[0]} ${
        surligne ? "ring-2 ring-sky-400/70" : ""
      }`}
      style={{ "--cachet": nature.accent } as React.CSSProperties}
    >
      {/*
        `min-h-full` et non `h-full` : la hauteur est un plancher, pas un
        plafond. Une lettre au corps long grandit avec son contenu au lieu
        d'en laisser déborder la signature ; en rangée, toutes prennent la
        hauteur de la plus haute (globals.css).
      */}
      <div className="flex min-h-full flex-col rounded-md border border-white/10 p-3">
        {/* en-tête : qui écrit, et sous quelle forme */}
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 font-display text-xs font-semibold uppercase leading-snug tracking-wide text-slate-200">
            {c.expediteur}
          </span>
          <span
            className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${nature.className}`}
          >
            {annonce ? "annoncé" : nature.label}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-white/10 pb-2 text-xs text-slate-500">
          <span className={c.pli === "recommande" ? "font-semibold text-red-300" : ""}>
            {MENTION_DU_PLI[c.pli]}
          </span>
          {reference ? <span className="tabular-nums">Nos réf. : {reference}</span> : null}
        </div>

        {destinataire ? (
          <span
            className={`mt-2.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-semibold ${
              surligne
                ? "border-sky-400/60 bg-sky-400/10 text-sky-300"
                : "border-white/10 bg-white/5 text-slate-400"
            }`}
          >
            {destinataire}
          </span>
        ) : null}

        <p className="mt-2.5 text-sm font-semibold leading-snug text-slate-50">
          <span className="text-slate-400">Objet : </span>
          {c.objet}
        </p>

        <p className="mt-2.5 text-xs italic text-slate-400">Madame, Monsieur,</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">{c.corps}</p>
        <p className="mt-2 text-right text-xs italic leading-snug text-slate-400">
          Veuillez agréer nos salutations distinguées.
          <span className="mt-0.5 block not-italic text-slate-300">{c.signataire}</span>
        </p>

        {/* ce que l'entreprise doit en faire, et ses pastilles de durée */}
        <div
          className={`mt-auto rounded-lg border px-3 py-2 ${
            routine ? "border-white/5 bg-slate-950/60" : "border-white/5 bg-slate-950"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-xs font-semibold leading-snug ${
                routine ? "text-slate-400" : "text-slate-100"
              }`}
            >
              {routine ? "🗂️" : "⚡"} {c.effet}
            </p>
            {routine ? null : (
              <span
                className="mt-0.5 shrink-0 text-xs tracking-widest text-slate-400"
                aria-label={`${duree} tour${duree > 1 ? "s" : ""}`}
                title={`${duree} tour${duree > 1 ? "s" : ""}`}
              >
                {"●".repeat(duree)}
              </span>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs leading-snug text-slate-400">💡 {c.enJeu}</p>

        <div className="mt-2 flex items-end justify-between border-t border-white/5 pt-1.5">
          <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
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
  /** Destinataire affiché : « Toute la classe » ou « → Équipe 3 ». */
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
