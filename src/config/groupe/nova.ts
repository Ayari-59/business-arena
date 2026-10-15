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
 * LA TAILLE DE DÉPART. Avec l'atelier du scénario, la demande qu'une gestion
 * neutre reçoit dépasse de loin sa capacité : toute dépense en lignes y
 * rapporte, et aucune autre croissance ne peut lui être comparée. Au niveau 7,
 * chaque entreprise démarre donc plus grande (`depart`) : sa capacité est
 * alors proche de la demande moyenne qu'elle reçoit, et les pics, Noël et le
 * grand compte, la dépassent toujours. Facteur choisi au banc (conception,
 * phase B4) : le plus petit qui garde des lignes entières et approche la
 * demande moyenne sans hâter la faillite des concurrents simulés.
 *
 * LE FONDS DE ROULEMENT DE DÉPART (`depart.apport`). L'atelier agrandi produit
 * deux fois plus, mais la demande d'avant les pics n'a pas bougé : il stocke
 * au premier tour, et paie ce stock comptant. Sa trésorerie de départ, simple
 * double de celle du scénario, ne le finançait pas : une équipe qui validait
 * les décisions proposées entrait en crise au premier tour et en défaillance
 * au deuxième, et la gestion neutre aussi. L'apport des associés à la
 * création finance ce cycle ; montant choisi au banc (conception, phase D) :
 * le plus petit, par pas de 25 000 €, qui fait traverser les six tours sans
 * crise à l'équipe qui valide la proposition, sur douze graines.
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
  depart: { facteur: 2, apport: 150_000 },
  valorisation: { multipleEBE: 5, actionsInitiales: 10_000 },
  rachat: {
    primeDeControle: 0.25,
    fraisDeTransaction: 0.03,
    decoteDEmission: 0.1,
    seuilDeControle: 0.5,
    tourMin: 2,
    tourMinTitres: 4,
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
        "Votre fournisseur historique de composants, celui de toute la profession : il vend aux fabricants de la partie, concurrents compris, et à bien d'autres, avec une marge de grossiste. Ses clients de la partie ne resteront pas tous chez un concurrent.",
      clientsExterieurs: { chiffreDAffaires: 400_000, saisonnalite: [0.9, 0.95, 1, 1.3, 0.9, 1], croissance: 0.01 },
      tauxDeCoutVariable: 0.96,
      chargesFixesParTour: 15_000,
      capacite: 2_500_000,
      immobilisations: 250_000,
      dureeDAmortissement: 24,
      bfr: 0.2,
      tresorerie: 40_000,
      dette: 150_000,
      tauxDInteretParTour: 0.012,
    },
    {
      code: "acoustika",
      nom: "Acoustika",
      recit:
        "Un atelier de transducteurs de studio, appairés à la main, qui fournit les fabricants de monitoring de toute l'Europe. Dans la partie, seule la Studio peut l'employer.",
      clientsExterieurs: { chiffreDAffaires: 400_000, saisonnalite: [0.9, 1, 1.05, 1.25, 0.95, 1.05], croissance: 0.015 },
      tauxDeCoutVariable: 0.85,
      chargesFixesParTour: 45_000,
      capacite: 700_000,
      immobilisations: 150_000,
      dureeDAmortissement: 24,
      bfr: 0.25,
      tresorerie: 30_000,
      dette: 80_000,
      tauxDInteretParTour: 0.012,
    },
  ],
  etrangers: [
    {
      id: "brightwave",
      nom: "Brightwave Audio Ltd",
      pays: "Royaume-Uni",
      devise: "GBP",
      recit:
        "Un distributeur britannique d'enceintes grand public, présent dans les grandes surfaces et les campus. Son réseau pourrait écouler des NOVA, si l'atelier en a de reste.",
      change: { coursInitial: 1.17, volatilite: 0.03 },
      ventes: { chiffreDAffaires: 250_000, saisonnalite: [0.9, 0.95, 1, 1.35, 0.9, 1], croissance: 0.01 },
      tauxDeCoutVariable: 0.65,
      chargesFixesParTour: 70_000,
      immobilisations: 150_000,
      dureeDAmortissement: 24,
      bfr: 0.25,
      tresorerie: 30_000,
      dette: 80_000,
      tauxDInteretParTour: 0.015,
      tauxDImpot: 0.25,
      risquePays: { probabilite: 0.05, perteDeVentes: 0.15 },
      parts: [0.51, 0.75, 1],
      reseau: { capacite: 3_000, prix: { "nova-go": 30, "nova-one": 52, "nova-studio": 112 }, coutParUnite: 5, coutFixeParTour: 35_000 },
    },
    {
      id: "fonika",
      nom: "Fonika Sp. z o.o.",
      pays: "Pologne",
      devise: "PLN",
      recit:
        "Un assembleur polonais d'électronique audio, qui vend ses propres marques en Europe centrale. Son usine pourrait fabriquer des NOVA, moins cher qu'un sous-traitant, payés en zlotys.",
      change: { coursInitial: 0.23, volatilite: 0.05 },
      ventes: { chiffreDAffaires: 600_000, saisonnalite: [0.95, 0.95, 1, 1.2, 0.95, 1], croissance: 0.015 },
      tauxDeCoutVariable: 0.7,
      chargesFixesParTour: 120_000,
      immobilisations: 900_000,
      dureeDAmortissement: 32,
      bfr: 0.2,
      tresorerie: 100_000,
      dette: 500_000,
      tauxDInteretParTour: 0.015,
      tauxDImpot: 0.19,
      risquePays: { probabilite: 0.08, perteDeVentes: 0.2 },
      parts: [0.51, 0.75, 1],
      fabrication: {
        capacite: 4_000,
        cout: { "nova-go": 120, "nova-one": 215, "nova-studio": 420 },
        qualite: 0.95,
        coutFixeParTour: 60_000,
      },
    },
    {
      id: "klangwerk",
      nom: "Klangwerk AG",
      pays: "Suisse",
      devise: "CHF",
      recit:
        "Un petit distributeur suisse de hi-fi haut de gamme, stable et cher. Son réseau vend des enceintes de qualité ; il n'a pas d'usine.",
      change: { coursInitial: 1.05, volatilite: 0.02 },
      ventes: { chiffreDAffaires: 150_000, saisonnalite: [0.95, 1, 1, 1.25, 0.95, 1.05], croissance: 0.005 },
      tauxDeCoutVariable: 0.55,
      chargesFixesParTour: 55_000,
      immobilisations: 60_000,
      dureeDAmortissement: 24,
      bfr: 0.3,
      tresorerie: 40_000,
      dette: 20_000,
      tauxDInteretParTour: 0.01,
      tauxDImpot: 0.15,
      parts: [0.51, 0.75, 1],
      reseau: { capacite: 1_200, prix: { "nova-one": 58, "nova-studio": 128 }, coutParUnite: 6, coutFixeParTour: 20_000 },
    },
  ],
  import: {
    code: "lowcost",
    rupture: { probabilite: 0.15, probabiliteAuxPics: 0.5, seuilDePic: 1.2 },
    change: { devise: "USD", volatilite: 0.08 },
  },
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
