"use server";

import { enqueteParCode } from "@/config/cours/enquetes";
import { corrigerAuBureau, type RetourDuBureau } from "@/pedagogy/cours/bureau-servi";
import { chapitreOuvert } from "../acces";

/**
 * LA CORRECTION D'UN GESTE DE L'ENQUÊTE (pedagogy/cours/bureau-servi.ts, le moteur du bureau).
 *
 * Une action serveur est une adresse que n'importe qui peut appeler : l'accès se contrôle ici, à chaque
 * geste, comme la page le contrôle à l'affichage (../acces.ts, les droits d'un cas pratique du chapitre
 * que l'enquête reprend). L'envoi est lu comme inconnu, borné, puis corrigé ; le retour ne porte que la
 * correction de ce geste.
 */
export async function corrigerALEnqueteAction(code: unknown, envoi: unknown): Promise<RetourDuBureau> {
  const enquete = typeof code === "string" ? enqueteParCode(code) : undefined;
  if (!enquete) return { refus: "bureau" };
  if (!(await chapitreOuvert(enquete))) return { refus: "licence" };
  return corrigerAuBureau(enquete, envoi);
}
