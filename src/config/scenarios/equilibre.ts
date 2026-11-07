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
 * trimestre). Le prix est multiplié, SECTEUR PAR SECTEUR, pour que la plus petite machine
 * du catalogue, pleinement vendue, rapporte environ 65 % par an (décision du
 * propriétaire) ; une machine au parc paie en plus chaque trimestre une charge
 * d'entretien courant et d'assurance, part de son prix, qui fait coûter une capacité
 * vide. Les machines plus grandes rapportent moins à capacité pleine.
 *
 * Le calcul (refait par `tests/engine/equilibre.test.ts`) : la marge sur coût variable
 * d'une unité vendue au premier trimestre de l'arène du cours, fois la capacité de la
 * machine, moins sa charge fixe, chaque trimestre de son amortissement ; le prix est
 * celui qui actualise ces flux à 65 % l'an, arrondi au millier d'euros.
 *
 * AU CONSEIL, c'est l'équipe qui borne : un poste de plus ne se facture qu'avec les
 * consultants qui l'occupent. Le flux d'une machine y retranche donc, de chaque jour
 * vendu, le salaire d'un consultant rapporté à ses jours facturables (12 600 € pour
 * 60 jours, 210 € le jour), et sa mise compte les recrutements qu'il faut pour la
 * remplir. Sans l'équipe, le poste junior rapportait plus de 3 500 % l'an au prix
 * décuplé : un chiffre qu'aucun cabinet ne verrait.
 *
 * Un scénario d'enseignant, absent de la table, garde le facteur dix.
 */
export const MULTIPLICATEUR_DU_PRIX_DES_MACHINES: Readonly<Record<string, number>> = {
  nova: 9.31,
  "nova-gamme": 8.93,
  "boutique-mono": 11.71,
  boutique: 16.75,
  hotel: 5.17,
  "hotel-gamme": 6.49,
  bistrot: 13.53,
  "bistrot-gamme": 13.23,
  conseil: 40.03,
  "conseil-gamme": 53.53,
  ecommerce: 26.44,
  "ecommerce-gamme": 33.65,
  fitness: 38.44,
  batiment: 9.2,
  transport: 6.16,
};
export const MULTIPLICATEUR_PAR_DEFAUT = 10;
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
 * transport, à la salle de sport, au bâtiment, à l'hôtel (son équipe calée sur la pointe
 * sert la clientèle que la qualité attire) et au bistrot (en un produit et en gamme) ;
 * elle reste derrière zéro chez NOVA en gamme, à la boutique, à l'hôtel en gamme et au
 * conseil. Le formulaire propose donc la part neutre là où elle paie, et zéro ailleurs ;
 * le bon gestionnaire, qui part du formulaire, la joue.
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
  hotel: 0.5,
  "nova-gamme": 0,
  boutique: 0,
  "boutique-mono": 0,
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
 * Le besoin est, selon la mesure :
 *  · l'atelier, là où la demande le dépasse ;
 *  · la POINTE de la demande, à l'hôtel (décision du propriétaire : l'équipe sert la
 *    haute saison, et licencier peut rapporter un peu hors saison, écart nommé dans la
 *    garde) et au commerce en ligne en gamme, dont l'atelier n'est jamais plein ;
 *  · la demande moyenne de l'année, au bistrot, au bâtiment et au transport, où l'équipe
 *    calée sur l'atelier gardait assez de marge pour que sous-payer rapporte encore ; au
 *    bistrot en gamme, à mi-chemin, la moyenne coûtant un cinquième du résultat.
 * Au commerce en ligne et à la salle de sport, calée sur la moyenne, l'équipe perdait la
 * pointe et le résultat de l'année : elles restent sur l'atelier.
 *
 * Absents : NOVA, déjà à moins de 4 % de l'atelier, et le conseil (en un produit comme en
 * gamme), où l'équipe est le goulot voulu du métier et où le bon gestionnaire embauche :
 * la porter à 1,05 fois les postes doublerait ses jours facturables et son résultat.
 */
export const HEURES_PAR_UNITE: Readonly<Record<string, number>> = {
  // Sur l'atelier.
  "nova-gamme": 1.039,
  boutique: 3.36,
  ecommerce: 1.238,
  fitness: 1.05,
  // Sur la pointe de la demande.
  hotel: 1.73,
  "hotel-gamme": 1.646,
  "ecommerce-gamme": 1.387,
  // Sur la demande moyenne de l'année.
  "boutique-mono": 2.93,
  bistrot: 1.037,
  "bistrot-gamme": 1.06,
  batiment: 1.039,
  transport: 1.064,
}

const auPrixDeLEquilibre = (multiplicateur: number) => (t: EquipmentTypeDef): EquipmentTypeDef => {
  const prix = Math.round((t.costPerUnit * multiplicateur) / 1000) * 1000;
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

  // Machines : prix multiplié selon le secteur, charge fixe au parc. Le parc de départ garde son prix
  // d'achat (valeurs nettes et amortissements du bilan d'ouverture) ; ses charges fixes
  // sont déjà comptées dans les charges de structure du métier : le moteur n'ajoute que
  // l'écart au parc de départ. Le compte du premier tour ne bouge pas, mais une machine
  // vendue rend sa charge, une machine achetée ajoute la sienne.
  if (s.equipment) {
    s = { ...s, equipment: { ...s.equipment, types: s.equipment.types.map(auPrixDeLEquilibre(MULTIPLICATEUR_DU_PRIX_DES_MACHINES[code] ?? MULTIPLICATEUR_PAR_DEFAUT)) } };
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
