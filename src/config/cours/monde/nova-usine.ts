/**
 * LE MONDE DU COURS : L'USINE DE NOVA, POUR LE CONTRÔLE BUDGÉTAIRE.
 *
 * NOVA fabrique des enceintes (voir l-escale.ts pour le principe du monde du cours : une
 * simulation figée, inspirée de l'arène, calculée par le cours). Pour le contrôle budgétaire,
 * l'usine fabrique deux modèles, la Nomade et la Salon, sur un trimestre : chacun a sa fiche de
 * coût préétabli (matière, main-d'œuvre directe, centre de montage), un budget de production et
 * de ventes, et ce qui s'est réellement passé. Toute la production du trimestre est vendue : il
 * n'y a pas de stock, et le coût des ventes est celui de la production.
 *
 * Les chiffres sont posés pour que chaque écart se voie et se décompose exactement : le modèle
 * (monde/ecarts.ts) les calcule, et la garde vérifie que chaque décomposition retombe sur son
 * total, centime compris.
 */

/** Un modèle d'enceinte, et ce que le standard prévoit pour en fabriquer une. */
export interface ModeleDeNova {
  code: "nomade" | "salon";
  nom: string;
  /** Le prix de vente prévu au budget, hors taxes. */
  prixPrevu: number;
  /** La matière d'une enceinte, en kilogrammes (composite, membranes, électronique). */
  matiereParUnite: number;
  /** Les heures de main-d'œuvre directe d'une enceinte. */
  heuresParUnite: number;
  /** Les heures-machine du centre de montage pour une enceinte : l'unité d'œuvre du centre. */
  heuresMachineParUnite: number;
  /** Les enceintes prévues au budget du trimestre, fabriquées et vendues. */
  quantitePrevue: number;
}

/** Ce qui s'est réellement passé au trimestre. */
export interface RealiseDeNova {
  /** Les enceintes fabriquées et vendues, et leur prix de vente réel, par modèle. */
  ventes: Readonly<Record<ModeleDeNova["code"], { quantite: number; prix: number }>>;
  /** La matière consommée, en kilogrammes, et son prix réel du kilogramme. */
  matiere: { kilos: number; prixDuKilo: number };
  /** Les heures de main-d'œuvre directe payées, et leur taux horaire réel. */
  mainDOeuvre: { heures: number; tauxHoraire: number };
  /** Les heures-machine réellement passées au centre de montage, et le coût réel du centre. */
  centre: { heuresMachine: number; cout: number };
  /** Les charges de distribution réelles, hors production. */
  distribution: number;
}

export interface FicheDeLUsine {
  code: string;
  entreprise: string;
  modeles: readonly ModeleDeNova[];
  /** Le prix standard du kilogramme de matière. */
  prixStandardDuKilo: number;
  /** Le taux horaire standard de la main-d'œuvre directe, charges sociales comprises. */
  tauxHoraireStandard: number;
  /**
   * Le centre de montage : son activité normale du trimestre (les heures-machine du budget), son
   * coût variable par heure-machine et ses charges fixes du trimestre. Le coût standard de
   * l'heure-machine est le variable plus le fixe ÷ l'activité normale.
   */
  centre: { nom: string; activiteNormale: number; coutVariableParHeure: number; chargesFixes: number };
  /** Les charges de distribution prévues au budget, hors production. */
  distributionPrevue: number;
  /** Le trimestre réalisé, face au budget. */
  realise: RealiseDeNova;
}

export const L_USINE_DE_NOVA: FicheDeLUsine = {
  code: "nova",
  entreprise: "NOVA",
  modeles: [
    { code: "nomade", nom: "Nomade", prixPrevu: 59, matiereParUnite: 0.8, heuresParUnite: 0.4, heuresMachineParUnite: 0.25, quantitePrevue: 12_000 },
    { code: "salon", nom: "Salon", prixPrevu: 119, matiereParUnite: 2, heuresParUnite: 1, heuresMachineParUnite: 0.5, quantitePrevue: 4_000 },
  ],
  prixStandardDuKilo: 15,
  tauxHoraireStandard: 25,
  centre: { nom: "Montage", activiteNormale: 5_000, coutVariableParHeure: 16, chargesFixes: 120_000 },
  distributionPrevue: 150_000,
  realise: {
    ventes: { nomade: { quantite: 11_000, prix: 57 }, salon: { quantite: 4_600, prix: 121 } },
    matiere: { kilos: 18_500, prixDuKilo: 15.4 },
    mainDOeuvre: { heures: 8_800, tauxHoraire: 26 },
    centre: { heuresMachine: 5_200, cout: 213_000 },
    distribution: 154_000,
  },
};

/** Les usines du monde du cours, par code d'entreprise. */
export const USINES_DU_COURS: Readonly<Record<string, FicheDeLUsine>> = { [L_USINE_DE_NOVA.code]: L_USINE_DE_NOVA };
