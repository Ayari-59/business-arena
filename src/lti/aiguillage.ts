import { eq } from "drizzle-orm";
import { db } from "@/db";
import { episodeCohortes, games } from "@/db/schema";
import { setGuestCookie } from "@/lib/guest";
import { clearSession, setSession } from "@/lib/session";
import { joinGameByCode } from "@/services/game.service";
import { rejoindreCohorte } from "@/services/cohortes.service";
import { compteEleve, compteEnseignant, PlafondAtteint } from "./comptes";
import { poserContexte, type ContexteLti } from "./contexte";
import type { Lancement } from "./lancement";
import { lienDuLancement, lienSansCibleOrpheline, relierDepuisLaSelection } from "./liens";

/**
 * OÙ MÈNE UN LANCEMENT VÉRIFIÉ.
 *
 *   · ENSEIGNANT : sa session (compte rattaché à l'organisation de la plateforme). Une
 *     activité qu'il a reliée le mène au pilotage de sa partie ou de sa cohorte ; une
 *     activité à configurer, à l'écran de choix.
 *   · ÉLÈVE : son identité invitée (le cookie de l'entrée par code), et la session
 *     enseignant éventuellement ouverte sur ce poste est fermée : c'est l'élève qui est
 *     au clavier. Une activité reliée à une partie l'y fait entrer, réparti dans une
 *     équipe comme par /join (s'il a déjà un prénom) ; à une cohorte, l'y inscrit.
 *     Sinon, l'écran d'attente ou celui du prénom.
 *
 * Le résultat est une DESCRIPTION (chemin et cookies) : la route l'applique tout de
 * suite, ou la confie à un ticket quand le lancement est arrivé dans une iframe et doit
 * se rouvrir dans une nouvelle fenêtre.
 */

export interface Aiguillage {
  chemin: string;
  session?: { userId: string; v: number };
  invite?: string;
  effacerSession?: boolean;
  contexte?: Omit<ContexteLti, "exp">;
}

async function codeDeLaPartie(gameId: string): Promise<string | null> {
  return (await db.select({ c: games.joinCode }).from(games).where(eq(games.id, gameId)))[0]?.c ?? null;
}

async function codeDeLaCohorte(cohorteId: string): Promise<string | null> {
  return (
    (await db.select({ c: episodeCohortes.code }).from(episodeCohortes).where(eq(episodeCohortes.id, cohorteId)))[0]
      ?.c ?? null
  );
}

/** Faire entrer l'élève dans la cible de l'activité ; le chemin d'arrivée, ou null. */
export async function entrerDansLaCible(args: {
  userId: string;
  pseudo: string;
  cibleType: string | null;
  gameId: string | null;
  cohorteId: string | null;
}): Promise<string | null> {
  if (args.cibleType === "partie" && args.gameId) {
    const code = await codeDeLaPartie(args.gameId);
    if (!code) return null;
    const r = await joinGameByCode({ code, userId: args.userId, pseudo: args.pseudo });
    return "gameId" in r ? `/arena/${r.gameId}` : null;
  }
  if (args.cibleType === "cohorte" && args.cohorteId) {
    const code = await codeDeLaCohorte(args.cohorteId);
    if (!code) return null;
    const r = await rejoindreCohorte(args.userId, code);
    return r.ok ? "/entreprises/episode/profil?bienvenue=1" : null;
  }
  return null;
}

export async function aiguiller(l: Lancement): Promise<Aiguillage> {
  const p = l.plateforme;
  if (l.role === "enseignant") {
    let compte: { userId: string; sessionVersion: number };
    try {
      compte = await compteEnseignant(l);
    } catch (e) {
      if (e instanceof PlafondAtteint) return { chemin: "/lti/refus?motif=plafond" };
      throw e;
    }
    let lien = await lienSansCibleOrpheline(await lienDuLancement(l));
    lien = await relierDepuisLaSelection(lien, l);
    const sien = lien.cibleType !== null && lien.configurePar === compte.userId;
    const chemin = !sien
      ? "/lti/activite"
      : lien.cibleType === "partie"
        ? `/teacher/games/${lien.gameId}`
        : `/teacher/cohortes/${lien.cohorteId}`;
    return {
      chemin,
      session: { userId: compte.userId, v: compte.sessionVersion },
      contexte: { u: compte.userId, p: p.id, r: "enseignant", l: lien.id },
    };
  }

  const { userId, pseudo } = await compteEleve(l);
  let lien = await lienSansCibleOrpheline(await lienDuLancement(l));
  lien = await relierDepuisLaSelection(lien, l);
  const base = {
    invite: userId,
    effacerSession: true,
    contexte: { u: userId, p: p.id, r: "eleve" as const, l: lien.id },
  };
  // La cohorte n'a pas besoin de prénom : ses vues sont agrégées, sans nom.
  if (lien.cibleType === "cohorte" || (lien.cibleType === "partie" && pseudo)) {
    const arrivee = await entrerDansLaCible({ userId, pseudo: pseudo ?? "", ...lien });
    if (arrivee) return { ...base, chemin: arrivee };
  }
  return { ...base, chemin: "/lti/eleve" };
}

/** Pose les cookies décrits par l'aiguillage (route de lancement ou d'ouverture). */
export async function appliquerAiguillage(a: Aiguillage): Promise<void> {
  if (a.effacerSession) await clearSession();
  if (a.session) await setSession(a.session.userId, "teacher", a.session.v);
  if (a.invite) await setGuestCookie(a.invite);
  if (a.contexte) await poserContexte(a.contexte);
}
