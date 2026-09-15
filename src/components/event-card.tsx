import { CARD_CATEGORIES, cardByCode, cardPosition, dureeDeLaCarte } from "@/config/events/cards";
import { BrandMark } from "@/components/brand-mark";

/**
 * Carte événement : l'habillage théâtral du moteur d'événements (§19).
 * L'animation de retournement est du pur théâtre CSS — le tirage réel est
 * fait par le PRNG seedé du moteur (ou annoncé par l'enseignant).
 *
 * ANATOMIE D'UNE CARTE À JOUER. La silhouette haute d'un jeu de poche, un double
 * cadre (le liseré de l'enseigne, puis le filet intérieur), l'index de coin
 * en haut à gauche et son miroir en bas à droite — enseigne et numéro —, le
 * médaillon au centre, le titre en romain, le récit en italique, l'effet dans
 * son cartouche avec ses pastilles de durée, la mini-leçon en pied, et la
 * marque du deck avec la numérotation. Le dos porte le motif et la marque.
 * Ce sont ces conventions, plus que la couleur, qui font qu'on tient une
 * carte et non un encart.
 */
export function EventCard({
  code,
  delayMs = 0,
  announced = false,
  targetLabel,
  highlight = false,
}: {
  code: string;
  delayMs?: number;
  announced?: boolean;
  /** Destinataire affiché sur la carte : « Toute la classe » ou « → Équipe X ». */
  targetLabel?: string;
  /** Vrai quand la carte cible l'équipe du joueur qui la regarde. */
  highlight?: boolean;
}) {
  const card = cardByCode.get(code);
  if (!card) {
    return (
      <div className="rounded-xl border border-amber-400/20 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
        ⚡ {code}
      </div>
    );
  }
  const category = CARD_CATEGORIES[card.category];
  const position = cardPosition(code);
  const numero = position ? String(position.index).padStart(2, "0") : "—";
  const duree = dureeDeLaCarte(card);
  const index = (
    <span className={`font-display text-base font-semibold leading-none ${category.className.split(" ")[1]}`}>
      {category.glyph}
      <span className="ml-0.5 text-xs tabular-nums">{numero}</span>
    </span>
  );

  return (
    <div className="card-flip-scene" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="card-flip" style={{ animationDelay: `${delayMs}ms` }}>
        {/* dos de la carte */}
        <div className="card-face card-back card-back-face rounded-xl border-2 border-amber-400/40">
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-amber-400/20">
            <BrandMark className="h-10 w-10 text-amber-400/80" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400/70">
              Business Arena
            </span>
            {position ? (
              <span className="text-xs uppercase tracking-[0.2em] text-amber-400/50">{position.deck}</span>
            ) : null}
          </div>
        </div>
        {/* face de la carte */}
        <div
          className={`card-face card-front rounded-xl border-2 bg-slate-900 p-2 ${category.className.split(" ")[0]} ${
            highlight ? "ring-2 ring-sky-400/70" : ""
          }`}
          style={{ "--enseigne": category.accent } as React.CSSProperties}
        >
          {/*
            `min-h-full` et non `h-full` : la hauteur est un plancher, pas un
            plafond. Une carte étroite au récit long grandit avec son contenu
            au lieu d'en laisser déborder la mini-leçon hors du cadre ; en
            rangée, toutes prennent la hauteur de la plus haute (globals.css).
          */}
          <div className="flex min-h-full flex-col rounded-lg border border-white/10 p-3">
            {/* index de coin et enseigne */}
            <div className="flex items-start justify-between gap-2">
              {index}
              <span
                className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${category.className}`}
              >
                {announced ? "annoncée" : `${category.glyph} ${category.label}`}
              </span>
            </div>
            {/* médaillon */}
            <div className="mt-2 flex items-center justify-center">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-3xl ring-1"
                style={{ boxShadow: `0 0 0 1px ${category.accent}55, 0 0 24px ${category.accent}22` }}
                aria-hidden
              >
                {card.emoji}
              </span>
            </div>
            {targetLabel ? (
              <span
                className={`mx-auto mt-2 inline-flex w-fit rounded-full border px-2 py-0.5 text-xs font-semibold ${
                  highlight
                    ? "border-sky-400/60 bg-sky-400/10 text-sky-300"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {targetLabel}
              </span>
            ) : null}
            <h4 className="mt-2 text-center font-display text-base font-semibold leading-tight text-slate-50">
              {card.title}
            </h4>
            <p className="mt-1.5 text-center text-xs italic leading-relaxed text-slate-400">
              {card.flavor}
            </p>
            {/* cartouche de l'effet, avec ses pastilles de durée */}
            <div className="mt-auto rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold leading-snug text-slate-100">⚡ {card.effectLabel}</p>
                <span
                  className="mt-0.5 shrink-0 text-xs tracking-widest text-slate-400"
                  aria-label={`${duree} tour${duree > 1 ? "s" : ""}`}
                  title={`${duree} tour${duree > 1 ? "s" : ""}`}
                >
                  {"●".repeat(duree)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs leading-snug text-slate-400">💡 {card.conceptHint}</p>
            {/* pied : deck, numérotation, index miroir */}
            <div className="mt-2 flex items-end justify-between border-t border-white/5 pt-1.5">
              <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                {position ? `${position.deck} · ${position.index} / ${position.total}` : "Business Arena"}
              </span>
              <span className="rotate-180" aria-hidden>
                {index}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
