"use client";

import { CARD_CATEGORIES, EVENT_CARDS, type EventCardDef } from "@/config/events/cards";
import { BrandMark } from "@/components/brand-mark";

/**
 * Deck physique imprimable (A4) : chaque carte est une paire dos + face à
 * découper sur les traits pleins puis plier sur le trait pointillé — pas
 * besoin d'impression recto-verso. Deux paquets : cartes MARCHÉ (toute la
 * classe) et cartes ÉQUIPE (tirage par équipe entre les tours).
 */

const PRINT_ACCENTS: Record<EventCardDef["category"], string> = {
  market: "#3987e5",
  competition: "#a855f7",
  internal: "#d97706",
  macro: "#059669",
};

function PrintCard({ card, deck }: { card: EventCardDef; deck: "market" | "team" }) {
  const accent = PRINT_ACCENTS[card.category];
  const backColor = deck === "market" ? "#b45309" : "#1d4ed8";
  return (
    <div className="print-pair">
      {/* dos : la marque en blanc sur la couleur du paquet */}
      <div className="print-half print-back" style={{ background: backColor }}>
        <BrandMark className="print-back-mark" />
        <span className="print-back-brand">
          BUSINESS <strong>ARENA</strong>
        </span>
        <span className="print-back-deck">
          {deck === "market" ? "Carte marché · toute la classe" : "Carte équipe · tirage ciblé"}
        </span>
      </div>
      {/* face */}
      <div className="print-half print-front" style={{ borderTopColor: accent }}>
        <div className="print-front-head">
          <span className="print-emoji">{card.emoji}</span>
          <span className="print-category" style={{ color: accent, borderColor: accent }}>
            {CARD_CATEGORIES[card.category].label}
          </span>
        </div>
        <h3 className="print-title">{card.title}</h3>
        <p className="print-flavor">{card.flavor}</p>
        <p className="print-effect">⚡ {card.effectLabel}</p>
        <p className="print-hint">💡 {card.conceptHint}</p>
      </div>
    </div>
  );
}

export default function PrintCardsPage() {
  const marketCards = EVENT_CARDS.filter((c) => c.scope === "market");
  const teamCards = EVENT_CARDS.filter((c) => c.scope === "team");

  return (
    <main className="print-page">
      <style>{printStyles}</style>

      <header className="print-header no-print">
        <div>
          <p className="print-kicker">Business Arena · Animation de classe</p>
          <h1>🃏 Deck physique à imprimer</h1>
          <p className="print-help">
            Imprimez en A4 (couleur de préférence), découpez chaque carte sur les{" "}
            <strong>traits pleins</strong>, puis pliez sur le <strong>trait pointillé</strong> :
            le dos et la face se retrouvent dos à dos, sans impression recto-verso. Faites tirer
            une carte <strong>marché</strong> à la classe entre deux tours, ou une carte{" "}
            <strong>équipe</strong> à chaque équipe lors d&apos;un événement spécial — puis
            saisissez la carte tirée dans le deck numérique de la partie pour qu&apos;elle
            s&apos;applique à la simulation.
          </p>
        </div>
        <button type="button" className="print-button" onClick={() => window.print()}>
          🖨️ Imprimer
        </button>
      </header>

      <section>
        <h2 className="print-deck-title">
          🌍 Deck marché — {marketCards.length} cartes (toute la classe)
        </h2>
        <div className="print-grid">
          {marketCards.map((card) => (
            <PrintCard key={card.code} card={card} deck="market" />
          ))}
        </div>
      </section>

      <section className="print-break">
        <h2 className="print-deck-title">
          🎯 Deck équipe — {teamCards.length} cartes (tirage par équipe)
        </h2>
        <p className="print-help no-print">
          Astuce : imprimez cette page en plusieurs exemplaires pour constituer une pioche par
          équipe.
        </p>
        <div className="print-grid">
          {teamCards.map((card) => (
            <PrintCard key={card.code} card={card} deck="team" />
          ))}
        </div>
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
  }
  .print-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    max-width: 900px;
    margin: 0 auto 24px;
  }
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
    max-width: 900px;
    margin: 24px auto 12px;
    font-size: 16px;
    color: #0f172a;
  }
  .print-grid {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: 8mm;
  }
  /* une paire = dos + face, pli au milieu */
  .print-pair {
    display: flex;
    width: 126mm;
    height: 88mm;
    border: 1px solid #0f172a;
    break-inside: avoid;
    background: #fff;
  }
  .print-half { width: 63mm; height: 88mm; box-sizing: border-box; overflow: hidden; }
  .print-back {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #fff;
    border-right: 1.5px dashed rgba(255, 255, 255, 0.85);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .print-back-mark { width: 22mm; height: 22mm; color: #fff; }
  .print-back-brand { font-size: 11px; font-weight: 300; letter-spacing: 0.25em; margin-top: 2mm; }
  .print-back-brand strong { font-weight: 800; }
  .print-back-deck { font-size: 9px; opacity: 0.85; }
  .print-front {
    display: flex;
    flex-direction: column;
    padding: 5mm;
    border-top: 3mm solid;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .print-front-head { display: flex; align-items: flex-start; justify-content: space-between; }
  .print-emoji { font-size: 26px; }
  .print-category {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border: 1px solid;
    border-radius: 999px;
    padding: 2px 7px;
    font-weight: 600;
  }
  .print-title { margin: 3mm 0 0; font-size: 13px; font-weight: 700; }
  .print-flavor { margin: 1.5mm 0 0; font-size: 10px; font-style: italic; color: #475569; line-height: 1.4; }
  .print-effect { margin-top: auto; padding-top: 2mm; font-size: 10.5px; font-weight: 700; }
  .print-hint {
    margin: 1.5mm 0 0;
    padding-top: 1.5mm;
    border-top: 1px solid #e2e8f0;
    font-size: 9px;
    color: #64748b;
    line-height: 1.35;
  }
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    .no-print { display: none !important; }
    .print-page { background: #fff; padding: 0; }
    .print-grid { gap: 4mm; max-width: none; }
    .print-deck-title { margin: 0 0 4mm; }
    .print-break { break-before: page; }
  }
`;
