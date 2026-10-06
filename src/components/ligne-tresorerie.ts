import type { CompanyRoundResult } from "@/engine/types";
import { formatEuro } from "@/lib/format";

/**
 * LA LIGNE TRÉSORERIE DU TOUR, en une phrase.
 *
 * Chaque mouvement n'apparaît que s'il a eu lieu — le coût financier compris.
 * Il était affiché même nul, et « coût financier 0 € » à côté d'une crise de
 * trésorerie laissait croire qu'une crise ne coûte rien : elle ne coûte rien
 * en commissions quand il n'y a pas de créances à céder, ce qui n'est pas la
 * même chose. On dit ce qui s'est passé, pas ce qui ne s'est pas passé.
 *
 * Isolée du composant pour que la ponctuation entre les morceaux soit testée
 * : un séparateur orphelin est le genre de faute qu'on ne voit qu'en partie.
 *
 * Une phrase, et rien d'autre : le portefeuille de la trésorerie, ou le
 * triangle de l'alerte quand la banque a dû forcer la main, est dessiné par
 * le tableau de bord devant la ligne. Écrit ici en emoji, il arrivait dans la
 * chaîne et ne pouvait plus prendre la couleur de son cadre.
 */
export function ligneTresorerie(t: NonNullable<CompanyRoundResult["treasury"]>): string {
  const morceaux = [
    t.discounted > 0.5 ? `escompte ${formatEuro(t.discounted)}` : null,
    t.factored > 0.5 ? `affacturage ${formatEuro(t.factored)}` : null,
    t.forcedFactored > 0.5
      ? `affacturage FORCÉ par la banque ${formatEuro(t.forcedFactored)} (découvert au-delà du plafond)`
      : null,
    t.financingCost > 0.5 ? `coût financier ${formatEuro(t.financingCost)}` : null,
    t.matured > 0.5
      ? `placement arrivé à terme ${formatEuro(t.matured)} (+${formatEuro(t.placementIncome)} d'intérêts)`
      : null,
    t.placed > 0.5 ? `${formatEuro(t.placed)} placés jusqu'au tour suivant` : null,
  ].filter((m): m is string => m !== null);
  const crise = "CRISE DE TRÉSORERIE : plafond dépassé et plus de créances à céder.";
  if (morceaux.length === 0) return t.crisis ? `Trésorerie : ${crise}` : "Trésorerie : rien à signaler.";
  return `Trésorerie : ${morceaux.join(" · ")}${t.crisis ? `. ${crise}` : ""}`;
}
