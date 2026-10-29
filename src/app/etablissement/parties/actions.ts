"use server";

import { redirect } from "next/navigation";
import { normaliserCodeDePartie } from "@/lib/code-de-partie";
import { refusDeRejoindre } from "@/services/game.service";
import { cohorteParCode } from "@/services/cohortes.service";
import { codeFaux, gardeDesCodes } from "@/lib/garde-des-codes";

/**
 * UN CODE, QUEL QU'IL SOIT : celui d'une partie de classe mène à l'entrée par code
 * (/join, où l'étudiant donne son prénom), celui d'une cohorte à son invitation. Rien
 * n'est créé ici : les pages d'arrivée font leurs propres contrôles.
 */
export async function rejoindreParCodeAction(formData: FormData): Promise<void> {
  const saisi = String(formData.get("code") ?? "").trim();
  // Les codes inconnus comptent par adresse (lib/garde-des-codes.ts) ; un code juste passe
  // toujours, et un code faux au-delà du plafond est ralenti.
  const garde = await gardeDesCodes();
  const cohorte = saisi ? await cohorteParCode(saisi) : null;
  if (cohorte) redirect(`/entreprises/episode/rejoindre?code=${encodeURIComponent(cohorte.code)}`);
  const partie = normaliserCodeDePartie(saisi);
  if (partie && (await refusDeRejoindre(partie)) === null) redirect(`/join?code=${encodeURIComponent(partie)}`);
  await codeFaux(garde);
  redirect(`/etablissement/parties?code=inconnu#code`);
}
