"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getGuestUserId, getOrCreateGuestUserId, setGuestCookie } from "@/lib/guest";
import { construireProfil } from "@/pedagogy/profil/profil";
import {
  codeDeRepriseDuProfil,
  quitterCohorte,
  rejoindreCohorte,
  reprendreProfil,
} from "@/services/cohortes.service";
import { effacerParties, enregistrerPartie, partiesDe } from "@/services/episode-parties.service";

export interface SuiteDeLaPartie {
  ok: boolean;
  /** Cette partie entre-t-elle dans le profil ? Sinon, pourquoi. */
  compte: true | "rejouee" | "decouverte";
  /** Le nombre d'épisodes qui comptent au profil, celui-ci compris. */
  episodesComptes: number;
  /** La compétence visée par la recommandation, et pourquoi. */
  pourquoi: string | null;
  recommandations: { code: string; numero: number; titre: string; raison: string }[];
}

const ECHEC: SuiteDeLaPartie = {
  ok: false,
  compte: true,
  episodesComptes: 0,
  pourquoi: null,
  recommandations: [],
};

/**
 * GARDER LA PARTIE QUI VIENT DE FINIR, ET DIRE LA SUITE.
 *
 * Appelée une fois par le bilan. La partie est confrontée à son épisode par
 * le service ; le profil est recalculé à partir de toutes les parties gardées,
 * pour proposer le prochain épisode. Le visiteur reçoit une identité invitée
 * s'il n'en a pas : son profil est attaché à cet appareil.
 */
export async function enregistrerPartieAction(entree: unknown): Promise<SuiteDeLaPartie> {
  try {
    const userId = await getOrCreateGuestUserId();
    const r = await enregistrerPartie(userId, entree);
    if (!r.ok) return ECHEC;
    const profil = construireProfil(await partiesDe(userId));
    const ignoree = profil.ignorees.find((p) => p.enregistree.id === r.id);
    revalidatePath("/entreprises/episode/profil");
    return {
      ok: true,
      compte:
        ignoree?.raison === "decouverte"
          ? "decouverte"
          : ignoree?.raison === "rejouee"
            ? "rejouee"
            : true,
      episodesComptes: profil.comptees.length,
      pourquoi: profil.cible?.pourquoi ?? null,
      recommandations: profil.recommandations.map((x) => ({
        code: x.code,
        numero: x.numero,
        titre: x.titre,
        raison: x.raison,
      })),
    };
  } catch (e) {
    console.error("[enregistrerPartieAction]", e);
    return ECHEC;
  }
}

/** Effacer toutes ses parties d'épisodes, et donc son profil. */
export async function effacerMesPartiesAction(): Promise<void> {
  const userId = await getGuestUserId();
  const effacees = userId ? await effacerParties(userId) : 0;
  revalidatePath("/entreprises/episode/profil");
  redirect(`/entreprises/episode/profil?efface=${effacees}`);
}

/** Rejoindre la cohorte du lien d'invitation ; le code de reprise est attribué au passage. */
export async function rejoindreCohorteAction(code: string): Promise<void> {
  const userId = await getOrCreateGuestUserId();
  const r = await rejoindreCohorte(userId, code);
  if (!r.ok) redirect(`/entreprises/episode/rejoindre?code=${encodeURIComponent(code)}&inconnu=1`);
  await codeDeRepriseDuProfil(userId, true);
  revalidatePath("/entreprises/episode/profil");
  redirect("/entreprises/episode/profil?bienvenue=1");
}

export async function quitterCohorteAction(): Promise<void> {
  const userId = await getGuestUserId();
  if (userId) await quitterCohorte(userId);
  revalidatePath("/entreprises/episode/profil");
  redirect("/entreprises/episode/profil");
}

/** Afficher son code de reprise, en le créant au premier appel. */
export async function obtenirCodeDeRepriseAction(): Promise<void> {
  const userId = await getOrCreateGuestUserId();
  await codeDeRepriseDuProfil(userId, true);
  revalidatePath("/entreprises/episode/profil");
  redirect("/entreprises/episode/profil#reprise");
}

export interface RepriseDeProfilState {
  error: string | null;
}

/** Reprendre son profil sur cet appareil avec son code personnel. */
export async function reprendreProfilAction(
  _prev: RepriseDeProfilState,
  formData: FormData,
): Promise<RepriseDeProfilState> {
  const h = await headers();
  const ip = h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",").pop()?.trim() || null;
  const r = await reprendreProfil({ code: String(formData.get("code") ?? ""), ip });
  if (!r.ok) return { error: r.erreur };
  await setGuestCookie(r.userId);
  revalidatePath("/entreprises/episode/profil");
  redirect("/entreprises/episode/profil?repris=1");
}
