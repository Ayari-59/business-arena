"use server";

import { enqueteParCode } from "@/config/cours/enquetes";
import { corrigerAuBureau, type RetourDuBureau } from "@/pedagogy/cours/bureau-servi";
import { chapitreOuvert } from "../acces";
import { noterDansLaClasse } from "../suivi-des-activites";

/**
 * LA CORRECTION D'UN GESTE DE L'ENQUÊTE (pedagogy/cours/bureau-servi.ts, le moteur du bureau).
 *
 * Une action serveur est une adresse que n'importe qui peut appeler : l'accès se contrôle ici, à chaque
 * geste, comme la page le contrôle à l'affichage (../acces.ts, les droits d'un cas pratique du chapitre
 * que l'enquête reprend). L'envoi est lu comme inconnu, borné, puis corrigé ; le retour ne porte que la
 * correction de ce geste. Un élève de classe le voit noté dans le suivi de son enseignant
 * (../suivi-des-activites.ts), d'après cette correction même.
 */
export async function corrigerALEnqueteAction(code: unknown, envoi: unknown): Promise<RetourDuBureau> {
  const enquete = typeof code === "string" ? enqueteParCode(code) : undefined;
  if (!enquete) return { refus: "bureau" };
  if (!(await chapitreOuvert(enquete))) return { refus: "licence" };
  const retour = corrigerAuBureau(enquete, envoi);
  // LE SUIVI DE LA CLASSE (migration 0057) : d'après cette correction, jamais d'après le navigateur.
  await noterDansLaClasse({ nature: "enquete", activite: enquete, envoi, retour });
  return retour;
}
