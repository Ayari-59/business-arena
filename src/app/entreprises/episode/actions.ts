"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGuestUserId, getOrCreateGuestUserId } from "@/lib/guest";
import { construireProfil } from "@/pedagogy/profil/profil";
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
