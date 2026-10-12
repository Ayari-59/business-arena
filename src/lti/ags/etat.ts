import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { examenCandidats, examens, ltiLiens, ltiNotesEleves, ltiNotesEnvois, ltiPlateformes } from "@/db/schema";
import { accordeLesNotes, nomDeLaPlateforme } from "./regles";
import { ressourceDeLExamen } from "./envois";
import type { EtatDuRetour } from "./textes";

/**
 * L'ÉTAT DU RETOUR DES NOTES D'UN EXAMEN, lu du journal d'envoi : l'encart de
 * /teacher/examens/[id]. Null : aucune activité de plateforme n'ouvre cet examen, et
 * l'encart ne se montre pas.
 */
export async function etatDuRetourDesNotes(examenId: string): Promise<EtatDuRetour | null> {
  const liens = await db
    .select({ lien: ltiLiens, nom: ltiPlateformes.nom })
    .from(ltiLiens)
    .innerJoin(ltiPlateformes, eq(ltiPlateformes.id, ltiLiens.plateformeId))
    .where(and(eq(ltiLiens.examenId, examenId), eq(ltiLiens.cibleType, "examen")));
  if (liens.length === 0) return null;
  const [examen] = await db.select({ publieLe: examens.publieLe }).from(examens).where(eq(examens.id, examenId));
  if (!examen) return null;
  const publie = examen.publieLe !== null;
  const avecNotes = liens.filter((l) => accordeLesNotes(l.lien.agsPortees));
  const noms = [...new Set((avecNotes.length ? avecNotes : liens).map((l) => nomDeLaPlateforme(l.nom)))];
  const plateforme = noms.length === 1 ? noms[0]! : "la plateforme de cours";
  const base: EtatDuRetour = {
    plateforme,
    accorde: avecNotes.length > 0,
    publie,
    attendues: 0,
    envoyees: 0,
    enCours: 0,
    erreurs: [],
    sansAdresse: 0,
    sansNote: 0,
  };
  if (avecNotes.length === 0) return base;

  const lienIds = avecNotes.map((l) => l.lien.id);
  const lignes = await db
    .select()
    .from(ltiNotesEnvois)
    .where(and(inArray(ltiNotesEnvois.lienId, lienIds), eq(ltiNotesEnvois.ressource, ressourceDeLExamen(examenId))));
  const presentes = lignes.filter((l) => l.nature === (publie ? "note" : "retrait"));
  const erreurs = new Map<string, { message: string; n: number; temporaire: boolean }>();
  for (const l of presentes) {
    if (l.etat !== "erreur") continue;
    const message = l.message ?? "Erreur inconnue.";
    const e = erreurs.get(message) ?? { message, n: 0, temporaire: l.temporaire };
    e.n += 1;
    erreurs.set(message, e);
  }

  // Les copies retenues des candidats venus de la plateforme.
  const copies = await db
    .select({ userId: examenCandidats.userId, tentative: examenCandidats.tentative, note: examenCandidats.note, notation: examenCandidats.notation })
    .from(examenCandidats)
    .where(and(eq(examenCandidats.examenId, examenId), eq(examenCandidats.identification, "lti"), isNotNull(examenCandidats.remisLe)));
  const retenues = new Map<string, (typeof copies)[number]>();
  for (const c of copies) if ((retenues.get(c.userId)?.tentative ?? 0) < c.tentative) retenues.set(c.userId, c);
  const connus = new Set(
    retenues.size === 0
      ? []
      : (
          await db
            .select({ userId: ltiNotesEleves.userId })
            .from(ltiNotesEleves)
            .where(and(inArray(ltiNotesEleves.lienId, lienIds), inArray(ltiNotesEleves.userId, [...retenues.keys()])))
        ).map((e) => e.userId),
  );
  let sansAdresse = 0;
  let sansNote = 0;
  for (const [userId, c] of retenues) {
    const notee = c.note !== null;
    if (!connus.has(userId) && notee) sansAdresse += 1;
    if (connus.has(userId) && !notee && c.notation) sansNote += 1;
  }

  return {
    ...base,
    attendues: presentes.length,
    envoyees: presentes.filter((l) => l.etat === "envoye").length,
    enCours: presentes.filter((l) => l.etat === "a-envoyer" || l.etat === "envoi").length,
    erreurs: [...erreurs.values()],
    sansAdresse,
    sansNote,
  };
}

/** Des envois attendent-ils encore (la page se relit alors d'elle-même) ? */
export const envoisEnCours = (e: EtatDuRetour | null): boolean => !!e && e.enCours > 0;
