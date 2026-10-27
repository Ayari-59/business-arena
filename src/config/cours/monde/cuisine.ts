import type { FicheDuBistrot } from "./la-table-d-augustin";

/**
 * LE MODÈLE DE LA CUISINE DU BISTROT DU COURS : un trimestre, à un prix donné.
 *
 * La demande de chaque clientèle, posée par la fiche au ticket de l'année, répond au prix avec
 * l'élasticité de la fiche. La salle et la cuisine servent au plus leurs couverts par jour × les
 * jours du trimestre : le bistrot sert la plus petite de la demande et de ces couverts servables
 * (comme le modèle du service, service.ts).
 *
 * Ce que la cuisine prépare : la demande attendue, plus une marge de préparation pour ne jamais
 * manquer (`MARGE_DE_PREPARATION`), dans la limite des couverts servables. Ce qui est préparé et
 * non servi est jeté : ses denrées sont payées sans rien rapporter. Quand la demande dépasse ce que
 * la salle peut servir, la cuisine prépare juste les couverts servables, et rien n'est jeté.
 *
 * Les denrées d'un couvert coûtent le coût matière de la fiche, et, à partir du trimestre de la
 * hausse, ce coût augmenté du taux de la hausse. Le coût matière consommé est celui de tous les
 * couverts préparés ; le ratio coût matière le divise par le chiffre d'affaires HT. Les autres
 * coûts variables se comptent par couvert servi ; les charges fixes ne dépendent pas des couverts.
 *
 * Rien ici ne lit l'arène : le cours calcule tout, et le test le refait à la main.
 */

/**
 * LA MARGE DE PRÉPARATION (hypothèse du cours) : la cuisine prépare 5 % de couverts de plus que la
 * demande qu'elle attend, pour ne jamais refuser un client faute de plat. C'est l'habitude d'une
 * cuisine qui craint de manquer ; ce qui n'est pas servi part à la poubelle.
 */
export const MARGE_DE_PREPARATION = 0.05;

/** Un trimestre de la cuisine, tel que le chef le lit. */
export interface TrimestreDeCuisine {
  /** Le rang du trimestre dans l'année, à partir de 1. */
  numero: number;
  /** Le ticket moyen HT du trimestre. */
  prix: number;
  demande: number;
  servables: number;
  servis: number;
  /** Les couverts que la cuisine a préparés : la demande, plus la marge, dans la limite des couverts servables. */
  prepares: number;
  /** Les couverts préparés et non servis, jetés. */
  perdus: number;
  /** Le coût matière d'un couvert ce trimestre : ses denrées, hausse comprise. */
  coutDuCouvert: number;
  /** Le coût matière consommé : les denrées de tous les couverts préparés. */
  denrees: number;
  chiffreDAffaires: number;
  autresCouts: number;
  /** Le chiffre d'affaires moins les denrées et les autres coûts variables. */
  margeSurCoutsVariables: number;
  /** Le ratio coût matière, en pourcentage, au dixième. */
  ratio: number;
}

const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les couverts que la salle et la cuisine peuvent servir en un trimestre. */
export const couvertsServables = (f: FicheDuBistrot) => f.couvertsParJour * f.joursParTrimestre;

/** Le coût matière d'un couvert au trimestre `numero` (à partir de 1) : la fiche, puis la hausse à partir de son trimestre. */
export function coutDuCouvert(f: FicheDuBistrot, numero: number): number {
  const h = f.hausseDesDenrees;
  return auCentime(f.coutMatiereParCouvert * (numero >= h.trimestre ? 1 + h.taux : 1));
}

/** La demande adressée au bistrot au trimestre `numero`, au prix donné : chaque clientèle, à l'unité. */
export function demandeDuBistrot(f: FicheDuBistrot, numero: number, prix: number): number {
  return f.clienteles.reduce((t, g) => t + Math.round(g.demande[numero - 1]! * (prix / f.prixDeLAnnee) ** f.elasticite), 0);
}

/** Le trimestre `numero` de la cuisine, au prix donné (arrondi au centime) et avec la marge de préparation donnée. */
export function trimestreDeCuisine(f: FicheDuBistrot, numero: number, prix = f.prixDeLAnnee, marge = MARGE_DE_PREPARATION): TrimestreDeCuisine {
  const p = auCentime(prix);
  const demande = demandeDuBistrot(f, numero, p);
  const servables = couvertsServables(f);
  const servis = Math.min(demande, servables);
  const prepares = Math.min(Math.round(demande * (1 + marge)), servables);
  const cout = coutDuCouvert(f, numero);
  const denrees = auCentime(prepares * cout);
  const chiffreDAffaires = auCentime(servis * p);
  const autresCouts = auCentime(servis * f.autresCoutsParCouvert);
  return {
    numero,
    prix: p,
    demande,
    servables,
    servis,
    prepares,
    perdus: prepares - servis,
    coutDuCouvert: cout,
    denrees,
    chiffreDAffaires,
    autresCouts,
    margeSurCoutsVariables: auCentime(chiffreDAffaires - denrees - autresCouts),
    ratio: auDixieme((denrees / chiffreDAffaires) * 100),
  };
}

/** L'année de la cuisine au ticket de l'année et à sa marge de préparation, et son ratio coût matière. */
export function anneeDeCuisine(f: FicheDuBistrot) {
  const trimestres = [1, 2, 3, 4].map((n) => trimestreDeCuisine(f, n));
  const denrees = auCentime(trimestres.reduce((s, t) => s + t.denrees, 0));
  const chiffreDAffaires = auCentime(trimestres.reduce((s, t) => s + t.chiffreDAffaires, 0));
  return { trimestres, denrees, chiffreDAffaires, ratio: auDixieme((denrees / chiffreDAffaires) * 100) };
}

export type AnneeDeCuisine = ReturnType<typeof anneeDeCuisine>;
