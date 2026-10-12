import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  games,
  ltiComptes,
  pairsEvaluations,
  pairsMoments,
  pairsReponses,
  players,
  samlComptes,
  teams,
  users,
} from "@/db/schema";
import { teamDisplayName } from "@/config/nom-equipe";
import {
  BAREMES,
  COMMENTAIRE_MAX,
  CRITERES_PAR_DEFAUT,
  MOMENTS_DES_PAIRS,
  criteresRetenus,
  tourDeMiParcours,
  type Bareme,
  type CritereDesPairs,
  type IdentificationDuMembre,
  type MomentDesPairs,
} from "@/config/pairs/criteres";
import {
  METHODE_DES_PAIRS,
  bornesValables,
  calculerLEquipe,
  lireUneNoteDEquipe,
  noteIndividuelle,
  noteValable,
  type Bornes,
  type ResultatDuMembre,
} from "@/config/pairs/calcul";
import { csvDesPairs, type LigneExportee } from "@/config/pairs/export";
import { resolveScenarioDefinition } from "@/services/scenario-source.service";
import { enEssai } from "@/config/tour-d-essai";

/**
 * L'ÉVALUATION ENTRE COÉQUIPIERS (migration 0044, config/pairs/*).
 *
 * QUI EST UN MEMBRE. Un joueur d'une partie de classe est toujours une ligne `users`,
 * rangée dans une équipe par `players` ; ce qui change est la façon dont il est arrivé :
 * un compte, une plateforme de cours (LTI), son établissement (RENATER), ou un nom saisi
 * à l'entrée avec le code. L'évaluation se bâtit sur cet identifiant : on évalue ses
 * coéquipiers ACTUELS, ceux de sa ligne `players`, et rien d'autre.
 *
 * L'ISOLEMENT, écrit dans chaque lecture :
 *  · un étudiant ne lit que ses coéquipiers (noms), ses propres réponses, et, après
 *    publication, SES moyennes reçues. Jamais un auteur, jamais un commentaire, jamais
 *    les notes d'un autre ;
 *  · un enseignant ne lit que les parties qu'il a créées (filtre sur `created_by`) ; il
 *    voit les auteurs et les commentaires, lui seul.
 *
 * RGPD : données minimales (des notes de 1 à 5, un commentaire facultatif), aucune adresse
 * électronique, tout part avec la partie.
 */

export interface ReglagesDesPairs {
  active: boolean;
  moments: MomentDesPairs[];
  criteres: CritereDesPairs[];
  autoEvaluation: boolean;
  commentaire: boolean;
  bornes: Bornes;
  bareme: Bareme;
}

export const REGLAGES_PAR_DEFAUT: ReglagesDesPairs = {
  active: true,
  moments: ["fin"],
  criteres: CRITERES_PAR_DEFAUT.map((c) => ({ ...c })),
  autoEvaluation: false,
  commentaire: true,
  bornes: { ...METHODE_DES_PAIRS.bornes },
  bareme: 20,
};

/** Où en est un moment : pas encore ouvert, ouvert aux réponses, publié (réponses closes). */
export type EtatDuMoment = "a-venir" | "ouvert" | "publie";

/** Ce qu'une action refuse, par un code que la page traduit. */
export class PairsRefusError extends Error {
  constructor(public readonly raison: "introuvable" | "pas-de-classe" | "ferme" | "saisie" | "membre") {
    super(raison);
    this.name = "PairsRefusError";
  }
}

type Partie = typeof games.$inferSelect;

/** La valeur proposée par l'insertion, pour une mise à jour sur conflit. */
const sqlExcluded = (colonne: string) => sql.raw(`excluded."${colonne}"`);
type Evaluation = typeof pairsEvaluations.$inferSelect;

const toursDe = (g: Partie) => (g.scenarioSnapshot as { roundsCount?: number }).roundsCount ?? 1;

/** Une partie de classe : des équipes d'élèves, pilotée par un enseignant. Ni solo, ni concours. */
export function estUnePartieDeClasse(g: Partie): boolean {
  return (g.difficultyProfile as { kind?: string } | null)?.kind === "class" && !g.competitionStageId && g.mode !== "contest";
}

/** Le moment est-il atteint (indépendamment de la publication) ? */
export function momentAtteint(
  g: Pick<Partie, "status" | "currentRound" | "essai">,
  tours: number,
  moment: MomentDesPairs,
): boolean {
  // Un tour d'essai ne compte pas (config/tour-d-essai.ts) : avec deux tours d'essai, la
  // mi-parcours de l'essai serait « atteinte » après le premier. Rien ne s'ouvre avant la
  // vraie partie, et rien ne se publie.
  if (enEssai(g)) return false;
  if (g.status === "finished") return true;
  return moment === "mi_parcours" && g.currentRound > tourDeMiParcours(tours);
}

function etatDuMoment(g: Partie, moment: MomentDesPairs, publieLe: Date | null): EtatDuMoment {
  if (publieLe) return "publie";
  return momentAtteint(g, toursDe(g), moment) ? "ouvert" : "a-venir";
}

const reglagesDe = (e: Evaluation): ReglagesDesPairs => ({
  active: e.active,
  moments: MOMENTS_DES_PAIRS.filter((m) => e.moments.includes(m)),
  criteres: e.criteres,
  autoEvaluation: e.autoEvaluation,
  commentaire: e.commentaire,
  bornes: { basse: e.borneBasse, haute: e.borneHaute },
  bareme: (BAREMES as readonly number[]).includes(e.bareme) ? (e.bareme as Bareme) : 20,
});

async function partie(gameId: string): Promise<Partie | null> {
  if (!/^[0-9a-f-]{36}$/i.test(gameId)) return null;
  return (await db.select().from(games).where(eq(games.id, gameId)))[0] ?? null;
}

/** La partie de CET enseignant, de classe ; sinon rien (une autre se lit comme absente). */
async function partieDeLEnseignant(teacherId: string, gameId: string): Promise<Partie | null> {
  const g = await partie(gameId);
  if (!g || g.createdBy !== teacherId || !estUnePartieDeClasse(g)) return null;
  return g;
}

async function evaluationDe(gameId: string): Promise<Evaluation | null> {
  return (await db.select().from(pairsEvaluations).where(eq(pairsEvaluations.gameId, gameId)))[0] ?? null;
}

interface Membre {
  userId: string;
  nom: string;
}
interface EquipeEtMembres {
  teamId: string;
  nom: string;
  membres: Membre[];
}

/**
 * Les équipes humaines et leurs membres actuels, rangés par nom. Deux homonymes dans une
 * même équipe (deux « Léa » entrées par le code) sont départagés : « Léa », « Léa (2) ».
 */
async function equipesDeLaPartie(gameId: string): Promise<EquipeEtMembres[]> {
  const equipes = (await db.select().from(teams).where(eq(teams.gameId, gameId)))
    .filter((t) => t.controller === "human")
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { numeric: true }));
  if (equipes.length === 0) return [];
  const lignes = await db
    .select({ teamId: players.teamId, userId: players.userId, nom: users.displayName })
    .from(players)
    .innerJoin(users, eq(users.id, players.userId))
    .where(inArray(players.teamId, equipes.map((t) => t.id)));
  return equipes.map((t) => {
    const membres = lignes
      .filter((l) => l.teamId === t.id)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.userId.localeCompare(b.userId));
    const vus = new Map<string, number>();
    return {
      teamId: t.id,
      nom: teamDisplayName(t.name),
      membres: membres.map((m) => {
        const n = (vus.get(m.nom) ?? 0) + 1;
        vus.set(m.nom, n);
        return { userId: m.userId, nom: n > 1 ? `${m.nom} (${n})` : m.nom };
      }),
    };
  });
}

async function identificationsDe(userIds: string[]): Promise<Map<string, IdentificationDuMembre>> {
  const resultat = new Map<string, IdentificationDuMembre>();
  if (userIds.length === 0) return resultat;
  const [lti, saml, comptes] = await Promise.all([
    db.select({ userId: ltiComptes.userId }).from(ltiComptes).where(inArray(ltiComptes.userId, userIds)),
    db.select({ userId: samlComptes.userId }).from(samlComptes).where(inArray(samlComptes.userId, userIds)),
    db
      .select({ id: users.id, mdp: users.passwordHash, provenance: users.provenance })
      .from(users)
      .where(inArray(users.id, userIds)),
  ]);
  const enLti = new Set(lti.map((l) => l.userId));
  const enRenater = new Set(saml.map((s) => s.userId));
  for (const u of comptes) {
    resultat.set(
      u.id,
      enLti.has(u.id)
        ? "lti"
        : enRenater.has(u.id)
          ? "renater"
          : u.mdp || u.provenance === "inscription"
            ? "compte"
            : "saisie",
    );
  }
  return resultat;
}

async function reponsesDe(gameId: string, moment?: MomentDesPairs) {
  return db
    .select()
    .from(pairsReponses)
    .where(
      moment
        ? and(eq(pairsReponses.gameId, gameId), eq(pairsReponses.moment, moment))
        : eq(pairsReponses.gameId, gameId),
    );
}

async function momentsDe(gameId: string) {
  return db.select().from(pairsMoments).where(eq(pairsMoments.gameId, gameId));
}

// ---------------------------------------------------------------------------
// L'enseignant : régler, publier, saisir les notes d'équipe, lire, exporter
// ---------------------------------------------------------------------------

/** La saisie du formulaire de réglages, avant validation. */
export interface SaisieDesReglages {
  active: boolean;
  moments: string[];
  criteresCoches: string[];
  criteresLibres: string[];
  autoEvaluation: boolean;
  commentaire: boolean;
  borneBasse: number;
  borneHaute: number;
  bareme: number;
}

/**
 * Régler l'évaluation (l'activer, la modifier, la désactiver). Dès qu'une réponse existe,
 * les critères et l'auto-évaluation sont FIGÉS : les changer rendrait les réponses déjà
 * données illisibles. Le reste (moments, commentaire, bornes, barème) se règle à tout
 * moment ; le facteur se recalcule. Rend `figes` quand une demande sur eux a été ignorée.
 */
export async function reglerLEvaluation(
  teacherId: string,
  gameId: string,
  saisie: SaisieDesReglages,
): Promise<{ figes: boolean }> {
  const g = await partieDeLEnseignant(teacherId, gameId);
  if (!g) throw new PairsRefusError("introuvable");
  const moments = MOMENTS_DES_PAIRS.filter((m) => saisie.moments.includes(m));
  const bornes = { basse: saisie.borneBasse, haute: saisie.borneHaute };
  if (moments.length === 0 || !bornesValables(bornes) || !(BAREMES as readonly number[]).includes(saisie.bareme)) {
    throw new PairsRefusError("saisie");
  }
  const existante = await evaluationDe(gameId);
  const dejaRepondu =
    existante !== null && (await db.select({ id: pairsReponses.id }).from(pairsReponses).where(eq(pairsReponses.gameId, gameId)).limit(1)).length > 0;
  const criteres = criteresRetenus({ coches: saisie.criteresCoches, libres: saisie.criteresLibres });
  const figes =
    dejaRepondu &&
    (JSON.stringify(criteres) !== JSON.stringify(existante!.criteres) || saisie.autoEvaluation !== existante!.autoEvaluation);
  const valeurs = {
    active: saisie.active,
    moments,
    criteres: dejaRepondu ? existante!.criteres : criteres,
    autoEvaluation: dejaRepondu ? existante!.autoEvaluation : saisie.autoEvaluation,
    commentaire: saisie.commentaire,
    borneBasse: bornes.basse,
    borneHaute: bornes.haute,
    bareme: saisie.bareme,
  };
  await db
    .insert(pairsEvaluations)
    .values({ gameId, ...valeurs, methodeVersion: METHODE_DES_PAIRS.version, creePar: teacherId })
    .onConflictDoUpdate({ target: pairsEvaluations.gameId, set: { ...valeurs, updatedAt: new Date() } });
  return { figes };
}

/** Activer avec les réglages par défaut : la case cochée à la création de la partie. */
export async function activerParDefaut(teacherId: string, gameId: string): Promise<void> {
  const d = REGLAGES_PAR_DEFAUT;
  await reglerLEvaluation(teacherId, gameId, {
    active: true,
    moments: d.moments,
    criteresCoches: d.criteres.map((c) => c.code),
    criteresLibres: [],
    autoEvaluation: d.autoEvaluation,
    commentaire: d.commentaire,
    borneBasse: d.bornes.basse,
    borneHaute: d.bornes.haute,
    bareme: d.bareme,
  });
}

/**
 * Publier un moment (ou retirer sa publication). Publier CLÔT les réponses : plus personne
 * ne modifie la sienne, et chaque étudiant voit ses moyennes. Retirer la publication les
 * rouvre. On ne publie qu'un moment activé et atteint.
 */
export async function publierUnMoment(
  teacherId: string,
  gameId: string,
  moment: MomentDesPairs,
  publier: boolean,
): Promise<void> {
  const g = await partieDeLEnseignant(teacherId, gameId);
  const e = g ? await evaluationDe(gameId) : null;
  if (!g || !e || !e.moments.includes(moment)) throw new PairsRefusError("introuvable");
  if (publier && !momentAtteint(g, toursDe(g), moment)) throw new PairsRefusError("ferme");
  const publieLe = publier ? new Date() : null;
  await db
    .insert(pairsMoments)
    .values({ gameId, moment, publieLe })
    .onConflictDoUpdate({ target: [pairsMoments.gameId, pairsMoments.moment], set: { publieLe, updatedAt: new Date() } });
}

/**
 * Les notes d'équipe d'un moment (facultatives) : une par équipe, sur le barème choisi.
 * Une case vide retire la note. Une saisie illisible refuse tout, sans rien écrire.
 */
export async function enregistrerLesNotesDEquipe(
  teacherId: string,
  gameId: string,
  moment: MomentDesPairs,
  saisies: Record<string, string>,
): Promise<void> {
  const g = await partieDeLEnseignant(teacherId, gameId);
  const e = g ? await evaluationDe(gameId) : null;
  if (!g || !e || !e.moments.includes(moment)) throw new PairsRefusError("introuvable");
  const bareme = reglagesDe(e).bareme;
  const equipes = new Set((await equipesDeLaPartie(gameId)).map((t) => t.teamId));
  const notes: Record<string, number> = {};
  for (const [teamId, brut] of Object.entries(saisies)) {
    if (!equipes.has(teamId)) continue;
    const v = lireUneNoteDEquipe(brut, bareme);
    if (v === "invalide") throw new PairsRefusError("saisie");
    if (v !== null) notes[teamId] = v;
  }
  await db
    .insert(pairsMoments)
    .values({ gameId, moment, notesDEquipe: notes })
    .onConflictDoUpdate({
      target: [pairsMoments.gameId, pairsMoments.moment],
      set: { notesDEquipe: notes, updatedAt: new Date() },
    });
}

export interface LigneDeLEtudiant {
  userId: string;
  nom: string;
  identification: IdentificationDuMembre;
  resultat: ResultatDuMembre;
  noteIndividuelle: number | null;
}

export interface EquipeDuTableau {
  teamId: string;
  nom: string;
  repondants: number;
  membres: number;
  /** Ceux qui n'ont pas encore rendu une réponse complète. */
  enAttente: string[];
  desaccord: boolean;
  noteDEquipe: number | null;
  lignes: LigneDeLEtudiant[];
}

export interface CommentaireLu {
  equipe: string;
  auteur: string;
  cible: string;
  texte: string;
}

export interface MomentDuTableau {
  moment: MomentDesPairs;
  etat: EtatDuMoment;
  publieLe: Date | null;
  /** Le tour à la clôture duquel le moment s'ouvre (mi-parcours), ou null (fin de partie). */
  ouvreApresLeTour: number | null;
  equipes: EquipeDuTableau[];
  commentaires: CommentaireLu[];
  reponses: number;
}

export interface TableauDesPairs {
  gameId: string;
  partie: string;
  tours: number;
  reglages: ReglagesDesPairs | null;
  /** Une réponse existe : les critères et l'auto-évaluation sont figés. */
  figes: boolean;
  moments: MomentDuTableau[];
  methodeVersion: number;
}

/** Ce que l'enseignant voit, pour SA partie de classe ; null sinon. */
export async function tableauDeLEnseignant(teacherId: string, gameId: string): Promise<TableauDesPairs | null> {
  const g = await partieDeLEnseignant(teacherId, gameId);
  if (!g) return null;
  const e = await evaluationDe(gameId);
  const tours = toursDe(g);
  const nomDeLaPartie =
    g.label ??
    (await resolveScenarioDefinition((g.scenarioSnapshot as { code?: string } | null)?.code).catch(() => null))?.title ??
    "Partie";
  if (!e) {
    return { gameId, partie: nomDeLaPartie, tours, reglages: null, figes: false, moments: [], methodeVersion: METHODE_DES_PAIRS.version };
  }
  const reglages = reglagesDe(e);
  const [equipes, toutes, lignesDeMoments] = await Promise.all([equipesDeLaPartie(gameId), reponsesDe(gameId), momentsDe(gameId)]);
  const ids = equipes.flatMap((t) => t.membres.map((m) => m.userId));
  const identifications = await identificationsDe(ids);
  const nomDe = new Map(equipes.flatMap((t) => t.membres.map((m) => [m.userId, m.nom] as const)));
  const criteres = reglages.criteres.map((c) => c.code);

  const moments = reglages.moments.map((moment): MomentDuTableau => {
    const ligne = lignesDeMoments.find((l) => l.moment === moment);
    const reponses = toutes.filter((r) => r.moment === moment);
    const etat = etatDuMoment(g, moment, ligne?.publieLe ?? null);
    const commentaires: CommentaireLu[] = [];
    const equipesDuMoment = equipes.map((t): EquipeDuTableau => {
      const membres = t.membres.map((m) => m.userId);
      const calcul = calculerLEquipe({
        membres,
        criteres,
        reponses: reponses.map((r) => ({ evaluateur: r.evaluateurId, evalue: r.evalueId, notes: r.notes })),
        autoDansLeFacteur: false,
        bornes: reglages.bornes,
      });
      const noteDEquipe = ligne?.notesDEquipe[t.teamId] ?? null;
      for (const r of reponses) {
        if (r.commentaire && membres.includes(r.evaluateurId) && membres.includes(r.evalueId)) {
          commentaires.push({ equipe: t.nom, auteur: nomDe.get(r.evaluateurId)!, cible: nomDe.get(r.evalueId)!, texte: r.commentaire });
        }
      }
      return {
        teamId: t.teamId,
        nom: t.nom,
        repondants: calcul.repondants,
        membres: membres.length,
        enAttente: calcul.membres.filter((m) => !m.aRepondu).map((m) => nomDe.get(m.userId)!),
        desaccord: calcul.desaccord,
        noteDEquipe,
        lignes: calcul.membres.map((r) => ({
          userId: r.userId,
          nom: nomDe.get(r.userId)!,
          identification: identifications.get(r.userId) ?? "saisie",
          resultat: r,
          noteIndividuelle: noteIndividuelle(noteDEquipe, r.facteur, reglages.bareme),
        })),
      };
    });
    return {
      moment,
      etat,
      publieLe: ligne?.publieLe ?? null,
      ouvreApresLeTour: moment === "mi_parcours" ? tourDeMiParcours(tours) : null,
      equipes: equipesDuMoment,
      commentaires,
      reponses: reponses.length,
    };
  });
  return {
    gameId,
    partie: nomDeLaPartie,
    tours,
    reglages,
    figes: toutes.length > 0,
    moments,
    methodeVersion: e.methodeVersion,
  };
}

/** Le tableur de l'évaluation, pour SA partie ; null sinon. */
export async function exportDesPairs(
  teacherId: string,
  gameId: string,
  le: Date = new Date(),
): Promise<{ nom: string; contenu: string } | null> {
  const t = await tableauDeLEnseignant(teacherId, gameId);
  if (!t || !t.reglages) return null;
  const lignes: LigneExportee[] = t.moments.flatMap((m) =>
    m.equipes.flatMap((eq) =>
      eq.lignes.map((l) => ({
        equipe: eq.nom,
        nom: l.nom,
        identification: l.identification,
        moment: m.moment,
        resultat: l.resultat,
        noteDEquipe: eq.noteDEquipe,
        noteIndividuelle: l.noteIndividuelle,
      })),
    ),
  );
  return csvDesPairs({ partie: t.partie, criteres: t.reglages.criteres, bareme: t.reglages.bareme, lignes, le });
}

/** Le résumé du pilotage : l'évaluation est-elle activée, et que reste-t-il à faire ? */
export async function resumePourLePilotage(
  teacherId: string,
  gameId: string,
): Promise<{ active: boolean; ouverts: number; publies: number } | null> {
  const g = await partieDeLEnseignant(teacherId, gameId);
  if (!g) return null;
  const e = await evaluationDe(gameId);
  if (!e) return { active: false, ouverts: 0, publies: 0 };
  const lignes = await momentsDe(gameId);
  const etats = reglagesDe(e).moments.map((m) => etatDuMoment(g, m, lignes.find((l) => l.moment === m)?.publieLe ?? null));
  return { active: e.active, ouverts: etats.filter((x) => x === "ouvert").length, publies: etats.filter((x) => x === "publie").length };
}

// ---------------------------------------------------------------------------
// L'étudiant : évaluer ses coéquipiers, lire ses moyennes après publication
// ---------------------------------------------------------------------------

/** Ce qu'un étudiant a donné à un coéquipier (ou à lui-même) : ses propres réponses seulement. */
export interface MaReponse {
  notes: Record<string, number>;
  commentaire: string | null;
}

/** Ce que l'étudiant reçoit, après publication : des moyennes, sans auteur ni commentaire. */
export interface MesMoyennes {
  evaluateurs: number;
  moyennes: Record<string, number | null>;
  moyenne: number | null;
  /** Sa propre évaluation, montrée à part (jamais mêlée aux moyennes). */
  auto: Record<string, number> | null;
}

export interface MomentDeLEtudiant {
  moment: MomentDesPairs;
  etat: EtatDuMoment;
  /** A-t-il rendu une réponse complète ? */
  envoyee: boolean;
  mesReponses: Record<string, MaReponse>;
  /** Ses moyennes, une fois le moment publié ; null avant. */
  resultats: MesMoyennes | null;
}

export interface VueDeLEtudiant {
  gameId: string;
  equipe: string;
  moi: Membre;
  coequipiers: Membre[];
  criteres: CritereDesPairs[];
  autoEvaluation: boolean;
  commentaire: boolean;
  /** Les moments atteints (ouverts ou publiés), du plus ancien au plus récent. */
  moments: MomentDeLEtudiant[];
  /** Partie rangée par l'enseignant : les réponses sont closes. */
  archivee: boolean;
}

/**
 * Tout ce que CET étudiant peut lire de l'évaluation : null s'il n'est pas membre d'une
 * équipe de la partie, si la partie n'est pas de classe, ou si l'évaluation n'est pas
 * active. Aucune donnée d'un autre étudiant n'en sort, hors des noms de ses coéquipiers.
 */
export async function vueDeLEtudiant(gameId: string, userId: string): Promise<VueDeLEtudiant | null> {
  const g = await partie(gameId);
  if (!g || !estUnePartieDeClasse(g)) return null;
  const e = await evaluationDe(gameId);
  if (!e || !e.active) return null;
  const equipe = (await equipesDeLaPartie(gameId)).find((t) => t.membres.some((m) => m.userId === userId));
  if (!equipe) return null;
  const reglages = reglagesDe(e);
  const moi = equipe.membres.find((m) => m.userId === userId)!;
  const coequipiers = equipe.membres.filter((m) => m.userId !== userId);
  const criteres = reglages.criteres.map((c) => c.code);
  const lignesDeMoments = await momentsDe(gameId);

  const moments: MomentDeLEtudiant[] = [];
  for (const moment of reglages.moments) {
    const etat = etatDuMoment(g, moment, lignesDeMoments.find((l) => l.moment === moment)?.publieLe ?? null);
    if (etat === "a-venir") continue;
    const reponses = await reponsesDe(gameId, moment);
    const miennes = reponses.filter((r) => r.evaluateurId === userId);
    const mesReponses = Object.fromEntries(
      miennes.map((r) => [r.evalueId, { notes: r.notes, commentaire: r.commentaire }] as const),
    );
    const envoyee =
      coequipiers.length > 0 &&
      coequipiers.every((c) => criteres.every((k) => noteValable(mesReponses[c.userId]?.notes[k])));
    let resultats: MesMoyennes | null = null;
    if (etat === "publie") {
      // Le calcul de l'équipe, dont on ne garde que SA ligne, et de sa ligne que les
      // moyennes : ni facteur, ni signaux, ni auteurs.
      const calcul = calculerLEquipe({
        membres: equipe.membres.map((m) => m.userId),
        criteres,
        reponses: reponses.map((r) => ({ evaluateur: r.evaluateurId, evalue: r.evalueId, notes: r.notes })),
        autoDansLeFacteur: false,
        bornes: reglages.bornes,
      });
      const mienne = calcul.membres.find((m) => m.userId === userId)!;
      resultats = {
        evaluateurs: mienne.evaluateurs,
        moyennes: mienne.moyennes,
        moyenne: mienne.moyenne,
        auto: reglages.autoEvaluation ? mienne.auto : null,
      };
    }
    moments.push({ moment, etat, envoyee, mesReponses, resultats });
  }
  return {
    gameId,
    equipe: equipe.nom,
    moi,
    coequipiers,
    criteres: reglages.criteres,
    autoEvaluation: reglages.autoEvaluation,
    commentaire: reglages.commentaire,
    moments,
    archivee: g.archivedAt !== null,
  };
}

/** La carte de l'arène : ce qu'il y a à faire ou à lire, en une ligne. Null : rien à montrer. */
export interface CarteDesCoequipiers {
  moment: MomentDesPairs;
  etat: "a-faire" | "envoyee" | "publiee";
  coequipiers: number;
}

export async function carteDeLEtudiant(gameId: string, userId: string): Promise<CarteDesCoequipiers | null> {
  const vue = await vueDeLEtudiant(gameId, userId);
  if (!vue || vue.coequipiers.length === 0) return null;
  // Un moment ouvert passe devant : il y a quelque chose à faire. Sinon, le dernier publié.
  const ouvert = vue.archivee ? undefined : vue.moments.find((m) => m.etat === "ouvert");
  if (ouvert) return { moment: ouvert.moment, etat: ouvert.envoyee ? "envoyee" : "a-faire", coequipiers: vue.coequipiers.length };
  const publie = [...vue.moments].reverse().find((m) => m.etat === "publie");
  if (publie) return { moment: publie.moment, etat: "publiee", coequipiers: vue.coequipiers.length };
  return null;
}

/** La saisie d'un étudiant : pour chaque évalué, ses notes et son commentaire. */
export type SaisieDesReponses = Record<string, { notes: Record<string, string | number>; commentaire?: string }>;

/**
 * Enregistrer (ou modifier) ses réponses pour un moment ouvert. Refusé si l'étudiant n'est
 * pas membre, si le moment n'est pas ouvert (à venir, publié, partie rangée), ou si la
 * saisie n'est pas complète : chaque coéquipier actuel, chaque critère, une note de 1 à 5
 * (et soi-même si l'auto-évaluation est demandée). Tout s'écrit d'un seul ordre.
 */
export async function enregistrerMesReponses(
  gameId: string,
  userId: string,
  moment: MomentDesPairs,
  saisie: SaisieDesReponses,
): Promise<void> {
  const vue = await vueDeLEtudiant(gameId, userId);
  if (!vue) throw new PairsRefusError("membre");
  const m = vue.moments.find((x) => x.moment === moment);
  if (!m || m.etat !== "ouvert" || vue.archivee) throw new PairsRefusError("ferme");
  if (vue.coequipiers.length === 0) throw new PairsRefusError("saisie");
  const g = (await partie(gameId))!;
  const teamId = (
    await db
      .select({ teamId: players.teamId })
      .from(players)
      .innerJoin(teams, eq(teams.id, players.teamId))
      .where(and(eq(players.userId, userId), eq(teams.gameId, g.id)))
  )[0]?.teamId;
  if (!teamId) throw new PairsRefusError("membre");

  const cibles = [...vue.coequipiers.map((c) => c.userId), ...(vue.autoEvaluation ? [userId] : [])];
  const criteres = vue.criteres.map((c) => c.code);
  const lignes = cibles.map((evalueId) => {
    const s = saisie[evalueId];
    if (!s) throw new PairsRefusError("saisie");
    const notes: Record<string, number> = {};
    for (const c of criteres) {
      const v = Number(s.notes[c]);
      if (!noteValable(v)) throw new PairsRefusError("saisie");
      notes[c] = v;
    }
    const commentaire =
      vue.commentaire && evalueId !== userId ? (s.commentaire ?? "").replace(/\s+/g, " ").trim().slice(0, COMMENTAIRE_MAX) : "";
    return { gameId, moment, teamId, evaluateurId: userId, evalueId, notes, commentaire: commentaire || null };
  });
  await db
    .insert(pairsReponses)
    .values(lignes)
    .onConflictDoUpdate({
      target: [pairsReponses.gameId, pairsReponses.moment, pairsReponses.evaluateurId, pairsReponses.evalueId],
      set: {
        teamId: sqlExcluded("team_id"),
        notes: sqlExcluded("notes"),
        commentaire: sqlExcluded("commentaire"),
        updatedAt: new Date(),
      },
    });
}

