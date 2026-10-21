import type { ConfigDeGroupe, DefinitionDUneNouveaute } from "@/engine/groupe/types";

/**
 * LE NIVEAU 7 « GROUPE » DE NOVA, EN GAMME : les paramètres du prototype.
 *
 * Base trimestrielle (les tranches et les plafonds de la sous-traitance sont
 * redimensionnés par la périodicité, `composerLeScenarioJoue`). Calibrés au
 * banc du niveau 7 (conception, sections 15 et suivantes) : chaque levier
 * doit créer de la valeur dans certains contextes et en détruire dans
 * d'autres.
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
    tourMinTitres: 5,
  },
  fournisseurs: [
    {
      code: "standard",
      nom: "Fournisseur standard",
      recit:
        "Votre fournisseur historique de composants, celui de toute la profession : il ne vit que des fabricants de la partie, concurrents compris, avec une marge de grossiste. Ses clients de la partie ne resteront pas tous chez un concurrent.",
      // Aucun client hors de la partie (recalibré quand la Studio est devenue
      // vendable au niveau 7 : ses composants passent par lui dès le tour 1, et
      // avec 400 000 € par tour de clients extérieurs son rachat battait la
      // croissance interne dans tous les contextes du banc ; conception NOVA
      // Home, phase 2). Son chiffre d'affaires est celui de la partie.
      clientsExterieurs: { chiffreDAffaires: 0, saisonnalite: [0.9, 0.95, 1, 1.3, 0.9, 1], croissance: 0.01 },
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
      // La Home aussi : un distributeur grand public vend des enceintes connectées.
      // Klangwerk (hi-fi passive) et l'usine de Fonika ne la prennent pas.
      reseau: { capacite: 3_000, prix: { "nova-go": 30, "nova-one": 52, "nova-studio": 112, "nova-home": 75 }, coutParUnite: 5, coutFixeParTour: 35_000 },
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
    // La Home : le sous-traitant l'assemble, NOVA fournit le micrologiciel.
    // Plus chère que la One à chaque tranche, une qualité un peu en dessous.
    "nova-home": {
      tranches: [{ jusqua: 1000, prix: 78 }, { jusqua: 2000, prix: 88 }, { prix: 98 }],
      plafond: 3000,
      qualite: 0.97,
    },
  },
};

/** Les scénarios joués qui portent un niveau 7, par code. */
export const GROUPE_PAR_SCENARIO: Readonly<Record<string, ConfigDeGroupe>> = {
  "nova-gamme": GROUPE_NOVA,
};

/**
 * NOVA HOME, LA NOUVEAUTÉ DU NIVEAU 7 : l'enceinte connectée multipièce,
 * Wi-Fi et Bluetooth, pilotée depuis l'application NOVA Link. Elle n'existe
 * qu'au niveau 7 (`composerLeScenarioJoue` l'ajoute à la gamme) et enseigne
 * l'innovation sur un marché nouveau. Conception et banc :
 * conception-nova-home.md.
 *
 * LA RÉFÉRENCE. 99 €, 44 € de matières dont 11 € de module radio, 19 € d'autres
 * charges variables (main-d'œuvre directe 13 €, tests radio et énergie 4 €,
 * licences 2 €) : 36 € de marge sur coût variable pour 0,45 h d'atelier, soit
 * 80 € par heure, entre la One (70 €) et la Go (83 €). Son intérêt tient à son
 * marché, pas à une marge hors norme : au banc, à 32 € de marge elle perdait
 * presque toujours, à 40 € elle gagnait toujours dans l'atelier agrandi.
 *
 * LE DÉVELOPPEMENT, PAR ÉTAPES. 90 000 € de R&D, immobilisés (frais de
 * développement) puis amortis sur huit trimestres à partir du lancement. Le
 * développement démarre quand un tiers est engagé ; deux trimestres au moins
 * séparent ce démarrage de la première vente, jamais avant le tour 3 ; la
 * certification radio peut retarder le lancement d'un trimestre (30 %). Une
 * fois lancée, la plateforme logicielle (serveurs, mises à jour de sécurité,
 * assistance) coûte 8 000 € par trimestre, vendue ou non.
 *
 * LE MODULE RADIO. Taikon Wireless, la référence, rompt sur un flux propre
 * (10 % par trimestre, 30 % aux pics) et ampute alors le plan de la Home de
 * 40 % ; Silicéa, double source européenne, 5 % plus cher, ne rompt jamais.
 * L'import n'est pas certifié pour la directive RED.
 *
 * LE MARCHÉ. Les foyers connectés, dont l'adoption est cachée : lente,
 * moyenne ou rapide, tirée par la graine à la composition, révélée par l'étude
 * de marché. Et les acheteurs de One qui passent au multipièce : dès qu'une
 * entreprise vend la Home, 4 % des étudiants et 20 % des passionnés de la One
 * (fois le facteur de l'adoption) migrent vers ce segment. La porte marketing
 * (une catégorie nouvelle se fait connaître) et la fidélité (l'écosystème)
 * sont des ressorts du moteur, pas des bonus.
 *
 * LES CONCURRENTS. Aucun ne l'ouvre ; Auris (premium) et Vertex (équilibré)
 * la développent dès qu'une autre entreprise l'a mise au marché.
 */
export const NOVA_HOME: DefinitionDUneNouveaute = {
  reference: {
    code: "nova-home",
    name: "NOVA Home",
    materialCostPerUnit: 44,
    otherVariableCostPerUnit: 19,
    hoursPerUnit: 0.45,
    suppliers: [
      {
        code: "taikon",
        name: "Taikon Wireless",
        narrative:
          "Le module Wi-Fi et Bluetooth de référence, certifié, au prix du marché. Une seule usine, à Taïwan : quand la demande mondiale de puces s'emballe, aux pics de ventes surtout, ses livraisons sont rationnées et la ligne Home s'arrête en partie.",
        costMultiplier: 1,
        qualityBonus: 0,
        paymentDelayDays: 30,
        // Le risque se tire sur un flux propre (`groupe.nouveautes[].ruptures`),
        // jamais sur le flux du tour.
        supplyRiskProbability: 0,
        supplyRiskAvailabilityHit: 0.6,
      },
      {
        code: "silicea",
        name: "Silicéa Modules",
        narrative:
          "Un fabricant grenoblois de modules radio, deux usines, 5 % plus cher et une meilleure tenue radio. Il n'a jamais rompu une livraison.",
        costMultiplier: 1.05,
        qualityBonus: 0.02,
        paymentDelayDays: 30,
        supplyRiskProbability: 0,
        supplyRiskAvailabilityHit: 1,
      },
    ],
    development: {
      cost: 90_000,
      availableFromRound: 3,
      seuilDeDemarrage: 1 / 3,
      dureeMinimale: 2,
      risqueDeRetard: { probabilite: 0.3, tours: 1 },
    },
    market: {
      segments: [
        {
          code: "foyers",
          name: "Foyers connectés (multipièce, pilotage au téléphone)",
          // taille et croissance : celles de l'état d'adoption tiré
          size: 1500,
          growth: 0.08,
          priceElasticity: -1.3,
          refPrice: 99,
          minAcceptablePrice: 69,
          psychThresholds: [{ threshold: 100, penalty: 0.92 }],
          marketingSensitivity: 0.25,
          // une catégorie nouvelle se fait connaître : sans budget, un cinquième de l'attraction
          marketingGate: 0.2,
          qualitySensitivity: 0.35,
          // l'écosystème : qui a une Home rachète la même marque pour la pièce d'à côté
          loyalty: 0.45,
          priceEffectBounds: { min: 0.3, max: 2.5 },
          paymentDelayDays: 30,
          seasonality: [0.8, 0.9, 1.0, 1.6, 1.0, 1.1],
        },
        {
          code: "migrants",
          name: "Acheteurs de One passés au multipièce",
          // le potentiel de ce segment est celui de la migration (moteur), pas sa taille
          size: 1,
          growth: 0,
          priceElasticity: -1.8,
          refPrice: 89,
          minAcceptablePrice: 65,
          psychThresholds: [{ threshold: 100, penalty: 0.9 }],
          marketingSensitivity: 0.15,
          qualitySensitivity: 0.3,
          loyalty: 0.3,
          priceEffectBounds: { min: 0.2, max: 3 },
          paymentDelayDays: 0,
        },
      ],
      seasonality: [0.8, 0.9, 1.0, 1.6, 1.0, 1.1],
      outsideAttraction: 0.6,
      competitionIntensity: 1.5,
    },
  },
  adoption: {
    segment: "foyers",
    etats: [
      { nom: "lente", taille: 500, croissance: -0.05, migration: 0.3 },
      { nom: "moyenne", taille: 1500, croissance: 0.08, migration: 1 },
      { nom: "rapide", taille: 2400, croissance: 0.18, migration: 1.5 },
    ],
  },
  regles: {
    migration: { depuis: "nova-one", vers: "migrants", parts: { etudiants: 0.04, passionnes: 0.2 } },
    plateforme: { coutFixeParTour: 8_000 },
    ruptures: [{ fournisseur: "taikon", probabilite: 0.1, probabiliteAuxPics: 0.3, seuilDePic: 1.2 }],
    suiveurs: ["premium", "balanced", "growth"],
    immobilisation: { dureeDAmortissement: 8 },
  },
};

/** Les nouveautés du niveau 7, par code de scénario joué. */
export const NOUVEAUTES_PAR_SCENARIO: Readonly<Record<string, readonly DefinitionDUneNouveaute[]>> = {
  "nova-gamme": [NOVA_HOME],
};
