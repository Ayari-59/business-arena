"use server";

import { bureauParCode } from "@/config/cours/bureaux";
import { corrigerAuBureau, type RetourDuBureau } from "@/pedagogy/cours/bureau-servi";
import { chapitreOuvert } from "../acces";

/**
 * LA CORRECTION D'UN GESTE AU BUREAU (pedagogy/cours/bureau-servi.ts).
 *
 * Une action serveur est une adresse que n'importe qui peut appeler : l'accès se contrôle ici, à chaque
 * geste, comme la page le contrôle à l'affichage (../acces.ts, les droits d'un cas pratique du chapitre
 * que le bureau reprend : licence, attribution par l'admin, libération de la classe). L'envoi est lu
 * comme inconnu, borné, puis corrigé ; le retour ne porte que la correction de ce geste.
 */
export async function corrigerAuBureauAction(code: unknown, envoi: unknown): Promise<RetourDuBureau> {
  const bureau = typeof code === "string" ? bureauParCode(code) : undefined;
  if (!bureau) return { refus: "bureau" };
  if (!(await chapitreOuvert(bureau))) return { refus: "licence" };
  return corrigerAuBureau(bureau, envoi);
}
