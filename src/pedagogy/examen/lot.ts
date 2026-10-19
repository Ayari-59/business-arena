/**
 * LE LOT DE GRAINES D'UN EXAMEN : DES MARCHÉS DIFFÉRENTS, D'ÉGALE DIFFICULTÉ.
 *
 * Un examen joué sur une seule graine donne le même marché à tous : c'est le plus simple à
 * expliquer, mais deux voisins de salle voient alors les mêmes chiffres, et l'un peut
 * recopier les décisions de l'autre. L'enseignant peut donc choisir un LOT : chaque
 * candidat reçoit l'une de ses graines, à tour de rôle dans l'ordre d'entrée (deux
 * candidats qui entrent l'un après l'autre n'ont pas le même marché).
 *
 * LA RÈGLE D'ÉQUIVALENCE. La difficulté d'une graine se mesure à ce que la GESTION NEUTRE
 * du secteur (`neutralDecisions`, la même pour tous, tenue à chaque tour) y obtient, face
 * aux mêmes concurrents pilotés, dans les réglages exacts de l'examen (entreprise, niveau,
 * tours, monde variable). On tire un vivier de `VIVIER_DU_LOT` graines ; on retient le rang
 * que la gestion neutre y obtient le plus souvent (le rang modal) ; parmi les graines où
 * elle obtient ce rang, on garde les `TAILLE_DU_LOT` dont le résultat net cumulé est le
 * plus proche de la médiane du vivier. Deux graines du lot sont dites d'égale difficulté :
 * la même gestion y finit au même rang, avec un résultat voisin. L'étendue des résultats
 * du lot est gardée avec lui, rapportée à l'écart interquartile du vivier, pour que l'écart
 * qui subsiste soit dit, et non caché.
 *
 * Ce qui reste du hasard ne pèse pas sur la note : elle juge les décisions rejouées sur les
 * trente marchés de « mérite ou chance », les mêmes pour tous, quelle que soit la graine
 * jouée (config/examen/grille.ts). Le lot n'a donc pas à être parfait ; il limite la copie
 * et garde des parties comparables à l'œil.
 *
 * Pur : le moteur seul, sans base. Les identifiants des entreprises sont ceux d'une partie
 * d'examen (le candidat d'abord, puis les concurrents dans l'ordre du registre), parce que
 * le moteur consomme les entreprises dans cet ordre pour ses tirages ciblés.
 */
import { botDecisions, botPersonalityFromSeed, neutralDecisions, soldByProduct, type BotProfile } from "@/engine/bots";
import { simulateRound } from "@/engine/simulation";
import type { CompanyRoundResult, CompanyState, EngineScenarioConfig, EventInstance, RoundDecisions } from "@/engine/types";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { applyPeriodicityToCompany, type Periodicity } from "@/config/scenarios/periodicity";
import { presetByLevel, profilDuNiveau } from "@/config/difficulty";
import { investissementPlafonne } from "@/engine/investment/plafond";
import type { ScenarioDefinition } from "@/config/scenarios/registry";

/**
 * LA PÉRIODICITÉ D'UN EXAMEN : UNE SEULE VALEUR, LUE DEUX FOIS.
 *
 * Le lot mesure l'équivalence de difficulté en SIMULANT la partie du candidat ; il doit
 * donc la simuler dans le monde que le candidat jouera. Le lot et la création de la
 * partie posaient tous deux `periodicity: "quarter"` en dur, chacun pour soi : rien ne
 * garantissait qu'ils parlent du même monde, et le jour où l'examen offre un sélecteur,
 * le lot aurait continué de mesurer au trimestre une copie jouée au mois — où le hasard,
 * les flux par tour et la saisonnalité ne sont pas les mêmes. L'équivalence annoncée à
 * l'enseignant aurait porté sur un autre jeu que celui passé par ses élèves.
 *
 * Tant que le produit n'offre pas de sélecteur à l'examen (la saisie n'a pas de champ,
 * la table `examens` n'a pas de colonne), cette valeur est le trimestre. C'est une
 * DÉCISION PRODUIT que de l'ouvrir ; le jour où elle est prise, la périodicité se lira
 * sur la ligne d'examen à ce seul endroit, et le lot suivra sans autre changement.
 */
export const PERIODICITE_DE_L_EXAMEN: Periodicity = "quarter";

/** Le nombre de graines d'un lot. */
export const TAILLE_DU_LOT = 6;
/** Le nombre de graines tirées pour en choisir un lot. */
export const VIVIER_DU_LOT = 24;

export interface ReglagesDeLExamen {
  definition: ScenarioDefinition;
  niveau: number;
  tours: number;
  /** Le nombre de concurrents pilotés. */
  bots: number;
  /** La périodicité de la partie examinée : le lot mesure dans CE monde. */
  periodicite: Periodicity;
}

export interface DifficulteDUneGraine {
  graine: number;
  /** Le résultat net cumulé de la gestion neutre sous cette graine. */
  resultat: number;
  /** Son rang au résultat cumulé parmi les entreprises en lice (1 : la meilleure). */
  rang: number;
}

/**
 * Les identifiants des entreprises d'une partie d'examen, triés : le candidat d'abord.
 * La création de la partie (services/game-creation.service.ts, `ordreFixe`) range ses
 * équipes dans le même ordre.
 */
const idsDeCalibrage = (n: number) => Array.from({ length: n }, (_, i) => `entreprise-${String(i).padStart(2, "0")}`);

/** Le scénario joué d'un examen sous une graine (monde variable, comme la partie). */
export function scenarioDeLExamen(r: ReglagesDeLExamen, graine: number): EngineScenarioConfig {
  return composerLeScenarioJoue({
    scenario: r.definition.scenario,
    seed: graine,
    variableWorld: true,
    level: r.niveau,
    concurrents: r.bots + 1,
    roundsCount: r.tours,
    periodicity: r.periodicite,
    investmentStories: true,
  });
}

const vendu = (r: CompanyRoundResult | undefined) =>
  r ? Object.values(r.market.bySegment).reduce((s, d) => s + d.sold, 0) + (r.subscription?.retained ?? 0) : undefined;

/** Ce que la gestion neutre obtient sous une graine, face aux concurrents de l'examen. */
export function difficulteDeLaGraine(r: ReglagesDeLExamen, graine: number): DifficulteDUneGraine {
  const scenario = scenarioDeLExamen(r, graine);
  const preset = presetByLevel.get(r.niveau as 1 | 2 | 3 | 4 | 5 | 6);
  const leviers = preset ? profilDuNiveau(preset).decisions : null;
  const ids = idsDeCalibrage(r.bots + 1);
  const bots = r.definition.bots.slice(0, r.bots);
  const abonnement = r.definition.scenario.subscription !== undefined;
  let etats: CompanyState[] = ids.map((id, i) =>
    applyPeriodicityToCompany(
      i === 0
        ? r.definition.company(id, r.definition.playerTeamName, "human")
        : r.definition.company(id, bots[i - 1]!.name, "bot", bots[i - 1]!.profile),
      r.periodicite,
      { abonnement },
    ),
  );
  let evenements: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  let prixHumain: number | undefined;
  const cumule: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (let tour = 1; tour <= scenario.roundsCount; tour += 1) {
    const decisions: Record<string, RoundDecisions> = {};
    for (const [i, id] of ids.entries()) {
      const state = etats.find((s) => s.id === id)!;
      const precedent = precedents[id];
      const ctx = {
        scenario,
        state,
        roundIndex: tour,
        lastSoldUnits: vendu(precedent),
        lastSoldByProduct: precedent ? soldByProduct(scenario, precedent.market.bySegment) : undefined,
        leviers,
        investissementPlafonne: leviers ? investissementPlafonne(leviers) : false,
      };
      if (i === 0) decisions[id] = neutralDecisions(ctx);
      else {
        const profil = bots[i - 1]!.profile as BotProfile;
        decisions[id] = botDecisions(profil, {
          ...ctx,
          humanAvgPrice: prixHumain,
          personality: botPersonalityFromSeed(graine, profil),
        });
      }
    }
    // Les leviers du niveau, comme la clôture les passe : mêmes crises possibles.
    const sortie = simulateRound({
      scenario,
      roundIndex: tour,
      companies: etats,
      decisions,
      activeEvents: evenements,
      seed: graine,
      ...(leviers ? { leviers } : {}),
    });
    for (const id of ids) cumule[id] = cumule[id]! + sortie.results[id]!.incomeStatement.netIncome;
    prixHumain = decisions[ids[0]!]!.price > 0 ? decisions[ids[0]!]!.price : undefined;
    precedents = sortie.results;
    etats = [...sortie.companies].sort((a, b) => a.id.localeCompare(b.id));
    evenements = sortie.events;
  }
  const resultat = cumule[ids[0]!]!;
  const rang = 1 + ids.filter((id) => cumule[id]! > resultat + 0.005).length;
  return { graine, resultat: Math.round(resultat * 100) / 100, rang };
}

const mediane = (xs: readonly number[]) => {
  const t = [...xs].sort((a, b) => a - b);
  if (t.length === 0) return 0;
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
};
const quartile = (xs: readonly number[], q: number) => {
  const t = [...xs].sort((a, b) => a - b);
  if (t.length === 0) return 0;
  const r = q * (t.length - 1);
  const b = Math.floor(r);
  return t[b]! + (t[Math.ceil(r)]! - t[b]!) * (r - b);
};

export interface LotDeGraines {
  graines: number[];
  /** Le rang commun de la gestion neutre sur les graines du lot (null si le vivier n'en avait pas assez). */
  rang: number | null;
  /** La médiane des résultats du vivier, et l'étendue de ceux du lot. */
  mediane: number;
  etendue: number;
  /** L'écart interquartile des résultats du vivier : l'étendue du lot s'y rapporte. */
  ecartInterquartile: number;
  vivier: number;
}

/** LA RÈGLE D'ÉQUIVALENCE appliquée à un vivier mesuré (pure, testée à part). */
export function choisirLeLot(vivier: readonly DifficulteDUneGraine[], taille = TAILLE_DU_LOT): LotDeGraines {
  if (vivier.length === 0) throw new Error("Vivier vide : aucune graine à choisir.");
  const m = mediane(vivier.map((v) => v.resultat));
  const parRang = new Map<number, DifficulteDUneGraine[]>();
  for (const v of vivier) parRang.set(v.rang, [...(parRang.get(v.rang) ?? []), v]);
  // Le rang modal ; à égalité, le meilleur rang.
  const [rangModal, groupe] = [...parRang.entries()].sort((a, b) => b[1].length - a[1].length || a[0] - b[0])[0]!;
  const proches = (xs: readonly DifficulteDUneGraine[]) =>
    [...xs].sort((a, b) => Math.abs(a.resultat - m) - Math.abs(b.resultat - m) || a.graine - b.graine);
  const assez = groupe.length >= Math.min(taille, vivier.length);
  const lot = (assez ? proches(groupe) : proches(vivier)).slice(0, taille);
  const resultats = lot.map((v) => v.resultat);
  return {
    graines: lot.map((v) => v.graine),
    rang: assez ? rangModal : null,
    mediane: Math.round(m * 100) / 100,
    etendue: Math.round((Math.max(...resultats) - Math.min(...resultats)) * 100) / 100,
    ecartInterquartile: Math.round((quartile(vivier.map((v) => v.resultat), 0.75) - quartile(vivier.map((v) => v.resultat), 0.25)) * 100) / 100,
    vivier: vivier.length,
  };
}

/** Tirer et mesurer un vivier, puis en choisir le lot. `tirer` : un entier de graine. */
export function composerUnLot(r: ReglagesDeLExamen, tirer: () => number, taille = TAILLE_DU_LOT, vivier = VIVIER_DU_LOT): LotDeGraines {
  const graines = new Set<number>();
  while (graines.size < vivier) graines.add(tirer());
  return choisirLeLot([...graines].map((g) => difficulteDeLaGraine(r, g)), taille);
}

/** La graine du candidat entré en `rang`-ième position (0 pour le premier) : à tour de rôle. */
export const graineDuRang = (graines: readonly number[], rang: number): number =>
  graines[((rang % graines.length) + graines.length) % graines.length]!;
