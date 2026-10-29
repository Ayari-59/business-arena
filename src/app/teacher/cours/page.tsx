import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { classesDeLEnseignant, NOM_DE_CLASSE_MAX } from "@/services/cours.service";
import { compter, jourDeCreation } from "@/lib/format";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { ENTREPRISES } from "@/app/cours/entreprises";
import { ArticulationDuCours } from "@/components/articulation-du-cours";
import { creerClasseAction } from "./actions";

export const metadata: Metadata = {
  title: "Mes classes du cours",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const REFUS: Record<string, string> = {
  nom: "Donnez un nom à la classe, par exemple « BTS CG 1 · groupe A ».",
  introuvable: "Cette classe n'existe pas, ou elle n'est pas l'une des vôtres.",
};

/**
 * MES CLASSES DU COURS PAR LA SIMULATION.
 *
 * L'enseignant crée une classe (un nom, et s'il le veut une entreprise pour tous) ; elle
 * reçoit un code. Ses élèves la rejoignent sur /cours/rejoindre, sous un prénom ou un
 * pseudonyme, et leur progression remonte ici, chapitre par chapitre.
 */
export default async function MesClassesDuCoursPage({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const { refus } = await searchParams;
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const [classes, staff] = await Promise.all([classesDeLEnseignant(session.userId), getStaffContext(session.userId)]);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const raison = refus && Object.hasOwn(REFUS, refus) ? REFUS[refus] : null;
  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Espace enseignant"
        titre="Mes classes du cours"
        chapeau="Le cours par la simulation, suivi en classe. Vos élèves rejoignent la classe par son code, sans compte, et vous voyez où chacun en est et les erreurs qui reviennent."
      >
        <NavigationEnseignant
          className="mt-6"
          actif="cours"
          liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {raison ? (
          <p role="alert" className="rounded-xl encadre-perte px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3">
            {raison}
          </p>
        ) : null}
        <Rubrique note={classes.length > 0 ? compter(classes.length, "classe") : undefined}>Mes classes</Rubrique>
        <details id="nouvelle-classe" className="group scroll-mt-24" open={classes.length === 0 || !!raison || undefined}>
          <summary className="inline-flex cursor-pointer list-none rounded-lg [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">
              <span className={bouton({ taille: "l" })}>
                <span aria-hidden>+</span> Nouvelle classe
              </span>
            </span>
            <span className="hidden group-open:inline">
              <span className={bouton({ variante: "secondaire" })}>Replier le formulaire</span>
            </span>
          </summary>
          <section aria-labelledby="nouvelle-classe-titre" className="carte mt-4 p-4 sm:p-7">
            <h2 id="nouvelle-classe-titre" className="titre-carte text-slate-100">
              Nouvelle classe
            </h2>
            <form action={creerClasseAction} className="mt-4 grid gap-5">
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">Nom de la classe</span>
                <input
                  name="nom"
                  required
                  maxLength={NOM_DE_CLASSE_MAX}
                  placeholder="BTS CG 1 · groupe A"
                  className="champ w-full px-3 py-2 text-base"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">Entreprise du cas</span>
                <select name="entreprise" defaultValue="" className="champ w-full px-3 py-2 text-base">
                  <option value="">Au choix de chaque élève</option>
                  {ENTREPRISES.map((e) => (
                    <option key={e.code} value={e.code}>
                      {e.nom} · {e.tagline}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-400">
                  La même pour toute la classe, pour corriger ensemble ; ou au choix, pour comparer les métiers.
                </span>
              </label>
              <div>
                <SubmitButton pendingLabel="Création de la classe…" className={bouton()}>
                  Créer la classe
                </SubmitButton>
              </div>
            </form>
          </section>
        </details>
        {classes.length === 0 ? (
          <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">
            Aucune classe pour l&apos;instant. Créez la première : vous obtiendrez un code à donner à vos élèves.
          </p>
        ) : (
          <ul className="grid gap-3" data-mes-classes="">
            {classes.map((c) => (
              <li key={c.id} data-classe={c.code} className="carte flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4">
                <Link href={`/teacher/cours/${c.id}`} className="min-w-0 flex-1 basis-56">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-base font-semibold text-slate-100">{c.nom}</span>
                    {c.closeLe ? (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">close</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-400">
                    {compter(c.eleves, "élève")} · créée {jourDeCreation(c.createdAt)}
                    {c.entreprise ? ` · ${ENTREPRISES.find((e) => e.code === c.entreprise)?.nom ?? ""}` : ""}
                  </span>
                </Link>
                <span className="font-mono text-sm text-slate-300">{c.code}</span>
              </li>
            ))}
          </ul>
        )}
        <ArticulationDuCours titreId="articulation-enseignant" />
      </div>
    </main>
  );
}
