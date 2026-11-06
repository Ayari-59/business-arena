import { casDeLEntreprise } from "../cas";
import { paieDeJanvier } from "../chapitres/la-paie";
import { auCentime } from "./amortissement";
import { TAUX_DE_LA_PAIE } from "./exercice-de-nova";
import { brutPourUnNetAPayer, bulletinDePaie } from "./paie";

/**
 * LE MONDE DU COURS : LA PAIE DE JANVIER DE ROUTE & CIE, AU BUREAU (décision du propriétaire, novembre
 * 2026 : une activité par chapitre ; le format « bureau » ; chapitre « La paie »).
 *
 * Le bureau (config/cours/bureaux/la-paie-de-janvier.ts) lit tout ici. Le 28 janvier, le journal de paie
 * de ROUTE & CIE est arrêté : l'élève trie les pièces de la paie, dresse le récapitulatif des bulletins,
 * passe les écritures du mois et du 15 février, puis répond au dirigeant.
 *
 * CE QUI VIENT DU CHAPITRE ET DU MONDE, ET NE S'ÉCRIT DONC PAS ICI : l'effectif et le brut de janvier
 * (le cas figé, monde/cas-des-entreprises.ts), les taux du cours (TAUX_DE_LA_PAIE), l'acompte et ses
 * dates (`paieDeJanvier` du chapitre), le bulletin et le calcul à rebours du net au brut
 * (monde/paie.ts : `bulletinDePaie`, `brutPourUnNetAPayer`).
 *
 * CE QUI EST CHOISI (hypothèse du bureau, nommée ci-dessous et dite à l'élève) : un chauffeur demande une
 * augmentation de 100 € nets par mois, prélèvement à la source retenu.
 */

/** L'entreprise du bureau : ROUTE & CIE, l'une des neuf où le chapitre se joue. */
export const ENTREPRISE_DE_LA_PAIE = "transport";

/** L'AUGMENTATION DEMANDÉE (hypothèse du bureau) : un chauffeur demande 100 € nets de plus par mois, prélèvement à la source retenu. */
export const AUGMENTATION_DEMANDEE_EN_NET = 100;

/** Tout ce que le bureau lit : le bulletin récapitulatif de janvier, l'acompte, ce que la paie fait sortir, et l'augmentation. */
export function paieDeRouteEtCie() {
  const c = casDeLEntreprise(ENTREPRISE_DE_LA_PAIE);
  const p = paieDeJanvier(c);
  const brutDeLAugmentation = brutPourUnNetAPayer(AUGMENTATION_DEMANDEE_EN_NET, TAUX_DE_LA_PAIE);
  const augmentation = bulletinDePaie(brutDeLAugmentation, TAUX_DE_LA_PAIE);
  return {
    c,
    p,
    b: p.b,
    t: TAUX_DE_LA_PAIE,
    entreprise: c.entreprise,
    augmentation: {
      net: AUGMENTATION_DEMANDEE_EN_NET,
      brut: brutDeLAugmentation,
      cout: augmentation.coutEmployeur,
      parAn: auCentime(augmentation.coutEmployeur * 12),
      /** L'erreur classique : demander le net en brut, et voir le salarié en recevoir moins. */
      netSiBrutEgalNet: bulletinDePaie(AUGMENTATION_DEMANDEE_EN_NET, TAUX_DE_LA_PAIE).netAPayer,
    },
  };
}

export type PaieDeRouteEtCie = ReturnType<typeof paieDeRouteEtCie>;
