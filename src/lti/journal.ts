import { db } from "@/db";
import { ltiRefus } from "@/db/schema";

/**
 * LE JOURNAL DES REFUS.
 *
 * Chaque lancement, connexion ou inscription refusés laisse une ligne : l'étape, le
 * motif, l'émetteur ANNONCÉ (qui peut être faux, c'est justement ce qu'on note). Le
 * jeton lui-même n'est jamais écrit : il porterait les données de la personne, et un
 * jeton encore valable ne doit traîner nulle part. Le motif est borné en longueur.
 */
export type EtapeLti = "connexion" | "lancement" | "inscription" | "selection" | "ouverture";

export async function journaliserRefus(args: {
  etape: EtapeLti;
  motif: string;
  issuer?: string | null;
  plateformeId?: string | null;
}): Promise<void> {
  const motif = args.motif.slice(0, 200);
  const issuer = typeof args.issuer === "string" ? args.issuer.slice(0, 300) : null;
  console.warn(`[lti] refus (${args.etape}) : ${motif}${issuer ? ` · iss=${issuer}` : ""}`);
  try {
    await db.insert(ltiRefus).values({
      etape: args.etape,
      motif,
      issuer,
      plateformeId: args.plateformeId ?? null,
    });
  } catch (e) {
    // Le journal ne doit jamais transformer un refus en panne.
    console.error("[lti] journal des refus indisponible :", e);
  }
}
