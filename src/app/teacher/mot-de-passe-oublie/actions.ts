"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { adresseDOrigine } from "@/lib/garde-des-codes";
import { garderLesTentatives } from "@/services/reprise.service";
import {
  MARQUEUR_MOT_DE_PASSE_OUBLIE,
  MAX_DEMANDES_DE_REINITIALISATION_PAR_ADRESSE,
  REPONSE_A_LA_DEMANDE,
} from "@/config/mot-de-passe-oublie";
import { demanderUneReinitialisation, reinitialiserLeMotDePasse } from "@/services/mot-de-passe-oublie.service";

export interface EtatDeLaDemande {
  message: string | null;
  error: string | null;
}

/**
 * LA DEMANDE : toujours la même réponse. Seul le plafond par adresse d'origine se dit
 * (il ne révèle rien du compte). Le travail — chercher le compte, poser le jeton, envoyer
 * le courriel — part APRÈS la réponse (`after`) : le temps de réponse ne dit pas non plus
 * si un compte existe.
 */
export async function demanderUneReinitialisationAction(
  _prev: EtatDeLaDemande,
  formData: FormData,
): Promise<EtatDeLaDemande> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { message: null, error: "Saisissez l'adresse e-mail de votre compte." };
  const garde = await garderLesTentatives({
    marqueur: MARQUEUR_MOT_DE_PASSE_OUBLIE,
    ip: await adresseDOrigine(),
    maxEchecs: MAX_DEMANDES_DE_REINITIALISATION_PAR_ADRESSE,
  });
  if (garde.refus) return { message: null, error: garde.refus };
  await garde.echec();
  after(() =>
    demanderUneReinitialisation({ email }).catch((e) => {
      console.error("[mot-de-passe-oublie] demande interrompue :", e instanceof Error ? e.message : e);
    }),
  );
  return { message: REPONSE_A_LA_DEMANDE, error: null };
}

export interface EtatDeLaReinitialisation {
  error: string | null;
  champ?: string | null;
}

export async function reinitialiserLeMotDePasseAction(
  _prev: EtatDeLaReinitialisation,
  formData: FormData,
): Promise<EtatDeLaReinitialisation> {
  const jeton = String(formData.get("jeton") ?? "");
  const motDePasse = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (motDePasse !== confirmation) {
    return { error: "Les deux mots de passe ne sont pas identiques.", champ: "confirmation" };
  }
  const r = await reinitialiserLeMotDePasse({ jeton, motDePasse });
  if (!r.ok) return { error: r.erreur, champ: r.champ ?? null };
  // Toutes les sessions sont fermées (version de session avancée) : on se reconnecte.
  redirect("/teacher/login?reinitialise=1");
}
