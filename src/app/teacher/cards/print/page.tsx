"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CARD_CATEGORIES,
  cardPosition,
  cardsForEventCodes,
  type EventCardDef,
} from "@/config/events/cards";
import { scenarioByCode } from "@/config/scenarios/registry";
import { EventCardBack, EventCardFace } from "@/components/event-card";

/**
 * Deck physique imprimable : chaque carte est une paire dos + face à découper
 * sur les traits pleins puis plier sur le trait pointillé — pas besoin
 * d'impression recto-verso. Deux paquets : cartes MARCHÉ (toute la classe) et
 * cartes ÉQUIPE (tirage par équipe entre les tours).
 *
 * LA MÊME CARTE QU'À L'ÉCRAN, EN ÉDITION ÉCONOME. La face et le dos sont ceux
 * de l'arène, rendus par les mêmes composants : même anatomie, même texte,
 * mêmes enseignes. Mais le papier n'est pas un écran : une carte de nuit
 * encre toute la feuille. La page se place donc sous le thème clair, dont les
 * jetons inversent toutes les couleurs — face blanche à l'encre sombre, dos
 * clair aux chevrons et à la marque de nuit — sans qu'aucun composant ne
 * change. Le papier ajoute seulement le ruban du paquet au dos, et la carte
 * libre en fin de paquet.
 */

type Paquet = "market" | "team";

function PrintPair({ card, deck }: { card: EventCardDef; deck: Paquet }) {
  const position = cardPosition(card.code);
  return (
    <div className="print-pair">
      <div className="print-half print-back">
        <EventCardBack deckName={position?.deck} ruban={deck} className="h-full" />
      </div>
      <div className="print-half print-front">
        <EventCardFace code={card.code} />
      </div>
    </div>
  );
}

/**
 * La carte libre : l'enseignant écrit son propre événement (une grève, une
 * visite d'inspection, un client qui ne paie pas) et le joue comme les
 * autres, en saisissant l'effet le plus proche dans le deck numérique.
 */
function PrintBlankPair({ deck, deckName }: { deck: Paquet; deckName: string | null }) {
  return (
    <div className="print-pair">
      <div className="print-half print-back">
        <EventCardBack deckName={deckName} ruban={deck} className="h-full" />
      </div>
      <div className="print-half print-front">
        <div className="card-front rounded-xl border-2 border-slate-500/50 bg-slate-900 p-2">
          <div className="flex min-h-full flex-col rounded-lg border border-white/10 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-base font-semibold leading-none text-slate-400">★</span>
              <span className="whitespace-nowrap rounded-full border border-slate-500/50 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-300">
                ★ Carte libre
              </span>
            </div>
            <div className="mt-2 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-3xl ring-1 ring-white/10" aria-hidden>
                ✍️
              </span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Titre</p>
            <div className="h-6 border-b border-white/20" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Ce qui arrive</p>
            <div className="h-6 border-b border-white/20" />
            <div className="h-6 border-b border-white/20" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Effet joué dans le deck numérique</p>
            <div className="h-6 border-b border-white/20" />
            <div className="mt-auto flex items-end justify-between border-t border-white/5 pt-1.5">
              <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                {deckName ?? "Business Arena"} · carte libre
              </span>
              <span className="rotate-180 font-display text-base font-semibold leading-none text-slate-400" aria-hidden>
                ★
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintCards() {
  // Un deck par secteur : imprimer les cartes de toute la plateforme n'aurait
  // aucun sens en classe. Le secteur se choisit dans l'URL (?scenario=hotel),
  // le lien du tableau de bord enseignant le renseigne déjà.
  const params = useSearchParams();
  const definition = scenarioByCode(params.get("scenario"));
  const deck = cardsForEventCodes(definition.scenario.events.map((e) => e.code));
  const marketCards = deck.filter((c) => c.scope === "market");
  const teamCards = deck.filter((c) => c.scope === "team");
  const deckName = deck[0] ? (cardPosition(deck[0].code)?.deck ?? null) : null;

  // Quatre paires par feuille A4 paysage (deux par deux), la feuille est
  // l'unité de saut de page : aucune carte coupée par le bord. Une carte
  // libre ferme chaque paquet.
  const feuilles = (cards: EventCardDef[], scope: Paquet) => {
    const paires: React.ReactNode[] = cards.map((card) => (
      <PrintPair key={card.code} card={card} deck={scope} />
    ));
    paires.push(<PrintBlankPair key={`${scope}-libre`} deck={scope} deckName={deckName} />);
    const out: React.ReactNode[][] = [];
    for (let i = 0; i < paires.length; i += 4) out.push(paires.slice(i, i + 4));
    return out.map((feuille, i) => (
      <div key={i} className="print-sheet">
        {feuille}
      </div>
    ));
  };
  const nbFeuilles = Math.ceil((marketCards.length + 1) / 4) + Math.ceil((teamCards.length + 1) / 4);

  return (
    <main id="main" className="print-page" data-theme="clair">
      <style>{printStyles}</style>

      <header className="print-header no-print">
        <div>
          <p className="print-kicker">
            Business Arena · Animation de classe · {definition.title}
          </p>
          <h1>🃏 Deck physique à imprimer</h1>
          <p className="print-legend">
            {(["market", "competition", "internal", "macro"] as const).map((c) => (
              <span key={c} style={{ color: CARD_CATEGORIES[c].accent }}>
                {CARD_CATEGORIES[c].glyph} {CARD_CATEGORIES[c].label}
              </span>
            ))}
            <span className="print-legend-pips">● un tour · ●● deux tours</span>
            <span className="print-legend-pips">
              {marketCards.length + teamCards.length} cartes · {nbFeuilles} feuilles
            </span>
          </p>
          <p className="print-help">
            Les cartes sont celles de l&apos;écran, en édition économe (face blanche, dos clair) :
            imprimez en <strong>A4 paysage</strong>, en couleur de préférence, quatre cartes par
            feuille. Découpez chaque
            carte sur les <strong>traits pleins</strong>, puis pliez sur le{" "}
            <strong>trait pointillé</strong> : le dos et la face se retrouvent dos à dos, sans
            impression recto-verso. Faites tirer une carte <strong>marché</strong> à la classe
            entre deux tours, ou une carte <strong>équipe</strong> à chaque équipe lors d&apos;un
            événement spécial, puis saisissez la carte tirée dans le deck numérique de la partie
            pour qu&apos;elle s&apos;applique à la simulation.
          </p>
        </div>
        <button type="button" className="print-button" onClick={() => window.print()}>
          🖨️ Imprimer
        </button>
      </header>

      <section>
        <h2 className="print-deck-title no-print">
          🌍 Deck marché · {marketCards.length} cartes (toute la classe) + 1 carte libre
        </h2>
        {feuilles(marketCards, "market")}
      </section>

      <section className="print-break">
        <h2 className="print-deck-title no-print">
          🎯 Deck équipe · {teamCards.length} cartes (tirage par équipe) + 1 carte libre
        </h2>
        <p className="print-help no-print">
          Astuce : imprimez cette page en plusieurs exemplaires pour constituer une pioche par
          équipe.
        </p>
        {feuilles(teamCards, "team")}
      </section>
    </main>
  );
}

const printStyles = `
  .print-page {
    background: #f8fafc;
    color: #0f172a;
    min-height: 100vh;
    padding: 24px;
    font-family: ui-sans-serif, system-ui, sans-serif;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  /*
   * LE DOS, INVERSÉ. À l'écran il est de nuit aux chevrons de laiton ; sur
   * papier, papier clair aux chevrons d'encre, la marque et le nom du deck en
   * laiton sombre (le thème clair s'en charge). Même motif, encre divisée
   * par dix.
   */
  .print-page .card-back-face {
    /* la marque et le nom du deck en laiton sombre, lisibles sur le clair */
    --color-amber-400: #86641a;
    --color-amber-300: #a67f22;
    background-color: #f8fafc;
    background-image:
      repeating-linear-gradient(45deg, rgba(7, 12, 26, 0.10) 0 0.5mm, transparent 0.5mm 3mm),
      repeating-linear-gradient(-45deg, rgba(7, 12, 26, 0.10) 0 0.5mm, transparent 0.5mm 3mm),
      radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 70%);
  }
  .print-header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    max-width: 1000px;
    margin: 0 auto 24px;
  }
  .print-header > div { flex: 1 1 420px; min-width: 0; }
  .print-kicker {
    font-size: 11px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: #b45309;
    margin: 0 0 4px;
  }
  .print-header h1 { margin: 0; font-size: 24px; }
  .print-help { font-size: 13px; color: #475569; max-width: 640px; line-height: 1.5; }
  .print-button {
    flex-shrink: 0;
    border: none;
    border-radius: 10px;
    background: #b45309;
    color: #fff;
    font-weight: 600;
    padding: 10px 18px;
    font-size: 14px;
    cursor: pointer;
  }
  .print-button:hover { background: #92400e; }
  .print-deck-title {
    max-width: 1000px;
    margin: 24px auto 12px;
    font-size: 16px;
    color: #0f172a;
  }
  .print-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 6px 0 0;
    font-size: 12px;
    font-weight: 600;
  }
  .print-legend-pips { color: #64748b; font-weight: 400; letter-spacing: 0.1em; }
  /* une feuille = quatre paires, deux par deux ; c'est elle qui saute de page */
  .print-sheet {
    max-width: 1000px;
    margin: 0 auto 8mm;
    display: grid;
    grid-template-columns: repeat(auto-fit, 126mm);
    gap: 6mm;
    justify-content: start;
    break-after: page;
    overflow-x: auto;
  }
  /* une paire = dos + face, pli au milieu ; le trait plein est le trait de coupe */
  .print-pair {
    display: flex;
    width: 126mm;
    height: 88mm;
    border: 1px solid #0f172a;
    break-inside: avoid;
    background: #fff;
  }
  .print-half { width: 63mm; height: 88mm; box-sizing: border-box; overflow: hidden; }
  .print-back { border-right: 1.5px dashed rgba(15, 23, 42, 0.6); }
  /*
   * La face de l'écran est dessinée pour 300 px de large ; la carte de poche
   * en fait 238. On la réduit d'un cinquième : même dessin, mêmes proportions.
   */
  .print-front .card-front, .print-back .card-back-face {
    height: 100%;
    min-height: 0;
    border-radius: 0;
  }
  .print-front { zoom: 0.8; width: 78.75mm; height: 110mm; }
  /*
   * Les paires sont en millimètres réels (elles doivent tomber juste sur le
   * papier) : 126 mm, c'est plus large qu'un téléphone. À l'écran seulement,
   * une fenêtre étroite les voit réduites ; à défaut, la feuille défile sur
   * elle-même sans emporter la page.
   */
  @media (max-width: 640px) {
    .print-pair { zoom: 0.72; }
    .print-page { padding: 16px; }
  }
  @media print {
    @page { size: A4 landscape; margin: 8mm; }
    .no-print { display: none !important; }
    .print-page { background: #fff; padding: 0; min-height: 0; }
    .print-sheet { margin: 0; max-width: none; overflow: visible; grid-template-columns: repeat(2, 126mm); }
    .print-pair { zoom: 1; }
    .print-sheet:last-child { break-after: auto; }
    .print-break { break-before: page; }
  }
`;

/**
 * `useSearchParams` suspend pendant le prérendu : la frontière Suspense est
 * obligatoire, sans quoi le build échoue sur cette route.
 */
export default function PrintCardsPage() {
  return (
    <Suspense fallback={null}>
      <PrintCards />
    </Suspense>
  );
}
