import { sql } from "drizzle-orm";
import { db } from "@/db";
import { classes, decisions, rounds } from "@/db/schema";
import { assezPourEtreDit, type PreuvesDusage } from "@/config/preuves-dusage";

/**
 * CE QUE LE PRODUIT A DÉJÀ SERVI, COMPTÉ DANS LE PRODUIT.
 *
 * Une page publique qui veut prouver son usage a deux façons de le faire. La
 * première est d'écrire « adopté par des centaines d'enseignants » et un
 * témoignage signé d'un prénom : personne ne peut le vérifier, et ce qui ne se
 * vérifie pas ne prouve rien — c'est le même défaut que le cockpit aux chiffres
 * inventés qu'on vient de retirer de l'accueil. La seconde est de compter ce
 * qui s'est réellement passé, et de le dire tel quel.
 *
 * QUATRE COMPTES, AUCUN NOM. Des tours résolus, des parties menées à leur
 * premier résultat, des décisions validées, des classes créées : des entiers
 * agrégés sur toute la plateforme. Aucun établissement n'est nommé, aucun
 * enseignant, aucun élève, et rien ici ne descend à la ligne près — il n'y a
 * pas de donnée personnelle dans un total.
 *
 * ET UN PLANCHER. En dessous, la page n'affiche RIEN plutôt que trois parties :
 * un compteur famélique prouve l'inverse de ce qu'on lui demande, et le gonfler
 * serait mentir. La section apparaîtra d'elle-même quand les chiffres seront
 * vrais.
 *
 * LA BASE PEUT ÊTRE ABSENTE. C'est une page publique : si la requête échoue,
 * elle rend `null` et la section disparaît, comme la configuration de
 * plateforme le fait déjà. Une vitrine ne tombe pas parce qu'un compteur n'a
 * pas répondu.
 */

/**
 * Une heure de mémoire, dans le processus.
 *
 * Ces compteurs vivent sur les pages les plus visitées du site et ne changent
 * pas d'une minute à l'autre : les recompter à chaque visite ferait payer un
 * balayage de table à chaque robot d'indexation. Un souvenir par instance
 * suffit — il tombe tout seul au redéploiement, et la valeur affichée n'a
 * jamais besoin d'être à la seconde près.
 */
const MEMOIRE_MS = 60 * 60 * 1000;
let memoire: { a: number; valeur: PreuvesDusage | null } | null = null;

/** Remet la mémoire à zéro. Pour les tests, qui ne veulent pas d'un cache. */
export function oublierLesPreuves(): void {
  memoire = null;
}

export async function preuvesDusage(maintenant = Date.now()): Promise<PreuvesDusage | null> {
  if (memoire && maintenant - memoire.a < MEMOIRE_MS) return memoire.valeur;

  let valeur: PreuvesDusage | null = null;
  try {
    const [toursRows, partiesRows, decisionsRows, classesRows] = await Promise.all([
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(rounds)
        .where(sql`${rounds.resolvedAt} is not null`),
      db
        .select({ n: sql<number>`count(distinct ${rounds.gameId})::int` })
        .from(rounds)
        .where(sql`${rounds.resolvedAt} is not null`),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(decisions)
        .where(sql`${decisions.status} = 'validated'`),
      db.select({ n: sql<number>`count(*)::int` }).from(classes),
    ]);

    const releve: PreuvesDusage = {
      tours: toursRows[0]?.n ?? 0,
      parties: partiesRows[0]?.n ?? 0,
      decisions: decisionsRows[0]?.n ?? 0,
      classes: classesRows[0]?.n ?? 0,
      releveLe: new Date(maintenant),
    };
    valeur = assezPourEtreDit(releve) ? releve : null;
  } catch (e) {
    // Une vitrine ne tombe pas parce qu'un compteur n'a pas répondu.
    console.warn("[preuves-dusage] relevé impossible :", e instanceof Error ? e.message : e);
    valeur = null;
  }

  memoire = { a: maintenant, valeur };
  return valeur;
}
