import { auCentime } from "./amortissement";
import {
  ACTION,
  COURS_AFFICHE,
  EMETTEUR,
  HAUSSE_DES_TAUX,
  OBLIGATION_UN_AN_PLUS_TARD,
  OBLIGATION_VERTE,
  RENTABILITE_EXIGEE,
  UN_AN_PLUS_TARD,
  coupon,
  coursDeLAction,
  coursDeLActionDuCas,
  coursDeLObligation,
  rendementDeLObligation,
  risqueDeLAction,
} from "./marche-financier";

/**
 * LE MONDE DE L'ENQUÊTE « LA NOTE DE L'ANALYSTE » (la suite du chapitre « Le marché financier : cours,
 * taux et risque »).
 *
 * Les titres sont ceux du chapitre (marche-financier.ts) : l'obligation verte d'Électro-Composants Lyon,
 * un an plus tard, les taux montés à 5 % et le cours affiché de 950 € ; l'action et ses dividendes ; les
 * trois états de l'économie. LES BONS CHIFFRES se calculent par les fonctions du chapitre. Ceux de
 * l'analyste sortent des mêmes données, lues de travers.
 *
 * LES SIX ERREURS, CHACUNE D'UNE NATURE DIFFÉRENTE (hypothèses de l'enquête) :
 *   1. LA BASE : le coupon est calculé sur le cours, et non sur le nominal ;
 *   2. LE TAUX : le cours est calculé au taux nominal, et non au taux du marché ;
 *   3. LE RENDEMENT : le rendement courant (coupon ÷ cours) est pris pour le rendement actuariel ;
 *   4. LE SENS : une hausse des taux ferait monter le cours de l'action ;
 *   5. LA RACINE : la variance est donnée pour l'écart-type ;
 *   6. LA DIVERSIFICATION : diversifier effacerait tout le risque de l'action.
 * Trois affirmations sont justes : l'émission sur le marché primaire, le cours de l'action, l'espérance.
 * La garde tests/cours/enquete-la-note-de-l-analyste.test.ts refait chaque chiffre à la main.
 */

export const AFFIRMATIONS_DE_L_ANALYSTE = ["emission", "coupon", "cours", "rendement", "action", "hausse", "esperance", "risque", "diversifier"] as const;
export type CodeDeLAffirmation = (typeof AFFIRMATIONS_DE_L_ANALYSTE)[number];
export type NatureDeLAffirmation = "juste" | "base" | "taux" | "rendement" | "sens" | "racine" | "diversification";

/** Un montant écrit comme au cours : « 40 € », « 964,54 € ». */
const eur = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`;
const pct = (t: number, chiffres = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: chiffres })} %`.replace(/^-/, "−");
const nombre = (x: number, chiffres = 2) => x.toLocaleString("fr-FR", { maximumFractionDigits: chiffres });

/** La note : ses affirmations et leur nature, les bons chiffres et ceux de l'analyste. */
export function noteDeLAnalyste() {
  const o = OBLIGATION_UN_AN_PLUS_TARD;
  const c = coupon(o);
  const action = coursDeLActionDuCas();
  const risque = risqueDeLAction();
  const rendementActuariel = rendementDeLObligation(o, COURS_AFFICHE);
  const ecartType = Math.sqrt(risque.variance);
  // Les chiffres de l'analyste.
  const couponSurLeCours = auCentime(COURS_AFFICHE * OBLIGATION_VERTE.tauxNominal);
  const coursAuTauxNominal = coursDeLObligation(o, o.tauxNominal);
  const rendementCourant = c / COURS_AFFICHE;
  const affirmations: { code: CodeDeLAffirmation; nature: NatureDeLAffirmation; texte: string }[] = [
    { code: "emission", nature: "juste", texte: `L'obligation verte a été souscrite au pair, le 1er janvier N+1, sur le marché primaire.` },
    { code: "coupon", nature: "base", texte: `Son coupon : ${pct(OBLIGATION_VERTE.tauxNominal)} de son cours, ${eur(COURS_AFFICHE)}, soit ${eur(couponSurLeCours)} par an.` },
    { code: "cours", nature: "taux", texte: `Au 1er janvier N+2, elle vaut ${eur(coursAuTauxNominal)} : ses coupons et son nominal, actualisés à son taux de ${pct(o.tauxNominal)}.` },
    { code: "rendement", nature: "rendement", texte: `Achetée ${eur(COURS_AFFICHE)}, elle rapporte ${eur(c)} ÷ ${eur(COURS_AFFICHE)} = ${pct(rendementCourant)} par an jusqu'à l'échéance.` },
    { code: "action", nature: "juste", texte: `L'action de ${EMETTEUR} vaut ${eur(ACTION.dividende)} ÷ (${pct(RENTABILITE_EXIGEE)} − ${pct(ACTION.croissance)}) = ${eur(action.cours)}.` },
    { code: "hausse", nature: "sens", texte: `Si les taux montent de ${nombre(HAUSSE_DES_TAUX * 100)} point, le cours de l'action montera : les placements rapporteront plus.` },
    { code: "esperance", nature: "juste", texte: `L'espérance de rentabilité de l'action est de ${nombre(risque.esperance)} % par an.` },
    { code: "risque", nature: "racine", texte: `Son risque : un écart-type de ${nombre(risque.variance)} points autour de cette espérance.` },
    { code: "diversifier", nature: "diversification", texte: "En achetant aussi d'autres actions, NOVA effacerait tout le risque de celle-ci." },
  ];
  return {
    affirmations,
    coupon: c,
    coursAuTauxDuMarche: coursDeLObligation(o, UN_AN_PLUS_TARD.tauxEnHausse),
    rendementActuariel,
    rendementActuarielEnPourcent: Math.round(rendementActuariel * 10_000) / 100,
    rendementCourant,
    exigee: RENTABILITE_EXIGEE,
    coursDeLAction: action.cours,
    apresLaHausse: coursDeLAction(ACTION.dividende, RENTABILITE_EXIGEE + HAUSSE_DES_TAUX, ACTION.croissance),
    risque,
    ecartType,
    ecartTypeArrondi: Math.round(ecartType * 100) / 100,
    analyste: { couponSurLeCours, coursAuTauxNominal },
  };
}
