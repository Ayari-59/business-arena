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

/**
 * Le dos, comme à l'écran : la nuit, les chevrons de laiton, la marque. Le
 * paquet (marché ou équipe) se lit à son ruban, en laiton ou en ciel, pour
 * qu'une pioche face cachée se trie du premier coup d'œil.
 */
function PrintBack({ deck, deckName }: { deck: "market" | "team"; deckName: string | null }) {
  return (
    <div className="print-half print-back">
      <div className="print-back-frame">
        <BrandMark className="print-back-mark" />
        <span className="print-back-brand">
          BUSINESS <strong>ARENA</strong>
        </span>
        {deckName ? <span className="print-back-deck-name">{deckName}</span> : null}
      </div>
      <span className={`print-back-ribbon ${deck === "market" ? "print-ribbon-market" : "print-ribbon-team"}`}>
        {deck === "market" ? "Marché · toute la classe" : "Équipe · tirage ciblé"}
      </span>
    </div>
  );
}

/**
 * La carte libre : l'enseignant écrit son propre événement (une grève, une
 * visite d'inspection, un client qui ne paie pas) et le joue comme les
 * autres, en saisissant l'effet le plus proche dans le deck numérique.
 */
function PrintBlankCard({ deck, deckName }: { deck: "market" | "team"; deckName: string | null }) {
  return (
    <div className="print-pair">
      <PrintBack deck={deck} deckName={deckName} />
      <div className="print-half print-front print-front-blank">
        <div className="print-front-frame">
          <div className="print-front-head">
            <span className="print-index">★</span>
            <span className="print-category">★ Carte libre</span>
          </div>
          <div className="print-medallion">
            <span className="print-emoji">✍️</span>
          </div>
          <p className="print-blank-label">Titre</p>
          <div className="print-blank-line" />
          <p className="print-blank-label">Ce qui arrive</p>
          <div className="print-blank-line" />
          <div className="print-blank-line" />
          <p className="print-blank-label">Effet joué dans le deck numérique</p>
          <div className="print-blank-line" />
          <div className="print-foot">
            <span className="print-deck-mark">{deckName ?? "Business Arena"} · carte libre</span>
            <span className="print-index-mirror"><span className="print-index">★</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintCard({ card, deck }: { card: EventCardDef; deck: "market" | "team" }) {
  const category = CARD_CATEGORIES[card.category];
  const accent = PRINT_ACCENTS[card.category];
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
      <PrintBack deck={deck} deckName={position?.deck ?? null} />
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
  const deckName = deck[0] ? (cardPosition(deck[0].code)?.deck ?? null) : null;

  // Quatre paires par feuille A4 paysage (deux par deux), la feuille est
  // l'unité de saut de page : aucune carte coupée par le bord. Une carte
  // libre ferme chaque paquet.
  const feuilles = (cards: EventCardDef[], scope: "market" | "team") => {
    const paires: React.ReactNode[] = cards.map((card) => (
      <PrintCard key={card.code} card={card} deck={scope} />
    ));
    paires.push(<PrintBlankCard key={`${scope}-libre`} deck={scope} deckName={deckName} />);
    const out: React.ReactNode[][] = [];
    for (let i = 0; i < paires.length; i += 4) out.push(paires.slice(i, i + 4));
    return out.map((feuille, i) => (
      <div key={i} className="print-sheet">
        {feuille}
      </div>
    ));
  };

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
            <span className="print-legend-pips">
              {marketCards.length + teamCards.length} cartes · {Math.ceil((marketCards.length + 1) / 4) + Math.ceil((teamCards.length + 1) / 4)} feuilles
            </span>
          </p>
          <p className="print-help">
            Imprimez en <strong>A4 paysage</strong> (couleur de préférence, quatre cartes par
            feuille), découpez chaque carte sur les <strong>traits pleins</strong>, puis pliez
            sur le <strong>trait pointillé</strong> :
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
  /*
   * Les paires sont en millimètres réels (elles doivent tomber juste sur le
   * papier) : 126 mm, c'est plus large qu'un téléphone. À l'écran seulement,
   * une fenêtre étroite les voit réduites ; à défaut, la feuille défile sur
   * elle-même sans emporter la page.
   */
  .print-sheet { overflow-x: auto; }
  @media (max-width: 640px) {
    .print-pair { zoom: 0.72; }
    .print-page { padding: 16px; }
  }
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
  /* une feuille = quatre paires, deux par deux ; c'est elle qui saute de page */
  .print-sheet {
    max-width: 1000px;
    margin: 0 auto 8mm;
    display: grid;
    grid-template-columns: repeat(auto-fit, 126mm);
    gap: 6mm;
    justify-content: start;
    break-after: page;
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
  /* le dos de nuit et ses chevrons de laiton, le même qu'à l'écran */
  .print-back {
    position: relative;
    display: flex;
    padding: 4mm;
    color: #d8b45c;
    border-right: 1.5px dashed rgba(216, 180, 92, 0.85);
    background-color: #060b18;
    background-image:
      repeating-linear-gradient(45deg, rgba(216, 180, 92, 0.18) 0 0.5mm, transparent 0.5mm 3mm),
      repeating-linear-gradient(-45deg, rgba(216, 180, 92, 0.18) 0 0.5mm, transparent 0.5mm 3mm),
      radial-gradient(circle at 50% 50%, #0f172a 0%, #060b18 70%);
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
    padding-bottom: 6mm;
    border: 0.4mm solid rgba(216, 180, 92, 0.6);
    border-radius: 3mm;
    text-align: center;
  }
  .print-back-mark { width: 20mm; height: 20mm; color: #d8b45c; }
  .print-back-brand { font-size: 12px; font-weight: 300; letter-spacing: 0.25em; margin-top: 2mm; }
  .print-back-brand strong { font-weight: 800; }
  .print-back-deck-name { font-size: 12px; letter-spacing: 0.2em; opacity: 0.85; }
  /* le ruban du paquet : laiton pour le marché, ciel pour l'équipe */
  .print-back-ribbon {
    position: absolute;
    left: 4mm;
    right: 4mm;
    bottom: 6mm;
    padding: 1mm 0;
    border-radius: 1mm;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #060b18;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .print-ribbon-market { background: #d8b45c; }
  .print-ribbon-team { background: #7dd3fc; }
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
  /* la carte libre : des lignes à remplir */
  .print-front-blank { border-color: #64748b; }
  .print-front-blank .print-index, .print-front-blank .print-category { color: #64748b; border-color: #64748b; }
  .print-front-blank .print-medallion { border-color: #64748b; }
  .print-blank-label { margin: 2mm 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
  .print-blank-line { height: 5.5mm; border-bottom: 0.3mm solid #cbd5e1; }
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
