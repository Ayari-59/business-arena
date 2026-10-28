import { auCentime } from "../../pedagogy/cours/etats";
import { scenarioByCode } from "../scenarios/registry";
import { type Cas } from "./cas";
import { anneeDuCours as anneeJouee } from "./monde/annee-du-cours";
import { DELAI_MAXIMAL_CONVENU } from "./monde/delais-et-tva";
import { METIERS } from "./metiers";

/**
 * DÉPRÉCIATIONS ET PROVISIONS : CE QUE L'ARÈNE NE CONNAÎT PAS.
 *
 * Dans l'arène, tout client paie à l'échéance, aucun salarié ne conteste son licenciement,
 * et l'équipement ne perd de valeur que par son amortissement. Les montants du chapitre
 * sont pourtant ceux de l'arène : la créance est ce que les clients doivent encore à
 * l'entreprise au 31 décembre de l'année jouée, le litige porte sur le salaire de la paie du
 * cours, l'équipement est celui du cas. Les événements, eux, sont ceux du cours : un client
 * en redressement judiciaire, un salarié devant le conseil de prud'hommes.
 */

/** La part de la créance hors taxes que le mandataire judiciaire laisse craindre de perdre. */
export const TAUX_DE_PERTE_ESTIME = 0.4;
/** La part de la créance TTC que le liquidateur reverse, l'année suivante. */
export const PART_RECOUVREE = 0.5;
/** Ce que le salarié réclame, et ce que l'avocat de l'entreprise juge probable, en mois de salaire brut. */
export const MOIS_RECLAMES = 12;
export const MOIS_PROBABLES = 6;

const creances = new Map<string, number>();

/**
 * Ce que les clients doivent encore à l'entreprise au 31 décembre de l'année de l'arène,
 * hors taxes. L'arène compte ses créances toutes taxes comprises quand elle applique la TVA,
 * hors taxes sinon.
 */
export function creanceDeFinDAnnee(code: string): number {
  const deja = creances.get(code);
  if (deja !== undefined) return deja;
  const { partie } = anneeJouee(code);
  const r = partie.rounds[partie.rounds.length - 1]!.results["joueur"]!;
  const tva = scenarioByCode(code).scenario.finance.vatRate ?? 0;
  const ht = auCentime(r.balanceSheet.receivables / (1 + tva));
  creances.set(code, ht);
  return ht;
}

/**
 * Le client nommé court, pour qu'il tienne dans une phrase : sans la précision qui suit la
 * virgule, et « le cabinet médical » plutôt que « un cabinet médical qui rénove ses locaux ».
 */
export function nomDuClient(client: string): string {
  const court = client.split(",")[0]!.trim();
  const m = /^un (.+?) qui /.exec(court);
  return m ? `le ${m[1]}` : court;
}

/** « de » devant un nom, contracté et élidé comme en français : du groupe, de la société, de l'agence, d'ATLAS CONSEIL. */
export const de = (nom: string) =>
  nom.startsWith("le ") ? `du ${nom.slice(3)}` : nom.startsWith("les ") ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈÊ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

/** « à » devant un nom, contracté comme en français : au comité, aux laboratoires, à la société. */
export const aNom = (nom: string) => (nom.startsWith("le ") ? `au ${nom.slice(3)}` : nom.startsWith("les ") ? `aux ${nom.slice(4)}` : `à ${nom}`);

/**
 * LE DÉLAI DU CLIENT PROFESSIONNEL, DIT HONNÊTEMENT. Entre professionnels, le délai convenu ne peut pas
 * dépasser 60 jours après la facture (code de commerce, article L. 441-10). Le cas porte le jour où le
 * client paie vraiment (`venteCredit.delai` et `venteCredit.echeance`) : quand il dépasse le plafond (le
 * cabinet médical de MARTEL & FILS, à 90 jours), la facture porte le délai convenu, le plafond, et le
 * client paie en retard. Jamais un délai plus long ne se dit convenu.
 */
export function delaiDuClientPro(c: Pick<Cas, "venteCredit">) {
  const reel = c.venteCredit.delai;
  const convenu = Math.min(reel, DELAI_MAXIMAL_CONVENU.joursDeLaFacture);
  return { reel, convenu, retard: reel - convenu, echeanceConvenue: c.venteCredit.date + convenu, paiement: c.venteCredit.echeance };
}

/** La créance douteuse : sa dépréciation au 31 décembre, puis son dénouement l'année suivante. */
export function creanceDouteuse(c: Cas) {
  const ht = creanceDeFinDAnnee(c.code);
  const tauxTva = METIERS[c.code]!.vente.tauxTva;
  const tva = auCentime(ht * tauxTva);
  const ttc = auCentime(ht + tva);
  const depreciation = auCentime(ht * TAUX_DE_PERTE_ESTIME);
  const recouvre = auCentime(ttc * PART_RECOUVREE);
  const perdu = auCentime(ttc - recouvre);
  const perteHt = auCentime(perdu / (1 + tauxTva));
  return {
    client: nomDuClient(c.venteCredit.client),
    deClient: de(nomDuClient(c.venteCredit.client)),
    ht,
    tauxTva,
    tva,
    ttc,
    depreciation,
    recouvre,
    perdu,
    perteHt,
    tvaRecuperee: auCentime(perdu - perteHt),
  };
}

/** Le litige devant les prud'hommes : le salaire brut d'un mois, ce qui est réclamé, ce qui est probable. */
export function litige(c: Cas) {
  const salaire = auCentime(c.personnel.brut / c.personnel.effectif);
  return {
    salaire,
    reclame: Math.round(salaire * MOIS_RECLAMES),
    provision: Math.round(salaire * MOIS_PROBABLES),
  };
}

