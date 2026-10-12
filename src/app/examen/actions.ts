"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { setGuestCookie } from "@/lib/guest";
import { identiteReconnue } from "@/lib/identite-du-candidat";
import { NOM_INVITE_PAR_DEFAUT } from "@/config/invite";
import { commencerLExamen, copiesDuCandidat, examenParCode } from "@/services/examen.service";
import { normaliserCodeDExamen, normaliserNumero, type Identification } from "@/config/examen/textes";

/**
 * COMMENCER L'EXAMEN. Qui joue se lit des cookies, jamais du formulaire :
 *   · une session ouverte (un compte Business Arena) : le compte ;
 *   · l'identité venue de l'établissement (RENATER) ou de la plateforme de cours (LTI) :
 *     elle-même, retrouvée sur tout appareil ;
 *   · sinon, le nom et le numéro d'étudiant saisis, sans adresse électronique : une
 *     identité NEUVE pour ce candidat, sauf si cet appareil porte déjà SA copie (même
 *     numéro). Sur un poste partagé, le candidat suivant ne reprend jamais la copie du
 *     précédent ; c'est le code de reprise qui rend une copie à son auteur.
 */

async function identiteNeuve(): Promise<string> {
  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: `guest-${id}@guest.business-arena.local`,
    displayName: NOM_INVITE_PAR_DEFAUT,
  });
  await setGuestCookie(id);
  return id;
}

export async function commencerExamenAction(code: string, formData: FormData): Promise<void> {
  const propre = normaliserCodeDExamen(code);
  if (!propre) redirect("/examen?refus=inconnu");
  const examen = await examenParCode(propre);
  if (!examen) redirect("/examen?refus=inconnu");
  const nom = String(formData.get("nom") ?? "").trim();
  const numeroSaisi = normaliserNumero(String(formData.get("numeroEtudiant") ?? ""));
  const reconnue = await identiteReconnue();
  let userId: string;
  let identification: Identification;
  if (reconnue.identification && reconnue.userId) {
    userId = reconnue.userId;
    identification = reconnue.identification;
    // Un compte joue sous sa propre identité, que l'arène lit dans le cookie invité.
    if (identification === "compte") await setGuestCookie(userId);
  } else {
    identification = "saisie";
    if (!nom || !numeroSaisi) redirect(`/examen/${propre}?refus=saisie`);
    const siennes = reconnue.userId ? await copiesDuCandidat(examen.id, reconnue.userId) : [];
    userId = siennes.some((c) => c.numeroEtudiant === numeroSaisi) ? reconnue.userId! : await identiteNeuve();
  }
  const r = await commencerLExamen({
    code: propre,
    userId,
    identification,
    nom: nom || "Candidat",
    numeroEtudiant: numeroSaisi || null,
  });
  if ("refus" in r) redirect(`/examen/${propre}?refus=${r.refus}`);
  redirect(`/arena/${r.gameId}`);
}
