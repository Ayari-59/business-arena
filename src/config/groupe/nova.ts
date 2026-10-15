import type { ConfigDeGroupe } from "@/engine/groupe/types";

/**
 * LE NIVEAU 7 « GROUPE » DE NOVA, EN GAMME : les paramètres du prototype.
 *
 * Base trimestrielle (les tranches et les plafonds de la sous-traitance sont
 * redimensionnés par la périodicité, `composerLeScenarioJoue`). Calibrés au
 * banc du niveau 7 (conception, section 15) : chaque levier doit créer de la
 * valeur dans certains contextes et en détruire dans d'autres.
 *
 * Le facteur de demande est propre au niveau 7 : NOVA en gamme vend deux à
 * trois fois sa capacité à partir du tour 3 ; à ce niveau, où l'on décide de
 * la capacité (racheter, faire fabriquer, investir), un marché qui absorbe tout
 * ferait de chaque unité de capacité une aubaine. Il ne touche aucun autre
 * niveau.
 */
export const GROUPE_NOVA: ConfigDeGroupe = {
  facteurDeDemande: 0.5,
  valorisation: { multipleEBE: 5, actionsInitiales: 10_000 },
  rachat: {
    primeDeControle: 0.25,
    fraisDeTransaction: 0.03,
    synergieDeStructure: 0.1,
    coutDIntegration: 1,
    decoteDEmission: 0.1,
    seuilDeControle: 0.5,
    tourMin: 2,
  },
  sousTraitance: {
    "nova-go": {
      tranches: [{ jusqua: 2000, prix: 24 }, { jusqua: 4000, prix: 29 }, { prix: 36 }],
      plafond: 6000,
      qualite: 1,
    },
    "nova-one": {
      tranches: [{ jusqua: 1500, prix: 46 }, { jusqua: 3000, prix: 54 }, { prix: 64 }],
      plafond: 4500,
      qualite: 1,
    },
  },
};

/** Les scénarios joués qui portent un niveau 7, par code. */
export const GROUPE_PAR_SCENARIO: Readonly<Record<string, ConfigDeGroupe>> = {
  "nova-gamme": GROUPE_NOVA,
};
