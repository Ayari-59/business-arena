"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { choisirLeParcours, cloreClasse, creerClasse, parcoursImposeALEnseignant, permettreLaCalculatrice } from "@/services/cours.service";
import { changerLaLiberation, libererLeChapitre } from "@/services/attributions.service";
import { chapitreParCode } from "@/config/cours/registre";
import { OFFRES } from "@/config/tarifs";

/**
 * LES GESTES DE L'ENSEIGNANT SUR SES CLASSES DU COURS. L'enseignant est celui de la
 * session ; le service filtre par ce créateur dans la requête même.
 */

async function enseignant(): Promise<string> {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  return session.userId;
}

/**
 * LE FORMULAIRE DE CRÉATION, APRÈS UN REFUS (audit UX du 11 novembre 2026, P2-6) : chaque erreur sous
 * son champ, toutes d'un coup, et la saisie à remettre dans les champs (components/nouvelle-classe-du-cours.tsx).
 */
export interface EtatDeLaNouvelleClasse {
  erreurs: { nom?: string; parcours?: string };
  valeurs: { nom: string; parcours: string; entreprise: string; liberation: "tout" | "chapitre" } | null;
}

const REFUS_DE_LA_CLASSE = {
  nom: "Donnez un nom à la classe, par exemple « BTS CG 1 · groupe A ».",
  parcours: "Choisissez le parcours du cours de la classe dans la liste.",
  impose: `Avec l'offre ${OFFRES.classe.nom}, une nouvelle classe suit le parcours de vos autres classes : choisissez-le dans la liste.`,
  horsDeLaListe: "Ce parcours n'est pas ouvert à votre établissement : choisissez-en un dans la liste.",
} as const;

export async function creerClasseAction(_avant: EtatDeLaNouvelleClasse, formData: FormData): Promise<EtatDeLaNouvelleClasse> {
  const enseignantId = await enseignant();
  const valeurs: NonNullable<EtatDeLaNouvelleClasse["valeurs"]> = {
    nom: String(formData.get("nom") ?? ""),
    parcours: String(formData.get("parcours") ?? ""),
    entreprise: String(formData.get("entreprise") ?? ""),
    liberation: formData.get("liberation") === "chapitre" ? "chapitre" : "tout",
  };
  const erreurs: EtatDeLaNouvelleClasse["erreurs"] = {};
  if (!valeurs.nom.trim()) erreurs.nom = REFUS_DE_LA_CLASSE.nom;
  if (!valeurs.parcours) erreurs.parcours = REFUS_DE_LA_CLASSE.parcours;
  if (erreurs.nom || erreurs.parcours) return { erreurs, valeurs };
  const cree = await creerClasse({
    enseignantId,
    nom: valeurs.nom,
    entreprise: valeurs.entreprise || null,
    parcours: valeurs.parcours,
    liberation: valeurs.liberation,
  });
  if (!cree) {
    // Sous l'offre Classe, un autre parcours que celui de la licence est refusé ; sinon, il n'est pas
    // de ceux qu'on propose, ou l'admin ne l'a pas attribué.
    const impose = await parcoursImposeALEnseignant(enseignantId);
    return {
      erreurs: { parcours: impose !== null && valeurs.parcours !== impose ? REFUS_DE_LA_CLASSE.impose : REFUS_DE_LA_CLASSE.horsDeLaListe },
      valeurs,
    };
  }
  revalidatePath("/teacher/cours");
  redirect(`/teacher/cours/${cree.id}?creee=1`);
}

export async function cloreClasseAction(classeId: string, close: boolean): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await cloreClasse({ enseignantId, classeId, close }))) redirect("/teacher/cours?refus=introuvable");
  revalidatePath(`/teacher/cours/${classeId}`);
  redirect(`/teacher/cours/${classeId}?fait=${close ? "close" : "rouverte"}`);
}

export async function calculatriceAction(classeId: string, permise: boolean): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await permettreLaCalculatrice({ enseignantId, classeId, permise }))) redirect("/teacher/cours?refus=introuvable");
  revalidatePath(`/teacher/cours/${classeId}`);
  redirect(`/teacher/cours/${classeId}?fait=${permise ? "calculatrice" : "sans-calculatrice"}`);
}

export async function parcoursAction(classeId: string, formData: FormData): Promise<void> {
  const enseignantId = await enseignant();
  const parcours = String(formData.get("parcours") ?? "");
  if (!(await choisirLeParcours({ enseignantId, classeId, parcours }))) redirect(`/teacher/cours/${classeId}?refus=parcours`);
  revalidatePath(`/teacher/cours/${classeId}`);
  redirect(`/teacher/cours/${classeId}?fait=parcours`);
}

/** Tout ouvrir aux élèves, ou libérer chapitre par chapitre (migration 0056). */
export async function liberationAction(classeId: string, mode: "tout" | "chapitre"): Promise<void> {
  const enseignantId = await enseignant();
  if (!(await changerLaLiberation({ enseignantId, classeId, mode }))) redirect("/teacher/cours?refus=introuvable");
  revalidatePath(`/teacher/cours/${classeId}`);
  redirect(`/teacher/cours/${classeId}?fait=${mode === "tout" ? "tout-libere" : "chapitre-par-chapitre"}#liberation`);
}

/**
 * Libérer ou refermer un chapitre de la classe, d'un clic sur sa case (audit UX du 11 novembre 2026,
 * P1-3). `vu` : le chapitre que la page suit ; il reste suivi après le geste.
 */
export async function libererChapitreAction(classeId: string, chapitre: string, libere: boolean, vu?: string): Promise<void> {
  const enseignantId = await enseignant();
  if (!chapitreParCode(chapitre) || !(await libererLeChapitre({ enseignantId, classeId, chapitre, libere })))
    redirect("/teacher/cours?refus=introuvable");
  revalidatePath(`/teacher/cours/${classeId}`);
  const suivi = vu && chapitreParCode(vu) ? vu : chapitre;
  redirect(`/teacher/cours/${classeId}?chapitre=${suivi}&fait=${libere ? "libere" : "referme"}#liberation`);
}

/**
 * LA LISTE DE LIBÉRATION, UN SEUL FORMULAIRE : la case cliquée envoie « code:1 » pour libérer son
 * chapitre, « code:0 » pour le refermer (components/case-de-liberation.tsx).
 */
export async function libererDepuisLaListeAction(classeId: string, vu: string, formData: FormData): Promise<void> {
  const [chapitre = "", geste] = String(formData.get("case") ?? "").split(":");
  await libererChapitreAction(classeId, chapitre, geste === "1", vu);
}
