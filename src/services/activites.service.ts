import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coursActivites, coursClasses, coursEleves } from "@/db/schema";
import { BUREAUX, type Bureau } from "@/config/cours/bureaux";
import { ENQUETES } from "@/config/cours/enquetes";
import { SCENARIOS, type Scenario } from "@/config/cours/scenarios";
import { parcoursQuiOuvrent } from "@/config/cours/parcours-de-formation";
import type { RetourDuBureau } from "@/pedagogy/cours/bureau-servi";
import type { RetourDuScenario } from "@/pedagogy/cours/scenario-servi";
import {
  suivreLeBureau,
  suivreLeScenario,
  vueDesActivites,
  type ActiviteDecrite,
  type NatureDActivite,
  type SuiviDActivite,
  type SuiviLu,
} from "@/pedagogy/cours/suivi-des-activites";

/**
 * LE SUIVI DES ACTIVITÉS EN CLASSE (migration 0057) : le bureau, l'enquête et le scénario.
 *
 * L'ÉCRITURE vient de l'action serveur qui corrige (app/cours/{bureau,enquete,scenario}/actions.ts),
 * après la correction, avec le retour qu'elle vient de calculer : jamais un état envoyé par le
 * navigateur. L'élève est celui du cookie d'invité ; sans classe, rien ne s'écrit. La règle du suivi
 * est pure (pedagogy/cours/suivi-des-activites.ts) ; ici, la lecture et l'écriture de la ligne.
 *
 * LA LECTURE est celle de l'enseignant de la classe, et de lui seul, comme pour les chapitres
 * (`classeDeLEnseignant`, services/cours.service.ts).
 */

export type GesteCorrige =
  | { nature: "bureau" | "enquete"; activite: Bureau; envoi: unknown; retour: RetourDuBureau }
  | { nature: "scenario"; activite: Scenario; envoi: unknown; retour: RetourDuScenario };

/** La classe que l'élève suit, s'il en suit une. */
async function classeDe(userId: string): Promise<string | null> {
  const [m] = await db.select({ classeId: coursEleves.classeId }).from(coursEleves).where(eq(coursEleves.userId, userId));
  return m?.classeId ?? null;
}

/**
 * Noter dans le suivi de sa classe le geste qu'un élève vient de faire, corrigé au serveur. Faux : rien
 * d'écrit (pas de classe, un envoi refusé, rien à noter).
 */
export async function enregistrerActivite(userId: string, a: GesteCorrige): Promise<boolean> {
  if ("refus" in a.retour) return false;
  const classeId = await classeDe(userId);
  if (!classeId) return false;
  const ou = and(
    eq(coursActivites.userId, userId),
    eq(coursActivites.classeId, classeId),
    eq(coursActivites.nature, a.nature),
    eq(coursActivites.code, a.activite.code),
  );
  // Sans transaction : le pilote HTTP de Neon n'en offre pas (services/catalogue.service.ts). Le
  // navigateur envoie les gestes d'une page un à un, et attend chaque correction avant le suivant.
  const [deja] = await db.select().from(coursActivites).where(ou);
  const avant: SuiviDActivite | null = deja
    ? { etat: deja.etat, essais: deja.essais, etapes: deja.etapes, erreurs: deja.erreurs, fin: deja.fin, meilleure: deja.meilleure }
    : null;
  const apres = a.nature === "scenario" ? suivreLeScenario(a.activite, avant, a.envoi, a.retour) : suivreLeBureau(a.activite, avant, a.envoi, a.retour);
  if (!apres) return false;
  const valeurs = { etat: apres.etat, essais: apres.essais, etapes: apres.etapes, erreurs: apres.erreurs, fin: apres.fin, meilleure: apres.meilleure };
  await db
    .insert(coursActivites)
    .values({ userId, classeId, nature: a.nature, code: a.activite.code, ...valeurs })
    .onConflictDoUpdate({
      target: [coursActivites.userId, coursActivites.classeId, coursActivites.nature, coursActivites.code],
      set: { ...valeurs, majLe: new Date() },
    });
  return true;
}

/** Les activités du cours, décrites pour l'enseignant, avec leur parcours. */
function toutesLesActivites(): (ActiviteDecrite & { parcours: string[] })[] {
  const bureau = (nature: "bureau" | "enquete") => (b: Bureau) => ({
    nature,
    code: b.code,
    titre: b.titre,
    etapes: b.etapes.map((e) => ({ id: e.id, titre: e.titre })),
    parcours: parcoursQuiOuvrent(b),
  });
  return [
    ...BUREAUX.map(bureau("bureau")),
    ...ENQUETES.map(bureau("enquete")),
    ...SCENARIOS.map((s) => ({
      nature: "scenario" as const,
      code: s.code,
      titre: s.titre,
      etapes: [{ id: s.questions.id, titre: s.questions.titre }],
      parcours: parcoursQuiOuvrent(s),
    })),
  ];
}

/**
 * Les activités d'une classe de cet enseignant, et où en est chacun de ses élèves. Null : pas sa
 * classe. Les activités montrées sont celles du parcours de la classe, et toute autre qu'un élève a
 * commencée (sous l'offre Campus, tout est ouvert).
 */
export async function activitesDeLaClasse(enseignantId: string, classeId: string) {
  const [classe] = await db
    .select({ id: coursClasses.id, parcours: coursClasses.parcours })
    .from(coursClasses)
    .where(and(eq(coursClasses.id, classeId), eq(coursClasses.creePar, enseignantId)));
  if (!classe) return null;
  const [eleves, lignes] = await Promise.all([
    db.select({ userId: coursEleves.userId, nom: coursEleves.nom }).from(coursEleves).where(eq(coursEleves.classeId, classeId)).orderBy(asc(coursEleves.nom)),
    db.select().from(coursActivites).where(eq(coursActivites.classeId, classeId)),
  ]);
  // Un élève parti de la classe ne compte plus : sa ligne reste, l'enseignant ne la voit pas.
  const presents = new Set(eleves.map((e) => e.userId));
  const suivis: SuiviLu[] = lignes.filter((l) => presents.has(l.userId));
  const commencees = new Set(suivis.map((s) => `${s.nature}:${s.code}`));
  const activites = toutesLesActivites()
    .filter((a) => (classe.parcours !== null && a.parcours.includes(classe.parcours)) || commencees.has(`${a.nature}:${a.code}`))
    .map(({ parcours: _parcours, ...a }) => a);
  return vueDesActivites(activites, eleves, suivis);
}

export type { NatureDActivite };
