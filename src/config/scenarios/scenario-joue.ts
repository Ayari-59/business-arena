import type { EngineScenarioConfig } from "@/engine/types";
import { withoutRd } from "@/engine/gamme";
import { GROUPE_PAR_SCENARIO, NOUVEAUTES_PAR_SCENARIO } from "@/config/groupe/nova";
import { etatDAdoption } from "@/engine/groupe/nouveautes";
import type { DefinitionDUneNouveaute } from "@/engine/groupe/types";
import {
  applyEconomicOverrides,
  applyEventIntensity,
  applyScoringWeightOverrides,
  presetByLevel,
  type DifficultyPreset,
  type EconomicOverrides,
  type ScoringWeightOverrides,
} from "@/config/difficulty";
import {
  avecInvestissementParNiveau,
  type CalendrierDesHistoires,
} from "@/config/investissement-par-niveau";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { applyPeriodicity, type Periodicity } from "@/config/scenarios/periodicity";
import { applyRoundsCount } from "@/config/scenarios/rounds";
import { applyScenarioVariability } from "@/config/scenarios/variability";

/**
 * LE SCÉNARIO JOUÉ : ce qu'une partie fige dans son snapshot à la création.
 *
 * Pipeline du snapshot (ADR-01 + ADR-10) : monde variable (la variante seedée
 * s'applique AVANT les réglages explicites de l'enseignant, qui gardent donc le
 * dernier mot) → paramètres économiques modulés (base trimestrielle) →
 * pondérations de l'IPG → taille du marché selon le nombre d'entreprises →
 * nombre de tours → périodicité → intensité d'événements du niveau → histoires
 * d'investissement du niveau → R&D du niveau (`rdDuNiveau` : retirée quand le
 * niveau ne l'ouvre pas, et la Studio de NOVA livrée prête aux niveaux 5 et 6).
 *
 * Il vivait dans `createGameCore`. Il est sorti ici, pur, parce que deux
 * appelants doivent faire EXACTEMENT le même calcul : la création, et le rejeu
 * du bilan (`pedagogy/merite`), qui recompose le monde d'une autre graine pour
 * dire ce que les mêmes décisions auraient donné sur un autre marché. Deux
 * copies auraient divergé au premier réglage ajouté.
 */
export interface ReglagesDuScenarioJoue {
  /** Le scénario de base, tel que le registre (ou l'éditeur) le définit. */
  scenario: EngineScenarioConfig;
  /** La graine de la partie : elle ne sert ici qu'au monde variable. */
  seed: number;
  variableWorld?: boolean;
  /** Niveau 1-6 ; absent = comportement historique, sans préréglage. */
  level?: number;
  /** Déjà assainis (`sanitizeEconomicOverrides`) ; absents = aucun. */
  economicOverrides?: EconomicOverrides;
  scoringWeightOverrides?: ScoringWeightOverrides;
  /** Équipes humaines + bots : toutes se partagent le marché. */
  concurrents: number;
  roundsCount?: number;
  periodicity: Periodicity;
  investmentStories?: boolean;
  /**
   * Les leviers de la partie, quand ils diffèrent des préréglages actuels (une
   * partie créée avant la répartition d'octobre 2026, recomposée par le rejeu
   * du bilan). Absents : ceux du niveau, aujourd'hui.
   */
  leviers?: DifficultyPreset["decisions"];
  /** Le calendrier des histoires d'investissement ; absent : l'actuel. */
  calendrier?: CalendrierDesHistoires;
}

export function composerLeScenarioJoue(r: ReglagesDuScenarioJoue): EngineScenarioConfig {
  const preset = r.level ? presetByLevel.get(r.level as DifficultyPreset["level"]) : undefined;
  const leviers = r.leviers ?? preset?.decisions;
  // Les nouveautés du niveau 7 entrent dans la gamme AVANT les réglages qui
  // dimensionnent les marchés (taille de la classe, périodicité) : elles les
  // suivent comme les autres références.
  const base = avecLesNouveautes(
    r.variableWorld ? applyScenarioVariability(r.scenario, r.seed) : r.scenario,
    leviers,
    r.seed,
  );
  const snapshot = applyEventIntensity(
    applyPeriodicity(
      applyRoundsCount(
        applyMarketScale(
          applyScoringWeightOverrides(
            applyEconomicOverrides(base, r.economicOverrides),
            r.scoringWeightOverrides,
          ),
          r.concurrents,
        ),
        r.roundsCount,
      ),
      r.periodicity,
    ),
    preset?.eventProbabilityMultiplier ?? 1,
  );
  // Les histoires qui appellent l'investissement, posées selon le niveau. Une partie sans
  // niveau (aucun préréglage) garde le calendrier de son scénario, comme avant.
  const avecHistoires =
    preset && r.investmentStories
      ? avecInvestissementParNiveau(snapshot, preset.level, r.calendrier ?? "actuel")
      : snapshot;
  const avecRd = preset && leviers ? rdDuNiveau(avecHistoires, preset.level, leviers.rd) : avecHistoires;
  return avecLeGroupe(avecRd, leviers, r.seed);
}

/** Le niveau ouvre-t-il le niveau 7 « Groupe » (croissance externe ou externalisation) ? */
const ouvreLeGroupe = (leviers: DifficultyPreset["decisions"] | undefined): boolean =>
  Boolean(leviers && (leviers.croissanceExterne || leviers.externalisation));

/** Les nouveautés du scénario, au niveau 7 seulement. */
const nouveautesDu = (
  scenario: EngineScenarioConfig,
  leviers: DifficultyPreset["decisions"] | undefined,
): readonly DefinitionDUneNouveaute[] => (ouvreLeGroupe(leviers) && scenario.products ? (NOUVEAUTES_PAR_SCENARIO[scenario.code] ?? []) : []);

/** L'état d'adoption tiré pour la partie. */
const etatTire = (d: DefinitionDUneNouveaute, seed: number) => d.adoption.etats[etatDAdoption(seed, d.reference.code, d.adoption.etats.length)]!;

/**
 * LES NOUVEAUTÉS DU NIVEAU 7 (NOVA Home) : la référence à développer propre au
 * niveau, ajoutée à la gamme. Son segment d'adoption prend la taille et la
 * croissance de l'état tiré par la graine (lente, moyenne ou rapide) : le
 * rejeu du bilan, qui recompose le monde d'une autre graine, la rejoue sur
 * un autre état. Aucun autre niveau, aucun autre scénario n'est touché.
 */
function avecLesNouveautes(
  scenario: EngineScenarioConfig,
  leviers: DifficultyPreset["decisions"] | undefined,
  seed: number,
): EngineScenarioConfig {
  const defs = nouveautesDu(scenario, leviers).filter((d) => !scenario.products!.some((p) => p.code === d.reference.code));
  if (defs.length === 0) return scenario;
  return {
    ...scenario,
    products: [
      ...scenario.products!,
      ...defs.map((d) => {
        const etat = etatTire(d, seed);
        return {
          ...d.reference,
          market: {
            ...d.reference.market,
            segments: d.reference.market.segments.map((s) =>
              s.code === d.adoption.segment ? { ...s, size: etat.taille, growth: etat.croissance } : s,
            ),
          },
        };
      }),
    ],
  };
}

/**
 * LE NIVEAU 7 « GROUPE » : son bloc, posé au seul niveau qui ouvre la
 * croissance externe ou l'externalisation, et seulement pour un scénario qui
 * en porte un (`config/groupe`). La demande est celle du scénario, saisons,
 * pics et grand compte compris : s'y préparer fait partie du jeu. Les
 * tranches et le plafond du sous-traitant, écrits au trimestre, suivent la
 * périodicité.
 *
 * LA TAILLE DE DÉPART. Les entreprises du niveau 7 démarrent plus grandes
 * (`groupe.depart`, appliqué à leur état par le moteur) ; la structure du
 * scénario qui suit la taille d'une entreprise suit le même facteur
 * (`agrandirLeScenario`), comme les tranches du sous-traitant. Le marché,
 * lui, reste celui du scénario.
 */
function avecLeGroupe(
  scenario: EngineScenarioConfig,
  leviers: DifficultyPreset["decisions"] | undefined,
  seed: number,
): EngineScenarioConfig {
  if (!leviers || !ouvreLeGroupe(leviers)) return scenario;
  const cfg = GROUPE_PAR_SCENARIO[scenario.code];
  if (!cfg) return scenario;
  const k = scenario.roundDays / 90;
  const f = cfg.depart?.facteur ?? 1;
  return {
    ...agrandirLeScenario(scenario, f),
    groupe: {
      // Le fonds de roulement de départ suit la durée du tour, comme le stock qu'il finance.
      ...(cfg.depart
        ? { depart: { ...cfg.depart, ...(cfg.depart.apport !== undefined ? { apport: cfg.depart.apport * k } : {}) } }
        : {}),
      valorisation: { ...cfg.valorisation },
      ...(leviers.croissanceExterne && cfg.rachat ? { rachat: { ...cfg.rachat } } : {}),
      ...(leviers.croissanceExterne && cfg.fournisseurs
        ? {
            fournisseurs: cfg.fournisseurs.map((f) => ({
              ...f,
              chargesFixesParTour: f.chargesFixesParTour * k,
              clientsExterieurs: { ...f.clientsExterieurs, chiffreDAffaires: f.clientsExterieurs.chiffreDAffaires * k },
              capacite: f.capacite * k,
              dureeDAmortissement: f.dureeDAmortissement / k,
              tauxDInteretParTour: f.tauxDInteretParTour * k,
            })),
          }
        : {}),
      ...(leviers.croissanceExterne && cfg.import ? { import: { ...cfg.import } } : {}),
      ...(leviers.croissanceExterne && cfg.etrangers
        ? {
            etrangers: cfg.etrangers.map((e) => ({
              ...e,
              change: { ...e.change, volatilite: e.change.volatilite * Math.sqrt(k) },
              ventes: { ...e.ventes, chiffreDAffaires: e.ventes.chiffreDAffaires * k },
              chargesFixesParTour: e.chargesFixesParTour * k,
              ...(e.risquePays ? { risquePays: { ...e.risquePays, probabilite: 1 - Math.pow(1 - e.risquePays.probabilite, k) } } : {}),
              dureeDAmortissement: e.dureeDAmortissement / k,
              tauxDInteretParTour: e.tauxDInteretParTour * k,
              ...(e.reseau ? { reseau: { ...e.reseau, capacite: e.reseau.capacite * k, coutFixeParTour: e.reseau.coutFixeParTour * k } } : {}),
              ...(e.fabrication
                ? { fabrication: { ...e.fabrication, capacite: e.fabrication.capacite * k, coutFixeParTour: e.fabrication.coutFixeParTour * k } }
                : {}),
            })),
          }
        : {}),
      ...(leviers.externalisation && cfg.sousTraitance
        ? {
            sousTraitance: Object.fromEntries(
              Object.entries(cfg.sousTraitance).map(([code, ref]) => [
                code,
                {
                  ...ref,
                  plafond: ref.plafond * k * f,
                  tranches: ref.tranches.map((t) => (t.jusqua === undefined ? { ...t } : { ...t, jusqua: t.jusqua * k * f })),
                },
              ]),
            ),
          }
        : {}),
      // Les nouveautés de la gamme (NOVA Home) : la migration au facteur de
      // l'adoption tirée, la plateforme et l'amortissement à la durée du tour.
      ...(() => {
        const nouveautes = nouveautesDu(scenario, leviers)
          .filter((d) => scenario.products!.some((p) => p.code === d.reference.code))
          .map((d) => {
            const etat = etatTire(d, seed);
            return {
              ...d.regles,
              code: d.reference.code,
              migration: {
                ...d.regles.migration,
                parts: Object.fromEntries(
                  Object.entries(d.regles.migration.parts).map(([c, part]) => [c, Math.min(1, part * etat.migration)]),
                ),
              },
              plateforme: { coutFixeParTour: d.regles.plateforme.coutFixeParTour * k },
              immobilisation: { dureeDAmortissement: Math.max(1, Math.round(d.regles.immobilisation.dureeDAmortissement / k)) },
            };
          });
        return nouveautes.length > 0 ? { nouveautes } : {};
      })(),
    },
  };
}

/**
 * La structure du scénario qui suit la taille d'une entreprise, multipliée
 * par le facteur de départ : effectif inclus (et ses salaires dans les
 * charges fixes), plafonds d'effectif et d'embauche, budgets d'entretien et
 * de qualité de référence, découvert autorisé. Le reste des charges fixes, la
 * structure, ne bouge pas. Le marché (segments, saisons, prix, événements)
 * ne change pas.
 */
export function agrandirLeScenario(scenario: EngineScenarioConfig, facteur: number): EngineScenarioConfig {
  if (facteur === 1) return scenario;
  // La structure ne double pas avec l'atelier : les charges fixes ne gagnent
  // que les salaires de l'effectif inclus en plus.
  const inclusEnPlus = scenario.hr ? Math.round(scenario.hr.includedHeadcount * facteur) - scenario.hr.includedHeadcount : 0;
  return {
    ...scenario,
    fixedCostsPerRound: scenario.fixedCostsPerRound + inclusEnPlus * (scenario.hr?.salaryPerEmployeePerRound ?? 0),
    production: {
      ...scenario.production,
      maintenanceReference: scenario.production.maintenanceReference * facteur,
      qualityScale: scenario.production.qualityScale * facteur,
    },
    finance: { ...scenario.finance, overdraftLimit: scenario.finance.overdraftLimit * facteur },
    ...(scenario.hr
      ? {
          hr: {
            ...scenario.hr,
            includedHeadcount: Math.round(scenario.hr.includedHeadcount * facteur),
            maxHeadcount: Math.round(scenario.hr.maxHeadcount * facteur),
            maxHiresPerRound: Math.round(scenario.hr.maxHiresPerRound * facteur),
          },
        }
      : {}),
  };
}

/**
 * LES RÉFÉRENCES LIVRÉES PRÊTES AUX NIVEAUX QUI OUVRENT LA R&D, NIVEAU PAR NIVEAU.
 *
 * NOVA en gamme : la Studio, aux niveaux 5, 6 et 7. Au niveau 4, la R&D est fermée
 * et la Studio était déjà livrée prête ; aux niveaux 5 et 6, la R&D s'ouvrait
 * et la Studio devenait un prototype à financer (25 000 €, vendable au tour 2).
 * Mesuré au banc des niveaux 1 à 6 : l'équipe qui valide les propositions ne
 * vendait alors que la Go et la One, et faisait défaillance (10 crises sur 12,
 * dont 5 défaillances, contre aucune au niveau 4) ; les concurrents pilotés
 * aussi (24 sur 24 en crise). Décision du propriétaire : la Studio est en
 * vente dès le tour 1 aux niveaux 5 et 6. Le levier R&D y reste ouvert : il
 * élève le niveau technique de chaque référence.
 *
 * AU NIVEAU 7, LA STUDIO EST LIVRÉE PRÊTE AUSSI (décision du propriétaire) :
 * la référence à développer y est NOVA Home, sa nouveauté propre
 * (`config/groupe/nova.ts`, `NOUVEAUTES_PAR_SCENARIO`), que cette table ne
 * nomme pas.
 *
 * Le scénario de base garde sa Studio à développer : une partie sans niveau,
 * un scénario publié par un enseignant à partir de lui, ne changent pas.
 */
export const REFERENCES_LIVREES_PRETES: Readonly<
  Record<string, { references: readonly string[]; niveaux: readonly number[] }>
> = {
  "nova-gamme": { references: ["nova-studio"], niveaux: [5, 6, 7] },
};

/**
 * La R&D du scénario joué, au niveau : un niveau qui ne l'ouvre pas retire le
 * levier du snapshot et livre prêtes les références à développer (une
 * référence hors de portée pour toute la partie n'aurait pas de sens) ; un
 * niveau qui l'ouvre garde le levier, et livre prêtes les seules références
 * que `REFERENCES_LIVREES_PRETES` désigne pour CE niveau. Sans niveau : rien
 * n'est livré prêt. Le même calcul sert la création de la partie et ce que
 * les ateliers distribuent avant elle (cockpit, dossiers).
 */
export function rdDuNiveau(
  scenario: EngineScenarioConfig,
  niveau: number | undefined,
  rdOuverte: boolean,
): EngineScenarioConfig {
  if (!rdOuverte) return withoutRd(scenario);
  const table = REFERENCES_LIVREES_PRETES[scenario.code];
  const pretes = table && niveau !== undefined && table.niveaux.includes(niveau) ? table.references : [];
  if (!scenario.products?.some((p) => p.development && pretes.includes(p.code))) return scenario;
  return {
    ...scenario,
    products: scenario.products.map((p) => {
      if (!p.development || !pretes.includes(p.code)) return p;
      const { development: _dev, ...prete } = p;
      void _dev;
      return prete;
    }),
  };
}
