import type { ConfigDeGroupe } from "@/engine/groupe/types";

/**
 * LE NIVEAU 7 « GROUPE » DE NOVA, EN GAMME : les paramètres du prototype.
 *
 * Base trimestrielle (les tranches et les plafonds de la sous-traitance sont
 * redimensionnés par la périodicité, `composerLeScenarioJoue`). Calibrés au
 * banc du niveau 7 (conception, section 15) : chaque levier doit créer de la
 * valeur dans certains contextes et en détruire dans d'autres.
 *
 * La demande est celle de NOVA en gamme, telle quelle (décision du
 * propriétaire) : saisons, Noël et grand compte compris.
 */
export const GROUPE_NOVA: ConfigDeGroupe = {
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
      tranches: [{ jusqua: 2000, prix: 30 }, { jusqua: 4000, prix: 34 }, { prix: 38 }],
      plafond: 6000,
      qualite: 1,
    },
    "nova-one": {
      tranches: [{ jusqua: 1500, prix: 54 }, { jusqua: 3000, prix: 60 }, { prix: 66 }],
      plafond: 4500,
      qualite: 1,
    },
  },
};

/** Les scénarios joués qui portent un niveau 7, par code. */
export const GROUPE_PAR_SCENARIO: Readonly<Record<string, ConfigDeGroupe>> = {
  "nova-gamme": GROUPE_NOVA,
};
