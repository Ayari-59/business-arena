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
 *
 * Banc à demande normale (conception, section 15, phase B2) :
 *  - le barème du sous-traitant monte vite au-delà de la première tranche
 *    (Go 30/36/44, One 54/64/76) : à 30/34/38 et 54/60/66, sous-traiter
 *    au-delà de la demande (×1,5) gagnait dans les 36 contextes ; ici il perd
 *    dans 12, et servir la demande du tour précédent dans 8 ;
 *  - l'intégration d'une société rachetée ne se fait pas en un jour (la moitié
 *    de ses lignes arrêtées au tour du rachat, un quart de son effectif qui
 *    part, la moitié de sa clientèle qui ne suit pas) : sans elle, racheter
 *    battait la croissance interne à décaissement égal dans presque tous les
 *    contextes.
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
    integration: { lignesArretees: 0.5, departs: 0.25, clienteleConservee: 0.5 },
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
