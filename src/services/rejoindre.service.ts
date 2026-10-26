import { eq } from "drizzle-orm";
import { db } from "@/db";
import { competitions } from "@/db/schema/competition";
import { normaliserCodeDExamen } from "@/config/examen/textes";
import { cohorteParCode } from "@/services/cohortes.service";
import { classeParCode } from "@/services/cours.service";
import { examenParCode } from "@/services/examen.service";

/**
 * UNE PORTE POUR TOUS LES CODES D'ÉLÈVE (audit d'octobre 2026).
 *
 * Six pages prennent un code : /join (une partie de l'arène), /cours/rejoindre
 * (une classe du cours), /entreprises/episode/rejoindre (une cohorte
 * d'épisodes), /compete (un concours), /examen (un examen individuel) et
 * /reprendre. La barre du site n'en propose qu'une, « Rejoindre une partie »,
 * qui répondait « Code de partie inconnu » à un code de classe ou de cohorte :
 * l'élève restait bloqué devant la classe.
 *
 * `/join` garde son rôle. Quand le code n'ouvre aucune partie, on cherche
 * ailleurs, par simple lecture, et on renvoie l'élève à la bonne page avec son
 * code : c'est elle qui décide ensuite (classe close, inscriptions finies).
 * Rien n'est créé tant que le code n'est pas reconnu, comme pour une partie.
 */
export async function ouRejoindre(brut: string): Promise<string | null> {
  const code = brut.trim();
  if (!code) return null;
  const enCapitales = code.toUpperCase();

  const examen = normaliserCodeDExamen(code);
  if (examen && (await examenParCode(examen))) return `/examen?code=${encodeURIComponent(examen)}`;

  const [concours] = await db
    .select({ id: competitions.id })
    .from(competitions)
    .where(eq(competitions.joinCode, enCapitales));
  if (concours) return `/compete?code=${encodeURIComponent(enCapitales)}`;

  const classe = await classeParCode(code);
  if (classe) return `/cours/rejoindre?code=${encodeURIComponent(classe.code)}`;

  const cohorte = await cohorteParCode(code);
  if (cohorte) return `/entreprises/episode/rejoindre?code=${encodeURIComponent(cohorte.code)}`;

  return null;
}
