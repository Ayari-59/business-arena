import { CARD_CATEGORIES, cardByCode } from "@/config/events/cards";
import { BrandMark } from "@/components/brand-mark";

/**
 * Carte événement : l'habillage théâtral du moteur d'événements (§19).
 * L'animation de retournement est du pur théâtre CSS — le tirage réel est
 * fait par le PRNG seedé du moteur (ou annoncé par l'enseignant).
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

  return (
    <div className="card-flip-scene" style={{ animationDelay: `${delayMs}ms` }}>
      <div className="card-flip" style={{ animationDelay: `${delayMs}ms` }}>
        {/* dos de la carte */}
        <div className="card-face card-back rounded-xl border border-amber-400/30 bg-gradient-to-br from-slate-900 to-slate-950">
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <BrandMark className="h-9 w-9 text-amber-400/80" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/70">
              Business Arena
            </span>
          </div>
        </div>
        {/* face de la carte */}
        <div
          className={`card-face card-front rounded-xl border bg-slate-900 ${category.className.split(" ")[0]} ${
            highlight ? "ring-2 ring-sky-400/70" : ""
          }`}
        >
          <div className="flex h-full flex-col p-4">
            <div className="flex items-start justify-between">
              <span className="text-3xl">{card.emoji}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${category.className}`}
              >
                {announced ? "annoncée" : category.label}
              </span>
            </div>
            {targetLabel ? (
              <span
                className={`mt-1.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  highlight
                    ? "border-sky-400/60 bg-sky-400/10 text-sky-300"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {targetLabel}
              </span>
            ) : null}
            <h4 className="mt-2 text-sm font-bold text-slate-100">{card.title}</h4>
            <p className="mt-1 text-xs italic leading-relaxed text-slate-400">{card.flavor}</p>
            <p className="mt-auto pt-2 text-xs font-semibold text-slate-200">
              ⚡ {card.effectLabel}
            </p>
            <p className="mt-1.5 border-t border-white/5 pt-1.5 text-[11px] leading-snug text-slate-500">
              💡 {card.conceptHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
