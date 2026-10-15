import type { ConfigDeGroupe } from "@/engine/groupe/types";

/**
 * LE NIVEAU 7 « GROUPE » DE NOVA, EN GAMME : les paramètres du prototype.
 *
 * Base trimestrielle (les tranches et les plafonds de la sous-traitance, les
 * charges des sites et leur délai de remise en route sont redimensionnés par
 * la périodicité, `composerLeScenarioJoue`). Calibrés au banc du niveau 7
 * (conception, sections 15 et suivantes) : chaque levier doit créer de la
 * valeur dans certains contextes et en détruire dans d'autres.
 *
 * La demande est celle de NOVA en gamme, telle quelle (décision du
 * propriétaire) : saisons, Noël et grand compte compris.
 *
 * Le barème du sous-traitant monte vite au-delà de la première tranche : à
 * des tranches plus douces, sous-traiter au-delà de la demande gagnait dans
 * tous les contextes du banc.
 *
 * LES SITES À L'ARRÊT. Trois anciennes usines d'électronique ou d'assemblage
 * audio, vendues par un liquidateur ou un propriétaire, de taille et d'état
 * différents : la petite est sûre et chère à la ligne, la grande est bon
 * marché à la ligne et risquée (une bonne part de ses lignes peut ne jamais
 * repartir, une dépollution est probable, elle met plus longtemps à
 * produire). Les
 * lignes sont celles du parc de NOVA ; leur prix du neuf fixe la valeur
 * recouvrable.
 */
export const GROUPE_NOVA: ConfigDeGroupe = {
  valorisation: { multipleEBE: 5, actionsInitiales: 10_000 },
  rachat: {
    primeDeControle: 0.25,
    fraisDeTransaction: 0.03,
    decoteDEmission: 0.1,
    seuilDeControle: 0.5,
    tourMin: 2,
  },
  sites: [
    {
      id: "sonelec",
      nom: "Atelier Sonelec, Saint-Étienne",
      recit:
        "Un petit atelier de câblage et d'assemblage d'enceintes, fermé au départ en retraite de son patron. Des lignes entretenues jusqu'au bout ; le bâtiment est sain.",
      lignes: [
        { typeCode: "semi_auto", count: 1 },
        { typeCode: "manual", count: 2 },
      ],
      prix: 23_000,
      remiseEnRoute: { min: 0.67, max: 1 },
      remiseEnEtatParLigne: { min: 2_000, max: 6_000 },
      passifEnvironnemental: { probabilite: 0.1, montant: 8_000 },
      delai: 1,
      usure: 0.35,
      chargesParTour: 2_500,
      coutDeLAudit: 2_000,
    },
    {
      id: "hexalys",
      nom: "Usine Hexalys, Vierzon",
      recit:
        "Un ancien sous-traitant d'électronique grand public, en liquidation depuis quelques années. Des lignes d'assemblage dont on ne sait pas combien repartiront ; le liquidateur ne garantit rien.",
      lignes: [
        { typeCode: "semi_auto", count: 3 },
        { typeCode: "manual", count: 2 },
      ],
      prix: 40_000,
      remiseEnRoute: { min: 0.4, max: 1 },
      remiseEnEtatParLigne: { min: 3_000, max: 10_000 },
      passifEnvironnemental: { probabilite: 0.3, montant: 20_000 },
      delai: 1,
      usure: 0.35,
      chargesParTour: 3_500,
      coutDeLAudit: 4_000,
    },
    {
      id: "arvel",
      nom: "Usine Arvel Électronique, Longwy",
      recit:
        "Une grande usine de cartes et d'amplificateurs, fermée depuis longtemps. Des lignes automatisées, semi-automatisées et manuelles ; des années sans entretien, et un sol que personne n'a analysé.",
      lignes: [
        { typeCode: "auto", count: 2 },
        { typeCode: "semi_auto", count: 2 },
        { typeCode: "manual", count: 2 },
      ],
      prix: 25_000,
      remiseEnRoute: { min: 0.15, max: 0.85 },
      remiseEnEtatParLigne: { min: 4_000, max: 12_000 },
      passifEnvironnemental: { probabilite: 0.4, montant: 30_000 },
      delai: 2,
      usure: 0.4,
      chargesParTour: 4_000,
      coutDeLAudit: 6_000,
    },
  ],
  fournisseurs: [
    {
      code: "standard",
      nom: "Fournisseur standard",
      recit:
        "Votre fournisseur historique de composants, celui de toute la profession : il vend à tous les fabricants de la partie, concurrents compris, avec une marge de grossiste. Ses clients ne resteront pas tous chez un concurrent.",
      tauxDeCoutVariable: 0.95,
      chargesFixesParTour: 8_000,
      capacite: 650_000,
      immobilisations: 150_000,
      dureeDAmortissement: 24,
      bfr: 0.25,
      tresorerie: 20_000,
      dette: 100_000,
      tauxDInteretParTour: 0.012,
    },
    {
      code: "acoustika",
      nom: "Acoustika",
      recit:
        "Un atelier de transducteurs de studio, appairés à la main : il ne vend qu'aux fabricants qui le choisissent pour la Studio. Petit, réputé, à la merci de ses rares clients.",
      tauxDeCoutVariable: 0.7,
      chargesFixesParTour: 3_000,
      capacite: 150_000,
      immobilisations: 25_000,
      dureeDAmortissement: 24,
      bfr: 0.3,
      tresorerie: 8_000,
      dette: 10_000,
      tauxDInteretParTour: 0.012,
    },
  ],
  sousTraitance: {
    "nova-go": {
      tranches: [{ jusqua: 2000, prix: 30 }, { jusqua: 4000, prix: 36 }, { prix: 44 }],
      plafond: 6000,
      qualite: 1,
    },
    "nova-one": {
      tranches: [{ jusqua: 1500, prix: 54 }, { jusqua: 3000, prix: 64 }, { prix: 76 }],
      plafond: 4500,
      qualite: 1,
    },
  },
};

/** Les scénarios joués qui portent un niveau 7, par code. */
export const GROUPE_PAR_SCENARIO: Readonly<Record<string, ConfigDeGroupe>> = {
  "nova-gamme": GROUPE_NOVA,
};
