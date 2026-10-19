import { randomInt } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  decisions,
  examenCandidats,
  examens,
  games,
  organizations,
  players,
  roundResults,
  rounds,
  situationInstances,
  teams,
  users,
} from "@/db/schema";
import { getTeacherOrgId } from "@/services/auth.service";
import { verifierLExamen } from "@/services/acces.service";
import { createGameCore } from "@/services/game-creation.service";
import { cloreLeTourEchu } from "@/services/round-resolution.service";
import { rejeuPourLExamen } from "@/services/merite.service";
import { SCENARIO_CHOICES, scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { NIVEAU_MAX } from "@/config/vitrine-solo";
import {
  grilleParCode,
  noterLaCopie,
  referenceDeLaGrille,
  type CopieNotee,
  type GrilleDeNotation,
  type MesuresDeLaCopie,
} from "@/config/examen/grille";
import {
  ALPHABET_DU_CODE,
  CONCURRENTS_DE_L_EXAMEN,
  DUREE_DE_TOUR_MAX_MINUTES,
  NOM_D_EXAMEN_MAX,
  NOM_DU_CANDIDAT_MAX,
  PLAFOND_DE_CANDIDATS,
  TENTATIVES_MAX,
  normaliserNumero,
  type EtatDeLaCopie,
  type Identification,
  type RefusAuCandidat,
} from "@/config/examen/textes";
import { atteint, competencesEvaluees, type CodeDeCompetence } from "@/config/examen/competences";
import { cleDeComparaison, comparer, type Comparaison } from "@/config/examen/comparaisons";
import { csvDeLExamen } from "@/config/examen/export";
import { composerUnLot, graineDuRang, PERIODICITE_DE_L_EXAMEN, type LotDeGraines } from "@/pedagogy/examen/lot";
import type { RoundDecisions } from "@/engine/types";
import { synchroniserLesNotesDeLExamen } from "@/lti/ags/envois";

/**
 * L'EXAMEN INDIVIDUEL, CÔTÉ SERVEUR (décision du propriétaire : « Lance l'examen individuel
 * façon Comp-XM »).
 *
 *   · L'ENSEIGNANT crée un examen sous la licence de son établissement (module `examen`,
 *     services/acces.service.ts), le suit en direct, publie les résultats, exporte, imprime
 *     le rapport d'accréditation. Il ne voit et ne touche que les examens qu'il a créés :
 *     chaque lecture filtre par le créateur dans la requête même.
 *   · LE CANDIDAT entre par un code, s'identifie sans adresse électronique, et joue SEUL une
 *     partie solo contre les concurrents pilotés : une partie d'examen est une partie solo
 *     ordinaire (le même moteur, la même arène), rangée dans l'établissement, avec l'ordre
 *     de ses équipes fixé (même graine, même marché), et des gardes de plus (pas d'aide de
 *     l'animateur, pas d'assistant, pas de classement, l'encart estimé si l'enseignant le
 *     veut). Une copie remise ne se rejoue pas.
 *   · LA NOTE se calcule à la remise, par la grille figée dans l'examen
 *     (config/examen/grille.ts), sur le rejeu de « mérite ou chance » appelé par sa
 *     fonction dédiée (`rejeuPourLExamen`), contre L'ÉTALON QUE LA GRILLE NOMME : la gestion
 *     neutre du secteur pour les grilles publiées. Le bilan des parties juge, lui, contre
 *     un bon gestionnaire ; l'examen ne lit pas ce verdict. La notation figée garde
 *     l'étalon contre lequel la copie a été notée.
 *
 * LE PLAFOND DES PARTIES PUBLIQUES (dix par adresse et par heure, game-creation.service)
 * NE S'APPLIQUE PAS aux parties d'examen, et c'est voulu : une salle d'examen entière
 * passe derrière la même adresse, et le plafond l'aurait arrêtée au dixième candidat. Ce
 * qu'il protégeait (une boucle qui crée des parties sans fin) est tenu autrement : une
 * partie d'examen ne naît que pour un candidat d'un examen OUVERT, une seule par candidat
 * et par tentative (index uniques), et un examen n'accueille pas plus de
 * `PLAFOND_DE_CANDIDATS` candidats.
 */

/* ---------------------------------------------------------------------------
 * LES FORMES.
 * ------------------------------------------------------------------------- */

export type LigneDExamen = typeof examens.$inferSelect;
export type LigneDeCandidat = typeof examenCandidats.$inferSelect;

export class ExamenRefuseError extends Error {
  constructor(readonly raison: "saisie" | "etablissement") {
    super(raison);
    this.name = "ExamenRefuseError";
  }
}

export interface SaisieDExamen {
  nom: string;
  scenarioCode: string;
  niveau: number;
  tours: number;
  dureeTourMinutes: number | null;
  ouverture: Date | null;
  fermeture: Date | null;
  questions: boolean;
  resultatEstime: boolean;
  tentatives: number;
  modeGraine: "commune" | "lot";
  grilleCode: string;
}

/** La copie notée gardée en base, ou la raison d'une copie sans note. */
export type NotationGardee =
  | ({ etat: "notee"; marches: number } & CopieNotee)
  | { etat: "sans-note"; raison: string; message: string };

/** Les tours maximum d'une entreprise : ceux de son scénario. */
export function toursDuScenario(code: string, niveau: number): number {
  return scenarioByCode(scenarioCodeForLevel(code, niveau)).scenario.roundsCount;
}

/** Ce qui ne va pas dans une saisie ; vide : elle s'enregistre. */
export function erreursDeLaSaisie(s: SaisieDExamen): string[] {
  const e: string[] = [];
  if (!s.nom.trim() || s.nom.trim().length > NOM_D_EXAMEN_MAX) e.push("nom");
  if (!SCENARIO_CHOICES.some((c) => c.code === s.scenarioCode)) e.push("entreprise");
  if (!Number.isInteger(s.niveau) || s.niveau < 1 || s.niveau > NIVEAU_MAX) e.push("niveau");
  else if (!Number.isInteger(s.tours) || s.tours < 1 || s.tours > toursDuScenario(s.scenarioCode, s.niveau)) e.push("tours");
  if (s.dureeTourMinutes !== null && (!Number.isInteger(s.dureeTourMinutes) || s.dureeTourMinutes < 1 || s.dureeTourMinutes > DUREE_DE_TOUR_MAX_MINUTES)) {
    e.push("duree");
  }
  if ((s.ouverture && Number.isNaN(s.ouverture.getTime())) || (s.fermeture && Number.isNaN(s.fermeture.getTime()))) e.push("fenetre");
  else if (s.ouverture && s.fermeture && s.ouverture >= s.fermeture) e.push("fenetre");
  if (!Number.isInteger(s.tentatives) || s.tentatives < 1 || s.tentatives > TENTATIVES_MAX) e.push("tentatives");
  if (s.modeGraine !== "commune" && s.modeGraine !== "lot") e.push("graine");
  if (!grilleParCode(s.grilleCode)) e.push("grille");
  return e;
}

const isUniqueViolation = (e: unknown): boolean => {
  const err = e as { code?: string; cause?: { code?: string }; message?: string } | null;
  return err?.code === "23505" || err?.cause?.code === "23505" || /duplicate key|unique constraint/i.test(err?.message ?? "");
};

function nouveauCode(): string {
  return `EX-${Array.from({ length: 6 }, () => ALPHABET_DU_CODE[randomInt(ALPHABET_DU_CODE.length)]).join("")}`;
}

/** Le nombre de concurrents pilotés d'un examen : borné par ceux du scénario. */
export const concurrentsDe = (scenarioCode: string, niveau: number): number =>
  Math.min(CONCURRENTS_DE_L_EXAMEN, scenarioByCode(scenarioCodeForLevel(scenarioCode, niveau)).bots.length);

/* ---------------------------------------------------------------------------
 * L'ENSEIGNANT : CRÉER, LISTER, LIRE.
 * ------------------------------------------------------------------------- */

/**
 * CRÉER UN EXAMEN. La licence se vérifie ici (module, entreprise et niveau), la grille est
 * copiée telle quelle, les graines sont tirées (une, ou un lot d'égale difficulté).
 */
export async function creerExamen(enseignantId: string, s: SaisieDExamen): Promise<{ id: string; code: string }> {
  const organizationId = await getTeacherOrgId(enseignantId);
  if (!organizationId) throw new ExamenRefuseError("etablissement");
  if (erreursDeLaSaisie(s).length > 0) throw new ExamenRefuseError("saisie");
  await verifierLExamen(organizationId, { scenarioCode: s.scenarioCode, niveau: s.niveau });
  const grille = grilleParCode(s.grilleCode)!;
  const tirer = () => randomInt(1, 2 ** 31);
  let graines: number[];
  let equite: LotDeGraines | null = null;
  if (s.modeGraine === "lot") {
    const definition = scenarioByCode(scenarioCodeForLevel(s.scenarioCode, s.niveau));
    equite = composerUnLot(
      {
        definition,
        niveau: s.niveau,
        tours: s.tours,
        bots: concurrentsDe(s.scenarioCode, s.niveau),
        // Le lot mesure dans le monde que les candidats joueront : même valeur ci-dessous.
        periodicite: PERIODICITE_DE_L_EXAMEN,
      },
      tirer,
    );
    graines = equite.graines;
  } else {
    graines = [tirer()];
  }
  for (let essai = 0; essai < 5; essai += 1) {
    const code = nouveauCode();
    try {
      const [ligne] = await db
        .insert(examens)
        .values({
          organizationId,
          creePar: enseignantId,
          nom: s.nom.trim(),
          code,
          scenarioCode: s.scenarioCode,
          niveau: s.niveau,
          tours: s.tours,
          dureeTourMinutes: s.dureeTourMinutes,
          ouverture: s.ouverture,
          fermeture: s.fermeture,
          questions: s.questions,
          resultatEstime: s.resultatEstime,
          tentatives: s.tentatives,
          modeGraine: s.modeGraine,
          graines,
          equite,
          grilleCode: grille.code,
          grilleVersion: grille.version,
          grille: structuredClone(grille),
        })
        .returning({ id: examens.id, code: examens.code });
      return ligne!;
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
    }
  }
  throw new Error("Impossible de tirer un code d'examen libre.");
}

/**
 * La grille FIGÉE d'un examen (sa copie), jamais celle du code. Une copie gardée avant que
 * la grille n'écrive son étalon le reçoit tel qu'il était : la gestion neutre du secteur.
 */
export const grilleDeLExamen = (e: Pick<LigneDExamen, "grille">): GrilleDeNotation => {
  const g = e.grille as GrilleDeNotation;
  return { ...g, reference: referenceDeLaGrille(g) };
};

export interface ExamenListe {
  id: string;
  nom: string;
  code: string;
  scenarioCode: string;
  niveau: number;
  tours: number;
  creeLe: Date;
  publieLe: Date | null;
  closLe: Date | null;
  candidats: number;
  remises: number;
}

/** Les examens de l'enseignant, les plus récents d'abord. */
export async function examensDeLEnseignant(enseignantId: string): Promise<ExamenListe[]> {
  const lignes = await db
    .select()
    .from(examens)
    .where(eq(examens.creePar, enseignantId))
    .orderBy(desc(examens.createdAt));
  if (lignes.length === 0) return [];
  const comptes = await db
    .select({
      examenId: examenCandidats.examenId,
      n: sql<number>`count(*)::int`,
      remises: sql<number>`count(${examenCandidats.remisLe})::int`,
    })
    .from(examenCandidats)
    .where(inArray(examenCandidats.examenId, lignes.map((l) => l.id)))
    .groupBy(examenCandidats.examenId);
  return lignes.map((l) => {
    const c = comptes.find((x) => x.examenId === l.id);
    return {
      id: l.id,
      nom: l.nom,
      code: l.code,
      scenarioCode: l.scenarioCode,
      niveau: l.niveau,
      tours: l.tours,
      creeLe: l.createdAt,
      publieLe: l.publieLe,
      closLe: l.closLe,
      candidats: c?.n ?? 0,
      remises: c?.remises ?? 0,
    };
  });
}

/** Un examen de l'enseignant (son créateur), ou null. */
export async function examenDeLEnseignant(enseignantId: string, examenId: string): Promise<LigneDExamen | null> {
  if (!/^[0-9a-f-]{36}$/i.test(examenId)) return null;
  const [e] = await db
    .select()
    .from(examens)
    .where(and(eq(examens.id, examenId), eq(examens.creePar, enseignantId)));
  return e ?? null;
}

/* ---------------------------------------------------------------------------
 * L'OUVERTURE ET L'HORLOGE.
 * ------------------------------------------------------------------------- */

export type OuvertureDeLExamen = "ouvert" | "a-venir" | "ferme";

export function ouvertureDe(e: Pick<LigneDExamen, "ouverture" | "fermeture" | "closLe">, now = new Date()): OuvertureDeLExamen {
  if (e.closLe) return "ferme";
  if (e.ouverture && now < e.ouverture) return "a-venir";
  if (e.fermeture && now >= e.fermeture) return "ferme";
  return "ouvert";
}

/** La copie d'une partie (null : la partie n'est pas une partie d'examen). */
export async function copieDeLaPartie(
  gameId: string,
): Promise<{ examen: LigneDExamen; candidat: LigneDeCandidat } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(gameId)) return null;
  const [l] = await db
    .select({ examen: examens, candidat: examenCandidats })
    .from(examenCandidats)
    .innerJoin(examens, eq(examens.id, examenCandidats.examenId))
    .where(eq(examenCandidats.gameId, gameId));
  return l ?? null;
}

/** Poser l'échéance du tour ouvert, s'il n'en a pas et que l'examen limite la durée d'un tour. */
async function poserLEcheance(gameId: string, dureeMinutes: number | null, depuis: Date): Promise<void> {
  if (!dureeMinutes) return;
  const [g] = await db.select({ tour: games.currentRound, statut: games.status }).from(games).where(eq(games.id, gameId));
  if (!g || g.statut !== "running") return;
  await db
    .update(rounds)
    .set({ deadline: new Date(depuis.getTime() + dureeMinutes * 60_000) })
    .where(and(eq(rounds.gameId, gameId), eq(rounds.index, g.tour), eq(rounds.status, "open"), isNull(rounds.deadline)));
}

/** La partie est-elle terminée ? Alors la copie est remise (une fois), et sa note se calcule. */
async function remettreSiTerminee(gameId: string, candidatId: string, quand: Date): Promise<boolean> {
  const [g] = await db.select({ statut: games.status }).from(games).where(eq(games.id, gameId));
  if (g?.statut !== "finished") return false;
  await db
    .update(examenCandidats)
    .set({ remisLe: quand })
    .where(and(eq(examenCandidats.id, candidatId), isNull(examenCandidats.remisLe)));
  return true;
}

/**
 * APRÈS UN TOUR VALIDÉ PAR LE CANDIDAT : la copie est remise si c'était le dernier tour ;
 * sinon le tour suivant reçoit son échéance. Rend vrai quand la copie vient d'être remise.
 */
export async function apresLeTour(gameId: string, now = new Date()): Promise<boolean> {
  const copie = await copieDeLaPartie(gameId);
  if (!copie) return false;
  if (await remettreSiTerminee(gameId, copie.candidat.id, now)) return true;
  await poserLEcheance(gameId, copie.examen.dureeTourMinutes, now);
  return false;
}

/**
 * L'HORLOGE DE L'EXAMEN, appliquée à la lecture de la partie (l'arène) et à la clôture :
 *   · un tour dont l'échéance est passée se clôt, les décisions reconduites, et le suivant
 *     reçoit la sienne à la suite (le temps d'un tour court, que le candidat soit là ou non) ;
 *   · un examen fermé (fin de la fenêtre, ou clos par l'enseignant) clôt tous les tours
 *     restants : la copie est remise telle qu'elle est.
 * Rend vrai quand la copie est remise.
 */
export async function appliquerLHorloge(gameId: string, now = new Date()): Promise<boolean> {
  const copie = await copieDeLaPartie(gameId);
  if (!copie) return false;
  const { examen, candidat } = copie;
  if (candidat.remisLe) return true;
  const ferme = ouvertureDe(examen, now) === "ferme";
  for (let garde = 0; garde < examen.tours + 1; garde += 1) {
    const [g] = await db.select({ tour: games.currentRound, statut: games.status }).from(games).where(eq(games.id, gameId));
    if (!g) return false;
    if (g.statut !== "running") break;
    const [r] = await db
      .select({ deadline: rounds.deadline, statut: rounds.status })
      .from(rounds)
      .where(and(eq(rounds.gameId, gameId), eq(rounds.index, g.tour)));
    const echu = r?.deadline ? r.deadline <= now : false;
    if (!ferme && !echu) break;
    const clos = await cloreLeTourEchu({ gameId, expectedRound: g.tour });
    if (clos.alreadyClosed) break;
    // Le tour suivant commence à l'échéance du précédent (ou maintenant, à la fermeture).
    if (!clos.finished && examen.dureeTourMinutes && !ferme) {
      await poserLEcheance(gameId, examen.dureeTourMinutes, r?.deadline ?? now);
    }
  }
  return remettreSiTerminee(gameId, candidat.id, now);
}

/* ---------------------------------------------------------------------------
 * LE CANDIDAT : ENTRER, COMMENCER, REPRENDRE.
 * ------------------------------------------------------------------------- */

/** Ce que le candidat voit d'un examen avant de commencer : rien de nominatif. */
export interface ExamenPublic {
  id: string;
  nom: string;
  code: string;
  scenarioCode: string;
  niveau: number;
  tours: number;
  dureeTourMinutes: number | null;
  ouverture: Date | null;
  fermeture: Date | null;
  questions: boolean;
  tentatives: number;
  etat: OuvertureDeLExamen;
  publie: boolean;
}

export async function examenParCode(code: string | null): Promise<ExamenPublic | null> {
  if (!code) return null;
  const [e] = await db.select().from(examens).where(eq(examens.code, code));
  if (!e) return null;
  return {
    id: e.id,
    nom: e.nom,
    code: e.code,
    scenarioCode: e.scenarioCode,
    niveau: e.niveau,
    tours: e.tours,
    dureeTourMinutes: e.dureeTourMinutes,
    ouverture: e.ouverture,
    fermeture: e.fermeture,
    questions: e.questions,
    tentatives: e.tentatives,
    etat: ouvertureDe(e),
    publie: e.publieLe !== null,
  };
}

/** Les copies de cette identité pour cet examen, la plus récente d'abord. */
export async function copiesDuCandidat(examenId: string, userId: string | null): Promise<LigneDeCandidat[]> {
  if (!userId) return [];
  return db
    .select()
    .from(examenCandidats)
    .where(and(eq(examenCandidats.examenId, examenId), eq(examenCandidats.userId, userId)))
    .orderBy(desc(examenCandidats.tentative));
}

export type EntreeDuCandidat = { gameId: string; reprise: boolean } | { refus: RefusAuCandidat };

/**
 * COMMENCER (OU REPRENDRE) L'EXAMEN. `userId` est l'identité qui joue, établie par
 * l'appelant (le cookie invité, posé au besoin) ; `identification`, comment elle a été
 * reconnue. Une copie en cours de cette identité est reprise telle quelle ; une copie
 * remise ne se recommence que s'il reste une tentative. Un numéro d'étudiant déjà engagé
 * par une AUTRE identité est refusé : c'est le code de reprise qui rend sa copie à son
 * auteur, jamais un numéro qu'on tape.
 */
export async function commencerLExamen(args: {
  code: string;
  userId: string;
  identification: Identification;
  nom: string;
  numeroEtudiant: string | null;
  now?: Date;
}): Promise<EntreeDuCandidat> {
  const now = args.now ?? new Date();
  const [examen] = await db.select().from(examens).where(eq(examens.code, args.code));
  if (!examen) return { refus: "inconnu" };
  const deja = await copiesDuCandidat(examen.id, args.userId);
  const enCours = deja.find((c) => !c.remisLe && c.gameId);
  if (enCours) return { gameId: enCours.gameId!, reprise: true };
  const etat = ouvertureDe(examen, now);
  if (etat !== "ouvert") return { refus: etat };
  if (deja.length >= examen.tentatives) return { refus: "deja-remis" };
  const nom = args.nom.trim().slice(0, NOM_DU_CANDIDAT_MAX);
  const numero = args.numeroEtudiant ? normaliserNumero(args.numeroEtudiant) : null;
  if (!nom || (args.identification === "saisie" && !numero)) return { refus: "saisie" };
  if (numero) {
    const autres = await db
      .select({ userId: examenCandidats.userId })
      .from(examenCandidats)
      .where(and(eq(examenCandidats.examenId, examen.id), eq(examenCandidats.numeroEtudiant, numero)));
    if (autres.some((a) => a.userId !== args.userId)) return { refus: "numero-pris" };
  }
  const [{ n }] = (await db
    .select({ n: sql<number>`count(*)::int` })
    .from(examenCandidats)
    .where(eq(examenCandidats.examenId, examen.id))) as [{ n: number }];
  if (n >= PLAFOND_DE_CANDIDATS) return { refus: "complet" };

  // LA GRAINE : la même pour tous, ou celle du lot qui revient à ce rang d'entrée.
  const graine = examen.modeGraine === "lot" ? graineDuRang(examen.graines, n) : examen.graines[0]!;
  const definition = scenarioByCode(scenarioCodeForLevel(examen.scenarioCode, examen.niveau));
  const { gameId, teams: equipes } = await createGameCore({
    organizationId: examen.organizationId,
    createdBy: args.userId,
    periodicity: PERIODICITE_DE_L_EXAMEN,
    kind: "solo",
    humanTeams: [{ name: definition.playerTeamName }],
    botCount: concurrentsDe(examen.scenarioCode, examen.niveau),
    level: examen.niveau,
    variableWorld: true,
    investmentStories: true,
    scenarioCode: examen.scenarioCode,
    roundsCount: examen.tours,
    quizMode: examen.questions ? "full" : "off",
    // Une épreuve notée se répond en cochant : une réponse écrite se corrige à la main.
    answerFormat: "qcm",
    seed: graine,
    ordreFixe: true,
  });
  const humaine = equipes.find((t) => t.controller === "human")!;
  await db.insert(players).values({ teamId: humaine.id, userId: args.userId, role: "captain" });
  try {
    await db.insert(examenCandidats).values({
      examenId: examen.id,
      userId: args.userId,
      nom,
      numeroEtudiant: numero,
      identification: args.identification,
      tentative: deja.length + 1,
      gameId,
      graine,
      commenceLe: now,
    });
  } catch (e) {
    // Deux envois simultanés : l'autre a gagné ; on retire la partie de trop.
    await db.delete(games).where(eq(games.id, gameId));
    if (!isUniqueViolation(e)) throw e;
    const gagnant = (await copiesDuCandidat(examen.id, args.userId)).find((c) => !c.remisLe && c.gameId);
    if (gagnant) return { gameId: gagnant.gameId!, reprise: true };
    return { refus: "numero-pris" };
  }
  // Le nom porté par l'appareil : l'arène l'annonce (« vous jouez sous le nom de… »).
  await db.update(users).set({ displayName: nom }).where(eq(users.id, args.userId));
  await poserLEcheance(gameId, examen.dureeTourMinutes, now);
  return { gameId, reprise: false };
}

/* ---------------------------------------------------------------------------
 * LA NOTE.
 * ------------------------------------------------------------------------- */

/** Les scores des situations rencontrées par l'équipe du candidat (0 à 1 ; sans réponse : 0). */
async function scoresDesSituations(gameId: string): Promise<number[]> {
  const [humaine] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.gameId, gameId), eq(teams.controller, "human")));
  if (!humaine) return [];
  const lignes = await db
    .select({ diagnosis: situationInstances.diagnosis })
    .from(situationInstances)
    .where(eq(situationInstances.teamId, humaine.id));
  return lignes.map((l) => {
    const d = l.diagnosis as { finalScore?: number } | null;
    return typeof d?.finalScore === "number" ? d.finalScore : 0;
  });
}

/**
 * NOTER UNE COPIE REMISE, une fois. Le rejeu est celui de « mérite ou chance », appelé par
 * sa fonction publique ; sans verdict (une partie que le rejeu ne retrouve plus), la copie
 * est gardée « sans note », avec la raison, et l'enseignant le voit.
 */
export async function noterLaCopieDuCandidat(candidatId: string, { forcer = false } = {}): Promise<NotationGardee | null> {
  const [l] = await db
    .select({ examen: examens, candidat: examenCandidats })
    .from(examenCandidats)
    .innerJoin(examens, eq(examens.id, examenCandidats.examenId))
    .where(eq(examenCandidats.id, candidatId));
  if (!l || !l.candidat.remisLe || !l.candidat.gameId) return null;
  if (l.candidat.notation && !forcer) return l.candidat.notation as NotationGardee;
  const grille = grilleDeLExamen(l.examen);
  const rejeu = await rejeuPourLExamen(l.candidat.gameId, referenceDeLaGrille(grille).code);
  let notation: NotationGardee;
  if (rejeu.etat !== "rejeu") {
    notation = { etat: "sans-note", raison: rejeu.raison, message: rejeu.message };
  } else {
    const mesures: MesuresDeLaCopie = {
      sur: rejeu.sur,
      joueur: rejeu.joueur,
      reference: rejeu.reference,
      situations: l.examen.questions ? { scores: await scoresDesSituations(l.candidat.gameId) } : null,
    };
    const copie = noterLaCopie(grille, mesures, { questions: l.examen.questions });
    notation = { etat: "notee", marches: rejeu.n, ...copie };
  }
  await db
    .update(examenCandidats)
    .set({ notation, note: notation.etat === "notee" ? notation.note : null, noteLe: new Date() })
    .where(eq(examenCandidats.id, candidatId));
  return notation;
}

/** Noter la copie d'une partie qui vient de finir (appelé après la réponse au candidat). */
export async function noterLaCopieDeLaPartie(gameId: string): Promise<void> {
  const copie = await copieDeLaPartie(gameId);
  if (copie?.candidat.remisLe) await noterLaCopieDuCandidat(copie.candidat.id);
  // Remise après la publication : la note part aussi vers la plateforme de cours (lti/ags).
  if (copie?.candidat.remisLe && copie.examen.publieLe) await synchroniserLesNotesDeLExamen(copie.examen.id);
}

/* ---------------------------------------------------------------------------
 * LE SUIVI ET LES RAPPORTS DE L'ENSEIGNANT.
 * ------------------------------------------------------------------------- */

export interface CopieSuivie {
  id: string;
  nom: string;
  numeroEtudiant: string | null;
  identification: Identification;
  tentative: number;
  /** Retenue pour les résultats : la dernière remise du candidat. */
  retenue: boolean;
  etat: EtatDeLaCopie;
  /** Le tour en cours (copie en cours), ou le dernier tour. */
  tour: number;
  tours: number;
  commenceLe: Date;
  remisLe: Date | null;
  /** La durée, en minutes (jusqu'à maintenant pour une copie en cours). */
  dureeMinutes: number;
  note: number | null;
  rang: number | null;
  notation: NotationGardee | null;
  gameId: string | null;
  graine: number;
}

export interface CompetenceDeLaPromotion {
  code: CodeDeCompetence;
  nom: string;
  objectif: string;
  /** La moyenne des parts tenues, de 0 à 1. */
  moyenne: number;
  /** La part des candidats notés qui atteignent le seuil (« acquis » ou mieux). */
  atteinte: number;
  evalues: number;
}

export interface SuiviDeLExamen {
  examen: LigneDExamen;
  /** Le nom de l'établissement de l'examen (le rapport d'accréditation le porte). */
  etablissement: string;
  ouverture: OuvertureDeLExamen;
  copies: CopieSuivie[];
  /** Les copies retenues et notées. */
  notees: CopieSuivie[];
  moyenne: number | null;
  mediane: number | null;
  /** L'histogramme des notes, par tranches de dix points (la dernière comprend 100). */
  histogramme: { de: number; a: number; n: number }[];
  competences: CompetenceDeLaPromotion[];
  /** La part des candidats notés qui atteignent le seuil sur toutes les compétences évaluées. */
  atteinteGlobale: number | null;
}

const mediane = (xs: readonly number[]) => {
  const t = [...xs].sort((a, b) => a - b);
  if (t.length === 0) return null;
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m]! : (t[m - 1]! + t[m]!) / 2;
};

/**
 * LE SUIVI D'UN EXAMEN (et les rapports qui s'en tirent). Les copies remises sans note se
 * notent ici au besoin, quelques-unes par lecture (`notationsParLecture`), pour qu'une page
 * reste rapide si la notation d'arrière-plan a manqué.
 */
export async function suiviDeLExamen(
  enseignantId: string,
  examenId: string,
  { notationsParLecture = 4, now = new Date() }: { notationsParLecture?: number; now?: Date } = {},
): Promise<SuiviDeLExamen | null> {
  const examen = await examenDeLEnseignant(enseignantId, examenId);
  if (!examen) return null;
  let lignes = await db
    .select({ c: examenCandidats, tour: games.currentRound, statut: games.status })
    .from(examenCandidats)
    .leftJoin(games, eq(games.id, examenCandidats.gameId))
    .where(eq(examenCandidats.examenId, examen.id))
    .orderBy(asc(examenCandidats.commenceLe));
  const aNoter = lignes.filter((l) => l.c.remisLe && !l.c.notation).slice(0, notationsParLecture);
  if (aNoter.length > 0) {
    for (const l of aNoter) await noterLaCopieDuCandidat(l.c.id).catch(() => null);
    lignes = await db
      .select({ c: examenCandidats, tour: games.currentRound, statut: games.status })
      .from(examenCandidats)
      .leftJoin(games, eq(games.id, examenCandidats.gameId))
      .where(eq(examenCandidats.examenId, examen.id))
      .orderBy(asc(examenCandidats.commenceLe));
  }
  // La copie retenue d'un candidat : sa dernière remise.
  const derniere = new Map<string, number>();
  for (const { c } of lignes) {
    if (c.remisLe) derniere.set(c.userId, Math.max(derniere.get(c.userId) ?? 0, c.tentative));
  }
  const copies: CopieSuivie[] = lignes.map(({ c, tour, statut }) => {
    const notation = (c.notation as NotationGardee | null) ?? null;
    const etat: EtatDeLaCopie = !c.remisLe ? "en-cours" : !notation ? "remise" : notation.etat === "notee" ? "notee" : "sans-note";
    const fin = c.remisLe ?? now;
    return {
      id: c.id,
      nom: c.nom,
      numeroEtudiant: c.numeroEtudiant,
      identification: c.identification,
      tentative: c.tentative,
      retenue: !!c.remisLe && derniere.get(c.userId) === c.tentative,
      etat,
      tour: statut === "finished" ? examen.tours : (tour ?? 1),
      tours: examen.tours,
      commenceLe: c.commenceLe,
      remisLe: c.remisLe,
      dureeMinutes: Math.max(0, Math.round((fin.getTime() - c.commenceLe.getTime()) / 60_000)),
      note: c.note,
      rang: null,
      notation,
      gameId: c.gameId,
      graine: c.graine,
    };
  });
  const notees = copies
    .filter((c) => c.retenue && c.etat === "notee" && c.note !== null)
    .sort((a, b) => b.note! - a.note!);
  notees.forEach((c, i) => {
    // Ex æquo : même rang.
    c.rang = i > 0 && notees[i - 1]!.note === c.note ? notees[i - 1]!.rang : i + 1;
  });
  const notes = notees.map((c) => c.note!);
  const histogramme = Array.from({ length: 10 }, (_, i) => ({
    de: i * 10,
    a: i * 10 + 10,
    n: notes.filter((x) => (i === 9 ? x >= 90 : x >= i * 10 && x < i * 10 + 10)).length,
  }));
  const evaluees = competencesEvaluees(examen.questions);
  const competences: CompetenceDeLaPromotion[] = evaluees.map((comp) => {
    const parts = notees
      .map((c) => (c.notation?.etat === "notee" ? c.notation.competences.find((x) => x.code === comp.code) : undefined))
      .filter((x): x is NonNullable<typeof x> => !!x);
    return {
      code: comp.code,
      nom: comp.nom,
      objectif: comp.objectif,
      moyenne: parts.length ? parts.reduce((s, x) => s + x.part, 0) / parts.length : 0,
      atteinte: parts.length ? parts.filter((x) => atteint(x.niveau)).length / parts.length : 0,
      evalues: parts.length,
    };
  });
  const toutesAtteintes = notees.filter(
    (c) => c.notation?.etat === "notee" && c.notation.competences.every((x) => atteint(x.niveau)),
  ).length;
  const [org] = await db.select({ nom: organizations.name }).from(organizations).where(eq(organizations.id, examen.organizationId));
  return {
    examen,
    etablissement: org?.nom ?? "",
    ouverture: ouvertureDe(examen, now),
    copies,
    notees,
    moyenne: notes.length ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10 : null,
    mediane: notes.length ? Math.round(mediane(notes)! * 10) / 10 : null,
    histogramme,
    competences: competences.filter((c) => c.evalues > 0 || notees.length === 0),
    atteinteGlobale: notees.length ? toutesAtteintes / notees.length : null,
  };
}

/** Publier (ou retirer) les résultats : les candidats voient alors leur note et leur relevé. */
export async function publierLesResultats(enseignantId: string, examenId: string, publier = true): Promise<boolean> {
  const maj = await db
    .update(examens)
    .set({ publieLe: publier ? new Date() : null, updatedAt: new Date() })
    .where(and(eq(examens.id, examenId), eq(examens.creePar, enseignantId)))
    .returning({ id: examens.id });
  return maj.length === 1;
}

/**
 * CLORE L'EXAMEN : plus aucune entrée ; les copies en cours sont remises telles quelles
 * (les tours restants se clôturent, décisions reconduites), puis notées.
 */
export async function cloreLExamen(enseignantId: string, examenId: string, now = new Date()): Promise<boolean> {
  const maj = await db
    .update(examens)
    .set({ closLe: now, updatedAt: now })
    .where(and(eq(examens.id, examenId), eq(examens.creePar, enseignantId), isNull(examens.closLe)))
    .returning({ id: examens.id });
  if (maj.length !== 1) return (await examenDeLEnseignant(enseignantId, examenId)) !== null;
  const enCours = await db
    .select({ id: examenCandidats.id, gameId: examenCandidats.gameId })
    .from(examenCandidats)
    .where(and(eq(examenCandidats.examenId, examenId), isNull(examenCandidats.remisLe)));
  for (const c of enCours) {
    if (!c.gameId) continue;
    await appliquerLHorloge(c.gameId, now);
    await noterLaCopieDuCandidat(c.id).catch(() => null);
  }
  return true;
}

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS D'UN CANDIDAT (consultables par l'enseignant).
 * ------------------------------------------------------------------------- */

export interface TourDuCandidat {
  tour: number;
  reconduit: boolean;
  decisions: RoundDecisions | null;
  justification: string | null;
  chiffreDAffaires: number | null;
  resultat: number | null;
  tresorerie: number | null;
}

export async function decisionsDuCandidat(
  enseignantId: string,
  examenId: string,
  candidatId: string,
): Promise<{ examen: LigneDExamen; candidat: LigneDeCandidat; tours: TourDuCandidat[] } | null> {
  const examen = await examenDeLEnseignant(enseignantId, examenId);
  if (!examen || !/^[0-9a-f-]{36}$/i.test(candidatId)) return null;
  const [candidat] = await db
    .select()
    .from(examenCandidats)
    .where(and(eq(examenCandidats.id, candidatId), eq(examenCandidats.examenId, examen.id)));
  if (!candidat) return null;
  if (!candidat.gameId) return { examen, candidat, tours: [] };
  const [humaine] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.gameId, candidat.gameId), eq(teams.controller, "human")));
  const lesTours = await db.select().from(rounds).where(eq(rounds.gameId, candidat.gameId)).orderBy(asc(rounds.index));
  const ids = lesTours.map((t) => t.id);
  const [lesDecisions, lesResultats] = ids.length && humaine
    ? await Promise.all([
        db.select().from(decisions).where(and(inArray(decisions.roundId, ids), eq(decisions.teamId, humaine.id))),
        db.select().from(roundResults).where(and(inArray(roundResults.roundId, ids), eq(roundResults.teamId, humaine.id))),
      ])
    : [[], []];
  const tours: TourDuCandidat[] = lesTours
    .filter((t) => t.status === "resolved")
    .map((t) => {
      const d = lesDecisions.find((x) => x.roundId === t.id);
      const r = lesResultats.find((x) => x.roundId === t.id);
      return {
        tour: t.index,
        reconduit: d?.status === "carried_over",
        decisions: (d?.payload as RoundDecisions | undefined) ?? null,
        justification: d?.justification ?? null,
        chiffreDAffaires: r ? Number(r.revenue) : null,
        resultat: r ? Number(r.netIncome) : null,
        tresorerie: r ? Number(r.netTreasury) : null,
      };
    });
  return { examen, candidat, tours };
}

/* ---------------------------------------------------------------------------
 * LES COMPARAISONS ENTRE ÉTABLISSEMENTS (agrégats anonymes).
 * ------------------------------------------------------------------------- */

/**
 * La comparaison nationale d'une épreuve (scénario × niveau × grille et version) : les
 * notes RETENUES de tous les établissements, réduites à des percentiles par
 * `comparer`, montrées seulement au-delà des seuils. Rien de nominatif ne sort d'ici :
 * la requête ne lit que la note et l'établissement (qui ne sert qu'à compter).
 */
export async function comparaisonNationale(e: Pick<LigneDExamen, "scenarioCode" | "niveau" | "grilleCode" | "grilleVersion">): Promise<Comparaison & { cle: string }> {
  const lignes = await db
    .select({
      etablissement: examens.organizationId,
      examenId: examenCandidats.examenId,
      userId: examenCandidats.userId,
      tentative: examenCandidats.tentative,
      note: examenCandidats.note,
    })
    .from(examenCandidats)
    .innerJoin(examens, eq(examens.id, examenCandidats.examenId))
    .where(
      and(
        eq(examens.scenarioCode, e.scenarioCode),
        eq(examens.niveau, e.niveau),
        eq(examens.grilleCode, e.grilleCode),
        eq(examens.grilleVersion, e.grilleVersion),
        sql`${examenCandidats.note} IS NOT NULL`,
      ),
    );
  // La copie retenue : la dernière tentative notée de chaque candidat.
  const retenues = new Map<string, { etablissement: string; note: number; tentative: number }>();
  for (const l of lignes) {
    const k = `${l.examenId}:${l.userId}`;
    const deja = retenues.get(k);
    if (!deja || l.tentative > deja.tentative) retenues.set(k, { etablissement: l.etablissement, note: l.note!, tentative: l.tentative });
  }
  return { ...comparer([...retenues.values()]), cle: cleDeComparaison(e) };
}

/* ---------------------------------------------------------------------------
 * CE QUE LE CANDIDAT VOIT DE SA COPIE.
 * ------------------------------------------------------------------------- */

export interface CopieDuCandidat {
  examen: Pick<LigneDExamen, "id" | "nom" | "code" | "scenarioCode" | "niveau" | "tours" | "questions" | "resultatEstime" | "dureeTourMinutes">;
  candidat: Pick<LigneDeCandidat, "id" | "nom" | "tentative" | "remisLe" | "commenceLe" | "gameId">;
  publie: boolean;
  /** La note et son détail, seulement quand l'enseignant a publié. */
  notation: NotationGardee | null;
  /** Une autre tentative est-elle possible ? */
  autreTentative: boolean;
}

function versCopieDuCandidat(examen: LigneDExamen, candidat: LigneDeCandidat, copies: number): CopieDuCandidat {
  const publie = examen.publieLe !== null;
  return {
    examen: {
      id: examen.id,
      nom: examen.nom,
      code: examen.code,
      scenarioCode: examen.scenarioCode,
      niveau: examen.niveau,
      tours: examen.tours,
      questions: examen.questions,
      resultatEstime: examen.resultatEstime,
      dureeTourMinutes: examen.dureeTourMinutes,
    },
    candidat: {
      id: candidat.id,
      nom: candidat.nom,
      tentative: candidat.tentative,
      remisLe: candidat.remisLe,
      commenceLe: candidat.commenceLe,
      gameId: candidat.gameId,
    },
    publie,
    notation: publie ? ((candidat.notation as NotationGardee | null) ?? null) : null,
    autreTentative: !!candidat.remisLe && copies < examen.tentatives && ouvertureDe(examen) === "ouvert",
  };
}

/** La copie d'une partie, vue par son candidat (l'arène) ; null : pas une partie d'examen, ou pas la sienne. */
export async function copieVueParLeCandidat(gameId: string, userId: string): Promise<CopieDuCandidat | null> {
  const copie = await copieDeLaPartie(gameId);
  if (!copie || copie.candidat.userId !== userId) return null;
  const toutes = await copiesDuCandidat(copie.examen.id, userId);
  return versCopieDuCandidat(copie.examen, copie.candidat, toutes.length);
}

/** La copie retenue d'un candidat pour un examen (la page de résultat, par le code). */
export async function copieRetenueDuCandidat(code: string, userId: string | null): Promise<CopieDuCandidat | null> {
  if (!userId) return null;
  const [examen] = await db.select().from(examens).where(eq(examens.code, code));
  if (!examen) return null;
  const toutes = await copiesDuCandidat(examen.id, userId);
  const retenue = toutes.find((c) => c.remisLe) ?? toutes[0];
  return retenue ? versCopieDuCandidat(examen, retenue, toutes.length) : null;
}

/** La partie d'examen est-elle une partie d'examen ? (pour les gardes de l'arène et des actions) */
export async function estUnePartieDExamen(gameId: string): Promise<boolean> {
  return (await copieDeLaPartie(gameId)) !== null;
}

/* ---------------------------------------------------------------------------
 * L'EXPORT (CSV) ET LE RAPPORT D'ACCRÉDITATION.
 * ------------------------------------------------------------------------- */

/** Le tableur des copies d'un examen de l'enseignant ; null : pas le sien. */
export async function exportDeLExamen(
  enseignantId: string,
  examenId: string,
  le = new Date(),
): Promise<{ nom: string; contenu: string } | null> {
  const suivi = await suiviDeLExamen(enseignantId, examenId, { now: le });
  if (!suivi) return null;
  const grille = grilleDeLExamen(suivi.examen);
  return csvDeLExamen({
    examen: suivi.examen,
    lignesDeLaGrille: grille.lignes,
    le,
    copies: suivi.copies.map((c) => ({
      nom: c.nom,
      numeroEtudiant: c.numeroEtudiant,
      identification: c.identification,
      tentative: c.tentative,
      retenue: c.retenue,
      etat: c.etat,
      commenceLe: c.commenceLe,
      remisLe: c.remisLe,
      dureeMinutes: c.dureeMinutes,
      note: c.note,
      rang: c.rang,
      lignes: c.notation?.etat === "notee" ? c.notation.lignes.map((l) => ({ code: l.code, points: l.points })) : [],
      competences: c.notation?.etat === "notee" ? c.notation.competences : [],
    })),
  });
}
