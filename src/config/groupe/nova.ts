import type { ConfigDeGroupe } from "@/engine/groupe/types";

/**
 * LE NIVEAU 7 « GROUPE » DE NOVA, EN GAMME : les paramètres du prototype.
 *
 * Base trimestrielle (les tranches et les plafonds de la sous-traitance sont
 * redimensionnés par la périodicité, `composerLeScenarioJoue`). Calibrés au
 * banc du niveau 7 (conception, section 15) : chaque levier doit créer de la
 * valeur dans certains contextes et en détruire dans d'autres.
 *
 * Banc du 15 octobre 2026 (6 tours, 3 et 4 entreprises, prix ×0,9 à ×1,2,
 * graines 2026, 7 et 4242) :
 *  - facteurDeDemande 0,65 : la demande de l'industrie au prix de référence
 *    vaut 1,28 fois sa capacité en moyenne sur la partie (0,57 au premier
 *    trimestre, 2,2 à Noël) ; plus bas, la gestion neutre ne passe plus le
 *    premier tour ;
 *  - barème relevé (Go 30/34/38, One 54/60/66) : au barème d'avant (24/29/36,
 *    46/54/64), sous-traiter la demande du tour précédent gagnait dans les 36
 *    contextes ; au barème retenu, il perd dans 2 à 3 sur 36, et sous-traiter
 *    au-delà (×1,5) perd dans 12.
 *
 * Le facteur de demande est propre au niveau 7 : NOVA en gamme vend deux à
 * trois fois sa capacité à partir du tour 3 ; à ce niveau, où l'on décide de
 * la capacité (racheter, faire fabriquer, investir), un marché qui absorbe tout
 * ferait de chaque unité de capacité une aubaine. Il ne touche aucun autre
 * niveau.
 */
export const GROUPE_NOVA: ConfigDeGroupe = {
  facteurDeDemande: 0.65,
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
