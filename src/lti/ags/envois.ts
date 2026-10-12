import { and, eq, inArray, isNotNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  examenCandidats,
  examens,
  games,
  ltiLiens,
  ltiNotesEleves,
  ltiNotesEnvois,
  ltiPlateformes,
  players,
  teams,
} from "@/db/schema";
import { authSecret } from "@/lib/auth-secret";
import { chiffrer, dechiffrer } from "@/lib/chiffrement";
import type { ClesDeLOutil } from "../cles";
import { urlDePlateformeAdmise } from "../reseau";
import { TYPE } from "./constantes";
import { JetonRefuse, jetonDeService, oublierLeJeton, type PosterFormulaire } from "./jeton";
import {
  accordeLesNotes,
  adresseDesColonnes,
  adresseDesNotes,
  choisirLaColonne,
  colonneACreer,
  COMMENTAIRE_DU_RETRAIT,
  commentaireDeLExamen,
  issueDeLEnvoi,
  majuscule,
  natureVoulueDeLaPartie,
  natureVoulueDeLExamen,
  nomDeLaPlateforme,
  porteesDuJeton,
  scoreAgs,
  type ColonneLue,
  type Issue,
  type Nature,
} from "./regles";
import { requeteAgs, type RequeteAgs } from "./transport";

/**
 * LE RETOUR DES NOTES, APPLIQUÉ : qui doit recevoir quoi (regles.ts), le journal d'envoi,
 * et l'envoi lui-même, toujours HORS de la requête de l'enseignant (`plus-tard.ts`).
 *
 *   1. AU LANCEMENT d'un élève, si la plateforme accorde le retour des notes à
 *      l'activité, son identifiant chez elle (`sub`) est gardé, chiffré : c'est l'adresse
 *      de sa note (`retenirLEleve`).
 *   2. À LA PUBLICATION, au retrait, à la fin d'une partie, ou quand l'enseignant le
 *      demande, la ligne du journal de chaque élève dit ce qui doit partir ; seule une
 *      ligne qui CHANGE repart (`preparer…`), sauf au renvoi demandé.
 *   3. L'ENVOI : un jeton par plateforme (jeton.ts, en cache), la colonne (celle de la
 *      plateforme, sinon celle de l'outil, créée une fois), puis une note par élève. Une
 *      erreur temporaire se retente aussitôt, deux fois, puis plus tard, à la prochaine
 *      lecture de la page de l'examen ; une erreur définitive attend « Renvoyer les
 *      notes ». Chaque essai laisse sa trace : état, date, code HTTP, message, essais.
 *
 * Deux envois simultanés ne se marchent pas dessus : une ligne se PREND (état « envoi »)
 * par une écriture conditionnelle avant de partir, et une prise de plus de deux minutes
 * passe pour abandonnée.
 */

/** Les essais immédiats après le premier, et leur attente. */
export const ATTENTES_PAR_DEFAUT_MS: readonly number[] = [2_000, 6_000];
/** Le nombre d'essais au-delà duquel une erreur temporaire n'est plus retentée seule. */
export const ESSAIS_MAX = 9;
/** L'attente avant un nouvel essai, après une série d'erreurs temporaires. */
export const REPRISE_APRES_MS = 10 * 60_000;
/** Une ligne « en cours d'envoi » depuis plus longtemps est abandonnée, donc reprise. */
const ENVOI_ABANDONNE_MS = 2 * 60_000;

export interface Reglages {
  requete?: RequeteAgs;
  poster?: PosterFormulaire;
  cles?: ClesDeLOutil;
  attentesMs?: readonly number[];
  maintenant?: () => Date;
}

const secretDesIdentifiants = () => `lti-ags:${authSecret()}`;

export type LigneDEnvoi = typeof ltiNotesEnvois.$inferSelect;
type Lien = typeof ltiLiens.$inferSelect;

/* ---------------------------------------------------------------------------
 * 1. AU LANCEMENT.
 * ------------------------------------------------------------------------- */

/** Garder l'identifiant de l'élève, chiffré, si l'activité accorde le retour des notes. */
export async function retenirLEleve(args: {
  lienId: string;
  userId: string;
  sub: string;
  portees: readonly string[] | null | undefined;
}): Promise<boolean> {
  if (!accordeLesNotes(args.portees)) return false;
  const subChiffre = chiffrer(args.sub, secretDesIdentifiants());
  await db
    .insert(ltiNotesEleves)
    .values({ lienId: args.lienId, userId: args.userId, subChiffre })
    .onConflictDoUpdate({
      target: [ltiNotesEleves.lienId, ltiNotesEleves.userId],
      set: { subChiffre, updatedAt: new Date() },
    });
  return true;
}

/* ---------------------------------------------------------------------------
 * 2. CE QUI DOIT PARTIR.
 * ------------------------------------------------------------------------- */

interface Cible {
  lienId: string;
  userId: string;
  ressource: string;
  nature: Nature;
  note: number | null;
  commentaire: string | null;
}

export const ressourceDeLExamen = (examenId: string) => `examen:${examenId}`;
export const ressourceDeLaPartie = (gameId: string) => `partie:${gameId}`;

async function journalDesLiens(lienIds: string[]): Promise<Map<string, LigneDEnvoi>> {
  if (lienIds.length === 0) return new Map();
  const lignes = await db.select().from(ltiNotesEnvois).where(inArray(ltiNotesEnvois.lienId, lienIds));
  return new Map(lignes.map((l) => [`${l.lienId}|${l.userId}`, l]));
}

async function elevesDesLiens(lienIds: string[]) {
  if (lienIds.length === 0) return [];
  return db
    .select({ lienId: ltiNotesEleves.lienId, userId: ltiNotesEleves.userId })
    .from(ltiNotesEleves)
    .where(inArray(ltiNotesEleves.lienId, lienIds));
}

/** Les activités LTI reliées à cet examen. */
async function liensDeLExamen(examenId: string): Promise<Lien[]> {
  return db
    .select()
    .from(ltiLiens)
    .where(and(eq(ltiLiens.examenId, examenId), eq(ltiLiens.cibleType, "examen")));
}

/** La copie retenue de chaque candidat : sa dernière remise. */
async function copiesRetenues(examenId: string, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, typeof examenCandidats.$inferSelect>();
  const lignes = await db
    .select()
    .from(examenCandidats)
    .where(
      and(
        eq(examenCandidats.examenId, examenId),
        inArray(examenCandidats.userId, userIds),
        isNotNull(examenCandidats.remisLe),
      ),
    );
  const retenue = new Map<string, (typeof lignes)[number]>();
  for (const c of lignes) {
    const deja = retenue.get(c.userId);
    if (!deja || c.tentative > deja.tentative) retenue.set(c.userId, c);
  }
  return retenue;
}

async function ciblesDeLExamen(examenId: string): Promise<Cible[]> {
  const [examen] = await db.select().from(examens).where(eq(examens.id, examenId));
  if (!examen) return [];
  const liens = (await liensDeLExamen(examenId)).filter((l) => accordeLesNotes(l.agsPortees));
  const lienIds = liens.map((l) => l.id);
  const eleves = await elevesDesLiens(lienIds);
  const [copies, journal] = await Promise.all([
    copiesRetenues(examenId, [...new Set(eleves.map((e) => e.userId))]),
    journalDesLiens(lienIds),
  ]);
  const ressource = ressourceDeLExamen(examenId);
  const commentaire = commentaireDeLExamen(examen.grille as { nom?: unknown; version?: unknown });
  const cibles: Cible[] = [];
  for (const e of eleves) {
    const copie = copies.get(e.userId);
    const ligne = journal.get(`${e.lienId}|${e.userId}`);
    const nature = natureVoulueDeLExamen({
      publie: examen.publieLe !== null,
      remise: !!copie,
      note: copie?.note ?? null,
      deja: ligne && ligne.ressource === ressource ? ligne.nature : null,
    });
    if (!nature) continue;
    cibles.push({
      lienId: e.lienId,
      userId: e.userId,
      ressource,
      nature,
      note: nature === "note" ? copie!.note : null,
      commentaire: nature === "note" ? commentaire : COMMENTAIRE_DU_RETRAIT,
    });
  }
  return cibles;
}

async function ciblesDeLaPartie(gameId: string): Promise<Cible[]> {
  const [partie] = await db.select({ statut: games.status }).from(games).where(eq(games.id, gameId));
  if (!partie) return [];
  // La progression ne va que dans une colonne créée par la plateforme (regles.ts).
  const liens = (
    await db.select().from(ltiLiens).where(and(eq(ltiLiens.gameId, gameId), eq(ltiLiens.cibleType, "partie")))
  ).filter((l) => accordeLesNotes(l.agsPortees) && l.agsLineitem);
  const eleves = await elevesDesLiens(liens.map((l) => l.id));
  if (eleves.length === 0) return [];
  const joueurs = new Set(
    (
      await db
        .select({ userId: players.userId })
        .from(players)
        .innerJoin(teams, eq(teams.id, players.teamId))
        .where(and(eq(teams.gameId, gameId), inArray(players.userId, eleves.map((e) => e.userId))))
    ).map((j) => j.userId),
  );
  const ressource = ressourceDeLaPartie(gameId);
  const cibles: Cible[] = [];
  for (const e of eleves) {
    const nature = natureVoulueDeLaPartie({ joueur: joueurs.has(e.userId), terminee: partie.statut === "finished" });
    if (nature) cibles.push({ lienId: e.lienId, userId: e.userId, ressource, nature, note: null, commentaire: null });
  }
  return cibles;
}

/**
 * Poser les cibles au journal : une ligne neuve ou CHANGÉE repart (essais remis à zéro) ;
 * une ligne identique reste telle quelle, sauf `forcer` (le bouton « Renvoyer les notes »).
 * Rend le nombre de lignes à envoyer.
 */
async function poser(cibles: Cible[], { forcer = false, maintenant = new Date() } = {}): Promise<number> {
  if (cibles.length === 0) return 0;
  const journal = await journalDesLiens([...new Set(cibles.map((c) => c.lienId))]);
  let n = 0;
  for (const c of cibles) {
    const l = journal.get(`${c.lienId}|${c.userId}`);
    const identique = !!l && l.ressource === c.ressource && l.nature === c.nature && l.note === c.note;
    if (identique && !forcer) continue;
    // Un envoi en cours de cette même ligne finit son travail.
    if (identique && l!.etat === "envoi" && l!.dernierEssai && maintenant.getTime() - l!.dernierEssai.getTime() < ENVOI_ABANDONNE_MS) {
      continue;
    }
    const valeurs = {
      ressource: c.ressource,
      nature: c.nature,
      note: c.note,
      commentaire: c.commentaire,
      etat: "a-envoyer" as const,
      temporaire: false,
      codeHttp: null,
      message: null,
      essais: 0,
      prochainEssai: null,
      updatedAt: maintenant,
    };
    await db
      .insert(ltiNotesEnvois)
      .values({ lienId: c.lienId, userId: c.userId, ...valeurs })
      .onConflictDoUpdate({ target: [ltiNotesEnvois.lienId, ltiNotesEnvois.userId], set: valeurs });
    n += 1;
  }
  return n;
}

/** Poser au journal ce que l'examen doit envoyer (publication, retrait, renvoi). Sans réseau. */
export async function preparerLesNotesDeLExamen(examenId: string, options: { forcer?: boolean } = {}): Promise<number> {
  return poser(await ciblesDeLExamen(examenId), options);
}

/** Poser au journal la progression des élèves d'une partie de classe. Sans réseau. */
export async function preparerLaProgressionDeLaPartie(gameId: string): Promise<number> {
  return poser(await ciblesDeLaPartie(gameId));
}

/** Préparer puis envoyer : à appeler hors de la requête (`plusTard`). */
export async function synchroniserLesNotesDeLExamen(
  examenId: string,
  options: Reglages & { forcer?: boolean } = {},
): Promise<void> {
  await preparerLesNotesDeLExamen(examenId, options);
  await envoyerCeQuiAttend(ressourceDeLExamen(examenId), options);
}

export async function synchroniserLaPartie(gameId: string, options: Reglages = {}): Promise<void> {
  await preparerLaProgressionDeLaPartie(gameId);
  await envoyerCeQuiAttend(ressourceDeLaPartie(gameId), options);
}

/* ---------------------------------------------------------------------------
 * 3. L'ENVOI.
 * ------------------------------------------------------------------------- */

/** Une ligne qui peut partir : à envoyer, en erreur temporaire échue, ou abandonnée. */
const prenable = (maintenant: Date) =>
  or(
    eq(ltiNotesEnvois.etat, "a-envoyer"),
    and(
      eq(ltiNotesEnvois.etat, "erreur"),
      eq(ltiNotesEnvois.temporaire, true),
      lt(ltiNotesEnvois.essais, ESSAIS_MAX),
      lte(ltiNotesEnvois.prochainEssai, maintenant),
    ),
    and(eq(ltiNotesEnvois.etat, "envoi"), lt(ltiNotesEnvois.dernierEssai, new Date(maintenant.getTime() - ENVOI_ABANDONNE_MS))),
  );

/** Envoyer ce qui attend pour cette ressource (« examen:<id> », « partie:<id> »). */
export async function envoyerCeQuiAttend(ressource: string, reglages: Reglages = {}): Promise<void> {
  const maintenant = (reglages.maintenant ?? (() => new Date()))();
  const lignes = await db
    .select({ id: ltiNotesEnvois.id, lienId: ltiNotesEnvois.lienId })
    .from(ltiNotesEnvois)
    .where(and(eq(ltiNotesEnvois.ressource, ressource), prenable(maintenant)));
  const parLien = new Map<string, string[]>();
  for (const l of lignes) parLien.set(l.lienId, [...(parLien.get(l.lienId) ?? []), l.id]);
  for (const [lienId, ids] of parLien) {
    try {
      await envoyerPourLeLien(lienId, ids, ressource, reglages);
    } catch (e) {
      console.error("[lti-notes] envoi interrompu :", e instanceof Error ? e.message : e);
    }
  }
}

interface Echec {
  statut: number | "reseau" | null;
  issue: Issue;
}

async function envoyerPourLeLien(lienId: string, ids: string[], ressource: string, reglages: Reglages): Promise<void> {
  const maintenant = reglages.maintenant ?? (() => new Date());
  const requete = reglages.requete ?? requeteAgs;
  const attentes = reglages.attentesMs ?? ATTENTES_PAR_DEFAUT_MS;

  // Prendre les lignes : une écriture conditionnelle, une seule prise par ligne.
  const prises: LigneDEnvoi[] = [];
  for (const id of ids) {
    const t = maintenant();
    const [prise] = await db
      .update(ltiNotesEnvois)
      .set({ etat: "envoi", dernierEssai: t, updatedAt: t })
      .where(and(eq(ltiNotesEnvois.id, id), prenable(t)))
      .returning();
    if (prise) prises.push(prise);
  }
  if (prises.length === 0) return;

  const echouer = async (lignes: LigneDEnvoi[], e: Echec, essaisEnPlus = 1) => {
    const t = maintenant();
    for (const l of lignes) {
      await db
        .update(ltiNotesEnvois)
        .set({
          etat: "erreur",
          temporaire: e.issue.temporaire,
          codeHttp: typeof e.statut === "number" ? e.statut : null,
          message: e.issue.message,
          essais: sql`${ltiNotesEnvois.essais} + ${essaisEnPlus}`,
          prochainEssai: e.issue.temporaire ? new Date(t.getTime() + REPRISE_APRES_MS) : null,
          updatedAt: t,
        })
        .where(eq(ltiNotesEnvois.id, l.id));
    }
  };

  const [lp] = await db
    .select({ lien: ltiLiens, plateforme: ltiPlateformes })
    .from(ltiLiens)
    .innerJoin(ltiPlateformes, eq(ltiPlateformes.id, ltiLiens.plateformeId))
    .where(eq(ltiLiens.id, lienId));
  if (!lp) return;
  const { lien, plateforme } = lp;
  const nom = nomDeLaPlateforme(plateforme.nom);
  const P = majuscule(nom);
  const definitif = (message: string): Echec => ({ statut: null, issue: { ok: false, temporaire: false, message } });

  if (!plateforme.actif) return echouer(prises, definitif("La connexion à cette plateforme est désactivée dans Business Arena."));
  if (!accordeLesNotes(lien.agsPortees)) {
    return echouer(prises, definitif(`${P} n'accorde plus le retour des notes à cette activité.`));
  }

  // LE JETON.
  const portees = porteesDuJeton(lien.agsPortees ?? []);
  const jeton = async (): Promise<string | Echec> => {
    try {
      return await jetonDeService({ plateforme, portees, poster: reglages.poster, cles: reglages.cles, maintenant: () => maintenant().getTime() });
    } catch (e) {
      const statut = e instanceof JetonRefuse ? e.statut : "reseau";
      const issue = issueDeLEnvoi(statut, nom);
      return {
        statut,
        issue: issue.temporaire
          ? issue
          : { ...issue, message: `${P} a refusé l'accès au carnet de notes (erreur ${statut}). Vérifiez que l'outil peut y renvoyer les notes.` },
      };
    }
  };
  let acces = await jeton();
  if (typeof acces !== "string") return echouer(prises, acces);

  // LA COLONNE.
  const colonne = await colonneDuLien(lien, ressource, acces, requete, nom);
  if ("echec" in colonne) return echouer(prises, colonne.echec);

  // LES NOTES, une par élève.
  const eleves = new Map(
    (
      await db
        .select()
        .from(ltiNotesEleves)
        .where(and(eq(ltiNotesEleves.lienId, lienId), inArray(ltiNotesEleves.userId, prises.map((p) => p.userId))))
    ).map((e) => [e.userId, e]),
  );
  const adresse = adresseDesNotes(colonne.url);
  for (const ligne of prises) {
    const chiffre = eleves.get(ligne.userId)?.subChiffre;
    const sub = chiffre ? dechiffrer(chiffre, secretDesIdentifiants()) : null;
    if (!sub) {
      await echouer(
        [ligne],
        definitif("L'identifiant de cet élève n'est plus lisible : qu'il rouvre l'activité depuis son cours, puis renvoyez les notes."),
      );
      continue;
    }
    let essais = 0;
    let jetonRenouvele = false;
    for (let k = 0; ; k += 1) {
      const score = scoreAgs({ sub, nature: ligne.nature, note: ligne.note, commentaire: ligne.commentaire, maintenant: maintenant() });
      const r = await requete({ methode: "POST", url: adresse, jeton: acces, type: TYPE.score, corps: score });
      essais += 1;
      // Un jeton refusé (révoqué, expiré plus tôt que prévu) : un neuf, une fois.
      if (r.statut === 401 && !jetonRenouvele) {
        jetonRenouvele = true;
        oublierLeJeton(plateforme.id, portees);
        const neuf = await jeton();
        if (typeof neuf === "string") {
          acces = neuf;
          k -= 1;
          continue;
        }
      }
      const issue = issueDeLEnvoi(r.statut, nom);
      const t = maintenant();
      if (issue.ok) {
        await db
          .update(ltiNotesEnvois)
          .set({
            etat: "envoye",
            temporaire: false,
            codeHttp: r.statut as number,
            message: null,
            essais: sql`${ltiNotesEnvois.essais} + ${essais}`,
            envoyeLe: t,
            prochainEssai: null,
            updatedAt: t,
          })
          .where(eq(ltiNotesEnvois.id, ligne.id));
        break;
      }
      if (!issue.temporaire || k >= attentes.length) {
        // Une colonne de l'outil disparue chez la plateforme : on l'oublie, le prochain
        // envoi en créera (ou en retrouvera) une.
        if (r.statut === 404 && colonne.quoi !== "plateforme") {
          await db.update(ltiLiens).set({ agsLineitemCree: null, agsRessource: null }).where(eq(ltiLiens.id, lien.id));
        }
        await echouer([ligne], { statut: r.statut, issue }, essais);
        break;
      }
      await new Promise((ok) => setTimeout(ok, attentes[k]));
    }
  }
}

/**
 * LA COLONNE de cette activité pour cette ressource (regles.ts, `choisirLaColonne`) :
 * lue chez la plateforme, ou créée, une fois, et retenue sur l'activité.
 */
async function colonneDuLien(
  lien: Lien,
  ressource: string,
  jeton: string,
  requete: RequeteAgs,
  nom: string,
): Promise<{ url: string; quoi: string } | { echec: Echec }> {
  const P = majuscule(nom);
  const [type, id] = ressource.split(":") as [string, string];
  const base = {
    colonneDeLaPlateforme: lien.agsLineitem,
    colonneCreee: { url: lien.agsLineitemCree, ressource: lien.agsRessource },
    ressource,
    resourceLinkId: lien.resourceLinkId,
    colonnes: lien.agsLineitems,
    portees: lien.agsPortees ?? [],
    creerPermis: type === "examen",
  };
  let choix = choisirLaColonne({ ...base, existantes: null });
  if (choix.quoi === "lire") {
    const r = await requete({
      methode: "GET",
      url: adresseDesColonnes(lien.agsLineitems!, { resourceLinkId: lien.resourceLinkId, resourceId: ressource }),
      jeton,
      accepte: TYPE.colonnes,
    });
    const issue = issueDeLEnvoi(r.statut, nom);
    if (!issue.ok && issue.temporaire) return { echec: { statut: r.statut, issue } };
    const existantes = issue.ok && Array.isArray(r.json) ? (r.json as ColonneLue[]) : [];
    choix = choisirLaColonne({ ...base, existantes });
  }
  if (choix.quoi === "lire") choix = { quoi: "aucune", raison: "pas-de-colonne" };
  if (choix.quoi === "aucune") {
    return {
      echec: {
        statut: null,
        issue: {
          ok: false,
          temporaire: false,
          message:
            choix.raison === "pas-d-adresse"
              ? `${P} n'a pas donné l'adresse des colonnes de notes du cours.`
              : `${P} n'a pas de colonne de notes pour cette activité et ne permet pas à l'outil d'en créer une.`,
        },
      },
    };
  }
  if (choix.quoi === "creer") {
    const [examen] = await db.select({ nom: examens.nom }).from(examens).where(eq(examens.id, id));
    const r = await requete({
      methode: "POST",
      url: lien.agsLineitems!,
      jeton,
      type: TYPE.colonne,
      accepte: TYPE.colonne,
      corps: colonneACreer({ nom: examen?.nom ?? "Examen", ressource, resourceLinkId: lien.resourceLinkId }),
    });
    const issue = issueDeLEnvoi(r.statut, nom);
    const url = (r.json as { id?: unknown } | null)?.id;
    if (!issue.ok || typeof url !== "string" || !urlDePlateformeAdmise(url)) {
      return {
        echec: {
          statut: r.statut,
          issue: issue.ok
            ? { ok: false, temporaire: false, message: `${P} n'a pas rendu l'adresse de la colonne créée.` }
            : issue.temporaire
              ? issue
              : { ...issue, message: `${P} a refusé la création de la colonne de notes (erreur ${r.statut}).` },
        },
      };
    }
    await db.update(ltiLiens).set({ agsLineitemCree: url, agsRessource: ressource, updatedAt: new Date() }).where(eq(ltiLiens.id, lien.id));
    return { url, quoi: "creee" };
  }
  if (choix.quoi === "trouvee") {
    await db
      .update(ltiLiens)
      .set({ agsLineitemCree: choix.url, agsRessource: ressource, updatedAt: new Date() })
      .where(eq(ltiLiens.id, lien.id));
  }
  return { url: choix.url, quoi: choix.quoi };
}

/**
 * APRÈS LE LANCEMENT D'UN ÉLÈVE (ou son entrée dans l'équipe) : une partie de classe dont
 * la plateforme a créé la colonne reçoit sa progression. Rien pour un examen : sa note
 * n'attend que la publication.
 */
export async function apresLeLancement(lienId: string, reglages: Reglages = {}): Promise<void> {
  const [lien] = await db.select().from(ltiLiens).where(eq(ltiLiens.id, lienId));
  if (lien?.cibleType !== "partie" || !lien.gameId || !lien.agsLineitem || !accordeLesNotes(lien.agsPortees)) return;
  await synchroniserLaPartie(lien.gameId, reglages);
}
