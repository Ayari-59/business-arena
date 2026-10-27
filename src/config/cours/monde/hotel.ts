import type { FicheDeLHotel } from "./l-escale";

/**
 * LE MODÈLE DE L'HÔTEL DU COURS : un trimestre, à un prix donné.
 *
 * Toutes les chambres sont en vente chaque nuit : l'hôtel offre ses chambres × les jours du
 * trimestre. La demande de chaque clientèle, posée par la fiche au prix de l'année, répond au prix
 * avec l'élasticité de la fiche. L'hôtel vend la plus petite des deux, la demande ou les nuitées
 * offertes : au-delà, les clients sont refusés ; en deçà, des chambres restent vides. Une nuitée
 * occupée coûte le coût variable ; les charges fixes se paient quel que soit le remplissage.
 *
 * Rien ici ne lit l'arène : le cours calcule tout, et le test le refait à la main.
 */

/** Un trimestre de l'hôtel, tel que l'hôtelier le lit. */
export interface TrimestreDeLHotel {
  numero: number;
  prix: number;
  demande: number;
  offertes: number;
  vendues: number;
  refusees: number;
  vides: number;
  chiffreDAffaires: number;
  coutsVariables: number;
  resultat: number;
}

const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les nuitées que l'hôtel offre en un trimestre : toutes ses chambres, chaque nuit. */
export const nuiteesOffertes = (f: FicheDeLHotel) => f.chambres * f.joursParTrimestre;

/** La demande d'une clientèle au trimestre `numero` (à partir de 1), au prix donné, à l'unité. */
export function demandeDeLaClientele(f: FicheDeLHotel, code: string, numero: number, prix: number): number {
  const g = f.clienteles.find((x) => x.code === code)!;
  return Math.round(g.demande[numero - 1]! * (prix / f.prixDeLAnnee) ** f.elasticite);
}

/** Le trimestre `numero`, au prix donné (arrondi au centime). */
export function trimestreDeLHotel(f: FicheDeLHotel, numero: number, prix: number): TrimestreDeLHotel {
  const p = auCentime(prix);
  const demande = f.clienteles.reduce((t, g) => t + demandeDeLaClientele(f, g.code, numero, p), 0);
  const offertes = nuiteesOffertes(f);
  const vendues = Math.min(demande, offertes);
  const chiffreDAffaires = auCentime(vendues * p);
  const coutsVariables = vendues * f.coutVariableParNuitee;
  return {
    numero,
    prix: p,
    demande,
    offertes,
    vendues,
    refusees: demande - vendues,
    vides: offertes - vendues,
    chiffreDAffaires,
    coutsVariables,
    resultat: auCentime(chiffreDAffaires - coutsVariables - f.chargesFixesParTrimestre),
  };
}

/** Une année de quatre trimestres, au prix de chacun, et ses trois indicateurs du métier. */
export function anneeDeLHotel(f: FicheDeLHotel, prix: readonly number[]) {
  const trimestres = prix.map((p, i) => trimestreDeLHotel(f, i + 1, p));
  const somme = (g: (t: TrimestreDeLHotel) => number) => trimestres.reduce((x, t) => x + g(t), 0);
  const vendues = somme((t) => t.vendues);
  const offertes = somme((t) => t.offertes);
  const chiffreDAffaires = auCentime(somme((t) => t.chiffreDAffaires));
  return {
    trimestres,
    vendues,
    offertes,
    chiffreDAffaires,
    occupation: auDixieme((vendues / offertes) * 100),
    prixMoyen: auCentime(chiffreDAffaires / vendues),
    revpar: auCentime(chiffreDAffaires / offertes),
    resultat: auCentime(somme((t) => t.resultat)),
  };
}

export type AnneeDeLHotel = ReturnType<typeof anneeDeLHotel>;
