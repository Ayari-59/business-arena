import type { Metadata } from "next";
import Link from "next/link";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { ConnexionEtablissement } from "@/components/connexion-etablissement";
import { PastillesDeNavigation } from "@/components/pastilles-de-navigation";
import { NAVIGATION_ETUDIANT } from "@/config/navigation";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { getGuestUserId } from "@/lib/guest";
import { partiesEtCohorte } from "@/saml/parties";
import { rejoindreParCodeAction } from "./actions";

export const metadata: Metadata = {
  title: "Vos parties et cohortes",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * « VOS PARTIES ET COHORTES » : là où arrive l'étudiant connecté par son établissement
 * sans code en main. Son identité de joueur est celle de la fédération : la même sur
 * tout appareil, sans code de reprise. La page liste ce qu'il a déjà rejoint, et prend
 * un code (de partie ou de cohorte) pour rejoindre autre chose.
 *
 * Un établissement sans offre le dit, sans mot de vente : l'étudiant joue comme invité.
 */
export default async function PartiesDeLEtudiantPage({
  searchParams,
}: {
  searchParams: Promise<{ offre?: string; code?: string }>;
}) {
  const { offre, code } = await searchParams;
  const userId = await getGuestUserId();
  const { parties, cohorte } = userId ? await partiesEtCohorte(userId) : { parties: [], cohorte: null };

  return (
    <main id="main" className="pb-16" data-vos-parties="">
      <EnTeteDePage
        surtitre="Connexion par l'établissement"
        titre="Vos parties et cohortes"
        chapeau="Connecté avec votre établissement, vous retrouvez vos parties sur n'importe quel appareil, sans code de reprise."
      >
        {/* Les pages de l'étudiant, sous les mots du plan du site : la même rangée
            de pastilles que l'espace enseignant et l'établissement. */}
        <PastillesDeNavigation className="mt-6" label="Vos pages" pastilles={NAVIGATION_ETUDIANT} actif="parties" />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} grid gap-6`}>
        {offre === "aucune" ? (
          <p className="max-w-2xl rounded-xl encadre-neutre px-4 py-3 text-base text-slate-200" data-sans-offre="">
            Votre établissement n&apos;a pas encore d&apos;offre Business Arena. Vous jouez comme invité : la partie
            solo, les épisodes de démonstration, et les parties ou cohortes dont votre enseignant vous donne le code.
          </p>
        ) : null}

        {!userId ? (
          <section className="carte grid justify-items-start gap-3 p-5">
            <p className="text-base text-slate-300">
              Connectez-vous avec votre établissement pour retrouver vos parties.
            </p>
            <ConnexionEtablissement retour="/etablissement/parties" />
          </section>
        ) : null}

        <section aria-labelledby="parties-titre" className="grid gap-3">
          <h2 id="parties-titre" className="text-xl font-bold text-slate-50">
            Vos parties
          </h2>
          {parties.length === 0 ? (
            <p className="text-base text-slate-400">Aucune partie pour l&apos;instant : entrez le code donné par votre enseignant.</p>
          ) : (
            <ul className="grid gap-2">
              {parties.map((p) => (
                <li
                  key={p.gameId}
                  className="carte flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3"
                  data-partie-rejointe=""
                >
                  <span className="min-w-0">
                    <span className="font-semibold text-slate-50">{p.entreprise}</span>{" "}
                    <span className="text-sm text-slate-400">
                      {p.classe ? "Partie de classe" : "Partie solo"} ·{" "}
                      {p.terminee ? "terminée" : p.tour >= 1 ? `tour ${p.tour} sur ${p.tours}` : "pas encore commencée"}
                    </span>
                  </span>
                  <Link href={`/arena/${p.gameId}`} prefetch={false} className={LIEN_A_L_ENCRE}>
                    {p.terminee ? "Voir les résultats" : "Reprendre"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="cohorte-titre" className="grid gap-3">
          <h2 id="cohorte-titre" className="text-xl font-bold text-slate-50">
            Votre cohorte
          </h2>
          {cohorte ? (
            <p className="carte flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3" data-cohorte-suivie="">
              <span>
                <span className="font-semibold text-slate-50">{cohorte.nom}</span>{" "}
                <span className="text-sm text-slate-400">{cohorte.close ? "close" : "épisodes manager"}</span>
              </span>
              <Link href="/entreprises/episode/profil" prefetch={false} className={LIEN_A_L_ENCRE}>
                Votre profil
              </Link>
            </p>
          ) : (
            <p className="text-base text-slate-400">Vous ne suivez aucune cohorte d&apos;épisodes.</p>
          )}
        </section>

        <section id="code" aria-labelledby="code-titre" className="grid gap-3">
          <h2 id="code-titre" className="text-xl font-bold text-slate-50">
            Un code de partie ou de cohorte
          </h2>
          <GuardedForm action={rejoindreParCodeAction} label="code de partie ou de cohorte" className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-semibold text-slate-200">Code</span>
              <input
                name="code"
                required
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="K7M2PR"
                className="champ w-64 max-w-full px-3 py-2 font-mono text-base"
              />
            </label>
            <SubmitButton pendingLabel="Recherche…" className={bouton()}>
              Rejoindre
            </SubmitButton>
          </GuardedForm>
          {code === "inconnu" ? (
            <p role="alert" className="text-sm text-red-300">
              Ce code n&apos;ouvre aucune partie en cours ni aucune cohorte. Vérifiez-le auprès de votre enseignant.
            </p>
          ) : null}
          <p className="text-sm text-slate-400">
            Ou jouez librement :{" "}
            <Link href="/jouer" prefetch={false} className={LIEN_A_L_ENCRE}>
              la partie solo
            </Link>{" "}
            et{" "}
            <Link href="/entreprises/episode" prefetch={false} className={LIEN_A_L_ENCRE}>
              les épisodes manager
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
