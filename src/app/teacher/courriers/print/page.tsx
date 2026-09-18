"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NATURES, type CourrierDef } from "@/config/courriers/types";
import { courriersPourCodes, positionDuCourrier } from "@/config/courriers/registre";
import { scenarioByCode } from "@/config/scenarios/registry";
import { Courriel, Enveloppe, Lettre, Message } from "@/components/courrier";

/**
 * LA LIASSE À IMPRIMER : chaque courrier est un pli — l'enveloppe d'un côté,
 * la lettre de l'autre — à découper sur les traits pleins puis à plier sur le
 * trait pointillé. Pas d'impression recto-verso : une fois plié, l'élève tient
 * une enveloppe qu'il retourne pour lire.
 *
 * Deux liasses : les courriers de MARCHÉ, que toute la classe reçoit, et les
 * plis ADRESSÉS, distribués entreprise par entreprise entre deux tours.
 *
 * LE MÊME COURRIER QU'À L'ÉCRAN, EN ÉDITION ÉCONOME. L'enveloppe et la lettre
 * sont celles de l'arène, rendues par les mêmes composants : même anatomie,
 * même texte, mêmes cachets. Mais le papier n'est pas un écran : une lettre
 * de nuit encre toute la feuille. La page se place donc sous le thème clair,
 * dont les jetons inversent les couleurs de la lettre, sans qu'aucun composant
 * ne change. L'enveloppe, elle, est déjà de papier : elle s'imprime telle
 * quelle. Le papier ajoute la mention de la liasse et la lettre vierge en fin
 * de liasse.
 */

type Liasse = "market" | "team";

function PliImprime({ courrier, liasse }: { courrier: CourrierDef; liasse: Liasse }) {
  const position = positionDuCourrier(courrier.code);
  const destinataire = liasse === "market" ? "Tout le marché" : "Une entreprise";
  /*
   * LE COURRIEL S'IMPRIME AUSSI, et sur le même gabarit : au dos la ligne de
   * boîte de réception, au recto le message. L'enseignant découpe, plie et
   * distribue exactement comme un pli — ce qui change, c'est ce que l'élève
   * tient : une impression d'écran et non une lettre. Le blanc froid du
   * courriel tombe juste sur le fond blanc de la feuille, sans règle
   * d'impression particulière.
   */
  const parCourriel = courrier.pli === "email";
  return (
    <div className="print-pair">
      <div className="print-half print-back">
        {parCourriel ? (
          <Courriel code={courrier.code} destinataire={destinataire} className="h-full" />
        ) : (
          <Enveloppe
            code={courrier.code}
            liasse={position?.liasse}
            destinataire={destinataire}
            className="h-full"
          />
        )}
      </div>
      <div className="print-half print-front">
        {parCourriel ? (
          <Message code={courrier.code} destinataire={destinataire} />
        ) : (
          <Lettre code={courrier.code} />
        )}
      </div>
    </div>
  );
}

/**
 * LA LETTRE VIERGE : l'enseignant écrit son propre courrier — une grève, une
 * visite d'inspection, un client qui ne paie pas — et le distribue comme les
 * autres, en saisissant dans l'appli l'effet le plus proche.
 */
function PliVierge({ liasse, nomDeLaLiasse }: { liasse: Liasse; nomDeLaLiasse: string | null }) {
  return (
    <div className="print-pair">
      <div className="print-half print-back">
        <Enveloppe
          liasse={nomDeLaLiasse}
          destinataire={liasse === "market" ? "Tout le marché" : "Une entreprise"}
          className="h-full"
        />
      </div>
      <div className="print-half print-front">
        <div className="lettre rounded-lg border-2 border-slate-500/50 bg-slate-900 p-2">
          <div className="flex min-h-full flex-col rounded-md border border-white/10 p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-xs font-semibold uppercase tracking-wide text-slate-400">
                Expéditeur
              </span>
              <span className="whitespace-nowrap rounded-full border border-slate-500/50 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-300">
                ✍️ Lettre vierge
              </span>
            </div>
            <div className="h-6 border-b border-white/20" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Objet</p>
            <div className="h-6 border-b border-white/20" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Corps de la lettre</p>
            <div className="h-6 border-b border-white/20" />
            <div className="h-6 border-b border-white/20" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
              Effet saisi dans l&apos;application
            </p>
            <div className="h-6 border-b border-white/20" />
            <div className="mt-auto flex items-end justify-between border-t border-white/5 pt-1.5">
              <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
                {nomDeLaLiasse ?? "Business Arena"} · lettre vierge
              </span>
              <span className="text-base" aria-hidden>
                ✍️
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiasseAImprimer() {
  // Une liasse par secteur : imprimer le courrier de toute la plateforme
  // n'aurait aucun sens en classe. Le secteur se choisit dans l'URL
  // (?scenario=hotel), le lien du tableau de bord enseignant le renseigne déjà.
  const params = useSearchParams();
  const definition = scenarioByCode(params.get("scenario"));
  const courriers = courriersPourCodes(definition.scenario.events.map((e) => e.code));
  const duMarche = courriers.filter((c) => c.scope === "market");
  const adresses = courriers.filter((c) => c.scope === "team");
  const nomDeLaLiasse = courriers[0]
    ? (positionDuCourrier(courriers[0].code)?.liasse ?? null)
    : null;

  // Quatre plis par feuille A4 paysage (deux par deux), la feuille est
  // l'unité de saut de page : aucun pli coupé par le bord. Une lettre vierge
  // ferme chaque liasse.
  const feuilles = (liste: CourrierDef[], liasse: Liasse) => {
    const plis: React.ReactNode[] = liste.map((courrier) => (
      <PliImprime key={courrier.code} courrier={courrier} liasse={liasse} />
    ));
    plis.push(
      <PliVierge key={`${liasse}-vierge`} liasse={liasse} nomDeLaLiasse={nomDeLaLiasse} />,
    );
    const out: React.ReactNode[][] = [];
    for (let i = 0; i < plis.length; i += 4) out.push(plis.slice(i, i + 4));
    return out.map((feuille, i) => (
      <div key={i} className="print-sheet">
        {feuille}
      </div>
    ));
  };
  const nbFeuilles = Math.ceil((duMarche.length + 1) / 4) + Math.ceil((adresses.length + 1) / 4);

  return (
    <main id="main" className="print-page" data-theme="clair">
      <style>{printStyles}</style>

      <header className="print-header no-print">
        <div>
          <p className="print-kicker">
            Business Arena · Animation de classe · {definition.title}
          </p>
          <h1>📬 Liasse de courrier à imprimer</h1>
          <p className="print-legend">
            {(["market", "competition", "internal", "macro"] as const).map((n) => (
              <span key={n} style={{ color: NATURES[n].accent }}>
                {NATURES[n].label}
              </span>
            ))}
            <span className="print-legend-pips">● un tour · ●● deux tours</span>
            <span className="print-legend-pips">
              {duMarche.length + adresses.length} courriers · {nbFeuilles} feuilles
            </span>
          </p>
          <p className="print-help">
            Les courriers sont ceux de l&apos;écran, en édition économe : imprimez en{" "}
            <strong>A4 paysage</strong>, en couleur de préférence, quatre plis par feuille.
            Découpez chaque pli sur les <strong>traits pleins</strong>, puis pliez sur le{" "}
            <strong>trait pointillé</strong> : l&apos;enveloppe et la lettre se retrouvent dos à
            dos, sans impression recto-verso — l&apos;élève tient une enveloppe qu&apos;il
            retourne pour lire. Distribuez un courrier <strong>de marché</strong> à toute la
            classe entre deux tours, ou un <strong>pli adressé</strong> à une entreprise, puis
            saisissez-le dans l&apos;application pour qu&apos;il s&apos;applique à la simulation.
          </p>
        </div>
        <button type="button" className="print-button" onClick={() => window.print()}>
          🖨️ Imprimer
        </button>
      </header>

      <section>
        <h2 className="print-liasse-title no-print">
          🌍 Courrier de marché · {duMarche.length} plis (toute la classe) + 1 lettre vierge
        </h2>
        {feuilles(duMarche, "market")}
      </section>

      <section className="print-break">
        <h2 className="print-liasse-title no-print">
          🎯 Plis adressés · {adresses.length} plis (une entreprise à la fois) + 1 lettre vierge
        </h2>
        <p className="print-help no-print">
          Astuce : imprimez cette page en plusieurs exemplaires pour constituer une pile par
          entreprise.
        </p>
        {feuilles(adresses, "team")}
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
   * L'ENVELOPPE n'a rien à inverser : elle est déjà de papier ivoire à l'encre
   * sombre, à l'écran comme sur la feuille. Seul son cadre s'aligne sur le
   * trait de coupe.
   */
  .print-page .enveloppe {
    border-radius: 0;
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
  .print-liasse-title {
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
  /* une feuille = quatre plis, deux par deux ; c'est elle qui saute de page */
  .print-sheet {
    max-width: 1100px;
    margin: 0 auto 8mm;
    display: grid;
    grid-template-columns: repeat(auto-fit, 138mm);
    gap: 4mm;
    justify-content: start;
    break-after: page;
    overflow-x: auto;
  }
  /* un pli = enveloppe + lettre, pliure au milieu ; le trait plein est le trait de coupe */
  .print-pair {
    display: flex;
    width: 138mm;
    height: 92mm;
    border: 1px solid #0f172a;
    break-inside: avoid;
    background: #fff;
  }
  .print-half { width: 69mm; height: 92mm; box-sizing: border-box; overflow: hidden; }
  .print-back { border-right: 1.5px dashed rgba(15, 23, 42, 0.6); }
  /*
   * La lettre de l'écran est dessinée pour 300 px de large ; la moitié de pli
   * en fait 261. On la réduit d'un quart : même dessin, mêmes proportions, et
   * la signature, l'effet et la leçon tombent au-dessus du bord. Le format du
   * pli (138 × 92 mm, quatre par A4 paysage) est calé sur cette hauteur-là :
   * une lettre a besoin de plus de place qu'une carte à jouer.
   */
  .print-front .lettre, .print-back .enveloppe,
  .print-front .message, .print-back .courriel {
    height: 100%;
    min-height: 0;
    border-radius: 0;
  }
  .print-front { zoom: 0.68; width: 101.5mm; height: 135.3mm; }
  /*
   * Les plis sont en millimètres réels (ils doivent tomber juste sur le
   * papier) : 138 mm, c'est plus large qu'un téléphone. À l'écran seulement,
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
    .print-sheet { margin: 0; max-width: none; overflow: visible; grid-template-columns: repeat(2, 138mm); }
    .print-pair { zoom: 1; }
    .print-sheet:last-child { break-after: auto; }
    .print-break { break-before: page; }
  }
`;

/**
 * `useSearchParams` suspend pendant le prérendu : la frontière Suspense est
 * obligatoire, sans quoi le build échoue sur cette route.
 */
export default function PageDeLaLiasse() {
  return (
    <Suspense fallback={null}>
      <LiasseAImprimer />
    </Suspense>
  );
}
