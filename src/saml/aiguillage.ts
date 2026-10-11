import { setGuestCookie } from "@/lib/guest";
import { clearSession, setSession } from "@/lib/session";
import { compteEnseignant, identiteEtudiante, PlafondAtteint } from "./comptes";
import { rattachementDe } from "./etablissements";
import type { IdentiteFederee } from "./reponse";

/**
 * OÙ MÈNE UNE CONNEXION VÉRIFIÉE.
 *
 *   · ENSEIGNANT OU PERSONNEL d'un établissement RATTACHÉ : son compte enseignant dans
 *     l'organisation de l'établissement (créé à la première venue), sa session, et
 *     /teacher. La licence de l'organisation s'applique telle quelle (acces.service.ts).
 *   · ENSEIGNANT d'un établissement INCONNU (de la fédération, mais rattaché à aucune
 *     organisation) : aucun compte n'est créé ; « Votre établissement n'a pas encore
 *     d'offre », les tarifs et la demande de devis.
 *   · ÉTUDIANT : son identité de joueur persistante (le cookie invité de l'entrée par
 *     code, mais retrouvée sur tout appareil par l'identifiant fédéré). La session
 *     enseignant éventuellement ouverte sur ce poste est fermée : c'est l'étudiant qui
 *     est au clavier. Il revient à la page d'où il est parti (l'entrée par code d'une
 *     partie, l'invitation d'une cohorte), ou arrive à « Vos parties et cohortes ».
 *     Que son établissement soit rattaché ou non : il joue comme un invité (solo,
 *     démonstrations, parties et cohortes dont on lui donne le code).
 *
 * Le résultat est une DESCRIPTION (chemin et cookies), appliquée par la route.
 */

export interface Aiguillage {
  chemin: string;
  session?: { userId: string; v: number };
  invite?: string;
  effacerSession?: boolean;
}

export const PAGE_DE_L_ETUDIANT = "/etablissement/parties";
export const PAGE_SANS_OFFRE = "/etablissement/sans-offre";

export async function aiguiller(p: IdentiteFederee): Promise<Aiguillage> {
  const rattachement = await rattachementDe(p.idp.entityId, p.etablissement);
  if (p.role === "enseignant") {
    if (!rattachement) return { chemin: PAGE_SANS_OFFRE };
    let compte: { userId: string; sessionVersion: number };
    try {
      compte = await compteEnseignant(p, rattachement.organizationId);
    } catch (e) {
      if (e instanceof PlafondAtteint) return { chemin: "/etablissement/refus?motif=plafond" };
      throw e;
    }
    const chemin = p.retour && (p.retour === "/teacher" || p.retour.startsWith("/teacher/")) ? p.retour : "/teacher";
    return { chemin, session: { userId: compte.userId, v: compte.sessionVersion } };
  }

  const userId = await identiteEtudiante(p);
  const chemin = p.retour ?? (rattachement ? PAGE_DE_L_ETUDIANT : `${PAGE_DE_L_ETUDIANT}?offre=aucune`);
  return { chemin, invite: userId, effacerSession: true };
}

/** Pose les cookies décrits par l'aiguillage. */
export async function appliquerAiguillage(a: Aiguillage): Promise<void> {
  if (a.effacerSession) await clearSession();
  if (a.session) await setSession(a.session.userId, "teacher", a.session.v);
  if (a.invite) await setGuestCookie(a.invite);
}
