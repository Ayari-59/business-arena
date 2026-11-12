import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { classesDeLEnseignant, NOM_DE_CLASSE_MAX, parcoursImposeALEnseignant } from "@/services/cours.service";
import { compter, jourDeCreation } from "@/lib/format";
import { insecables, typographier } from "@/lib/typographie";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { ENTREPRISES } from "@/app/cours/entreprises";
import { parcoursAttribues } from "@/services/attributions.service";
import { parcoursAttribue } from "@/services/chapitres-de-la-classe";
import {
  CE_QU_EST_UN_PARCOURS,
  PARCOURS_PROPOSES_A_CHOISIR,
  parcoursRangesParDiplome,
  titreDuParcours,
} from "@/config/cours/parcours-de-formation";
import { classeSansOffre, offreDuCoursDeLEnseignant, parcoursDeLEssai, unParcoursParLicenceClasse } from "@/services/chapitres-de-la-classe";
import { LIBELLE_DU_DEVIS, OFFRES } from "@/config/tarifs";
import { lienDuDevisDuCours } from "@/config/parametrage-du-devis";
import { ArticulationDuCours } from "@/components/articulation-du-cours";
import { NouvelleClasseDuCours } from "@/components/nouvelle-classe-du-cours";

export const metadata: Metadata = {
  title: "Mes classes du cours",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Ce que dit la page quand un geste sur une classe a été refusé (`?refus=`, depuis la page d'une classe). */
const REFUS: Record<string, string> = {
  introuvable: "Cette classe n'existe pas, ou elle n'est pas l'une des vôtres.",
};

/**
 * MES CLASSES DU COURS PAR LA SIMULATION.
 *
 * L'enseignant crée une classe (un nom, son parcours, et s'il le veut une entreprise pour tous) ; elle
 * reçoit un code. Ses élèves la rejoignent sur /cours/rejoindre, sous un prénom ou un pseudonyme, et
 * leur progression remonte ici, chapitre par chapitre. Le formulaire est un composant client, pour que
 * ses erreurs se lisent sous leurs champs, la saisie gardée (components/nouvelle-classe-du-cours.tsx).
 */
async function MesClassesDuCoursPage({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  const { refus } = await searchParams;
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const [classes, staff, offre, attribues, impose] = await Promise.all([
    classesDeLEnseignant(session.userId),
    getStaffContext(session.userId),
    offreDuCoursDeLEnseignant(session.userId),
    parcoursAttribues(session.userId),
    parcoursImposeALEnseignant(session.userId),
  ]);
  // Les parcours que l'admin a attribués (migration 0056) : sans liste, tous ceux qu'on propose.
  // Sous l'offre Classe, le seul parcours de la licence quand il est fixé (décision du 10 novembre 2026).
  // Rangés par diplôme, le cours du diplôme en premier (décision du 11 novembre 2026).
  const aChoisir = PARCOURS_PROPOSES_A_CHOISIR.filter((p) => (impose ? p.code === impose : parcoursAttribue(attribues, p.code)));
  const groupes = parcoursRangesParDiplome(aChoisir.map((p) => p.code));
  const offres = { classe: OFFRES.classe.nom, programme: OFFRES.programme.nom, campus: OFFRES.campus.nom };
  const aide =
    offre === "classe"
      ? unParcoursParLicenceClasse(offres, impose ? (titreDuParcours(impose) ?? impose) : null)
      : offre
        ? `Avec l'offre ${offres.classe} ou ${offres.programme}, la classe ouvre les chapitres de ce parcours ; avec l'offre ${offres.campus}, tous les chapitres.`
        : parcoursDeLEssai(offres);
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
        <details id="nouvelle-classe" className="group scroll-mt-24" open={classes.length === 0 || undefined}>
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
            {/* SANS OFFRE, LE DIRE AVANT LA CRÉATION (audit UX du 29 octobre 2026, P1-1) : la
                classe se crée, mais n'ouvre que les chapitres libres ; les élèves ne doivent pas le
                découvrir en se heurtant à un chapitre fermé. */}
            {!offre ? (
              <p data-classe-du-cours-sans-offre="" className="mt-3 rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300">
                {classeSansOffre()}{" "}
                <Link href={lienDuDevisDuCours()} prefetch={false} className={LIEN_A_L_ENCRE}>
                  {LIBELLE_DU_DEVIS}
                </Link>
              </p>
            ) : null}
            {/* Un composant client n'est, vu d'ici, qu'une référence : ses textes lui arrivent avec
                leurs insécables (lib/typographie.ts). */}
            <NouvelleClasseDuCours
              groupes={typographier(groupes.map((g) => ({ cle: g.cle, libelle: g.libelle, parcours: g.parcours.map((p) => ({ code: p.code, libelle: p.libelle })) })))}
              impose={impose}
              aide={insecables(aide)}
              ceQuEstUnParcours={insecables(CE_QU_EST_UN_PARCOURS)}
              entreprises={typographier(ENTREPRISES.map((e) => ({ code: e.code, nom: e.nom, tagline: e.tagline })))}
              nomMax={NOM_DE_CLASSE_MAX}
            />
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
                    {c.parcours ? ` · ${titreDuParcours(c.parcours) ?? ""}` : ""}
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

export default avecTypographie(MesClassesDuCoursPage);
