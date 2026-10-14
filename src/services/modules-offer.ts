import { champDeModule, type DecisionDeModule } from "@/config/modules-saisis";
import type { ErreurDeChamp } from "@/config/refus-de-decision";
import type { LeviersDuNiveau } from "@/config/difficulty";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, RoundDecisions } from "@/engine/types";
import { formatEuro, formatPercent, MOINS } from "@/lib/format";

/**
 * L'OFFRE DES MODULES : CE QUE LE SCÉNARIO PROPOSE CE TOUR, ET CE QUI TOURNE DÉJÀ.
 *
 * Les catalogues optionnels d'un scénario (actions qualité, hygiène et
 * sécurité, capacité, export, innovation, programme RSE, stratégie de prix,
 * plans de crise, partenariats, projets digitaux, marque) existaient dans le
 * moteur sans que personne puisse les choisir. L'offre en est la vitrine :
 *
 *  - seuls les catalogues PRÉSENTS dans le snapshot de la partie paraissent ;
 *  - un module suit le niveau de difficulté, par le levier qui lui ressemble
 *    (la qualité au niveau qui ouvre la qualité, la capacité avec
 *    l'investissement, l'export et l'innovation avec la stratégie) ;
 *  - un élément dont le tour minimal n'est pas atteint n'est pas proposé ;
 *  - ce qui est déjà actif ou en cours se lit à part, et ne se relance pas ;
 *  - le plafond est celui que le moteur appliquera, places déjà prises
 *    déduites.
 *
 * LES EFFETS ANNONCÉS SONT CEUX QUE LE MOTEUR APPLIQUE, et eux seuls. Les
 * catalogues portent d'autres effets (fidélité, marge, réduction de coûts…)
 * que le calcul du tour ne lit pas aujourd'hui : les promettre serait mentir
 * au joueur. Un élément dont aucun effet n'est appliqué n'est pas proposé.
 *
 * Les modules dont le moteur ne fait que payer le coût (formation, actions
 * commerciales, politiques RH avancées) ou rien du tout (négociation
 * fournisseurs), ceux qui exigent un parc machine par machine que les
 * scénarios ne portent pas (maintenance par machine), et les catalogues sans
 * traitement moteur (actions R&D, options de financement) ne sont pas offerts.
 */

export interface ElementDeModule {
  /** L'identifiant du catalogue (ou le code de l'action). */
  id: string;
  /** Le nom du champ de la case : `module.<décision>.<id>`. */
  champ: string;
  /** La valeur envoyée : l'identifiant, ou le niveau pour une action qualité. */
  valeur: string;
  libelle: string;
  /** Les coûts, dans l'ordre où ils tombent. */
  couts: { libelle: string; montant: number }[];
  /** Ce que coûte le choix CE TOUR, pour le cumul affiché pendant qu'on coche. */
  coutDuTour: number;
  /** La durée, en clair ; `null` quand elle ne dit rien. */
  duree: string | null;
  /** Les effets que le moteur applique, en clair. Jamais vide. */
  effets: string[];
}

export interface ModuleOffert {
  decision: DecisionDeModule;
  titre: string;
  /** Une phrase qui dit le mécanisme : quand le coût tombe, quand l'effet vient. */
  aide: string;
  /** Le nombre de cases cochables ce tour ; `null` sans plafond. */
  plafond: number | null;
  /** Le plafond en clair, ou `null`. */
  plafondTexte: string | null;
  elements: ElementDeModule[];
  /** Ce qui est déjà actif ou en cours, et ne se relance pas. */
  enCours: { libelle: string; etat: string }[];
}

export type OffreDesModules = ModuleOffert[];

const tours = (n: number) => `${n} tour${n > 1 ? "s" : ""}`;
const plus = (x: number) => `+${formatPercent(x)}`;
const moins = (x: number) => `${MOINS}${formatPercent(x)}`;

const CRISES: Record<string, string> = {
  greve: "grève",
  rappelProduit: "rappel de produit",
  cyberAttaque: "cyberattaque",
  ruptureFournisseur: "rupture d'un fournisseur",
  criseSanitaire: "crise sanitaire",
};
const nomDeCrise = (type: string) => CRISES[type] ?? type;

/** Le levier du niveau qui ouvre chaque module. */
const OUVERT_PAR: Record<DecisionDeModule, keyof LeviersDuNiveau> = {
  qualityActions: "quality",
  hsActions: "hr",
  activeCapacityOptionIds: "investment",
  activatePartnershipIds: "investment",
  activeCrisisPlanIds: "insurance",
  activeRseActionIds: "rse",
  enteredMarketIds: "rd",
  startedInnovationIds: "rd",
  activePricingStrategyIds: "rd",
  startDigitalProjectIds: "rd",
  activeBrandActionIds: "rd",
};

export interface EntreeDeLOffre {
  scenario: EngineScenarioConfig;
  /** L'état d'OUVERTURE du tour à jouer (le dernier état persisté). */
  etat: Partial<CompanyState> | null | undefined;
  /** Le tour à jouer (1..N), celui que le moteur recevra. */
  tour: number;
  /** Les leviers du niveau ; absent : tous ouverts. */
  leviers?: LeviersDuNiveau | null;
  vocabulaire?: Pick<ScenarioVocabulary, "capacityLabel"> | null;
}

/** L'offre des modules du tour ; `null` quand le scénario n'en propose aucun à ce niveau. */
export function construireOffreDesModules(e: EntreeDeLOffre): OffreDesModules | null {
  const { scenario: s, tour } = e;
  const etat = e.etat ?? {};
  const ouvert = (d: DecisionDeModule) => !e.leviers || e.leviers[OUVERT_PAR[d]] === true;
  const finDePartie = s.roundsCount;
  const modules: ModuleOffert[] = [];
  const element = (
    decision: DecisionDeModule,
    x: Omit<ElementDeModule, "champ" | "valeur"> & { valeur?: string },
  ): ElementDeModule => ({ ...x, champ: champDeModule(decision, x.id), valeur: x.valeur ?? x.id });

  // ── Actions qualité : un niveau à la fois, effet immédiat et définitif ──
  if (s.qualityActions && ouvert("qualityActions")) {
    const acquis = etat.qualityActionsCompleted ?? {};
    const elements: ElementDeModule[] = [];
    const enCours: ModuleOffert["enCours"] = [];
    for (const a of s.qualityActions.actions) {
      const niveau = acquis[a.code] ?? 0;
      if (niveau > 0) enCours.push({ libelle: a.label, etat: `niveau ${niveau} atteint` });
      const suivant = a.levels.find((l) => l.level === niveau + 1);
      if (!suivant) continue;
      const f = suivant.effects;
      const effets = [
        f.qualityImageBonus ? `Attractivité ${plus(f.qualityImageBonus)}` : null,
        f.productionCostReduction ? `Coût variable de production ${moins(f.productionCostReduction)}` : null,
        f.defectRateReduction ? `Rebuts ${moins(f.defectRateReduction)}` : null,
        f.returnRateReduction ? `Retours clients ${moins(f.returnRateReduction)}` : null,
        f.maintenanceSaving ? `Entretien allégé de ${formatEuro(f.maintenanceSaving)} par tour` : null,
      ].filter((x): x is string => x !== null);
      if (effets.length === 0) continue;
      elements.push(
        element("qualityActions", {
          id: a.code,
          valeur: String(suivant.level),
          libelle: `${a.label} · niveau ${suivant.level}`,
          couts: [{ libelle: "Coût unique", montant: suivant.cost }],
          coutDuTour: suivant.cost,
          duree: "Acquis pour la partie",
          effets,
        }),
      );
    }
    const max = s.qualityActions.maxConcurrentActions ?? 2;
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "qualityActions",
        titre: "Démarches qualité",
        aide:
          "Un niveau acheté s'applique dès ce tour et reste acquis. Chaque niveau ouvre le suivant.",
        plafond: max,
        plafondTexte: `${max} démarche${max > 1 ? "s" : ""} au plus par tour`,
        elements,
        enCours,
      });
  }

  // ── Hygiène et sécurité : actions ponctuelles, certaines durent ──
  if (s.healthSafetyActions && ouvert("hsActions")) {
    const actives = etat.activeHsActions ?? [];
    const enCours = actives.flatMap((a) => {
      const def = s.healthSafetyActions!.actions.find((d) => d.code === a.actionCode);
      return def ? [{ libelle: def.label, etat: `encore ${tours(a.remainingRounds)}` }] : [];
    });
    const elements = s.healthSafetyActions.actions
      .filter((a) => !actives.some((x) => x.actionCode === a.code))
      .flatMap((a) => {
        const f = a.effects;
        const effets = [
          f.attritionReduction ? `Départs volontaires ${moins(f.attritionReduction)}` : null,
          f.productivityBonus ? `Productivité ${plus(f.productivityBonus)}` : null,
          f.defectReduction ? `Rebuts ${moins(f.defectReduction)}` : null,
          f.hrImageBonus ? `Image employeur ${plus(f.hrImageBonus)} d'attractivité` : null,
          f.maintenanceSaving ? `Entretien allégé de ${formatEuro(f.maintenanceSaving)}` : null,
        ].filter((x): x is string => x !== null);
        if (effets.length === 0) return [];
        const cout = a.laborCost + (a.immobilizationCost ?? 0);
        return [
          element("hsActions", {
            id: a.code,
            libelle: a.label,
            couts: [
              { libelle: "Main-d'œuvre", montant: a.laborCost },
              ...(a.immobilizationCost ? [{ libelle: "Immobilisation", montant: a.immobilizationCost }] : []),
            ],
            coutDuTour: cout,
            duree:
              a.isRecurring && (a.durationRounds ?? 0) > 0
                ? `Effet pendant ${tours(a.durationRounds!)}`
                : "Effet sur ce tour",
            effets,
          }),
        ];
      });
    const max = s.healthSafetyActions.maxActionsPerRound ?? 3;
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "hsActions",
        titre: "Hygiène et sécurité",
        aide: "Le coût tombe ce tour, l'effet aussi. Une action qui dure ne se relance pas avant d'avoir pris fin.",
        plafond: max,
        plafondTexte: `${max} action${max > 1 ? "s" : ""} au plus par tour`,
        elements,
        enCours,
      });
  }

  // ── Expansion de capacité : mise en place ce tour, capacité dès le suivant ──
  if (s.capacityExpansion && ouvert("activeCapacityOptionIds")) {
    const cfg = s.capacityExpansion;
    const actives = etat.activeCapacityOptions ?? [];
    const restent = actives.filter((a) => {
      const def = cfg.options.find((o) => o.id === a.id);
      return def ? a.roundsUsed + 1 <= def.maxRounds : false;
    });
    const enCours = actives.flatMap((a) => {
      const def = cfg.options.find((o) => o.id === a.id);
      return def ? [{ libelle: def.label, etat: `en service depuis ${tours(a.roundsUsed)}` }] : [];
    });
    const libelleCapacite = e.vocabulaire?.capacityLabel ?? "Capacité de production";
    const elements = cfg.options
      .filter((o) => !restent.some((a) => a.id === o.id) && o.capacityBonus > 0)
      .map((o) =>
        element("activeCapacityOptionIds", {
          id: o.id,
          libelle: o.label,
          couts: [
            { libelle: "Mise en place, ce tour", montant: o.setupCost },
            { libelle: "Par tour ensuite", montant: o.costPerRound },
          ],
          coutDuTour: o.setupCost,
          duree: o.maxRounds >= finDePartie ? "Jusqu'à la fin de la partie" : `${tours(o.maxRounds)}`,
          effets: [`${libelleCapacite} ${plus(o.capacityBonus)} dès le tour suivant`],
        }),
      );
    const max = Math.max(0, cfg.maxActiveOptions - restent.length);
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activeCapacityOptionIds",
        titre: "Capacité supplémentaire",
        aide:
          "La mise en place se paie ce tour ; la capacité arrive au tour suivant, avec son coût par tour.",
        plafond: max,
        plafondTexte: `${cfg.maxActiveOptions} option${cfg.maxActiveOptions > 1 ? "s" : ""} actives au plus`,
        elements,
        enCours,
      });
  }

  // ── Marchés internationaux : entrée ce tour, ventes dès le suivant ──
  if (s.internationalMarkets && ouvert("enteredMarketIds")) {
    const cfg = s.internationalMarkets;
    const actifs = etat.activeInternationalMarkets ?? [];
    const enCours = actifs.flatMap((a) => {
      const def = cfg.markets.find((m) => m.id === a.id);
      return def ? [{ libelle: def.label, etat: `ouvert au tour ${a.enteredAtRound}` }] : [];
    });
    const elements = cfg.markets
      .filter((m) => !actifs.some((a) => a.id === m.id) && m.baseEntryRound <= tour && m.demandMultiplier > 0)
      .map((m) =>
        element("enteredMarketIds", {
          id: m.id,
          libelle: m.label,
          couts: [
            { libelle: "Entrée, ce tour", montant: m.entryInvestment },
            { libelle: "Adaptation locale, par tour ensuite", montant: m.localAdaptationCost },
          ],
          coutDuTour: m.entryInvestment,
          duree: "Jusqu'à la fin de la partie",
          effets: [
            `Ventes à l'export de l'ordre de ${formatPercent(m.demandMultiplier * 0.1)} de votre chiffre d'affaires, dès le tour suivant`,
            `Droits de douane ${formatPercent(m.tariffRate)} de ces ventes, change à plus ou moins ${formatPercent(m.exchangeRateVolatility)}`,
          ],
        }),
      );
    const max = Math.max(0, cfg.maxActiveMarkets - actifs.length);
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "enteredMarketIds",
        titre: "Marchés à l'export",
        aide: "Un marché ouvert le reste : son coût d'adaptation court chaque tour, ses ventes aussi.",
        plafond: max,
        plafondTexte: `${cfg.maxActiveMarkets} marché${cfg.maxActiveMarkets > 1 ? "s" : ""} au plus`,
        elements,
        enCours,
      });
  }

  // ── Innovation produit : développement sur plusieurs tours, puis lancement ──
  if (s.productInnovation && ouvert("startedInnovationIds")) {
    const cfg = s.productInnovation;
    const enDev = etat.innovationsInDev ?? [];
    const lancees = etat.launchedInnovations ?? [];
    const restent = enDev.filter((d) => {
      const def = cfg.innovations.find((i) => i.id === d.id);
      return def ? d.roundsCompleted + 1 < def.developmentRounds : false;
    });
    const enCours = [
      ...enDev.flatMap((d) => {
        const def = cfg.innovations.find((i) => i.id === d.id);
        return def
          ? [{ libelle: def.label, etat: `en développement, ${d.roundsCompleted} tour${d.roundsCompleted > 1 ? "s" : ""} sur ${def.developmentRounds}` }]
          : [];
      }),
      ...lancees.flatMap((id) => {
        const def = cfg.innovations.find((i) => i.id === id);
        return def ? [{ libelle: def.label, etat: "lancée" }] : [];
      }),
    ];
    const elements = cfg.innovations
      .filter((i) => !enDev.some((d) => d.id === i.id) && !lancees.includes(i.id) && i.effects.demandBonus > 0)
      .map((i) =>
        element("startedInnovationIds", {
          id: i.id,
          libelle: i.label,
          couts: [
            { libelle: "Développement, par tour", montant: i.devCostPerRound },
            { libelle: "Lancement", montant: i.launchCost },
          ],
          coutDuTour: i.devCostPerRound + (i.developmentRounds <= 1 ? i.launchCost : 0),
          duree: `${tours(i.developmentRounds)} de développement`,
          effets: [`Attractivité ${plus(i.effects.demandBonus)} une fois lancée, pour toute la partie`],
        }),
      );
    const max = Math.max(0, cfg.maxSimultaneousDev - restent.length);
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "startedInnovationIds",
        titre: "Innovation produit",
        aide:
          "Le développement se paie à chaque tour jusqu'au lancement, qui a son propre coût. L'effet vient au tour qui suit le lancement.",
        plafond: max,
        plafondTexte: `${cfg.maxSimultaneousDev} développement${cfg.maxSimultaneousDev > 1 ? "s" : ""} en même temps au plus`,
        elements,
        enCours,
      });
  }

  // ── Programme RSE : un engagement qui dure, un effet après déploiement ──
  if (s.rseProgram && ouvert("activeRseActionIds")) {
    const cfg = s.rseProgram;
    const actives = etat.activeRseActions ?? [];
    const enCours = actives.flatMap((a) => {
      const def = cfg.actions.find((x) => x.id === a.id);
      if (!def) return [];
      return [
        {
          libelle: def.label,
          etat: a.roundsActive >= def.implementationRounds ? "déployée" : `déploiement, ${a.roundsActive} tour${a.roundsActive > 1 ? "s" : ""} sur ${def.implementationRounds}`,
        },
      ];
    });
    const elements = cfg.actions
      .filter((x) => !actives.some((a) => a.id === x.id))
      .flatMap((x) => {
        const effets = [
          x.effects.imageBonus ? `Attractivité ${plus(x.effects.imageBonus)}` : null,
          x.effects.energySaving ? `Économie d'énergie de ${formatEuro(x.effects.energySaving)} par tour` : null,
        ].filter((v): v is string => v !== null);
        if (effets.length === 0) return [];
        return [
          element("activeRseActionIds", {
            id: x.id,
            libelle: x.label,
            couts: [{ libelle: "Par tour, dès ce tour", montant: x.costPerRound }],
            coutDuTour: x.costPerRound,
            duree: `Déployée en ${tours(x.implementationRounds)}, puis jusqu'à la fin de la partie`,
            effets: effets.map((v) => `${v} une fois déployée`),
          }),
        ];
      });
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activeRseActionIds",
        titre: "Programme RSE",
        aide:
          "Une action engagée court jusqu'à la fin de la partie : son coût tombe chaque tour, ses effets viennent une fois déployée.",
        plafond: null,
        plafondTexte: null,
        elements,
        enCours,
      });
  }

  // ── Stratégie de prix : un positionnement qui s'installe au tour suivant ──
  if (s.pricingStrategy && ouvert("activePricingStrategyIds")) {
    const cfg = s.pricingStrategy;
    const actives = etat.activePricingStrategies ?? [];
    const enCours = actives.flatMap((id) => {
      const def = cfg.strategies.find((x) => x.id === id);
      return def ? [{ libelle: def.label, etat: "en vigueur" }] : [];
    });
    const elements = cfg.strategies
      .filter((x) => !actives.includes(x.id) && x.minRound <= tour)
      .flatMap((x) => {
        const effets = [
          x.priceMultiplier !== 1
            ? `Prix tel que le perçoivent vos clients ${x.priceMultiplier > 1 ? plus(x.priceMultiplier - 1) : moins(1 - x.priceMultiplier)}`
            : null,
          x.demandImpact ? `Attractivité ${x.demandImpact > 0 ? plus(x.demandImpact) : moins(-x.demandImpact)}` : null,
        ].filter((v): v is string => v !== null);
        if (effets.length === 0) return [];
        return [
          element("activePricingStrategyIds", {
            id: x.id,
            libelle: x.label,
            couts: [],
            coutDuTour: 0,
            duree: "Dès le tour suivant, jusqu'à la fin de la partie",
            effets,
          }),
        ];
      });
    const max = Math.max(0, cfg.maxActiveStrategies - actives.length);
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activePricingStrategyIds",
        titre: "Stratégie de prix",
        aide:
          "Un positionnement ne coûte rien à annoncer, mais il engage : il s'installe au tour suivant et ne se retire plus.",
        plafond: max,
        plafondTexte: `${cfg.maxActiveStrategies} stratégie${cfg.maxActiveStrategies > 1 ? "s" : ""} en vigueur au plus`,
        elements,
        enCours,
      });
  }

  // ── Plans de crise : se préparer coûte chaque tour, la crise est tirée au sort ──
  if (s.crisisManagement && ouvert("activeCrisisPlanIds")) {
    const cfg = s.crisisManagement;
    const actifs = etat.activeCrisisPlans ?? [];
    const enCours = actifs.flatMap((id) => {
      const def = cfg.plans.find((p) => p.id === id);
      return def ? [{ libelle: def.label, etat: "prêt" }] : [];
    });
    const elements = cfg.plans
      .filter((p) => !actifs.includes(p.id) && p.effects.revenueProtection > 0)
      .map((p) =>
        element("activeCrisisPlanIds", {
          id: p.id,
          libelle: p.label,
          couts: [
            { libelle: "Préparation, par tour", montant: p.preparationCostPerRound },
            { libelle: "Activation, si la crise survient", montant: p.activationCost },
          ],
          coutDuTour: p.preparationCostPerRound,
          duree: "Jusqu'à la fin de la partie",
          effets: [
            `Couvre : ${nomDeCrise(p.crisisType)}`,
            `Protège ${formatPercent(p.effects.revenueProtection)} des ventes menacées par cette crise`,
          ],
        }),
      );
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activeCrisisPlanIds",
        titre: "Plans de crise",
        aide: `Chaque tour, une crise survient avec une probabilité de ${formatPercent(cfg.crisisEventProbability)}. Un plan ne protège que de la crise qu'il couvre.`,
        plafond: null,
        plafondTexte: null,
        elements,
        enCours,
      });
  }

  // ── Partenariats : un droit d'entrée, des redevances, un accès au marché ──
  if (s.partnerships && ouvert("activatePartnershipIds")) {
    const cfg = s.partnerships;
    const actifs = etat.activePartnerships ?? [];
    const restent = actifs.filter((a) => a.remainingRounds > 1);
    const enCours = actifs.map((a) => ({
      libelle: cfg.options.find((o) => o.id === a.id)?.label ?? a.id,
      etat: `encore ${tours(a.remainingRounds)}`,
    }));
    const elements = cfg.options
      .filter((o) => !restent.some((a) => a.id === o.id) && o.minRound <= tour && o.effects.marketAccessBonus > 0)
      .map((o) =>
        element("activatePartnershipIds", {
          id: o.id,
          libelle: o.label,
          couts: [
            { libelle: "Droit d'entrée", montant: o.entryFee },
            { libelle: "Redevance, par tour", montant: o.royaltiesPerRound },
          ],
          coutDuTour: o.entryFee + o.royaltiesPerRound,
          duree: tours(o.durationRounds),
          effets: [`Attractivité ${plus(o.effects.marketAccessBonus)} dès le tour suivant, tant qu'il dure`],
        }),
      );
    const max = Math.max(0, cfg.maxActivePartnerships - restent.length);
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activatePartnershipIds",
        titre: "Partenariats",
        aide: "Le droit d'entrée et la première redevance tombent ce tour ; l'accès au marché suit au tour suivant.",
        plafond: max,
        plafondTexte: `${cfg.maxActivePartnerships} partenariat${cfg.maxActivePartnerships > 1 ? "s" : ""} actifs au plus`,
        elements,
        enCours,
      });
  }

  // ── Transformation digitale : des tours de projet, puis une maintenance ──
  if (s.digitalTransformation && ouvert("startDigitalProjectIds")) {
    const cfg = s.digitalTransformation;
    const enCoursEtat = etat.digitalProjectsInProgress ?? [];
    const termines = etat.completedDigitalProjects ?? [];
    const restent = enCoursEtat.filter((p) => {
      const def = cfg.projects.find((x) => x.id === p.id);
      return def ? p.roundsCompleted + 1 < def.implementationRounds : false;
    });
    const enCours = [
      ...enCoursEtat.flatMap((p) => {
        const def = cfg.projects.find((x) => x.id === p.id);
        return def
          ? [{ libelle: def.label, etat: `en cours, ${p.roundsCompleted} tour${p.roundsCompleted > 1 ? "s" : ""} sur ${def.implementationRounds}` }]
          : [];
      }),
      ...termines.flatMap((id) => {
        const def = cfg.projects.find((x) => x.id === id);
        return def ? [{ libelle: def.label, etat: "terminé" }] : [];
      }),
    ];
    const elements = cfg.projects
      .filter((p) => !enCoursEtat.some((x) => x.id === p.id) && !termines.includes(p.id) && p.effects.demandBonus > 0)
      .map((p) =>
        element("startDigitalProjectIds", {
          id: p.id,
          libelle: p.label,
          couts: [
            { libelle: "Projet, par tour", montant: p.costPerRound },
            { libelle: "Maintenance, par tour une fois terminé", montant: p.maintenanceCostPerRound },
          ],
          coutDuTour: p.costPerRound,
          duree: `${tours(p.implementationRounds)} de mise en œuvre`,
          effets: [`Attractivité ${plus(p.effects.demandBonus)} une fois terminé, pour toute la partie`],
        }),
      );
    const max = Math.max(0, cfg.maxSimultaneousProjects - restent.length);
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "startDigitalProjectIds",
        titre: "Transformation digitale",
        aide:
          "Un projet se paie à chaque tour de mise en œuvre, puis sa maintenance court. L'effet vient au tour qui suit sa fin.",
        plafond: max,
        plafondTexte: `${cfg.maxSimultaneousProjects} projet${cfg.maxSimultaneousProjects > 1 ? "s" : ""} en même temps au plus`,
        elements,
        enCours,
      });
  }

  // ── Gestion de marque : des actions qui durent, certaines se reconduisent ──
  if (s.brandManagement && ouvert("activeBrandActionIds")) {
    const cfg = s.brandManagement;
    const actives = etat.activeBrandActions ?? [];
    const restent = actives.filter((a) => {
      const def = cfg.actions.find((x) => x.id === a.id);
      return def ? a.remainingRounds > 1 || def.isRecurring : false;
    });
    const enCours = actives.flatMap((a) => {
      const def = cfg.actions.find((x) => x.id === a.id);
      if (!def) return [];
      return [{ libelle: def.label, etat: def.isRecurring ? "reconduite à chaque échéance" : `encore ${tours(a.remainingRounds)}` }];
    });
    const elements = cfg.actions
      .filter((x) => !restent.some((a) => a.id === x.id))
      .flatMap((x) => {
        const effets = [
          x.effects.imageBonus ? `Attractivité ${plus(x.effects.imageBonus)}` : null,
          x.effects.priceAcceptance ? `Prix tel que le perçoivent vos clients ${moins(x.effects.priceAcceptance)}` : null,
          x.effects.crisisRecovery ? `Pertes en cas de crise ${moins(x.effects.crisisRecovery)}` : null,
        ].filter((v): v is string => v !== null);
        if (effets.length === 0) return [];
        return [
          element("activeBrandActionIds", {
            id: x.id,
            libelle: x.label,
            couts: [{ libelle: "Par tour, dès ce tour", montant: x.costPerRound }],
            coutDuTour: x.costPerRound,
            duree: x.isRecurring
              ? `${tours(x.durationRounds)}, reconduite automatiquement`
              : tours(x.durationRounds),
            effets: effets.map((v, i) => (i === 0 ? `${v} dès le tour suivant` : v)),
          }),
        ];
      });
    const max = cfg.maxActionsPerRound;
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activeBrandActionIds",
        titre: "Gestion de la marque",
        aide:
          "Une action se paie à chaque tour où elle court. Une action reconduite ne s'arrête plus : elle repart à chaque échéance.",
        plafond: max,
        plafondTexte: `${max} nouvelle${max > 1 ? "s" : ""} action${max > 1 ? "s" : ""} au plus par tour`,
        elements,
        enCours,
      });
  }

  return modules.length > 0 ? modules : null;
}

/** Les identifiants choisis pour un module, tels que les décisions les portent. */
export function choixDuModule(decisions: Partial<RoundDecisions>, decision: DecisionDeModule): string[] {
  if (decision === "qualityActions") return (decisions.qualityActions ?? []).map((q) => q.actionCode);
  if (decision === "hsActions") return (decisions.hsActions ?? []).map((h) => h.actionCode);
  return decisions[decision] ?? [];
}

/** Les décisions de module que l'écran ne propose jamais : un envoi qui les porte est forgé. */
const DECISIONS_NON_OFFERTES = [
  "trainingEnrollments",
  "activeCommercialActionIds",
  "activeContractIds",
  "activeHRPolicyIds",
  "maintenanceDecisions",
] as const satisfies readonly (keyof RoundDecisions)[];

/**
 * LES MODULES, JUGÉS PAR LE SERVEUR. La feuille ne propose que l'offre du tour
 * et grise les cases au plafond ; un formulaire périmé ou forgé tombe ici :
 * un choix hors de l'offre (catalogue absent, tour minimal non atteint, niveau
 * fermé, déjà en cours), un niveau qualité qui n'est pas le suivant, ou un
 * plafond dépassé.
 */
export function refusDesModules(
  decisions: Partial<RoundDecisions>,
  offre: OffreDesModules | null,
): ErreurDeChamp[] {
  const erreurs: ErreurDeChamp[] = [];
  for (const cle of DECISIONS_NON_OFFERTES) {
    const v = decisions[cle];
    if (Array.isArray(v) && v.length > 0)
      erreurs.push({ champ: null, message: "Ce module n'est pas proposé dans cette partie." });
  }
  const decisionsDeModule: DecisionDeModule[] = [
    "qualityActions",
    "hsActions",
    "activeCapacityOptionIds",
    "enteredMarketIds",
    "startedInnovationIds",
    "activeRseActionIds",
    "activePricingStrategyIds",
    "activeCrisisPlanIds",
    "activatePartnershipIds",
    "startDigitalProjectIds",
    "activeBrandActionIds",
  ];
  for (const decision of decisionsDeModule) {
    const choix = choixDuModule(decisions, decision);
    if (choix.length === 0) continue;
    const offert = offre?.find((m) => m.decision === decision);
    if (!offert) {
      erreurs.push({ champ: null, message: "Ce module n'est pas proposé dans cette partie." });
      continue;
    }
    for (const id of choix) {
      const el = offert.elements.find((x) => x.id === id);
      const niveauJuste =
        decision !== "qualityActions" ||
        (decisions.qualityActions ?? []).some((q) => q.actionCode === id && String(q.level) === el?.valeur);
      if (!el || !niveauJuste) {
        erreurs.push({
          champ: el?.champ ?? null,
          message: `${offert.titre} : ce choix n'est pas ouvert ce tour.`,
        });
      }
    }
    if (new Set(choix).size !== choix.length) {
      erreurs.push({ champ: null, message: `${offert.titre} : un même choix ne se coche qu'une fois.` });
    }
    if (offert.plafond !== null && choix.length > offert.plafond) {
      const champ = offert.elements.find((x) => x.id === choix[offert.plafond!])?.champ ?? null;
      erreurs.push({
        champ,
        message:
          offert.plafond === 0
            ? `${offert.titre} : plus aucune place ce tour.`
            : `${offert.titre} : ${offert.plafond} choix au plus ce tour.`,
      });
    }
  }
  return erreurs;
}

/** Une ligne du bilan des modules d'un tour clos. */
export interface LigneDeModule {
  titre: string;
  /** Ce qui a été engagé CE tour (libellés du catalogue). */
  engage: string[];
  /** Ce que le module a coûté au tour ; `null` quand il ne coûte rien. */
  cout: number | null;
  /** L'effet principal, en clair ; `null` quand le tour n'en porte pas. */
  effet: string | null;
}

export interface BilanDesModules {
  lignes: LigneDeModule[];
  /** La crise survenue ce tour, en clair ; `null` sans crise. */
  crise: string | null;
}

/**
 * CE QUE LES MODULES ONT FAIT AU TOUR : ce qui a été engagé, ce que cela a
 * coûté, l'effet principal en vigueur, et la crise s'il y en a eu une. Lu du
 * résultat du moteur (trace persistée) et des décisions du tour. `null` quand
 * aucun module n'a rien engagé ni coûté : un tour sans module n'a rien à dire.
 */
export function bilanDesModules(
  result: Pick<
    CompanyRoundResult,
    | "qualityActions"
    | "hsCost"
    | "capacityCost"
    | "internationalRevenue"
    | "internationalCost"
    | "innovationCost"
    | "innovationEffects"
    | "rseProgramCost"
    | "rseProgramEffects"
    | "pricingEffects"
    | "crisisCost"
    | "crisisEvent"
    | "partnershipCost"
    | "partnershipEffects"
    | "digitalCost"
    | "digitalEffects"
    | "brandCost"
    | "brandEffects"
  >,
  decisions: Partial<RoundDecisions> | null,
  scenario: EngineScenarioConfig,
): BilanDesModules | null {
  const d = decisions ?? {};
  const s = scenario;
  const lignes: LigneDeModule[] = [];
  const nommer = <T extends { id: string; label: string }>(liste: T[] | undefined, ids: string[] | undefined) =>
    (ids ?? []).map((id) => liste?.find((x) => x.id === id)?.label ?? id);
  const pousser = (l: LigneDeModule) => {
    if (l.engage.length > 0 || (l.cout ?? 0) > 0 || l.effet) lignes.push(l);
  };
  const positif = (x: number | undefined) => (x !== undefined && x > 0 ? x : 0);

  const qa = result.qualityActions;
  pousser({
    titre: "Démarches qualité",
    engage: (qa?.started ?? []).map((q) => {
      const a = s.qualityActions?.actions.find((x) => x.code === q.actionCode);
      return `${a?.label ?? q.actionCode} · niveau ${q.level}`;
    }),
    cout: qa && qa.started.length > 0 ? qa.started.reduce((t, q) => t + q.cost, 0) : null,
    effet:
      qa && qa.activeEffects.qualityImageBonus > 0
        ? `Attractivité ${plus(qa.activeEffects.qualityImageBonus)}`
        : qa && qa.activeEffects.productionCostReduction > 0
          ? `Coût variable de production ${moins(qa.activeEffects.productionCostReduction)}`
          : null,
  });
  const hs = result.hsCost;
  pousser({
    titre: "Hygiène et sécurité",
    engage: (d.hsActions ?? []).map(
      (h) => s.healthSafetyActions?.actions.find((x) => x.code === h.actionCode)?.label ?? h.actionCode,
    ),
    cout: hs ? hs.laborCost + hs.immobilizationCost : null,
    effet:
      hs && hs.effects.productivityBonus > 0
        ? `Productivité ${plus(hs.effects.productivityBonus)}`
        : hs && hs.effects.attritionReduction > 0
          ? `Départs volontaires ${moins(hs.effects.attritionReduction)}`
          : null,
  });
  pousser({
    titre: "Capacité supplémentaire",
    engage: nommer(s.capacityExpansion?.options, d.activeCapacityOptionIds),
    cout: result.capacityCost ?? null,
    effet: null,
  });
  pousser({
    titre: "Marchés à l'export",
    engage: nommer(s.internationalMarkets?.markets, d.enteredMarketIds),
    cout: result.internationalCost ?? null,
    effet: positif(result.internationalRevenue) > 0 ? `Ventes à l'export ${formatEuro(result.internationalRevenue!)}` : null,
  });
  pousser({
    titre: "Innovation produit",
    engage: nommer(s.productInnovation?.innovations, d.startedInnovationIds),
    cout: result.innovationCost ?? null,
    effet: positif(result.innovationEffects?.demandBonus) > 0 ? `Attractivité ${plus(result.innovationEffects!.demandBonus!)}` : null,
  });
  pousser({
    titre: "Programme RSE",
    engage: nommer(s.rseProgram?.actions, d.activeRseActionIds),
    cout: result.rseProgramCost ?? null,
    effet:
      positif(result.rseProgramEffects?.imageBonus) > 0
        ? `Attractivité ${plus(result.rseProgramEffects!.imageBonus!)}`
        : positif(result.rseProgramEffects?.energySaving) > 0
          ? `Économie d'énergie ${formatEuro(result.rseProgramEffects!.energySaving!)}`
          : null,
  });
  const prix = result.pricingEffects;
  pousser({
    titre: "Stratégie de prix",
    engage: nommer(
      s.pricingStrategy?.strategies,
      d.activePricingStrategyIds,
    ),
    cout: null,
    effet:
      prix && prix.priceMultiplier !== 1
        ? `Prix perçu ${prix.priceMultiplier > 1 ? plus(prix.priceMultiplier - 1) : moins(1 - prix.priceMultiplier)}`
        : null,
  });
  pousser({
    titre: "Plans de crise",
    engage: nommer(s.crisisManagement?.plans, d.activeCrisisPlanIds),
    cout: result.crisisCost ?? null,
    effet: null,
  });
  pousser({
    titre: "Partenariats",
    engage: nommer(s.partnerships?.options, d.activatePartnershipIds),
    cout: result.partnershipCost ?? null,
    effet:
      positif(result.partnershipEffects?.marketAccessBonus) > 0
        ? `Accès au marché ${plus(result.partnershipEffects!.marketAccessBonus!)}`
        : null,
  });
  pousser({
    titre: "Transformation digitale",
    engage: nommer(s.digitalTransformation?.projects, d.startDigitalProjectIds),
    cout: result.digitalCost ?? null,
    effet: positif(result.digitalEffects?.demandBonus) > 0 ? `Attractivité ${plus(result.digitalEffects!.demandBonus!)}` : null,
  });
  pousser({
    titre: "Gestion de la marque",
    engage: nommer(s.brandManagement?.actions, d.activeBrandActionIds),
    cout: result.brandCost ?? null,
    effet: positif(result.brandEffects?.imageBonus) > 0 ? `Attractivité ${plus(result.brandEffects!.imageBonus!)}` : null,
  });

  // LA CRISE NE SE DIT QUE LÀ OÙ ELLE PÈSE. Le moteur la tire dès que le
  // scénario porte un catalogue de crise, même au niveau qui ne l'ouvre pas, et
  // la perte ne frappe que les ventes à l'export : sans plan engagé ni marché
  // ouvert, l'annoncer serait parler d'un événement sans conséquence.
  const criseQuiPese =
    result.crisisEvent && ((result.crisisCost ?? 0) > 0 || (result.internationalCost ?? 0) > 0);
  const crise = criseQuiPese ? `Crise ce tour : ${nomDeCrise(result.crisisEvent!.type)}.` : null;
  return lignes.length > 0 || crise ? { lignes, crise } : null;
}
