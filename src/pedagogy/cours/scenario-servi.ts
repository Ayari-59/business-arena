import type { BilanDuScenario, ConsequenceDuScenario, Scenario, SituationDuScenario } from "../../config/cours/scenarios/types";
import { CHAPITRES, PALIERS, PARCOURS } from "../../config/cours/registre";
import { typographier } from "../../lib/typographie";
import { envoiValide, montrer, questionsServies, repondre, type RetourDuBureau } from "./bureau-servi";

/**
 * LE SCÉNARIO À EMBRANCHEMENTS SERVI ET CALCULÉ AU SERVEUR (décision du propriétaire, novembre 2026).
 *
 * Le moteur est celui du bureau (bureau-servi.ts) : la page ne sert que ce que l'élève doit lire, et
 * chaque geste remonte à une action serveur (app/cours/scenario/actions.ts), qui contrôle l'accès puis
 * appelle `corrigerAuScenario`. La page sert la première décision, sa situation et ses options, rien
 * d'autre. Un choix envoie la suite des choix faits ; le serveur rend la conséquence du dernier, puis la
 * situation suivante, ou le bilan et les questions de compréhension. Les branches non choisies, la
 * meilleure suite et les réponses des questions ne partent pas avant : les questions se corrigent comme
 * celles du bureau (`repondre`, `montrer`).
 *
 * Ce module est serveur : aucun composant « use client » ne doit l'importer
 * (tests/architecture/corriges-hors-du-navigateur.test.ts).
 */

// ─────────────────────────────────────────────────────────────────────────────
// CE QUI EST SERVI
// ─────────────────────────────────────────────────────────────────────────────

/** Une situation servie : celle de la décision `index` (0 pour la première). */
export interface SituationServie extends SituationDuScenario {
  index: number;
}

/** Les questions de compréhension servies : les options dans l'ordre affiché, leur seul texte. */
export interface QuestionsServies {
  id: string;
  type: "reponse";
  titre: string;
  consigne: string;
  pieces: readonly string[];
  questions: { id: string; question: string; options: { texte: string }[] }[];
}

export interface BilanServi extends BilanDuScenario {
  questions: QuestionsServies;
}

export interface ScenarioServi {
  code: string;
  titre: string;
  accroche: string;
  objectifs: readonly string[];
  commanditaire: string;
  entreprise: string;
  parcours: string;
  palier: number;
  accueil: readonly string[];
  /** Les chapitres que le scénario reprend, pour y revenir. */
  chapitres: { code: string; titre: string }[];
  /** Les titres des décisions, pour dire où en est l'élève. */
  decisions: { id: string; titre: string }[];
  premiere: SituationServie;
}

const servirLaSituation = (s: Scenario, avant: readonly string[]): SituationServie => ({ ...s.situation(avant), index: avant.length });

/** Le scénario, réduit à ce que l'élève lit avant son premier choix. */
export function servirLeScenario(s: Scenario): ScenarioServi {
  return typographier({
    code: s.code,
    titre: s.titre,
    accroche: s.accroche,
    objectifs: s.objectifs,
    commanditaire: s.commanditaire,
    entreprise: s.entreprise.nom,
    parcours: PARCOURS.find((p) => p.code === s.parcours)!.titre,
    palier: PALIERS.find((p) => p.palier === s.palier)!.palier,
    accueil: s.accueil,
    chapitres: s.reprend.map((code) => ({ code, titre: CHAPITRES.find((c) => c.code === code)!.titre })),
    decisions: s.decisions.map((d) => ({ id: d.id, titre: d.titre })),
    premiere: servirLaSituation(s, []),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CE QUI EST CALCULÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que le navigateur envoie : la suite des choix faits, ou un geste sur les questions. */
export type EnvoiAuScenario =
  | { geste: "choisir"; suite: string[] }
  | { etape: string; geste: "repondre"; question: string; option: string; justes: string[] }
  | { etape: string; geste: "montrer" };

export type RetourDuScenario =
  | { refus: "scenario" | "licence" | "envoi" | "etape" }
  | { geste: "choisir"; index: number; consequence: ConsequenceDuScenario; suivante?: SituationServie; bilan?: BilanServi }
  | Extract<RetourDuBureau, { geste: "repondre" | "montrer" }>;

/** Le plus long code d'option qu'un navigateur peut envoyer. */
const LONGUEUR_D_UN_CODE = 64;

/** L'envoi lu tel qu'il arrive, inconnu : null s'il n'a pas la forme d'un geste. */
export function envoiDuScenario(x: unknown): EnvoiAuScenario | null {
  if (!x || typeof x !== "object") return null;
  const e = x as Record<string, unknown>;
  if (e.geste === "choisir") {
    const ok = Array.isArray(e.suite) && e.suite.length >= 1 && e.suite.length <= 12 && e.suite.every((c) => typeof c === "string" && c.length <= LONGUEUR_D_UN_CODE);
    return ok ? { geste: "choisir", suite: [...(e.suite as string[])] } : null;
  }
  const v = envoiValide(x);
  if (v?.geste === "repondre" || v?.geste === "montrer") return v;
  return null;
}

/** Une suite que le scénario connaît : autant de choix que de décisions au plus, chacun parmi les options de la sienne. */
const suiteConnue = (s: Scenario, suite: readonly string[]) => suite.length <= s.decisions.length && suite.every((c, i) => s.decisions[i]!.options.includes(c));

function choisir(s: Scenario, suite: readonly string[]): RetourDuScenario {
  if (!suiteConnue(s, suite)) return { refus: "envoi" };
  const index = suite.length - 1;
  const consequence = s.consequence(suite);
  if (suite.length < s.decisions.length) return { geste: "choisir", index, consequence, suivante: servirLaSituation(s, suite) };
  const q = s.questions;
  // Les questions sans leur corrigé : ni option juste, ni retour, ni explication.
  const questions: QuestionsServies = { id: q.id, type: "reponse", titre: q.titre, consigne: q.consigne, pieces: q.pieces, questions: questionsServies(s, q) };
  return { geste: "choisir", index, consequence, bilan: { ...s.bilan(suite), questions } };
}

/** Calcule la conséquence d'un choix, ou corrige une question, après le contrôle de l'accès. */
export function corrigerAuScenario(s: Scenario, brut: unknown): RetourDuScenario {
  const envoi = envoiDuScenario(brut);
  if (!envoi) return { refus: "envoi" };
  if (envoi.geste === "choisir") return typographier(choisir(s, envoi.suite));
  if (envoi.etape !== s.questions.id) return { refus: "etape" };
  const retour = envoi.geste === "montrer" ? montrer(s.questions) : repondre(s.questions, envoi.question, envoi.option, envoi.justes);
  if (!retour || "refus" in retour || (retour.geste !== "repondre" && retour.geste !== "montrer")) return { refus: "envoi" };
  return typographier(retour);
}
