import { cardByCode } from "@/config/events/cards";

/**
 * Le bandeau des cartes annoncées.
 *
 * Constaté en production : quand l'enseignant joue une carte, l'annonce était
 * rendue en bas de l'onglet Situation, après le texte de la situation et le
 * diagnostic, deux mille caractères sous le pli. L'élève qui ouvre directement
 * l'onglet Décisions décidait sans savoir que le monde venait de changer.
 *
 * Ce bandeau se pose sous l'en-tête de la page, hors des onglets : nom de la
 * carte, effet en une ligne, destinataire. Le récit, la mini-leçon et
 * l'animation restent dans l'onglet Situation, où renvoie « Voir le détail ».
 *
 * Il ne montre que ce qui s'applique à l'équipe qui lit : les cartes marché,
 * et les cartes qui la ciblent. Une carte tirée contre une autre équipe n'est
 * pas une consigne pour celle-ci.
 */
export interface AnnouncedCard {
  code: string;
  teamId: string | null;
  teamName: string | null;
  isMyTeam: boolean;
}

/** Les cartes qui s'appliquent à l'équipe qui lit. */
export function cartesQuiMeConcernent(cards: readonly AnnouncedCard[]): AnnouncedCard[] {
  return cards.filter((c) => c.teamId === null || c.isMyTeam);
}

export function EventBanner({
  cards,
  detailHref = "#situation",
}: {
  cards: readonly AnnouncedCard[];
  /** Où lire le récit complet : l'onglet Situation, par défaut. */
  detailHref?: string;
}) {
  const visibles = cartesQuiMeConcernent(cards);
  if (visibles.length === 0) return null;

  return (
    <aside
      role="status"
      aria-label="Cartes événement annoncées pour ce tour"
      className="rounded-xl border border-amber-400/40 bg-amber-950/20 px-4 py-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        ⚡ Votre enseignant a tiré {visibles.length > 1 ? "des cartes" : "une carte"} : elle
        {visibles.length > 1 ? "s s'appliquent" : " s'applique"} à ce tour
      </p>
      <ul className="mt-2 space-y-1.5">
        {visibles.map((card) => {
          const def = cardByCode.get(card.code);
          const cible = card.teamId === null ? "Toute la classe" : "🎯 Votre équipe";
          return (
            <li
              key={`${card.code}-${card.teamId ?? "market"}`}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
            >
              <span className="font-semibold text-slate-100">
                {def ? `${def.emoji} ${def.title}` : `⚡ ${card.code}`}
              </span>
              {def ? <span className="text-slate-300">{def.effectLabel}</span> : null}
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${
                  card.isMyTeam
                    ? "border-sky-400/60 bg-sky-400/10 text-sky-300"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {cible}
              </span>
            </li>
          );
        })}
      </ul>
      <a
        href={detailHref}
        className="mt-2 inline-block text-xs text-amber-300 underline-offset-4 hover:underline"
      >
        Voir le détail dans la situation
      </a>
    </aside>
  );
}
