import { arretDeModule, champDeModule, type DecisionDeModule } from "@/config/modules-saisis";
import type { ErreurDeChamp } from "@/config/refus-de-decision";
import type { LeviersDuNiveau } from "@/config/difficulty";
import type { ScenarioVocabulary } from "@/config/scenarios/registry";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, MachineRecord, RoundDecisions } from "@/engine/types";
import { initMachineFleet } from "@/engine/equipment";
import { DECISIONS_DE_MODULE, moduleOuvert } from "@/engine/modules/ouverture";
import { moduleArretable } from "@/engine/modules/arret";
import { encoursDeLOption, MACHINE_ATELIER, PERTE_DE_CRISE } from "@/engine/modules/effets";
import { formatEuro, formatPercent, formatUnits, MOINS } from "@/lib/format";

/**
 * L'OFFRE DES MODULES : CE QUE LE SCÉNARIO PROPOSE CE TOUR, ET CE QUI TOURNE DÉJÀ.
 *
 * Les catalogues optionnels d'un scénario (actions qualité, hygiène et
 * sécurité, formation, politiques RH, maintenance, contrats fournisseurs,
 * capacité, export, innovation, programmes R&D, programme RSE, stratégie de
 * prix, actions commerciales, plans de crise, partenariats, projets digitaux,
 * marque, options de financement) en sont la vitrine :
 *
 *  - seuls les catalogues PRÉSENTS dans le snapshot de la partie paraissent ;
 *  - un module suit le niveau de difficulté, par le levier qui lui ressemble
 *    (règle partagée avec le moteur : `engine/modules/ouverture`) ;
 *  - un élément dont le tour minimal n'est pas atteint n'est pas proposé ;
 *  - ce qui est déjà actif ou en cours se lit à part, ne se relance pas, et
 *    s'ARRÊTE quand le module le permet (`engine/modules/arret`) ;
 *  - le plafond est celui que le moteur appliquera, places déjà prises
 *    déduites (un arrêt du tour en libère une).
 *
 * LES EFFETS ANNONCÉS SONT CEUX QUE LE MOTEUR APPLIQUE, et eux seuls. Un
 * effet du catalogue que le calcul du tour ne lit pas (la sécurité d'une
 * formation, l'image d'une stratégie de prix, la réduction de coûts d'un
 * partenariat…) n'est pas promis. Un élément dont aucun effet n'est appliqué
 * n'est pas proposé.
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
  /**
   * Un nombre à saisir au lieu d'une case : l'effectif à former, le montant à
   * tirer. Le champ porte alors le nombre ; vide ou zéro, rien n'est choisi.
   * `coutUnitaire` : ce que coûte une unité saisie ce tour (le cumul affiché).
   */
  saisie?: { min: number; max: number; pas: number; defaut: number; unite: string; coutUnitaire: number };
}

/** Ce qui tourne déjà : son nom, son état, et la case pour l'arrêter si le module le permet. */
export interface EnCoursDeModule {
  libelle: string;
  etat: string;
  /** L'identifiant dans le catalogue (absent : ne s'arrête pas). */
  id?: string;
  /** La case d'arrêt ; `occupe` : il prend une place du plafond, que l'arrêt libère. */
  arret?: { champ: string; occupe: boolean };
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
  enCours: EnCoursDeModule[];
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

export interface EntreeDeLOffre {
  scenario: EngineScenarioConfig;
  /** L'état d'OUVERTURE du tour à jouer (le dernier état persisté). */
  etat: Partial<CompanyState> | null | undefined;
  /** Le tour à jouer (1..N), celui que le moteur recevra. */
  tour: number;
  /** Les leviers du niveau ; absent : tous ouverts. */
  leviers?: LeviersDuNiveau | null;
  vocabulaire?: Pick<ScenarioVocabulary, "capacityLabel" | "units"> | null;
}

/** Ce qui s'arrête : le champ de la case d'arrêt, et s'il occupe une place. */
const arretable = (decision: DecisionDeModule, id: string, occupe: boolean) => ({
  id,
  arret: { champ: arretDeModule(decision, id), occupe },
});

/** L'offre des modules du tour ; `null` quand le scénario n'en propose aucun à ce niveau. */
export function construireOffreDesModules(e: EntreeDeLOffre): OffreDesModules | null {
  const { scenario: s, tour } = e;
  const etat = e.etat ?? {};
  const ouvert = (d: DecisionDeModule) => moduleOuvert(d, e.leviers);
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

  const ajouter = (m: ModuleOffert | null) => {
    if (m) modules.push(m);
  };
  const ctx: ContexteDOffre = { s, tour, etat, ouvert, element, vocabulaire: e.vocabulaire ?? null };
  ajouter(offreFormation(ctx));
  ajouter(offrePolitiquesRh(ctx));
  ajouter(offreMaintenance(ctx));
  ajouter(offreContrats(ctx));

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
      if (!def) return [];
      const occupe = a.roundsUsed + 1 <= def.maxRounds;
      return [
        {
          libelle: def.label,
          etat: `en service depuis ${tours(a.roundsUsed)}`,
          ...arretable("activeCapacityOptionIds", a.id, occupe),
        },
      ];
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
          "La mise en place se paie ce tour ; la capacité arrive au tour suivant, avec son coût par tour, jusqu'à ce que vous l'arrêtiez.",
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
      return def
        ? [{ libelle: def.label, etat: `ouvert au tour ${a.enteredAtRound}`, ...arretable("enteredMarketIds", a.id, true) }]
        : [];
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
          duree: "Jusqu'à ce que vous le fermiez",
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
        aide:
          "Un marché ouvert le reste jusqu'à ce que vous le fermiez : son coût d'adaptation court chaque tour, ses ventes aussi. L'investissement d'entrée n'est pas rendu.",
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
          ? [
              {
                libelle: def.label,
                etat: `en développement, ${d.roundsCompleted} tour${d.roundsCompleted > 1 ? "s" : ""} sur ${def.developmentRounds}`,
                ...arretable("startedInnovationIds", d.id, d.roundsCompleted + 1 < def.developmentRounds),
              },
            ]
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
          "Le développement se paie à chaque tour jusqu'au lancement, qui a son propre coût. L'effet vient au tour qui suit le lancement. Un développement arrêté ne rend pas ce qu'il a coûté.",
        plafond: max,
        plafondTexte: `${cfg.maxSimultaneousDev} développement${cfg.maxSimultaneousDev > 1 ? "s" : ""} en même temps au plus`,
        elements,
        enCours,
      });
  }

  ajouter(offreRd(ctx));

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
          ...arretable("activeRseActionIds", a.id, false),
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
            duree: `Déployée en ${tours(x.implementationRounds)}, puis jusqu'à son arrêt`,
            effets: effets.map((v) => `${v} une fois déployée`),
          }),
        ];
      });
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activeRseActionIds",
        titre: "Programme RSE",
        aide:
          "Une action engagée court jusqu'à ce que vous l'arrêtiez : son coût tombe chaque tour, ses effets viennent une fois déployée.",
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
      return def ? [{ libelle: def.label, etat: "en vigueur", ...arretable("activePricingStrategyIds", id, true) }] : [];
    });
    const elements = cfg.strategies
      .filter((x) => !actives.includes(x.id) && x.minRound <= tour)
      .flatMap((x) => {
        const effets = [
          x.priceMultiplier !== 1
            ? `Prix facturé et perçu par vos clients ${x.priceMultiplier > 1 ? plus(x.priceMultiplier - 1) : moins(1 - x.priceMultiplier)}`
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
            duree: "Dès le tour suivant, jusqu'à son arrêt",
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
          "Un positionnement ne coûte rien à annoncer, mais il engage : il s'installe au tour suivant et change le prix que vos clients paient, jusqu'à ce que vous l'arrêtiez.",
        plafond: max,
        plafondTexte: `${cfg.maxActiveStrategies} stratégie${cfg.maxActiveStrategies > 1 ? "s" : ""} en vigueur au plus`,
        elements,
        enCours,
      });
  }

  ajouter(offreActionsCommerciales(ctx));

  // ── Plans de crise : se préparer coûte chaque tour, la crise est tirée au sort ──
  if (s.crisisManagement && ouvert("activeCrisisPlanIds")) {
    const cfg = s.crisisManagement;
    const actifs = etat.activeCrisisPlans ?? [];
    const enCours = actifs.flatMap((id) => {
      const def = cfg.plans.find((p) => p.id === id);
      return def ? [{ libelle: def.label, etat: "prêt", ...arretable("activeCrisisPlanIds", id, false) }] : [];
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
          duree: "Jusqu'à son arrêt",
          effets: [
            `Couvre : ${nomDeCrise(p.crisisType)}`,
            `Protège ${formatPercent(p.effects.revenueProtection)} du chiffre d'affaires que cette crise emporterait`,
          ],
        }),
      );
    if (elements.length > 0 || enCours.length > 0)
      modules.push({
        decision: "activeCrisisPlanIds",
        titre: "Plans de crise",
        aide: `Chaque tour, une crise survient avec une probabilité de ${formatPercent(cfg.crisisEventProbability)} et emporte ${formatPercent(PERTE_DE_CRISE)} du chiffre d'affaires du tour. Un plan ne protège que de la crise qu'il couvre.`,
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
      ...arretable("activatePartnershipIds", a.id, a.remainingRounds > 1),
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
        aide:
          "Le droit d'entrée et la première redevance tombent ce tour ; l'accès au marché suit au tour suivant. Un partenariat arrêté avant son terme ne rend pas son droit d'entrée.",
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
          ? [
              {
                libelle: def.label,
                etat: `en cours, ${p.roundsCompleted} tour${p.roundsCompleted > 1 ? "s" : ""} sur ${def.implementationRounds}`,
                ...arretable("startDigitalProjectIds", p.id, p.roundsCompleted + 1 < def.implementationRounds),
              },
            ]
          : [];
      }),
      ...termines.flatMap((id) => {
        const def = cfg.projects.find((x) => x.id === id);
        return def ? [{ libelle: def.label, etat: "terminé", ...arretable("startDigitalProjectIds", id, false) }] : [];
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
          "Un projet se paie à chaque tour de mise en œuvre, puis sa maintenance court. L'effet vient au tour qui suit sa fin. Arrêté en cours, il perd ce qu'il a coûté ; arrêté une fois terminé, sa maintenance cesse et son effet aussi.",
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
      return [
        {
          libelle: def.label,
          etat: def.isRecurring ? "reconduite à chaque échéance" : `encore ${tours(a.remainingRounds)}`,
          ...arretable("activeBrandActionIds", a.id, false),
        },
      ];
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
          "Une action se paie à chaque tour où elle court. Une action reconduite repart à chaque échéance, jusqu'à ce que vous l'arrêtiez.",
        plafond: max,
        plafondTexte: `${max} nouvelle${max > 1 ? "s" : ""} action${max > 1 ? "s" : ""} au plus par tour`,
        elements,
        enCours,
      });
  }

  ajouter(offreFinancement(ctx));

  return modules.length > 0 ? modules : null;
}

interface ContexteDOffre {
  s: EngineScenarioConfig;
  tour: number;
  etat: Partial<CompanyState>;
  ouvert: (d: DecisionDeModule) => boolean;
  element: (
    decision: DecisionDeModule,
    x: Omit<ElementDeModule, "champ" | "valeur"> & { valeur?: string },
  ) => ElementDeModule;
  vocabulaire: Pick<ScenarioVocabulary, "capacityLabel" | "units"> | null;
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const points = (x: number) => `${formatUnits(x * 100)} point${x * 100 >= 2 ? "s" : ""}`;

/** ── Formation : un effectif formé, un coût par salarié, un effet le temps du programme ── */
function offreFormation(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.trainingPrograms;
  if (!cfg || !c.ouvert("trainingEnrollments")) return null;
  const effectif = Math.max(1, c.etat.headcount ?? 1);
  const actifs = c.etat.activeTrainingPrograms ?? [];
  const enCours = actifs.flatMap((a) => {
    const def = cfg.programs.find((p) => p.id === a.programId);
    return def
      ? [
          {
            libelle: def.label,
            etat: `${pluriel(a.enrolledCount, "salarié")} en formation, encore ${tours(a.remainingRounds)}`,
            ...arretable("trainingEnrollments", a.programId, true),
          },
        ]
      : [];
  });
  const elements = cfg.programs
    .filter((p) => !actifs.some((a) => a.programId === p.id))
    .flatMap((p) => {
      const f = p.effects;
      const effets = [
        f.productivityBonus ? `Productivité ${plus(f.productivityBonus)}` : null,
        f.attritionReduction ? `Départs volontaires ${moins(f.attritionReduction)}` : null,
        f.qualityBonus ? `Qualité perçue ${plus(f.qualityBonus)} à terme` : null,
      ].filter((x): x is string => x !== null);
      const entretien = f.maintenanceSaving
        ? `Entretien allégé de ${formatEuro(f.maintenanceSaving)} par tour, dans la limite du budget d'entretien`
        : null;
      if (effets.length === 0 && !entretien) return [];
      const max = Math.min(p.maxEmployeesPerRound, effectif);
      return [
        c.element("trainingEnrollments", {
          id: p.id,
          valeur: String(max),
          libelle: p.label,
          // Le coût par salarié se lit dans le titre ; le cumul suit l'effectif saisi.
          couts: [],
          coutDuTour: max * p.costPerEmployee,
          duree: `${tours(p.durationRounds)} : le coût et l'effet courent pendant toute la formation`,
          effets: [
            ...(effets.length > 0
              ? [`${effets.join(", ")} si toute l'équipe est formée, au prorata de l'effectif formé sinon`]
              : []),
            ...(entretien ? [entretien] : []),
          ],
          saisie: { min: 1, max, pas: 1, defaut: max, unite: "salariés", coutUnitaire: p.costPerEmployee },
        }),
      ];
    });
  const max = Math.max(0, cfg.maxConcurrentPrograms - actifs.length);
  if (elements.length === 0 && enCours.length === 0) return null;
  return {
    decision: "trainingEnrollments",
    titre: "Formation",
    aide: `Inscrivez jusqu'à ${pluriel(effectif, "salarié")}, l'effectif de l'équipe. Le coût se paie par salarié à chaque tour du programme ; l'effet vaut dès ce tour et cesse avec la formation.`,
    plafond: max,
    plafondTexte: `${pluriel(cfg.maxConcurrentPrograms, "programme")} en même temps au plus`,
    elements,
    enCours,
  };
}

/** ── Politiques RH : un coût par tour, un effet une fois déployées ── */
function offrePolitiquesRh(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.advancedHR;
  if (!cfg || !c.ouvert("activeHRPolicyIds")) return null;
  const actives = c.etat.activeHRPolicies ?? [];
  const enCours = actives.flatMap((a) => {
    const def = cfg.policies.find((p) => p.id === a.id);
    if (!def) return [];
    return [
      {
        libelle: def.label,
        etat:
          a.roundsActive >= def.implementationRounds
            ? "déployée"
            : `déploiement, ${a.roundsActive} tour${a.roundsActive > 1 ? "s" : ""} sur ${def.implementationRounds}`,
        ...arretable("activeHRPolicyIds", a.id, true),
      },
    ];
  });
  const elements = cfg.policies
    .filter((p) => !actives.some((a) => a.id === p.id))
    .flatMap((p) => {
      const f = p.effects;
      const effets = [
        f.productivityBonus ? `Productivité ${plus(f.productivityBonus)}` : null,
        f.absenteeismReduction ? `Heures réellement travaillées ${plus(f.absenteeismReduction)} (moins d'absences)` : null,
        f.attritionReduction ? `Départs volontaires ${moins(f.attritionReduction)}` : null,
        f.recruitmentBonus ? `Coût d'une embauche ${moins(f.recruitmentBonus)}` : null,
      ].filter((x): x is string => x !== null);
      if (effets.length === 0) return [];
      const quand =
        p.implementationRounds <= 1 ? "dès le tour suivant" : `${tours(p.implementationRounds)} après le lancement`;
      return [
        c.element("activeHRPolicyIds", {
          id: p.id,
          libelle: p.label,
          couts: [{ libelle: "Par tour, dès ce tour", montant: p.costPerRound }],
          coutDuTour: p.costPerRound,
          duree: `Déployée en ${tours(p.implementationRounds)}, puis jusqu'à son arrêt`,
          effets: effets.map((v, i) => (i === 0 ? `${v}, ${quand}` : v)),
        }),
      ];
    });
  const max = Math.max(0, cfg.maxActivePolicies - actives.length);
  if (elements.length === 0 && enCours.length === 0) return null;
  return {
    decision: "activeHRPolicyIds",
    titre: "Politiques RH",
    aide: "Une politique se paie à chaque tour, dès son lancement ; ses effets viennent une fois déployée et durent jusqu'à ce que vous l'arrêtiez. Les effets se cumulent avec la formation, dans des plafonds communs.",
    plafond: max,
    plafondTexte: `${pluriel(cfg.maxActivePolicies, "politique")} en vigueur au plus`,
    elements,
    enCours,
  };
}

/** Le parc d'ouverture, machine par machine, comme le moteur le lira. */
function parcDOuverture(c: ContexteDOffre): MachineRecord[] | null {
  if (!c.s.equipment) return null;
  if (c.etat.machineFleet) return [...c.etat.machineFleet, ...(c.etat.pendingMachineFleet ?? [])];
  return initMachineFleet([...(c.etat.fleet ?? []), ...(c.etat.pendingFleet ?? [])], c.tour);
}

/** ── Maintenance : une intervention ponctuelle sur tout l'outil de production ── */
function offreMaintenance(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.maintenanceActions;
  if (!cfg || !c.ouvert("maintenanceDecisions")) return null;
  const parc = parcDOuverture(c);
  if (!parc || parc.length === 0) return null;
  const enService = parc.filter((m) => m.isOperational).length;
  const enPanne = parc.length - enService;
  const elements: ElementDeModule[] = [];
  for (const type of cfg.types) {
    for (const niveau of type.levels) {
      const curatif = niveau.capacityRestoration !== undefined;
      const n = curatif ? enPanne : enService;
      if (n === 0) continue;
      const effets = [
        curatif && niveau.capacityRestoration
          ? `Chaque équipement en panne repart avec une chance de ${formatPercent(niveau.capacityRestoration)}, dès ce tour`
          : null,
        niveau.wearReduction ? `Usure de chaque équipement traité ${MOINS}${points(niveau.wearReduction)}` : null,
        !curatif && niveau.breakdownRiskReduction ? `Risque de panne du tour ${moins(niveau.breakdownRiskReduction)}` : null,
      ].filter((x): x is string => x !== null);
      if (effets.length === 0) continue;
      const id = `${type.code}.${niveau.level}`;
      elements.push(
        c.element("maintenanceDecisions", {
          id,
          libelle: `${type.label} · ${niveau.label}`,
          couts: [
            { libelle: `Main-d'œuvre, ${pluriel(n, "équipement")}`, montant: n * niveau.laborCost },
            { libelle: "Immobilisation", montant: n * niveau.downtimeCost },
          ],
          coutDuTour: n * (niveau.laborCost + niveau.downtimeCost),
          duree: `Intervention ponctuelle ce tour, sur ${curatif ? pluriel(n, "équipement") + " en panne" : pluriel(n, "équipement") + " en service"}`,
          effets,
        }),
      );
    }
  }
  if (elements.length === 0) return null;
  return {
    decision: "maintenanceDecisions",
    titre: "Interventions de maintenance",
    aide: "Une intervention porte sur tout l'outil de production et se paie par équipement traité, ce tour. Elle s'ajoute au budget d'entretien, qui entretient le parc en continu. Une intervention de chaque type par tour.",
    plafond: null,
    plafondTexte: "un niveau par type d'intervention",
    elements,
    enCours: [],
  };
}

const COUVERTURE_DE_CONTRAT: Record<string, string> = {
  matiere: "les matières",
  energie: "les autres charges variables, énergie comprise",
  logistique: "les autres charges variables, logistique comprise",
  soustraitance: "les autres charges variables, sous-traitance comprise",
};

/** ── Contrats fournisseurs : une remise contre un engagement de volume ── */
function offreContrats(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.supplierNegotiation;
  if (!cfg || !c.ouvert("activeContractIds")) return null;
  const actifs = c.etat.activeSupplierContracts ?? [];
  const unites = c.vocabulaire?.units ?? "unités";
  const risquePossible = [...(c.s.suppliers ?? []), ...(c.s.products ?? []).flatMap((p) => p.suppliers ?? [])].some(
    (x) => x.supplyRiskProbability > 0,
  );
  const enCours = actifs.flatMap((a) => {
    const def = cfg.contracts.find((x) => x.id === a.id);
    return def ? [{ libelle: def.label, etat: `encore ${tours(a.remainingRounds)}` }] : [];
  });
  const elements = cfg.contracts
    .filter((x) => !actifs.some((a) => a.id === x.id))
    .flatMap((x) => {
      const effets = [
        x.discountRate > 0
          ? `Remise de ${formatPercent(x.discountRate)} sur ${COUVERTURE_DE_CONTRAT[x.supplierType] ?? "les achats"}${
              x.volumeThreshold > 0
                ? `, les tours où la production atteint ${formatUnits(x.volumeThreshold)} ${unites}`
                : ""
            }`
          : null,
        risquePossible && x.supplyRiskReduction > 0
          ? `Risque de rupture d'approvisionnement ${moins(x.supplyRiskReduction)}`
          : null,
      ].filter((v): v is string => v !== null);
      if (effets.length === 0) return [];
      return [
        c.element("activeContractIds", {
          id: x.id,
          libelle: x.label,
          couts: [],
          coutDuTour: 0,
          duree: `${tours(x.contractDurationRounds)}, dès ce tour : engagement tenu jusqu'au terme`,
          effets,
        }),
      ];
    });
  const max = Math.max(0, cfg.maxActiveContracts - actifs.length);
  if (elements.length === 0 && enCours.length === 0) return null;
  return {
    decision: "activeContractIds",
    titre: "Contrats fournisseurs",
    aide: "Un contrat se signe sans frais et vaut dès ce tour. La remise n'est due qu'aux tours où la production tient le volume promis. Un contrat ne se rompt pas avant son terme.",
    plafond: max,
    plafondTexte: `${pluriel(cfg.maxActiveContracts, "contrat")} en cours au plus`,
    elements,
    enCours,
  };
}

/** ── Programmes R&D : des tours de travaux, puis un acquis pour la partie ── */
function offreRd(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.rdActions;
  if (!cfg || !c.ouvert("startedRdActionIds")) return null;
  const enCoursEtat = c.etat.rdActionsInProgress ?? [];
  const acheves = c.etat.completedRdActions ?? [];
  const restent = enCoursEtat.filter((p) => {
    const def = cfg.actions.find((x) => x.id === p.id);
    return def ? p.roundsCompleted + 1 < def.durationRounds : false;
  });
  const enCours = [
    ...enCoursEtat.flatMap((p) => {
      const def = cfg.actions.find((x) => x.id === p.id);
      return def
        ? [
            {
              libelle: def.label,
              etat: `travaux, ${p.roundsCompleted} tour${p.roundsCompleted > 1 ? "s" : ""} sur ${def.durationRounds}`,
              ...arretable("startedRdActionIds", p.id, p.roundsCompleted + 1 < def.durationRounds),
            },
          ]
        : [];
    }),
    ...acheves.flatMap((id) => {
      const def = cfg.actions.find((x) => x.id === id);
      return def ? [{ libelle: def.label, etat: "achevé" }] : [];
    }),
  ];
  const elements = cfg.actions
    .filter((x) => !enCoursEtat.some((p) => p.id === x.id) && !acheves.includes(x.id))
    .flatMap((x) => {
      const f = x.effects;
      const effets = [
        f.costReduction ? `Coût variable unitaire ${moins(f.costReduction)}` : null,
        f.qualityBonus ? `Qualité perçue ${plus(f.qualityBonus)} à terme` : null,
        f.imageBonus ? `Attractivité ${plus(f.imageBonus)}` : null,
      ].filter((v): v is string => v !== null);
      if (effets.length === 0) return [];
      return [
        c.element("startedRdActionIds", {
          id: x.id,
          libelle: x.label,
          couts: [{ libelle: "Par tour de travaux", montant: x.costPerRound }],
          coutDuTour: x.costPerRound,
          duree: `${tours(x.durationRounds)} de travaux`,
          effets: effets.map((v) => `${v} une fois achevé, pour toute la partie`),
        }),
      ];
    });
  const max = Math.max(0, cfg.maxSimultaneousProjects - restent.length);
  if (elements.length === 0 && enCours.length === 0) return null;
  return {
    decision: "startedRdActionIds",
    titre: "Programmes de R&D",
    aide: "Un programme se paie à chaque tour de travaux, sur la ligne R&D. Ses effets viennent au tour qui suit son achèvement et durent toute la partie. Arrêté en cours, il ne rend pas ce qu'il a coûté.",
    plafond: max,
    plafondTexte: `${pluriel(cfg.maxSimultaneousProjects, "programme")} en même temps au plus`,
    elements,
    enCours,
  };
}

/** ── Actions commerciales : un coût par tour, un effet dès ce tour ── */
function offreActionsCommerciales(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.commercialActions;
  if (!cfg || !c.ouvert("activeCommercialActionIds")) return null;
  const actives = c.etat.activeCommercialActions ?? [];
  const enCours = actives.flatMap((a) => {
    const def = cfg.actions.find((x) => x.id === a.id);
    if (!def) return [];
    return [
      {
        libelle: def.label,
        etat: def.isRecurring ? "reconduite à chaque échéance" : `encore ${tours(a.remainingRounds)}`,
        ...arretable("activeCommercialActionIds", a.id, true),
      },
    ];
  });
  const elements = cfg.actions
    .filter((x) => !actives.some((a) => a.id === x.id))
    .flatMap((x) => {
      const f = x.effects;
      const effets = [
        f.demandBonus ? `Attractivité ${f.demandBonus > 0 ? plus(f.demandBonus) : moins(-f.demandBonus)}` : null,
        f.imageBonus ? `Image ${f.imageBonus > 0 ? plus(f.imageBonus) : moins(-f.imageBonus)} d'attractivité` : null,
        f.newClientRatio ? `Conquête : ${plus(f.newClientRatio)} d'attractivité sur la part de marché pas encore acquise` : null,
        f.loyaltyBonus ? `Fidélité de la clientèle acquise ${plus(f.loyaltyBonus)}` : null,
        f.marginImpact < 0 ? `Remise : prix facturé ${moins(-f.marginImpact)}` : null,
      ].filter((v): v is string => v !== null);
      if (effets.length === 0) return [];
      return [
        c.element("activeCommercialActionIds", {
          id: x.id,
          libelle: x.label,
          couts: [{ libelle: "Par tour, dès ce tour", montant: x.costPerRound }],
          coutDuTour: x.costPerRound,
          duree: x.isRecurring ? `${tours(x.durationRounds)}, reconduite jusqu'à son arrêt` : tours(x.durationRounds),
          effets: effets.map((v, i) => (i === 0 ? `${v} dès ce tour` : v)),
        }),
      ];
    });
  const max = Math.max(0, cfg.maxActionsPerRound - actives.length);
  if (elements.length === 0 && enCours.length === 0) return null;
  return {
    decision: "activeCommercialActionIds",
    titre: "Actions commerciales",
    aide: "Une action se paie à chaque tour où elle court, en marketing, et agit dès ce tour. Une remise se lit sur le chiffre d'affaires : vos clients paient moins. Une action reconduite repart à chaque échéance, jusqu'à ce que vous l'arrêtiez.",
    plafond: max,
    plafondTexte: `${pluriel(cfg.maxActionsPerRound, "action")} en cours au plus`,
    elements,
    enCours,
  };
}

/** ── Options de financement : un tirage, des échéances, un taux propre ── */
function offreFinancement(c: ContexteDOffre): ModuleOffert | null {
  const cfg = c.s.financingOptions;
  if (!cfg || !c.ouvert("financingDraws") || c.s.finance.loanDurationRounds === undefined) return null;
  const loans = c.etat.loans ?? [];
  const enCours = cfg.options.flatMap((o) => {
    const encours = encoursDeLOption(loans, o.id);
    return encours > 0.005 ? [{ libelle: o.label, etat: `encours ${formatEuro(encours)}` }] : [];
  });
  const ratio = c.s.finance.maxDebtToEquity;
  const elements = cfg.options
    .filter((o) => o.availableFromRound <= c.tour)
    .flatMap((o) => {
      const enveloppe = Math.max(0, o.maxAmount - encoursDeLOption(loans, o.id));
      if (enveloppe < 1) return [];
      return [
        c.element("financingDraws", {
          id: o.id,
          libelle: o.label,
          couts: [],
          coutDuTour: 0,
          duree: `Remboursé en ${pluriel(o.durationRounds, "échéance")} égales, dès le tour suivant`,
          effets: [
            `Trésorerie : le montant tiré entre en caisse ce tour, jusqu'à ${formatEuro(enveloppe)}`,
            `Intérêts de ${formatPercent(o.interestRatePerRound)} de l'encours par tour`,
            ...(ratio !== undefined
              ? [`Dans la limite de ce que la banque prête encore : une dette au plus égale à ${formatUnits(ratio)} fois les capitaux propres`]
              : []),
          ],
          saisie: { min: 0, max: Math.floor(enveloppe), pas: 1000, defaut: 0, unite: "€", coutUnitaire: 0 },
        }),
      ];
    });
  if (elements.length === 0 && enCours.length === 0) return null;
  return {
    decision: "financingDraws",
    titre: "Options de financement",
    aide: "Un tirage entre au tableau d'emprunts, à son taux et à sa durée : il se rembourse par échéances égales à partir du tour suivant, comme un emprunt, et peut se rembourser par anticipation.",
    plafond: null,
    plafondTexte: null,
    elements,
    enCours,
  };
}

/** Les identifiants choisis pour un module, tels que les décisions les portent. */
export function choixDuModule(decisions: Partial<RoundDecisions>, decision: DecisionDeModule): string[] {
  switch (decision) {
    case "qualityActions":
      return (decisions.qualityActions ?? []).map((q) => q.actionCode);
    case "hsActions":
      return (decisions.hsActions ?? []).map((h) => h.actionCode);
    case "trainingEnrollments":
      return (decisions.trainingEnrollments ?? []).map((t) => t.programId);
    case "maintenanceDecisions":
      return (decisions.maintenanceDecisions ?? []).map((m) => `${m.actionCode}.${m.level}`);
    case "financingDraws":
      return (decisions.financingDraws ?? []).map((f) => f.optionId);
    default:
      return decisions[decision] ?? [];
  }
}

/** La valeur saisie d'un choix (effectif, montant), pour le relire sur la feuille. */
export function saisieDuChoix(decisions: Partial<RoundDecisions>, decision: DecisionDeModule, id: string): number | null {
  if (decision === "trainingEnrollments")
    return decisions.trainingEnrollments?.find((t) => t.programId === id)?.enrolledCount ?? null;
  if (decision === "financingDraws") return decisions.financingDraws?.find((f) => f.optionId === id)?.amount ?? null;
  return null;
}

/**
 * LES MODULES, JUGÉS PAR LE SERVEUR. La feuille ne propose que l'offre du tour
 * et grise les cases au plafond ; un formulaire périmé ou forgé tombe ici :
 * un choix hors de l'offre (catalogue absent, tour minimal non atteint, niveau
 * fermé, déjà en cours), un niveau qualité qui n'est pas le suivant, une
 * saisie hors de ses bornes, deux interventions du même type, un arrêt de ce
 * qui ne tourne pas, ou un plafond dépassé (un arrêt du tour libère sa place).
 */
export function refusDesModules(
  decisions: Partial<RoundDecisions>,
  offre: OffreDesModules | null,
): ErreurDeChamp[] {
  const erreurs: ErreurDeChamp[] = [];
  const nonPropose = { champ: null, message: "Ce module n'est pas proposé dans cette partie." };
  // Une intervention de maintenance ne se décide que sur tout l'atelier.
  if ((decisions.maintenanceDecisions ?? []).some((m) => m.machineId !== MACHINE_ATELIER)) erreurs.push(nonPropose);
  // Les arrêts : seulement ce qui tourne, et que le module laisse arrêter.
  const arrets = decisions.stoppedModuleItems ?? [];
  const placesLiberees = new Map<string, number>();
  for (const a of arrets) {
    const vise = offre?.find((m) => m.decision === a.module);
    const enCours = vise?.enCours.find((x) => x.id === a.id && x.arret);
    if (!moduleArretable(a.module) || !vise || !enCours?.arret) {
      erreurs.push({ champ: null, message: "Cet arrêt ne porte sur rien qui tourne ce tour." });
      continue;
    }
    if (enCours.arret.occupe) placesLiberees.set(a.module, (placesLiberees.get(a.module) ?? 0) + 1);
  }
  if (new Set(arrets.map((a) => `${a.module}.${a.id}`)).size !== arrets.length)
    erreurs.push({ champ: null, message: "Un même arrêt ne se coche qu'une fois." });
  for (const decision of DECISIONS_DE_MODULE) {
    const choix = choixDuModule(decisions, decision);
    if (choix.length === 0) continue;
    const offert = offre?.find((m) => m.decision === decision);
    if (!offert) {
      erreurs.push(nonPropose);
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
        continue;
      }
      const saisi = saisieDuChoix(decisions, decision, id);
      if (el.saisie && saisi !== null && (!(saisi >= Math.max(el.saisie.min, 1e-9)) || saisi > el.saisie.max)) {
        erreurs.push({
          champ: el.champ,
          message: `${offert.titre} : ${formatUnits(el.saisie.max)} ${el.saisie.unite} au plus pour ce choix.`,
        });
      }
    }
    if (new Set(choix).size !== choix.length) {
      erreurs.push({ champ: null, message: `${offert.titre} : un même choix ne se coche qu'une fois.` });
    }
    if (decision === "maintenanceDecisions") {
      const types = (decisions.maintenanceDecisions ?? []).map((m) => m.actionCode);
      if (new Set(types).size !== types.length)
        erreurs.push({ champ: null, message: `${offert.titre} : une seule intervention de chaque type par tour.` });
    }
    const plafond = offert.plafond === null ? null : offert.plafond + (placesLiberees.get(decision) ?? 0);
    if (plafond !== null && choix.length > plafond) {
      const champ = offert.elements.find((x) => x.id === choix[plafond])?.champ ?? null;
      erreurs.push({
        champ,
        message:
          plafond === 0
            ? `${offert.titre} : plus aucune place ce tour.`
            : `${offert.titre} : ${plafond} choix au plus ce tour.`,
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
  /** Ce qui a été arrêté CE tour (libellés du catalogue). */
  arrete: string[];
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

/** Le libellé d'un élément de catalogue, par module ; l'identifiant à défaut. */
function libelleDansLeCatalogue(s: EngineScenarioConfig, module: string, id: string): string {
  const listes: Record<string, { id: string; label: string }[] | undefined> = {
    activeCapacityOptionIds: s.capacityExpansion?.options,
    enteredMarketIds: s.internationalMarkets?.markets,
    startedInnovationIds: s.productInnovation?.innovations,
    activeRseActionIds: s.rseProgram?.actions,
    activePricingStrategyIds: s.pricingStrategy?.strategies,
    activeCrisisPlanIds: s.crisisManagement?.plans,
    activatePartnershipIds: s.partnerships?.options,
    startDigitalProjectIds: s.digitalTransformation?.projects,
    activeBrandActionIds: s.brandManagement?.actions,
    activeCommercialActionIds: s.commercialActions?.actions,
    activeContractIds: s.supplierNegotiation?.contracts,
    activeHRPolicyIds: s.advancedHR?.policies,
    startedRdActionIds: s.rdActions?.actions,
    trainingEnrollments: s.trainingPrograms?.programs,
    financingDraws: s.financingOptions?.options,
  };
  return listes[module]?.find((x) => x.id === id)?.label ?? id;
}

/**
 * CE QUE LES MODULES ONT FAIT AU TOUR : ce qui a été engagé ou arrêté, ce que
 * cela a coûté, l'effet principal en vigueur, et la crise s'il y en a eu une.
 * Lu du résultat du moteur (trace persistée) et des décisions du tour. `null`
 * quand aucun module n'a rien engagé ni coûté : un tour sans module n'a rien
 * à dire.
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
    | "crisisRevenueLoss"
    | "partnershipCost"
    | "partnershipEffects"
    | "digitalCost"
    | "digitalEffects"
    | "brandCost"
    | "brandEffects"
    | "trainingCost"
    | "trainingEffects"
    | "hrCost"
    | "hrEffects"
    | "commercialCost"
    | "commercialEffects"
    | "supplierNegotiationSaving"
    | "maintenanceCost"
    | "maintenanceEffects"
    | "rdActionsCost"
    | "rdActionsEffects"
    | "debt"
  >,
  decisions: Partial<RoundDecisions> | null,
  scenario: EngineScenarioConfig,
): BilanDesModules | null {
  const d = decisions ?? {};
  const s = scenario;
  const lignes: LigneDeModule[] = [];
  const nommer = <T extends { id: string; label: string }>(liste: T[] | undefined, ids: string[] | undefined) =>
    (ids ?? []).map((id) => liste?.find((x) => x.id === id)?.label ?? id);
  const arretes = (module: DecisionDeModule) =>
    (d.stoppedModuleItems ?? []).filter((a) => a.module === module).map((a) => libelleDansLeCatalogue(s, module, a.id));
  const pousser = (module: DecisionDeModule | null, l: Omit<LigneDeModule, "arrete">) => {
    const ligne = { ...l, arrete: module ? arretes(module) : [] };
    if (ligne.engage.length > 0 || ligne.arrete.length > 0 || (ligne.cout ?? 0) > 0 || ligne.effet) lignes.push(ligne);
  };
  const positif = (x: number | undefined) => (x !== undefined && x > 0 ? x : 0);

  const qa = result.qualityActions;
  pousser("qualityActions", {
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
  pousser("hsActions", {
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
  const fo = result.trainingEffects;
  pousser("trainingEnrollments", {
    titre: "Formation",
    engage: (d.trainingEnrollments ?? []).map(
      (t) => `${s.trainingPrograms?.programs.find((p) => p.id === t.programId)?.label ?? t.programId} · ${pluriel(t.enrolledCount, "salarié")}`,
    ),
    cout: result.trainingCost ?? null,
    effet:
      positif(fo?.productivityBonus) > 0
        ? `Productivité ${plus(fo!.productivityBonus!)}`
        : positif(fo?.attritionReduction) > 0
          ? `Départs volontaires ${moins(fo!.attritionReduction!)}`
          : positif(fo?.qualityBonus) > 0
            ? `Qualité perçue visée ${plus(fo!.qualityBonus!)}`
            : null,
  });
  const rh = result.hrEffects;
  pousser("activeHRPolicyIds", {
    titre: "Politiques RH",
    engage: nommer(s.advancedHR?.policies, d.activeHRPolicyIds),
    cout: result.hrCost ?? null,
    effet:
      positif(rh?.productivityBonus) > 0
        ? `Productivité ${plus(rh!.productivityBonus!)}`
        : positif(rh?.attritionReduction) > 0
          ? `Départs volontaires ${moins(rh!.attritionReduction!)}`
          : null,
  });
  const ma = result.maintenanceCost;
  pousser("maintenanceDecisions", {
    titre: "Interventions de maintenance",
    engage: (d.maintenanceDecisions ?? []).map((m) => {
      const type = s.maintenanceActions?.types.find((t) => t.code === m.actionCode);
      const niveau = type?.levels.find((l) => l.level === m.level);
      return type ? `${type.label} · ${niveau?.label ?? `niveau ${m.level}`}` : m.actionCode;
    }),
    cout: ma ? ma.laborCost + ma.downtimeCost : null,
    effet:
      (result.maintenanceEffects?.machinesRestored ?? 0) > 0
        ? `${pluriel(result.maintenanceEffects!.machinesRestored, "équipement")} remis en service`
        : null,
  });
  pousser("activeContractIds", {
    titre: "Contrats fournisseurs",
    engage: nommer(s.supplierNegotiation?.contracts, d.activeContractIds),
    cout: null,
    effet:
      positif(result.supplierNegotiationSaving) > 0
        ? `Remises obtenues ${formatEuro(result.supplierNegotiationSaving!)}`
        : null,
  });
  pousser("activeCapacityOptionIds", {
    titre: "Capacité supplémentaire",
    engage: nommer(s.capacityExpansion?.options, d.activeCapacityOptionIds),
    cout: result.capacityCost ?? null,
    effet: null,
  });
  pousser("enteredMarketIds", {
    titre: "Marchés à l'export",
    engage: nommer(s.internationalMarkets?.markets, d.enteredMarketIds),
    cout: result.internationalCost ?? null,
    effet: positif(result.internationalRevenue) > 0 ? `Ventes à l'export ${formatEuro(result.internationalRevenue!)}` : null,
  });
  pousser("startedInnovationIds", {
    titre: "Innovation produit",
    engage: nommer(s.productInnovation?.innovations, d.startedInnovationIds),
    cout: result.innovationCost ?? null,
    effet: positif(result.innovationEffects?.demandBonus) > 0 ? `Attractivité ${plus(result.innovationEffects!.demandBonus!)}` : null,
  });
  const rd = result.rdActionsEffects;
  pousser("startedRdActionIds", {
    titre: "Programmes de R&D",
    engage: nommer(s.rdActions?.actions, d.startedRdActionIds),
    cout: result.rdActionsCost ?? null,
    effet:
      positif(rd?.costReduction) > 0
        ? `Coût variable unitaire ${moins(rd!.costReduction)}`
        : positif(rd?.imageBonus) > 0
          ? `Attractivité ${plus(rd!.imageBonus)}`
          : positif(rd?.qualityBonus) > 0
            ? `Qualité perçue visée ${plus(rd!.qualityBonus)}`
            : null,
  });
  pousser("activeRseActionIds", {
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
  pousser("activePricingStrategyIds", {
    titre: "Stratégie de prix",
    engage: nommer(s.pricingStrategy?.strategies, d.activePricingStrategyIds),
    cout: null,
    effet:
      prix && prix.priceMultiplier !== 1
        ? `Prix facturé ${prix.priceMultiplier > 1 ? plus(prix.priceMultiplier - 1) : moins(1 - prix.priceMultiplier)}`
        : null,
  });
  const co = result.commercialEffects;
  pousser("activeCommercialActionIds", {
    titre: "Actions commerciales",
    engage: nommer(s.commercialActions?.actions, d.activeCommercialActionIds),
    cout: result.commercialCost ?? null,
    effet:
      co && (co.demandBonus ?? 0) !== 0
        ? `Attractivité ${(co.demandBonus ?? 0) > 0 ? plus(co.demandBonus!) : moins(-co.demandBonus!)}${
            (co.marginImpact ?? 0) < 0 ? `, remise ${moins(-co.marginImpact!)}` : ""
          }`
        : null,
  });
  pousser("activeCrisisPlanIds", {
    titre: "Plans de crise",
    engage: nommer(s.crisisManagement?.plans, d.activeCrisisPlanIds),
    cout: result.crisisCost ?? null,
    effet: null,
  });
  pousser("activatePartnershipIds", {
    titre: "Partenariats",
    engage: nommer(s.partnerships?.options, d.activatePartnershipIds),
    cout: result.partnershipCost ?? null,
    effet:
      positif(result.partnershipEffects?.marketAccessBonus) > 0
        ? `Accès au marché ${plus(result.partnershipEffects!.marketAccessBonus!)}`
        : null,
  });
  pousser("startDigitalProjectIds", {
    titre: "Transformation digitale",
    engage: nommer(s.digitalTransformation?.projects, d.startDigitalProjectIds),
    cout: result.digitalCost ?? null,
    effet: positif(result.digitalEffects?.demandBonus) > 0 ? `Attractivité ${plus(result.digitalEffects!.demandBonus!)}` : null,
  });
  pousser("activeBrandActionIds", {
    titre: "Gestion de la marque",
    engage: nommer(s.brandManagement?.actions, d.activeBrandActionIds),
    cout: result.brandCost ?? null,
    effet: positif(result.brandEffects?.imageBonus) > 0 ? `Attractivité ${plus(result.brandEffects!.imageBonus!)}` : null,
  });
  const tirages = result.debt?.financingDrawn ?? [];
  pousser("financingDraws", {
    titre: "Options de financement",
    engage: tirages.map((t) => `${libelleDansLeCatalogue(s, "financingDraws", t.optionId)} · ${formatEuro(t.amount)}`),
    cout: null,
    effet:
      positif(result.debt?.financingInterest) > 0 ? `Intérêts du tour ${formatEuro(result.debt!.financingInterest!)}` : null,
  });

  // LA CRISE NE SE DIT QUE LÀ OÙ ELLE PÈSE : une perte de chiffre d'affaires,
  // ou un plan activé. Le moteur ne la tire qu'aux parties qui offrent les
  // plans de crise.
  const perte = positif(result.crisisRevenueLoss);
  const criseQuiPese = result.crisisEvent && (perte > 0 || (result.crisisCost ?? 0) > 0);
  const crise = criseQuiPese
    ? `Crise ce tour : ${nomDeCrise(result.crisisEvent!.type)}${perte > 0 ? `, chiffre d'affaires perdu ${formatEuro(perte)}` : ""}.`
    : null;
  return lignes.length > 0 || crise ? { lignes, crise } : null;
}
