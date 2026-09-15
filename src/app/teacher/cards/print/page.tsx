"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CARD_CATEGORIES,
  cardPosition,
  cardsForEventCodes,
  dureeDeLaCarte,
  type EventCardDef,
} from "@/config/events/cards";
import { scenarioByCode } from "@/config/scenarios/registry";
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
  const category = CARD_CATEGORIES[card.category];
  const accent = PRINT_ACCENTS[card.category];
  const backColor = deck === "market" ? "#b45309" : "#1d4ed8";
  const position = cardPosition(card.code);
  const numero = position ? String(position.index).padStart(2, "0") : "—";
  const duree = dureeDeLaCarte(card);
  const index = (
    <span className="print-index" style={{ color: accent }}>
      {category.glyph}
      <span className="print-index-num">{numero}</span>
    </span>
  );
  return (
    <div className="print-pair">
      {/* dos : le motif et la marque sur la couleur du paquet */}
      <div className="print-half print-back" style={{ background: backColor }}>
        <div className="print-back-frame">
          <BrandMark className="print-back-mark" />
          <span className="print-back-brand">
            BUSINESS <strong>ARENA</strong>
          </span>
          {position ? <span className="print-back-deck-name">{position.deck}</span> : null}
          <span className="print-back-deck">
            {deck === "market" ? "Carte marché · toute la classe" : "Carte équipe · tirage ciblé"}
          </span>
        </div>
      </div>
      {/* face */}
      <div className="print-half print-front" style={{ borderColor: accent }}>
        <div className="print-front-frame">
          <div className="print-front-head">
            {index}
            <span className="print-category" style={{ color: accent, borderColor: accent }}>
              {category.glyph} {category.label}
            </span>
          </div>
          <div className="print-medallion" style={{ borderColor: accent }}>
            <span className="print-emoji">{card.emoji}</span>
          </div>
          <h3 className="print-title">{card.title}</h3>
          <p className="print-flavor">{card.flavor}</p>
          <div className="print-effect">
            <span>⚡ {card.effectLabel}</span>
            <span className="print-pips" title={`${duree} tour${duree > 1 ? "s" : ""}`}>
              {"●".repeat(duree)}
            </span>
          </div>
          <p className="print-hint">💡 {card.conceptHint}</p>
          <div className="print-foot">
            <span className="print-deck-mark">
              {position ? `${position.deck} · ${position.index} / ${position.total}` : "Business Arena"}
            </span>
            <span className="print-index-mirror">{index}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintCards() {
  // Un deck par secteur : imprimer les 77 cartes de la plateforme n'aurait
  // aucun sens en classe. Le secteur se choisit dans l'URL (?scenario=hotel),
  // le lien du tableau de bord enseignant le renseigne déjà.
  const params = useSearchParams();
  const definition = scenarioByCode(params.get("scenario"));
  const deck = cardsForEventCodes(definition.scenario.events.map((e) => e.code));
  const marketCards = deck.filter((c) => c.scope === "market");
  const teamCards = deck.filter((c) => c.scope === "team");

  return (
    <main id="main" className="print-page">
      <style>{printStyles}</style>

      <header className="print-header no-print">
        <div>
          <p className="print-kicker">
            Business Arena · Animation de classe · {definition.title}
          </p>
          <h1>🃏 Deck physique à imprimer</h1>
          <p className="print-legend">
            {(["market", "competition", "internal", "macro"] as const).map((c) => (
              <span key={c} style={{ color: PRINT_ACCENTS[c] }}>
                {CARD_CATEGORIES[c].glyph} {CARD_CATEGORIES[c].label}
              </span>
            ))}
            <span className="print-legend-pips">● un tour · ●● deux tours</span>
          </p>
          <p className="print-help">
            Imprimez en A4 (couleur de préférence), découpez chaque carte sur les{" "}
            <strong>traits pleins</strong>, puis pliez sur le <strong>trait pointillé</strong> :
            le dos et la face se retrouvent dos à dos, sans impression recto-verso. Faites tirer
            une carte <strong>marché</strong> à la classe entre deux tours, ou une carte{" "}
            <strong>équipe</strong> à chaque équipe lors d&apos;un événement spécial, puis
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
          🌍 Deck marché · {marketCards.length} cartes (toute la classe)
        </h2>
        <div className="print-grid">
          {marketCards.map((card) => (
            <PrintCard key={card.code} card={card} deck="market" />
          ))}
        </div>
      </section>

      <section className="print-break">
        <h2 className="print-deck-title">
          🎯 Deck équipe · {teamCards.length} cartes (tirage par équipe)
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
  .print-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 6px 0 0;
    font-size: 12px;
    font-weight: 600;
  }
  .print-legend-pips { color: #64748b; font-weight: 400; letter-spacing: 0.1em; }
  .print-back {
    display: flex;
    padding: 4mm;
    color: #fff;
    border-right: 1.5px dashed rgba(255, 255, 255, 0.85);
    background-image:
      repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.12) 0 0.5mm, transparent 0.5mm 3mm),
      repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.12) 0 0.5mm, transparent 0.5mm 3mm);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .print-back-frame {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 3mm;
    text-align: center;
  }
  .print-back-mark { width: 20mm; height: 20mm; color: #fff; }
  .print-back-brand { font-size: 12px; font-weight: 300; letter-spacing: 0.25em; margin-top: 2mm; }
  .print-back-brand strong { font-weight: 800; }
  .print-back-deck-name { font-size: 12px; letter-spacing: 0.2em; opacity: 0.9; }
  .print-back-deck { font-size: 12px; opacity: 0.8; }
  .print-front {
    display: flex;
    padding: 2.5mm;
    border: 1.2mm solid;
    border-left-width: 0;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .print-front-frame {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 2.5mm;
    border: 0.3mm solid #cbd5e1;
    border-radius: 2.5mm;
  }
  .print-front-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 2mm; }
  .print-index { font-family: ui-serif, Georgia, serif; font-size: 16px; font-weight: 700; line-height: 1; }
  .print-index-num { font-size: 12px; margin-left: 1px; font-variant-numeric: tabular-nums; }
  .print-index-mirror { display: inline-block; transform: rotate(180deg); }
  .print-medallion {
    align-self: center;
    margin-top: 1.5mm;
    width: 13mm;
    height: 13mm;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0.4mm solid;
    border-radius: 50%;
    background: #f8fafc;
  }
  .print-emoji { font-size: 22px; line-height: 1; }
  .print-category {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border: 1px solid;
    border-radius: 999px;
    padding: 1px 6px;
    font-weight: 600;
    white-space: nowrap;
  }
  .print-title { margin: 2mm 0 0; font-family: ui-serif, Georgia, serif; font-size: 14px; font-weight: 700; text-align: center; line-height: 1.15; }
  .print-flavor { margin: 1.2mm 0 0; font-size: 12px; font-style: italic; color: #475569; line-height: 1.3; text-align: center; }
  .print-effect {
    margin-top: auto;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2mm;
    padding: 1.5mm 2mm;
    border: 0.3mm solid #cbd5e1;
    border-radius: 1.5mm;
    background: #f1f5f9;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.25;
  }
  .print-pips { flex-shrink: 0; letter-spacing: 0.1em; color: #475569; font-weight: 400; }
  .print-hint {
    margin: 1.2mm 0 0;
    font-size: 12px;
    color: #64748b;
    line-height: 1.25;
  }
  .print-foot {
    margin-top: 1.2mm;
    padding-top: 1mm;
    border-top: 0.3mm solid #e2e8f0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  .print-deck-mark { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; }
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    .no-print { display: none !important; }
    .print-page { background: #fff; padding: 0; }
    .print-grid { gap: 4mm; max-width: none; }
    .print-deck-title { margin: 0 0 4mm; }
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
