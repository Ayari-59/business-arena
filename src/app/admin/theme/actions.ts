"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session-admin";
import { updatePlatformConfig } from "@/services/admin.service";
import { BANDES, PAGES_A_BANDES } from "@/config/bandes";
import {
  THEME_PAR_DEFAUT,
  estCodeTheme,
  type CodeTheme,
} from "@/config/themes";
import {
  THEME_DU_SITE_PAR_DEFAUT,
  etatDesContrastes,
  themeDepuisEtat,
  validerContrastes,
  validerThemeParDefaut,
} from "@/config/theme-du-site";

/**
 * Ce que le formulaire du thème renvoie à l'écran : les raisons d'un refus, ou
 * la confirmation, et l'état que l'administrateur vient d'envoyer — pour qu'un
 * refus ne lui fasse pas perdre ses réglages et qu'il n'ait qu'à corriger.
 */
export interface EtatTheme {
  erreurs: string[];
  enregistre: boolean;
  etat: Record<string, boolean>;
  parDefaut: CodeTheme;
}

/**
 * Les pages vitrine sont pré-rendues au build : un réglage n'y paraîtrait qu'au
 * prochain déploiement sans cette invalidation, la même que celle des autres
 * réglages d'admin. Elle porte sur CHAQUE page à bandes, pas seulement sur celle
 * qu'on vient de modifier : la validation raisonne sur l'ensemble.
 */
function revalider() {
  for (const { page } of PAGES_A_BANDES) revalidatePath(page);
  // Le thème d'ouverture est posé par la mise en page, qui enveloppe TOUTES les
  // pages : l'invalider une fois, à la racine, les invalide toutes.
  revalidatePath("/", "layout");
}

export async function enregistrerThemeAction(
  _precedent: EtatTheme,
  formData: FormData,
): Promise<EtatTheme> {
  const adminId = await requireAdminSession();

  // Une case décochée n'est pas envoyée : toute bande du registre est lue, et
  // l'absence vaut « pas à contre-jour ». C'est le registre qui fait foi, pas
  // les champs reçus — un champ forgé pour une bande inconnue est ignoré.
  const etat: Record<string, boolean> = {};
  for (const b of BANDES) etat[b.id] = formData.get(`bande:${b.id}`) === "on";

  // La validation se refait ICI. Celle du navigateur sert à guider ; elle ne
  // protège rien, puisqu'un formulaire se forge.
  const choisi = formData.get("parDefaut");
  const parDefaut: CodeTheme = estCodeTheme(choisi) ? choisi : THEME_PAR_DEFAUT;
  const erreurs = [
    ...validerThemeParDefaut(choisi),
    ...validerContrastes(etat),
  ];
  if (erreurs.length > 0)
    return { erreurs, enregistre: false, etat, parDefaut };

  await updatePlatformConfig(adminId, {
    theme: themeDepuisEtat(etat, parDefaut),
  });
  revalider();
  return { erreurs: [], enregistre: true, etat, parDefaut };
}

export async function retablirThemeAction(): Promise<EtatTheme> {
  const adminId = await requireAdminSession();
  await updatePlatformConfig(adminId, { theme: THEME_DU_SITE_PAR_DEFAUT });
  revalider();
  return {
    erreurs: [],
    enregistre: true,
    etat: etatDesContrastes(THEME_DU_SITE_PAR_DEFAUT),
    parDefaut: THEME_PAR_DEFAUT,
  };
}
