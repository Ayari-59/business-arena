import type { EngineScenarioConfig } from "../../engine/types";
import { mapGammeSegments } from "../../engine/gamme";
import { DEFAULT_RSE_CONFIG } from "../../engine/rse";

/**
 * Périodicité d'une partie (ADR-01) : un tour peut représenter un mois, un
 * trimestre ou une année. Les scénarios sont écrits en base trimestrielle
 * (90 jours) ; cette fonction dérive une variante redimensionnée SANS toucher
 * au scénario d'origine — la dramaturgie par tour (pic au tour 4, CampusTech
 * au tour 3…) est conservée, seule l'échelle économique change.
 *
 * Règles de redimensionnement (facteur k = jours du tour / 90) :
 * - grandeurs de flux par tour (demande de base, coûts fixes, amortissements,
 *   capacités machine et heures, références de budgets) : × k ;
 * - taux de croissance par tour : composés — (1+g)^k − 1 ;
 * - taux de PERTE et probabilités de tirage par tour : composés comme ce qui
 *   reste — 1 − (1 − p)^k, pour que la chance annuelle d'un choc ne dépende
 *   pas du découpage du temps ;
 * - délais de paiement (en jours) et taux annuels : INCHANGÉS — leur poids
 *   relatif varie donc naturellement avec la durée du tour (un client à 80 j
 *   pèse plus lourd au mois qu'à l'année : c'est voulu et pédagogique).
 *
 * LA SAISONNALITÉ NE CHANGE PAS AVEC LA PÉRIODICITÉ — C'EST UNE DÉCISION, révisée
 * pour le mois (octobre 2026) : une partie au mois née depuis porte un mois de départ
 * et suit le calendrier (`calendrier-mensuel.ts`), qui répartit la saison de chaque
 * trimestre entre ses trois mois et place au premier mois de son trimestre ce qui est
 * écrit pour lui. Ce qui suit vaut pour le trimestre, l'année, et les parties au mois
 * d'avant le calendrier.
 *
 * Un tableau de saisonnalité se lit UNE VALEUR PAR TOUR (`saisonDuTour`,
 * engine/market/demand.ts), au mois comme au trimestre ou à l'année. Il porte la
 * dramaturgie de la partie au même titre que les situations, les événements
 * scriptés et le tour du pic (`tourDuPic`) : tous sont comptés en tours, et c'est
 * ce qui les garde d'accord entre eux. Au mois, le pic du tour 4 reste au tour 4,
 * là où la situation qui le raconte l'attend ; seule l'échelle des volumes suit
 * la durée du tour (la taille des segments, × k ci-dessous). Sa lecture
 * calendaire — dans 66 des 86 tableaux, quatre trimestres d'une année suivis de
 * la répétition des deux premiers — n'est vraie qu'au trimestre : c'est de
 * l'habillage (ADR-01), pas une règle du moteur.
 *
 * Pourquoi ne pas étaler chaque trimestre sur trois mois, ou ramener l'année à
 * la moyenne de ses quatre trimestres ? Parce que (1) le pic quitterait le tour
 * où la situation et l'événement scripté le racontent ; (2) vingt tableaux sur
 * quatre-vingt-six ne sont pas une année répétée mais un arc écrit tour par tour
 * (le référencement de CampusTech chez NOVA, les produits des gammes), qu'un
 * étalement détruirait ; (3) un profil mensuel fidèle n'est pas un étirement
 * mécanique, c'est du contenu à écrire et à recalibrer secteur par secteur.
 *
 * La garde de cette décision n'est donc pas ici mais à la création : une
 * partie ne se joue jamais sur plus de tours que ses tableaux n'ont de valeurs
 * (`applyRoundsCount`, config/scenarios/rounds.ts). Jamais de lecture modulo.
 *
 * QUAND L'UNITÉ VENDUE EST UNE PÉRIODE (scénarios à `subscription`).
 *
 * Un adhérent paie un TOUR d'abonnement et consomme un TOUR d'encadrement :
 * son prix, son coût variable et les heures qu'il prend sont des flux, pas des
 * grandeurs unitaires figées. La règle générale les laissait intacts, et le
 * bloc d'abonnement n'était pas redimensionné du tout : au mois, une salle
 * gardait 15 % d'attrition PAR MOIS là où le scénario les avait calibrés par
 * trimestre, soit près de 86 % par an, tout en encaissant 105 € mensuels pour
 * des charges divisées par trois. Le scénario n'était pas jouable au mois, et
 * rien ne le disait.
 *
 * Trois règles supplémentaires, donc, et elles suffisent à tenir les trois
 * invariants que la garde vérifie : le seuil en adhérents, la capacité en
 * adhérents et l'attrition annualisée ne dépendent pas de la durée du tour.
 * - les taux d'attrition par tour se COMPOSENT comme les croissances :
 *   1 − (1 − c)^k ;
 * - prix d'un tour d'abonnement, coût variable et heures par adhérent : × k,
 *   sur le bloc d'abonnement comme sur le marché des nouveaux ;
 * - la capacité d'accueil est un STOCK de places, pas un flux : elle ne bouge
 *   pas, non plus que le prix d'une place à l'achat.
 */

export type Periodicity = "month" | "quarter" | "year";

export const PERIODICITY_DAYS: Record<Periodicity, number> = {
  month: 30,
  quarter: 90,
  year: 360,
};

export const PERIODICITY_LABELS: Record<Periodicity, { singular: string; plural: string }> = {
  month: { singular: "Mois", plural: "mois" },
  quarter: { singular: "Trimestre", plural: "trimestres" },
  year: { singular: "Année", plural: "années" },
};

/** Retrouve la périodicité d'un instantané de scénario depuis roundDays. */
export function periodicityFromRoundDays(roundDays: number): Periodicity {
  if (roundDays <= 45) return "month";
  if (roundDays <= 180) return "quarter";
  return "year";
}

/**
 * Le libellé d'un tour à l'écran. Unifié sur « Tour N » (choix produit) :
 * quelle que soit la durée réelle d'un tour (mois, trimestre, année, fixée au
 * lancement de la partie), le joueur lit « Tour 1 », « Tour 2 »… La durée reste
 * un paramètre de la partie — le sélecteur « un trimestre par tour » l'annonce
 * au lancement — mais elle ne teinte plus chaque libellé. `_roundDays` est donc
 * conservé dans la signature (les appelants le passent) sans influer sur le texte.
 */
export function periodLabel(_roundDays: number, index: number): string {
  return `Tour ${index}`;
}

const compound = (ratePerQuarter: number, k: number) => Math.pow(1 + ratePerQuarter, k) - 1;

/**
 * Un taux de PERTE par tour, ramené à une autre durée de tour.
 *
 * Ce n'est pas la même composition qu'une croissance : ce qui se compose est
 * la part qui RESTE. Quinze pour cent par trimestre font 5,27 % par mois, et
 * non cinq.
 *
 * Exportée pour les énoncés (`situation-texte.ts`) : un taux d'attrition cité
 * dans une situation se ramène à la durée du tour par la même règle que le
 * moteur, sans quoi le texte et le compte de résultat divergeraient.
 */
export const composerPerte =(tauxParTour: number, k: number) =>
  1 - Math.pow(1 - Math.min(1, Math.max(0, tauxParTour)), k);

/**
 * Un tarif affiché à l'élève, arrondi à l'euro.
 *
 * Les prestations proratisées tombaient juste tant qu'un tour valait un
 * trimestre. Au mois, le tiers d'un tarif rond donne « 333,333 € », affiché tel
 * quel à côté de tarifs entiers dans le même bloc. Personne ne facture des
 * millièmes d'euro : l'arrondi appartient au tarif, pas à son affichage.
 */
const tarif = (montant: number) => Math.round(montant);

export function applyPeriodicity(
  scenario: EngineScenarioConfig,
  periodicity: Periodicity,
): EngineScenarioConfig {
  const days = PERIODICITY_DAYS[periodicity];
  const k = days / 90;
  if (k === 1) return scenario;
  // L'unité vendue est-elle une période ? Tout ce qui suit en dépend.
  const abonnement = scenario.subscription !== undefined;

  // Demande de base et croissance : sur le marché du scénario et, en gamme,
  // sur celui de chaque produit (les seuls segments que le moteur simule).
  // Les tableaux de saisonnalité ne sont PAS touchés : voir l'en-tête.
  // Dans un scénario par abonnement, le prix d'un segment est celui d'un TOUR
  // d'abonnement : il suit la durée du tour, comme ses seuils.
  const redimensionne = mapGammeSegments(scenario, (s) => ({
    ...s,
    size: s.size * k,
    growth: compound(s.growth, k),
    ...(abonnement
      ? {
          refPrice: s.refPrice * k,
          minAcceptablePrice: s.minAcceptablePrice * k,
          psychThresholds: s.psychThresholds.map((p) => ({ ...p, threshold: p.threshold * k })),
        }
      : {}),
  }));

  return {
    ...redimensionne,
    roundDays: days,
    // Un tour d'abonnement coûte à servir ce qu'un tour dure : matières,
    // autres charges variables et heures d'encadrement suivent la durée.
    ...(abonnement
      ? {
          product: {
            ...scenario.product,
            materialCostPerUnit: scenario.product.materialCostPerUnit * k,
            otherVariableCostPerUnit: scenario.product.otherVariableCostPerUnit * k,
            hoursPerUnit: scenario.product.hoursPerUnit * k,
          },
        }
      : {}),
    ...(scenario.subscription
      ? {
          subscription: {
            ...scenario.subscription,
            baseChurnRate: composerPerte(scenario.subscription.baseChurnRate, k),
            crowdingChurn: composerPerte(scenario.subscription.crowdingChurn, k),
            ...(scenario.subscription.maxChurnRate !== undefined
              ? { maxChurnRate: composerPerte(scenario.subscription.maxChurnRate, k) }
              : {}),
            refPrice: scenario.subscription.refPrice * k,
          },
        }
      : {}),
    production: {
      ...scenario.production,
      qualityScale: scenario.production.qualityScale * k,
      maintenanceReference: scenario.production.maintenanceReference * k,
    },
    marketing: { scale: scenario.marketing.scale * k },
    // Cartes RSE à l'année : la mauvaise presse et l'amende gardent leur chance
    // ANNUELLE, comme les événements (tirées une fois l'an avec la chance d'un
    // trimestre, elles sortaient près de trois fois moins souvent). L'amende tirée
    // vaut un trimestre : son montant suit l'échelle du marketing, qui compte
    // l'année. Une mauvaise presse dure un tour, donc l'année, comme un événement.
    // Au mois, c'est le calendrier qui s'en charge (`auCalendrierMensuel`).
    ...(periodicity === "year"
      ? (() => {
          const rse = scenario.rse ?? DEFAULT_RSE_CONFIG;
          return {
            rse: {
              ...rse,
              cards: {
                ...rse.cards,
                badBuzzProbability: composerPerte(rse.cards.badBuzzProbability, k),
                sanctionProbability: composerPerte(rse.cards.sanctionProbability, k),
                fineAmount: rse.cards.fineAmount / k,
              },
            },
          };
        })()
      : {}),
    // R&D : l'échelle du budget est un flux par tour (× k) ; le coût de
    // développement d'une référence est un total, il ne bouge pas ; son tour
    // de disponibilité est une date réelle, il se compte en tours de la
    // nouvelle durée.
    ...(scenario.rd ? { rd: { ...scenario.rd, techScale: scenario.rd.techScale * k } } : {}),
    // Communication : l'échelle du budget de marque est un flux par tour (× k).
    ...(scenario.communication
      ? { communication: { ...scenario.communication, brandScale: scenario.communication.brandScale * k } }
      : {}),
    ...(redimensionne.products
      ? {
          products: redimensionne.products.map((p) =>
            p.development?.availableFromRound !== undefined
              ? {
                  ...p,
                  development: {
                    ...p.development,
                    availableFromRound: Math.max(1, Math.round((p.development.availableFromRound - 1) / k) + 1),
                    // Niveau 7 (NOVA Home) : la durée minimale et le retard
                    // sont des durées réelles, recomptées en tours.
                    ...(p.development.dureeMinimale !== undefined
                      ? { dureeMinimale: Math.max(1, Math.round(p.development.dureeMinimale / k)) }
                      : {}),
                    ...(p.development.risqueDeRetard
                      ? {
                          risqueDeRetard: {
                            ...p.development.risqueDeRetard,
                            tours: Math.max(1, Math.round(p.development.risqueDeRetard.tours / k)),
                          },
                        }
                      : {}),
                  },
                }
              : p,
          ),
        }
      : {}),
    finance: {
      ...scenario.finance,
      depreciationPerRound: scenario.finance.depreciationPerRound * k,
      // même emprunt, même durée réelle : la durée en tours varie en 1/k
      ...(scenario.finance.loanDurationRounds !== undefined
        ? { loanDurationRounds: scenario.finance.loanDurationRounds / k }
        : {}),
    },
    fixedCostsPerRound: scenario.fixedCostsPerRound * k,
    ...(scenario.insurance
      ? {
          insurance: {
            ...scenario.insurance,
            premiumPerRound: tarif(scenario.insurance.premiumPerRound * k),
            ...(scenario.insurance.formulas
              ? {
                  formulas: scenario.insurance.formulas.map((f) => ({
                    ...f,
                    premiumPerRound: tarif(f.premiumPerRound * k),
                  })),
                }
              : {}),
          },
        }
      : {}),
    // RH : salaires et échelle de formation sont des flux (× k) ; les coûts
    // d'embauche/licenciement sont des ponctuels réels — non redimensionnés.
    ...(scenario.hr
      ? {
          hr: {
            ...scenario.hr,
            salaryPerEmployeePerRound: scenario.hr.salaryPerEmployeePerRound * k,
            trainingScale: scenario.hr.trainingScale * k,
          },
        }
      : {}),
    // Études : des prestations par tour — flux (× k).
    ...(scenario.studies
      ? {
          studies: {
            marketCost: tarif(scenario.studies.marketCost * k),
            priceCost: tarif(scenario.studies.priceCost * k),
            financeCost: tarif(scenario.studies.financeCost * k),
            projectCost: tarif(scenario.studies.projectCost * k),
          },
        }
      : {}),
    // Commandes exceptionnelles : volumes en flux (× k) ; prix unitaires et
    // délais de règlement (jours réels) inchangés.
    ...(scenario.orderOffers
      ? {
          // Par abonnement, une unité est un ADHÉRENT qui paie un tour : le
          // nombre d'inscrits d'un contrat ne dépend pas de la durée du tour,
          // son prix par tour si (comme le prix de référence). Les inscrits
          // multipliés par k étaient, à l'année, quatre fois ceux du trimestre
          // (plus que la salle n'en accueille) à un prix resté trimestriel.
          orderOffers: scenario.orderOffers.map((o) =>
            abonnement ? { ...o, price: tarif(o.price * k) } : { ...o, units: o.units * k },
          ),
        }
      : {}),
    // Les modificateurs en unités (« order », « order_subcontract ») sont des
    // flux : × k. Les prix imposés (« order_price ») ne changent pas. Par
    // abonnement, c'est l'inverse, pour la raison dite des contrats ci-dessus :
    // les adhérents d'une commande ferme ne bougent pas, et le prix imposé d'un
    // tour d'abonnement suit la durée du tour. Sans cela, la commande comptait
    // la durée deux fois (des adhérents × k payés au prix du tour, déjà × k) :
    // à l'année, elle rapportait seize fois son montant trimestriel.
    //
    // LA PROBABILITÉ DE TIRAGE EST UN TAUX PAR TOUR : ELLE SE COMPOSE.
    //
    // `probability` est la chance qu'une carte sorte À CHAQUE TOUR. Laissée
    // telle quelle, elle attache le hasard du monde au découpage du temps :
    // une même année civile tirait 3,1 à 3,6 chocs en douze tours mensuels
    // contre 0,60 à 0,80 en quatre tours trimestriels (de trois à onze fois
    // plus), et presque rien en un tour annuel (0,00 à 0,05). L'élève au mois
    // subissait un monde beaucoup plus agité que son voisin au trimestre, sans
    // que rien ne l'annonce. Ce qui doit se conserver est la chance ANNUELLE :
    // on compose donc comme un taux de perte, 1 − (1 − p)^k. Une carte à
    // probabilité nulle (celles réservées à la main de l'enseignant) le reste.
    events: scenario.events.map((e) => ({
      ...e,
      probability: composerPerte(e.probability, k),
      modifiers: e.modifiers.map((m) => {
        if (abonnement) return m.target === "order_price" ? { ...m, value: tarif(m.value * k) } : m;
        return m.target === "order" || m.target === "order_subcontract" ? { ...m, value: m.value * k } : m;
      }),
    })),
    // Investissement : une même machine physique vaut le même prix quelle que
    // soit la périodicité — le coût par unité de capacité PAR TOUR varie en
    // 1/k, la durée d'amortissement en tours en 1/k, le plafond d'achat en k.
    ...(scenario.investment
      ? {
          investment: {
            // Une place de salle coûte le même prix quelle que soit la durée
            // du tour : c'est une capacité d'accueil, pas une capacité de
            // production par tour.
            costPerCapacityUnit: abonnement
              ? scenario.investment.costPerCapacityUnit
              : scenario.investment.costPerCapacityUnit / k,
            depreciationRounds: scenario.investment.depreciationRounds / k,
            maxPerRound: scenario.investment.maxPerRound * k,
          },
        }
      : {}),
    // Équipements typés : la capacité par machine est par TOUR (× k), le coût
    // physique ne change pas, la durée d'amortissement en tours varie en 1/k.
    ...(scenario.equipment
      ? {
          equipment: {
            types: scenario.equipment.types.map((t) => ({
              ...t,
              capacityPerUnit: abonnement ? t.capacityPerUnit : t.capacityPerUnit * k,
              depreciationRounds: t.depreciationRounds / k,
              maxPerRound: Math.max(1, Math.round(t.maxPerRound * k)),
            })),
            initialFleet: scenario.equipment.initialFleet,
          },
        }
      : {}),
    ...modulesALaDureeDuTour(scenario, k),
    scoring: {
      ...scenario.scoring,
      benchmarks: {
        ...scenario.scoring.benchmarks,
        operatingIncome: scaleBounds(scenario.scoring.benchmarks.operatingIncome, k),
        revenue: scaleBounds(scenario.scoring.benchmarks.revenue, k),
        netTreasury: scaleBounds(scenario.scoring.benchmarks.netTreasury, k),
        // ROE, part de marché et utilisation sont des ratios : inchangés
      },
    },
  };
}

/**
 * LES MODULES DU SCÉNARIO SUIVENT LA DURÉE DU TOUR, COMME LES SALAIRES.
 *
 * Un coût PAR TOUR (un programme de R&D) est un flux : × k, arrondi à l'euro
 * comme les primes d'assurance. Une économie par tour (l'entretien allégé
 * d'une démarche qualité) de même. Ce qui se paie UNE fois (le niveau d'une
 * démarche qualité) ne bouge pas : c'est le même achat quelle que soit la
 * durée du tour. Les durées des programmes restent comptées en tours : la
 * dramaturgie de la partie est conservée.
 */
function modulesALaDureeDuTour(scenario: EngineScenarioConfig, k: number): Partial<EngineScenarioConfig> {
  const flux = (x: number) => tarif(x * k);
  const s = scenario;
  return {
    ...(s.qualityActions
      ? {
          qualityActions: {
            ...s.qualityActions,
            actions: s.qualityActions.actions.map((a) => ({
              ...a,
              levels: a.levels.map((l) =>
                l.effects.maintenanceSaving
                  ? { ...l, effects: { ...l.effects, maintenanceSaving: flux(l.effects.maintenanceSaving) } }
                  : l,
              ),
            })),
          },
        }
      : {}),
    ...(s.rdActions
      ? {
          rdActions: {
            ...s.rdActions,
            actions: s.rdActions.actions.map((a) => ({ ...a, costPerRound: flux(a.costPerRound) })),
          },
        }
      : {}),
  };
}

const scaleBounds = (b: { min: number; target: number }, k: number) => ({
  min: b.min * k,
  target: b.target * k,
});

/**
 * Redimensionne l'état initial d'une entreprise (capacités par tour).
 * Le bilan initial (stock de valeur, pas flux) reste inchangé.
 *
 * `abonnement` dit que l'unité vendue est une période : la capacité d'accueil
 * est alors un STOCK de places, qui ne dépend pas de la durée du tour. Une
 * salle de mille places en accueille mille au mois comme au trimestre ; la
 * redimensionner reviendrait à en murer les deux tiers.
 */
export function applyPeriodicityToCompany<
  T extends {
    machineCapacity: number;
    hoursPerEmployee: number;
    loans?: { remaining: number; perRound: number }[];
    fleet?: { typeCode: string; count: number; acquiredRound: number; bookValue: number }[];
  },
>(company: T, periodicity: Periodicity, options?: { abonnement?: boolean }): T {
  const k = PERIODICITY_DAYS[periodicity] / 90;
  if (k === 1) return company;
  return {
    ...company,
    machineCapacity: options?.abonnement ? company.machineCapacity : company.machineCapacity * k,
    hoursPerEmployee: company.hoursPerEmployee * k,
    // même dette, même durée réelle : l'échéance PAR TOUR varie en k
    ...(company.loans
      ? { loans: company.loans.map((l) => ({ ...l, perRound: l.perRound * k })) }
      : {}),
    // le parc physique ne change pas (stock), seule la capacité par type
    // change via le scénario — le bookValue est un stock, pas un flux
  };
}
