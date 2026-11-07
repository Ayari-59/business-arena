import type { EngineScenarioConfig, EquipmentTypeDef } from "@/engine/types";

/**
 * L'ÉQUILIBRE DU MOTEUR 0.2.0 : CE QU'UNE PARTIE CRÉÉE AUJOURD'HUI FIGE DE PLUS.
 *
 * Un relevé de l'arène du cours (graine 20260101, le bon gestionnaire, novembre 2026)
 * a montré des stratégies naïves qui rapportaient : ne rien entretenir dans quatre
 * secteurs, ne rien dépenser en prévention, licencier ou sous-payer une équipe trop
 * nombreuse, acheter une machine qui se payait en moins d'un trimestre. Le propriétaire
 * a validé les corrections ; elles vivent ici, en données, et en trois règles du moteur
 * que le drapeau `equilibre` ouvre (engine/types.ts).
 *
 * Les parties créées avant gardent l'équilibre de leur instantané, au bit près : le
 * registre ne change pas, c'est la composition du scénario joué
 * (`composerLeScenarioJoue`, avec `CORRECTIFS_DES_PARTIES_NOUVELLES`) qui l'applique.
 * Le rejeu du bilan relit le drapeau dans l'instantané (`services/merite.service.ts`).
 *
 * Appliqué sur la base trimestrielle, après les réglages économiques de l'enseignant et
 * avant la durée du tour : la charge fixe des machines suit la durée comme les autres
 * charges de structure (`applyPeriodicity`).
 */
export const VERSION_DE_L_EQUILIBRE = "0.2.0" as const;

/**
 * LES MACHINES. Le relevé mesurait, pour une machine pleinement vendue, un retour de 5 à
 * plus de 1 000 fois sa mise par an (NOVA : la ligne manuelle se payait en 0,71
 * trimestre). Le prix est décuplé ; une machine au parc paie en plus chaque trimestre
 * une charge d'entretien courant et d'assurance, part de son prix, qui fait coûter une
 * capacité vide.
 */
export const MULTIPLICATEUR_DU_PRIX_DES_MACHINES = 10;
export const CHARGE_FIXE_DES_MACHINES = 0.01;

/**
 * L'USURE DOUBLE dans les quatre secteurs où ne rien entretenir rapportait sur un an
 * (relevé : hôtel +35 000 €, conseil +23 000 €, salle de sport +11 000 €, bâtiment
 * +10 500 €). Par code du registre : un scénario d'enseignant garde son usure.
 */
export const USURE_DOUBLEE: ReadonlySet<string> = new Set([
  "hotel",
  "hotel-gamme",
  "conseil",
  "conseil-gamme",
  "fitness",
  "batiment",
]);

/**
 * LA PRÉVENTION. L'effet du budget qualité sur la qualité produite, donc sur la
 * demande, double partout (le levier que le relevé a mesuré) ; et les retours clients
 * s'ouvrent là où il n'y en avait pas. Un retour ne naît que d'une qualité perçue sous 1 :
 * un atelier poussé au-delà de 95 % sans prévention. La valeur est mesurée dans l'arène
 * du cours (budget qualité à la moitié de l'échelle contre zéro, huit trimestres) :
 * chez NOVA, la prévention perdait 17 000 € sans retours, 10 300 € à 0,5, 3 600 € à 1, et
 * passe devant au-delà de 1,3 ; au bâtiment, elle passe devant dès 1 sur quatre trimestres,
 * et la partie solo du formulaire (`QUALITE_PROPOSEE`) ne la donne gagnante qu'à 2. Au
 * conseil, les postes ne dépassent jamais 95 % d'occupation : les retours n'y jouent pas,
 * et la prévention y paie sur huit trimestres par l'effet doublé.
 */
export const MULTIPLICATEUR_DE_L_EFFET_QUALITE = 2;
export const RETOURS_OUVERTS: Readonly<Record<string, number>> = {
  nova: 1.5,
  "nova-gamme": 1.5,
  conseil: 1,
  "conseil-gamme": 1,
  batiment: 2,
};

/**
 * L'ACTION « SATISFACTION CLIENT », niveau 1 : elle rapportait jusqu'à six fois sa
 * mise en un an. Coût doublé, bonus d'image divisé par deux.
 */
export const SATISFACTION_N1 = { cout: 2, image: 0.5 } as const;

/**
 * LA QUALITÉ QUE LE FORMULAIRE PROPOSE À L'ÉQUILIBRE 0.2.0 (`qualiteProposee`,
 * engine/types.ts), en part de l'échelle. La même mesure que celle qui la fonde
 * (`tests/engine/qualite-proposee-mesure.test.ts` : partie solo fidèle, six graines,
 * l'horizon du scénario), refaite à l'équilibre : la part de la gestion neutre y fait
 * mieux que zéro chez NOVA, au commerce en ligne (en un produit et en gamme), au
 * transport, à la salle de sport, au bâtiment et au bistrot (en un produit et en gamme) ;
 * elle reste derrière zéro chez NOVA en gamme, à la boutique, à l'hôtel en gamme et au
 * conseil, et l'écart est négligeable à l'hôtel. Le formulaire propose donc la part
 * neutre là où elle paie, et zéro ailleurs ; le bon gestionnaire, qui part du
 * formulaire, la joue.
 */
export const QUALITE_PROPOSEE: Readonly<Record<string, number>> = {
  nova: 0.5,
  bistrot: 0.5,
  "bistrot-gamme": 0.5,
  ecommerce: 0.5,
  "ecommerce-gamme": 0.5,
  fitness: 0.5,
  transport: 0.5,
  batiment: 0.5,
  "nova-gamme": 0,
  boutique: 0,
  "boutique-mono": 0,
  hotel: 0,
  "hotel-gamme": 0,
  conseil: 0,
  "conseil-gamme": 0,
};

/**
 * LES HEURES D'UNE UNITÉ, pour que l'équipe de départ couvre environ 1,05 fois ce dont
 * l'entreprise a besoin. La boutique couvrait trois fois son atelier, l'hôtel deux fois
 * sa demande, et licencier ou sous-payer y rapportait (relevé : jusqu'à 225 000 € sur
 * deux ans à l'hôtel). Un facteur sur `hoursPerUnit` : la capacité de l'équipe au premier
 * trimestre de l'arène du cours, divisée par 1,05 fois le besoin.
 *
 * Le besoin est l'atelier, ou la demande moyenne de l'année là où les places ne sont
 * jamais toutes prises (l'hôtel, comme le propriétaire l'a demandé) et là où la mesure le
 * montre : au bistrot, au bâtiment et au transport, calée sur l'atelier, l'équipe gardait
 * assez de marge pour que sous-payer rapporte encore. Au commerce en ligne, à la salle de
 * sport et à la boutique en gamme, la pointe de l'année dépasse de loin la moyenne :
 * calée sur la moyenne, l'équipe perdait la pointe et le résultat de l'année (au commerce
 * en ligne, 93 000 € devenaient une perte sur deux ans) ; elles restent sur l'atelier.
 *
 * Absents : NOVA et le bistrot en gamme, déjà à moins de 4 % de l'atelier, et le conseil,
 * où l'équipe est le goulot voulu du métier (elle couvre la moitié des postes, et le bon
 * gestionnaire embauche) : la porter à 1,05 fois les postes doublerait ses jours
 * facturables et son résultat.
 */
export const HEURES_PAR_UNITE: Readonly<Record<string, number>> = {
  // Sur l'atelier.
  "nova-gamme": 1.039,
  boutique: 3.36,
  ecommerce: 1.238,
  "ecommerce-gamme": 1.097,
  fitness: 1.05,
  // Sur la demande moyenne de l'année.
  "boutique-mono": 2.93,
  hotel: 1.973,
  "hotel-gamme": 1.889,
  bistrot: 1.037,
  batiment: 1.039,
  transport: 1.064,
};

const auPrixDeLEquilibre = (t: EquipmentTypeDef): EquipmentTypeDef => {
  const prix = t.costPerUnit * MULTIPLICATEUR_DU_PRIX_DES_MACHINES;
  return {
    ...t,
    costPerUnit: prix,
    prixDuParcDeDepart: t.prixDuParcDeDepart ?? t.costPerUnit,
    chargeFixeParTour: Math.round(prix * CHARGE_FIXE_DES_MACHINES),
  };
};

/** Le scénario à l'équilibre 0.2.0. Déjà à l'équilibre : rendu tel quel. */
export function avecLEquilibre(scenario: EngineScenarioConfig): EngineScenarioConfig {
  if (scenario.equilibre !== undefined) return scenario;
  const code = scenario.code;
  let s: EngineScenarioConfig = { ...scenario, equilibre: VERSION_DE_L_EQUILIBRE };

  // Machines : prix décuplé, charge fixe au parc. Le parc de départ garde son prix
  // d'achat (valeurs nettes et amortissements du bilan d'ouverture) ; ses charges fixes
  // sont déjà comptées dans les charges de structure du métier : le moteur n'ajoute que
  // l'écart au parc de départ. Le compte du premier tour ne bouge pas, mais une machine
  // vendue rend sa charge, une machine achetée ajoute la sienne.
  if (s.equipment) {
    s = { ...s, equipment: { ...s.equipment, types: s.equipment.types.map(auPrixDeLEquilibre) } };
  }

  // Entretien et prévention.
  s = {
    ...s,
    production: {
      ...s.production,
      qualitySensitivity: s.production.qualitySensitivity * MULTIPLICATEUR_DE_L_EFFET_QUALITE,
      ...(USURE_DOUBLEE.has(code) ? { availabilityDecay: Math.min(0.5, s.production.availabilityDecay * 2) } : {}),
    },
  };
  const retours = RETOURS_OUVERTS[code];
  if (retours !== undefined && (s.qualityCosts?.externalReturnSensitivity ?? 0) === 0) {
    s = {
      ...s,
      qualityCosts: { ...(s.qualityCosts ?? { baseDefectRate: 0 }), externalReturnSensitivity: retours },
    };
  }

  // L'action « satisfaction », niveau 1.
  if (s.qualityActions) {
    s = {
      ...s,
      qualityActions: {
        ...s.qualityActions,
        actions: s.qualityActions.actions.map((a) =>
          a.code.startsWith("satisfaction")
            ? {
                ...a,
                levels: a.levels.map((l, i) =>
                  i === 0
                    ? {
                        ...l,
                        cost: l.cost * SATISFACTION_N1.cout,
                        effects: {
                          ...l.effects,
                          ...(l.effects.qualityImageBonus !== undefined
                            ? { qualityImageBonus: l.effects.qualityImageBonus * SATISFACTION_N1.image }
                            : {}),
                        },
                      }
                    : l,
                ),
              }
            : a,
        ),
      },
    };
  }

  // La qualité proposée : elle remplace celle du registre, et celle d'une partie à la
  // demande, que la mesure à l'équilibre recouvre aussi.
  const qualite = QUALITE_PROPOSEE[code];
  if (qualite !== undefined) {
    const { qualiteProposeeALaDemande: _demande, ...sansElle } = s;
    void _demande;
    s = { ...sansElle, qualiteProposee: qualite };
  }

  // Les heures d'une unité.
  const heures = HEURES_PAR_UNITE[code];
  if (heures !== undefined) {
    s = {
      ...s,
      product: { ...s.product, hoursPerUnit: s.product.hoursPerUnit * heures },
      ...(s.products ? { products: s.products.map((p) => ({ ...p, hoursPerUnit: p.hoursPerUnit * heures })) } : {}),
    };
  }
  return s;
}
