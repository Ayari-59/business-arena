import { affectationDeNova } from "./capitaux-propres";
import { bilanDuLycee, compteDuLycee, exerciceDe } from "./comptes-du-lycee";
import { tableauDeBord } from "./couts-et-budgets";
import { NOVA_GESTION } from "./nova-gestion";
import { KG_CO2_PAR_KWH, KWH_DU_BATIMENT_PAR_MOIS, KWH_PAR_ENCEINTE, tableauDeBordDurable } from "./tableau-de-bord-durable";

/**
 * LE MONDE DU COURS : LA PERFORMANCE GLOBALE DE NOVA (le chapitre « La performance globale au tableau de
 * bord », SGN de première T3.2).
 *
 * CE QUI VIENT DES FICHES, sans un chiffre de plus :
 *   · l'année N : les ventes, les enceintes vendues, le résultat net, la capacité d'autofinancement
 *     (comptes-du-lycee.ts), les capitaux propres du 31 décembre, et le dividende retenu par le cours
 *     (capitaux-propres.ts) ;
 *   · le premier semestre : la part de marché (couts-et-budgets.ts, `tableauDeBord`), l'absentéisme et
 *     l'accident du travail (tableau-de-bord-durable.ts) ;
 *   · l'énergie de la chaîne et du bâtiment et le facteur d'émission de l'électricité, appliqués à
 *     l'année (tableau-de-bord-durable.ts).
 *
 * LES HYPOTHÈSES DU COURS, dites ici : l'objectif de ventes que le président s'était fixé pour N
 * (25 000 enceintes) ; les clients du site qui ont racheté dans l'année (360 sur 2 400) ; ce que veulent
 * les associés et le président pour le bénéfice de N (le laboratoire).
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

export const HYPOTHESES_DE_LA_PERFORMANCE = {
  objectifDeVentes: 25_000,
  clientsDuSite: 2_400,
  clientsQuiRachetent: 360,
  /** Le dividende que les associés attendent au moins, et l'autofinancement que le président veut garder au moins pour investir. */
  dividendeVoulu: 25_000,
  autofinancementVoulu: 80_000,
} as const;

/** Les mois d'une année, pour l'énergie du bâtiment. */
const MOIS = 12;

let calculee: ReturnType<typeof calculer> | undefined;

/** La performance de NOVA en N, calculée une fois (la clôture et le semestre ne bougent pas). */
export const performanceDeNova = () => (calculee ??= calculer());

function calculer() {
  const f = exerciceDe("nova");
  const k = compteDuLycee(f);
  const b = bilanDuLycee(f);
  const bord = tableauDeBord(NOVA_GESTION).semestre;
  const durable = tableauDeBordDurable().semestre;
  const h = HYPOTHESES_DE_LA_PERFORMANCE;
  const kwh = auCentime(KWH_PAR_ENCEINTE * k.quantite + KWH_DU_BATIMENT_PAR_MOIS * MOIS);
  const co2 = auCentime(kwh * KG_CO2_PAR_KWH);
  return {
    enceintes: k.quantite,
    chiffreDAffaires: k.ventes,
    resultatNet: k.resultatNet,
    capitauxPropres: b.capitauxPropres,
    caf: k.caf,
    dividendes: affectationDeNova().dividendes,
    /** Efficacité : le réalisé rapporté à l'objectif, en %. */
    efficacitePct: auDixieme((k.quantite / h.objectifDeVentes) * 100),
    /** Fidélité : la part des clients du site qui ont racheté, en %. */
    fidelitePct: auDixieme((h.clientsQuiRachetent / h.clientsDuSite) * 100),
    partDeMarchePct: auDixieme(bord.partDeMarche * 100),
    rentabilitePct: auDixieme((k.resultatNet / b.capitauxPropres) * 100),
    profitabilitePct: auDixieme((k.resultatNet / k.ventes) * 100),
    absenteismePct: auDixieme(durable.absenteisme * 100),
    accidents: durable.accidents,
    kwh,
    co2,
    /** Les grammes de CO2 émis par enceinte, à l'unité. */
    co2ParEnceinteGrammes: Math.round((co2 / k.quantite) * 1000),
  };
}

/** Le bénéfice de N partagé : le dividende versé, et ce qui reste pour autofinancer l'entreprise (la CAF moins les dividendes). */
export function partageDuBenefice(dividendes: number) {
  const p = performanceDeNova();
  return { dividendes, partDistribueePct: auDixieme((dividendes / p.resultatNet) * 100), autofinancement: auCentime(p.caf - dividendes), reserves: auCentime(p.resultatNet - dividendes) };
}
