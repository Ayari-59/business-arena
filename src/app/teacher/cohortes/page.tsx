import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { unCompteAvecEpisodes } from "@/services/acces.service";
import { lienDuDevis, LIBELLE_DU_DEVIS, MARQUE_DES_EPISODES } from "@/config/tarifs";
import { cohortesDeLEnseignant } from "@/services/cohortes.service";
import { episodeParCode, EPISODES } from "@/pedagogy/episodes/registre";
import {
  estUnRefusDeCohorte,
  NOM_DE_COHORTE_MAX,
  REFUS_DE_COHORTE,
  REFUS_SANS_LICENCE,
} from "@/config/cohortes";
import { LIEN_TARIFS } from "@/config/vitrine-solo";
import { compter, jourDeCreation } from "@/lib/format";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { ChoixDesEpisodes } from "@/components/choix-des-episodes";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { creerCohorteAction } from "./actions";

export const metadata: Metadata = {
  title: "Mes cohortes",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * MES COHORTES : LES ÉPISODES MANAGER, EN CLASSE, SOUS LA LICENCE DE L'ÉTABLISSEMENT.
 *
 * Décision du propriétaire (octobre 2026) : « des cohortes créées par l'enseignant ».
 * Sans licence, seuls les épisodes de démonstration se lancent ; une cohorte de
 * l'établissement sous licence ouvre à ses élèves, sans compte, les épisodes que
 * l'enseignant y met. Jusqu'ici seul l'administrateur créait une cohorte.
 *
 * LA PAGE SUIT « MES PARTIES » : la liste ouvre la page, la création attend derrière son
 * bouton (un `<details>`), ouverte d'elle-même pour qui n'a encore rien créé, pour qui
 * arrive d'une fiche d'épisode (`?episode=…`, l'épisode pré-coché) et après un refus.
 *
 * SANS LICENCE QUI INCLUT LES ÉPISODES (une licence Classe ou Campus seule ne suffit pas :
 * les épisodes se vendent à part), la page se montre, avec son formulaire ; la création
 * est refusée par le serveur (services/cohortes.service.ts), avec le message et le lien vers les tarifs.
 * La page le dit avant, pour qu'on ne remplisse pas un formulaire pour rien.
 */
export default async function MesCohortesPage({
  searchParams,
}: {
  searchParams: Promise<{ refus?: string; episode?: string }>;
}) {
  const { refus, episode } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const [cohortes, droits, staff] = await Promise.all([
    cohortesDeLEnseignant(session.userId),
    unCompteAvecEpisodes([session.userId]),
    getStaffContext(session.userId),
  ]);
  const licence = droits;
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const preselection = episode && episodeParCode(episode) ? episode : null;
  const raison = estUnRefusDeCohorte(refus) ? refus : null;
  const ouvrir = cohortes.length === 0 || !!preselection || !!raison;

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Espace enseignant"
        titre="Mes cohortes"
        chapeau="Une cohorte fait jouer des épisodes manager à une classe. Vos élèves la rejoignent par son code, sans compte, et jouent les épisodes que vous avez choisis, sous la licence épisodes de votre établissement."
      >
        <NavigationEnseignant
          className="mt-6"
          actif="cohortes"
          liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {raison ? (
          <p
            role="alert"
            data-refus-de-cohorte={raison}
            className="rounded-xl encadre-perte px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3"
          >
            {raison === "licence" ? "La cohorte n'a pas été créée. " : ""}
            {REFUS_DE_COHORTE[raison]}
            {raison === "licence" ? (
              <>
                {" "}
                <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
                  Voir les tarifs
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        {!licence && raison !== "licence" ? (
          <p
            data-cohortes-sans-licence=""
            className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300 sm:px-4 sm:py-3"
          >
            <strong className="font-semibold text-slate-100">{MARQUE_DES_EPISODES}.</strong>{" "}
            {REFUS_SANS_LICENCE}{" "}
            <Link href={lienDuDevis("episodes")} prefetch={false} className={LIEN_A_L_ENCRE}>
              {LIBELLE_DU_DEVIS}
            </Link>{" "}
            ·{" "}
            <Link href={LIEN_TARIFS} prefetch={false} className={LIEN_A_L_ENCRE}>
              Voir les tarifs
            </Link>
          </p>
        ) : null}

        <Rubrique note={cohortes.length > 0 ? compter(cohortes.length, "cohorte") : undefined}>
          Mes cohortes
        </Rubrique>

        {/* LA CRÉATION, REPLIÉE DERRIÈRE SON BOUTON, comme « Nouvelle partie » : le
            bouton plein quand c'est fermé, un filet pour replier quand c'est ouvert. */}
        <details id="nouvelle-cohorte" className="group scroll-mt-24" open={ouvrir || undefined}>
          <summary className="inline-flex cursor-pointer list-none rounded-lg [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">
              <span className={bouton({ taille: "l" })}>
                <span aria-hidden>+</span> Nouvelle cohorte
              </span>
            </span>
            <span className="hidden group-open:inline">
              <span className={bouton({ variante: "secondaire" })}>Replier le formulaire</span>
            </span>
          </summary>
          <section aria-labelledby="nouvelle-cohorte-titre" className="carte mt-4 p-4 sm:p-7">
            <h2 id="nouvelle-cohorte-titre" className="titre-carte text-slate-100">
              Nouvelle cohorte
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Un nom et des épisodes, c&apos;est tout. La cohorte reçoit un code à donner à
              la classe ; {EPISODES.length} épisodes sont proposés.
            </p>
            <GuardedForm
              action={creerCohorteAction}
              label="création d'une cohorte"
              className="mt-4 grid gap-5"
            >
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">Nom de la cohorte</span>
                <input
                  name="nom"
                  required
                  maxLength={NOM_DE_COHORTE_MAX}
                  placeholder="BTS MCO 2 · groupe A"
                  className="champ w-full px-3 py-2 text-base"
                />
              </label>
              <ChoixDesEpisodes preselection={preselection} />
              <SubmitButton pendingLabel="Création de la cohorte…" className={bouton()}>
                Créer la cohorte
              </SubmitButton>
            </GuardedForm>
          </section>
        </details>

        {cohortes.length === 0 ? (
          <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">
            Aucune cohorte pour l&apos;instant. Créez la première avec le formulaire ci-dessus :
            vous obtiendrez un code à donner à vos élèves.
          </p>
        ) : (
          <ul className="grid gap-3" data-mes-cohortes="">
            {cohortes.map((c) => {
              const numeros = c.episodes
                .map((code) => episodeParCode(code)?.numero)
                .filter((n): n is number => n !== undefined);
              return (
                <li
                  key={c.id}
                  data-cohorte={c.code}
                  className="carte flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4"
                >
                  <Link href={`/teacher/cohortes/${c.id}`} className="min-w-0 flex-1 basis-56">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="block truncate text-base font-semibold text-slate-100">
                        {c.nom}
                      </span>
                      {c.closeLe ? (
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                          close
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                      {compter(c.membres, "participant")} · créée {jourDeCreation(c.creeeLe)}
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                      {numeros.length > 1 ? "Épisodes" : "Épisode"}{" "}
                      <span className="tabular-nums">{numeros.join(", ")}</span>
                    </span>
                  </Link>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs text-slate-400">Code</span>
                    <span className="block font-mono text-base font-semibold text-slate-100">
                      {c.code}
                    </span>
                  </span>
                  <span className="flex w-full flex-wrap gap-x-4 gap-y-1 text-sm">
                    <Link href={`/teacher/cohortes/${c.id}`} className={LIEN_A_L_ENCRE}>
                      Diffuser le code
                    </Link>
                    <Link
                      href={`/entreprises/episode/animation/${c.cleAnimateur}`}
                      className={LIEN_A_L_ENCRE}
                    >
                      Vue de l&apos;animateur
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
