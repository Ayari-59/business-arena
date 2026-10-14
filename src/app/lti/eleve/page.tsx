import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { episodeCohortes, games } from "@/db/schema";
import { getGuestDisplayName, getGuestUserId } from "@/lib/guest";
import { lireContexte } from "@/lti/contexte";
import { lienParId } from "@/lti/liens";
import { plateformeParId } from "@/lti/plateformes";
import { organisationOuverte } from "@/lti/acces";
import { refusDeRejoindre } from "@/services/game.service";
import { COHORTE_CLOSE } from "@/config/cohortes";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { entrerAction } from "./actions";

export const metadata: Metadata = {
  title: "Votre activité",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * L'ÉLÈVE ARRIVÉ DEPUIS SON COURS, quand il ne peut pas encore entrer :
 *   · l'activité n'est pas configurée : « Votre enseignant n'a pas encore choisi la
 *     partie » ; et si l'établissement n'a aucune licence en cours, seulement « pas
 *     encore ouverte ». JAMAIS de message de vente devant un élève ;
 *   · la plateforme n'a pas envoyé de prénom : il le donne ici, puis entre ;
 *   · la partie est terminée ou rangée, la cohorte close : il le lit.
 */

function Ecran({ titre, chapeau, children }: { titre: string; chapeau: string; children?: React.ReactNode }) {
  return (
    <main id="main" className="pb-16" data-eleve-lti="">
      <EnTeteDePage surtitre="Votre activité" titre={titre} chapeau={chapeau} />
      {children ? <div className={COLONNE_DE_PAGE}>{children}</div> : null}
    </main>
  );
}

export default async function EleveLtiPage({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const { refus } = await searchParams;
  const [ctx, invite] = await Promise.all([lireContexte(), getGuestUserId()]);
  const lien = ctx?.r === "eleve" && ctx.l && invite === ctx.u ? await lienParId(ctx.l) : null;
  const plateforme = lien ? await plateformeParId(lien.plateformeId) : null;
  if (!lien || !plateforme?.actif) {
    return (
      <Ecran
        titre="Ouvrez l'activité depuis votre cours"
        chapeau="Cette page s'ouvre quand vous lancez l'activité Business Arena depuis votre cours. Relancez-la depuis le cours."
      />
    );
  }

  if (!lien.cibleType) {
    return (await organisationOuverte(plateforme.organizationId)) ? (
      <Ecran
        titre="Votre enseignant n'a pas encore choisi la partie"
        chapeau="L'activité sera prête dès qu'il l'aura configurée. Relancez-la depuis votre cours un peu plus tard."
      />
    ) : (
      <Ecran
        titre="Cette activité n'est pas encore ouverte"
        chapeau="Prévenez votre enseignant : l'activité s'ouvrira de son côté. Relancez-la ensuite depuis votre cours."
      />
    );
  }

  if (lien.cibleType === "cohorte") {
    const [c] = lien.cohorteId
      ? await db.select({ close: episodeCohortes.closeLe }).from(episodeCohortes).where(eq(episodeCohortes.id, lien.cohorteId))
      : [];
    return <Ecran titre="Cette cohorte est close" chapeau={c?.close ? COHORTE_CLOSE : "Relancez l'activité depuis votre cours."} />;
  }

  if (lien.cibleType === "examen") {
    return <Ecran titre="Cet examen n'est plus ouvert" chapeau="Relancez l'activité depuis votre cours ; votre enseignant vous dira la suite." />;
  }

  const [g] = lien.gameId ? await db.select({ code: games.joinCode }).from(games).where(eq(games.id, lien.gameId)) : [];
  const empechement = g?.code ? await refusDeRejoindre(g.code) : "Cette partie n'existe plus.";
  if (empechement) return <Ecran titre="La partie n'est plus ouverte" chapeau={`${empechement} Votre enseignant vous dira la suite.`} />;

  const prenom = await getGuestDisplayName();
  return (
    <Ecran
      titre="Votre prénom, et vous entrez"
      chapeau="Votre enseignant le verra au pilotage de la partie. Un prénom suffit : ni nom, ni courriel."
    >
      <GuardedForm action={entrerAction} label="entrée dans la partie depuis le cours" className="carte grid max-w-md gap-3 p-4 sm:p-6">
        <label className="grid gap-1">
          <span className="text-sm font-semibold text-slate-200">Prénom ou pseudo</span>
          <input
            name="pseudo"
            required
            maxLength={40}
            autoComplete="given-name"
            defaultValue={prenom ?? ""}
            className="champ px-3 py-2 text-base"
          />
        </label>
        {refus ? (
          <p role="alert" className="text-sm text-red-300">
            {refus === "prenom" ? "Écrivez un prénom ou un pseudo." : "L'entrée dans la partie a échoué. Réessayez."}
          </p>
        ) : null}
        <SubmitButton pendingLabel="Entrée dans la partie…" className={bouton()}>
          Entrer dans la partie
        </SubmitButton>
      </GuardedForm>
    </Ecran>
  );
}
