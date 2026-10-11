import { desc } from "drizzle-orm";
import { db } from "@/db";
import { samlRefus } from "@/db/schema";

/**
 * LE JOURNAL DES REFUS DE LA CONNEXION PAR L'ÉTABLISSEMENT.
 *
 * Chaque connexion ou réponse refusée laisse une ligne : l'étape, le motif, l'IdP
 * annoncé (qui peut être faux, c'est ce qu'on note). La réponse SAML elle-même n'est
 * jamais écrite : elle porte les attributs de la personne. Lu dans /admin/renater :
 * « mes étudiants n'arrivent pas à se connecter » s'y explique.
 */
export type EtapeSaml = "connexion" | "reponse" | "federation";

export async function journaliserRefus(args: { etape: EtapeSaml; motif: string; idp?: string | null }): Promise<void> {
  const motif = args.motif.slice(0, 300);
  const idp = typeof args.idp === "string" ? args.idp.slice(0, 300) : null;
  console.warn(`[saml] refus (${args.etape}) : ${motif}${idp ? ` · idp=${idp}` : ""}`);
  try {
    await db.insert(samlRefus).values({ etape: args.etape, motif, idpEntityId: idp });
  } catch (e) {
    // Le journal ne doit jamais transformer un refus en panne.
    console.error("[saml] journal des refus indisponible :", e);
  }
}

export async function derniersRefus(n = 20) {
  return db.select().from(samlRefus).orderBy(desc(samlRefus.createdAt)).limit(n);
}
