import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orientationRequests } from "@/db/schema";
import { OBJECTIFS, diplomesProposes, recommander, type Recommandation, type Semestre } from "@/config/orientation";
import { PERIODICITY_LABELS } from "@/config/scenarios/periodicity";

/**
 * LES DEMANDES DE SIMULATION.
 *
 * Le formulaire de la page d'orientation recueille qui écrit et pour quelle
 * classe ; ce service garde la demande, la relit pour l'administration et la
 * marque traitée. Il compose aussi le texte du courriel de notification : le
 * même contenu que le courriel pré-rempli d'avant, mais rédigé chez nous.
 */

/** Plafonds : cinq demandes par adresse d'origine et par heure, une par e-mail toutes les dix minutes. */
export const PLAFOND_PAR_IP_PAR_HEURE = 5;
export const DELAI_MEME_EMAIL_MS = 10 * 60 * 1000;

export interface DemandeOrientation {
  name: string;
  school: string;
  email: string;
  diplome: string;
  semestre: Semestre;
  objectif: string;
  message: string;
  ip: string | null;
}

export async function deposerDemandeOrientation(
  d: DemandeOrientation,
  now: number = Date.now(),
): Promise<{ id: string; recommandation: Recommandation } | { error: string }> {
  const email = d.email.trim().toLowerCase();
  if (d.ip) {
    const [compte] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(orientationRequests)
      .where(
        and(
          eq(orientationRequests.ip, d.ip),
          gt(orientationRequests.createdAt, new Date(now - 60 * 60 * 1000)),
        ),
      );
    if ((compte?.n ?? 0) >= PLAFOND_PAR_IP_PAR_HEURE) {
      return { error: "Trop de demandes depuis cette connexion : réessayez dans une heure." };
    }
  }
  const recente = await db
    .select({ id: orientationRequests.id })
    .from(orientationRequests)
    .where(
      and(
        eq(orientationRequests.email, email),
        gt(orientationRequests.createdAt, new Date(now - DELAI_MEME_EMAIL_MS)),
      ),
    )
    .limit(1);
  if (recente.length > 0) {
    return { error: "Une demande vient d'être envoyée avec cette adresse : nous vous répondons dessus." };
  }
  const recommandation = recommander({ diplome: d.diplome, semestre: d.semestre, objectif: d.objectif });
  const [ligne] = await db
    .insert(orientationRequests)
    .values({
      name: d.name.trim(),
      school: d.school.trim(),
      email,
      diplome: d.diplome,
      semestre: d.semestre,
      objectif: d.objectif,
      message: d.message.trim(),
      recommendation: recommandation,
      ip: d.ip,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    })
    .returning({ id: orientationRequests.id });
  return { id: ligne!.id, recommandation };
}

export async function marquerCourrielEnvoye(id: string): Promise<void> {
  await db.update(orientationRequests).set({ mailSent: true }).where(eq(orientationRequests.id, id));
}

export interface DemandeOrientationVue {
  id: string;
  name: string;
  school: string;
  email: string;
  diplomeLibelle: string;
  semestreLibelle: string;
  objectifLibelle: string;
  message: string;
  recommandation: Recommandation;
  mailSent: boolean;
  status: "new" | "handled";
  createdAt: Date;
}

const libelleSemestre = (s: string) => (s === "s1" ? "Premier semestre" : "Second semestre");

export async function listerDemandesOrientation(limite = 100): Promise<DemandeOrientationVue[]> {
  const rows = await db
    .select()
    .from(orientationRequests)
    .orderBy(desc(orientationRequests.createdAt))
    .limit(limite);
  const diplomes = diplomesProposes();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    school: r.school,
    email: r.email,
    diplomeLibelle: diplomes.find((x) => x.code === r.diplome)?.libelle ?? r.diplome,
    semestreLibelle: libelleSemestre(r.semestre),
    objectifLibelle: OBJECTIFS.find((o) => o.code === r.objectif)?.libelle ?? r.objectif,
    message: r.message,
    recommandation: r.recommendation as Recommandation,
    mailSent: r.mailSent,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export async function marquerDemandeTraitee(id: string, adminId: string): Promise<void> {
  await db
    .update(orientationRequests)
    .set({ status: "handled", handledBy: adminId, handledAt: new Date(), updatedAt: new Date() })
    .where(eq(orientationRequests.id, id));
}

/** Le courriel de notification : ce que l'enseignant a écrit, et ce que la page lui a conseillé. */
export function texteDuCourriel(d: DemandeOrientation, reco: Recommandation): { sujet: string; texte: string } {
  const diplome = diplomesProposes().find((x) => x.code === d.diplome)?.libelle ?? d.diplome;
  const objectif = OBJECTIFS.find((o) => o.code === d.objectif)?.libelle ?? d.objectif;
  const periodicite = PERIODICITY_LABELS[reco.periodicite].singular.toLowerCase();
  const texte = [
    `Demande de simulation reçue depuis business-arena.fr/orientation.`,
    "",
    `De : ${d.name.trim()} · ${d.school.trim()}`,
    `E-mail : ${d.email.trim()}`,
    "",
    `Diplôme : ${diplome}`,
    `Moment de l'année : ${libelleSemestre(d.semestre).toLowerCase()}`,
    `Objectif : ${objectif}`,
    "",
    "Recommandation de la page :",
    `· Entreprise : ${reco.scenarioTitre}`,
    `· Niveau ${reco.niveau} · ${reco.niveauNom}`,
    `· ${reco.tours} tours, un ${periodicite} par tour`,
    reco.atelierCode ? `· Atelier : ${reco.atelierCode}` : "· Aucun atelier publié pour ce diplôme",
    "",
    "Ce que l'enseignant cherche :",
    d.message.trim() || "(rien d'ajouté)",
  ].join("\n");
  return { sujet: `Choix d'une simulation · ${d.school.trim()}`, texte };
}
