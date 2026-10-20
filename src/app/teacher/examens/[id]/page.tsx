import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { origineDeLaRequete } from "@/lib/origine";
import { getStaffContext } from "@/services/admin.service";
import {
  comparaisonNationale,
  grilleDeLExamen,
  suiviDeLExamen,
  type CopieSuivie,
} from "@/services/examen.service";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { methodeDe, justificationDe } from "@/config/examen/grille";
import { ETATS_DE_LA_COPIE, IDENTIFICATIONS } from "@/config/examen/textes";
import { nomDuNiveau, NIVEAU_D_ATTEINTE, pourcentDuSeuil, seuilDAtteinteRelatifDit } from "@/config/examen/competences";
import { GRAINES_DU_BILAN } from "@/engine/episodes/commun";
import type { LotDeGraines } from "@/pedagogy/examen/lot";
import { compter } from "@/lib/format";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { BoutonCopierLeLien } from "@/components/bouton-copier-le-lien";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { CompetencesDeLaPromotion, HistogrammeDesNotes } from "@/components/examen/graphiques-de-l-examen";
import { SuiviEnDirect } from "@/components/examen/suivi-en-direct";
import { RetourDesNotes } from "@/components/examen/retour-des-notes";
import { etatDuRetourDesNotes, envoisEnCours } from "@/lti/ags/etat";
import { synchroniserLesNotesDeLExamen } from "@/lti/ags/envois";
import { plusTard } from "@/lti/ags/plus-tard";
import { cloreExamenAction, publierExamenAction, renvoyerLesNotesAction, retirerPublicationAction } from "../actions";

export const metadata: Metadata = {
  title: "Examen individuel",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * UN EXAMEN : SON CODE, LE SUIVI EN DIRECT, LES RÉSULTATS, LES RAPPORTS.
 *
 * L'enseignant (le créateur seul : le service filtre) diffuse le code, voit en direct qui
 * a commencé, à quel tour en est chacun et qui a remis ; puis les notes, leur distribution,
 * la moyenne de la promotion par compétence, la comparaison nationale quand elle est
 * significative. Il publie les résultats (le seul bouton plein de l'écran), exporte le
 * tableur, imprime le rapport d'accréditation, et consulte les décisions de chaque copie.
 */

const FAITS: Record<string, string> = {
  cree: "L'examen est créé. Donnez le code à vos étudiants : chacun le passe seul, depuis son poste.",
  publie: "Les résultats sont publiés : chaque candidat voit sa note et son relevé.",
  retire: "La publication est retirée : les candidats ne voient plus que leur reçu.",
  clos: "L'examen est clos : plus personne n'entre, les copies en cours ont été remises.",
  renvoi: "Les notes repartent vers la plateforme de cours : l'encart du carnet de notes se met à jour de lui-même.",
};

const heure = (d: Date) =>
  d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function etatDeLaLigne(c: CopieSuivie): string {
  if (c.etat === "en-cours") return c.tour <= 1 ? "Commencé" : `Tour ${c.tour} sur ${c.tours}`;
  return ETATS_DE_LA_COPIE[c.etat];
}

export default async function ExamenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cree?: string; fait?: string }>;
}) {
  const { id } = await params;
  const { cree, fait } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const [suivi, staff, origine] = await Promise.all([
    suiviDeLExamen(session.userId, id),
    getStaffContext(session.userId),
    origineDeLaRequete(),
  ]);
  if (!suivi) notFound();
  // LE CARNET DE NOTES DE LA PLATEFORME (lti/ags) : son état, et, après la réponse, ce qui
  // attend encore (une copie notée depuis, une erreur temporaire échue).
  const retour = await etatDuRetourDesNotes(suivi.examen.id);
  if (retour?.accorde) plusTard(() => synchroniserLesNotesDeLExamen(suivi.examen.id));
  const { examen } = suivi;
  const comparaison = await comparaisonNationale(examen);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const def = SCENARIO_CHOICES.find((d) => d.code === examen.scenarioCode);
  const grille = grilleDeLExamen(examen);
  // Les seuils de la grille de l'examen : un examen noté sous une grille d'avant garde les siens.
  const seuilRelatif = seuilDAtteinteRelatifDit(grille.seuils, grille.reference.nom);
  const lien = `${origine}/examen/${examen.code}`;
  const enCours = suivi.copies.filter((c) => c.etat === "en-cours").length;
  const remises = suivi.copies.filter((c) => c.etat !== "en-cours").length;
  const message = FAITS[cree ? "cree" : (fait ?? "")] ?? null;
  const lot = examen.equite as LotDeGraines | null;
  const publie = examen.publieLe !== null;
  const etatDeLOuverture =
    suivi.ouverture === "ouvert" ? "Ouvert" : suivi.ouverture === "a-venir" ? "Pas encore ouvert" : "Fermé";

  return (
    <main id="main" className="pb-16">
      <SuiviEnDirect
        actif={enCours > 0 || envoisEnCours(retour)}
        toutesLesMs={enCours === 0 && envoisEnCours(retour) ? 5_000 : undefined}
      />
      <EnTeteDePage
        surtitre="Examen individuel"
        titre={examen.nom}
        chapeau={
          <>
            {def?.title ?? examen.scenarioCode} · niveau {examen.niveau} · {compter(examen.tours, "tour")}
            {examen.dureeTourMinutes ? ` · ${examen.dureeTourMinutes} minutes au plus par tour` : ""}
            {examen.ouverture ? ` · ouvre le ${heure(examen.ouverture)}` : ""}
            {examen.fermeture ? ` · ferme le ${heure(examen.fermeture)}` : ""}
          </>
        }
      >
        <NavigationEnseignant
          className="mt-6"
          actif="examens"
          liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {message ? (
          <p role="status" className="rounded-xl encadre-gain px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3">
            {message}
          </p>
        ) : null}

        <section aria-labelledby="code-titre" className="carte grid gap-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="code-titre" className="text-sm font-semibold text-slate-300">
                Le code à donner aux étudiants
              </h2>
              <p id="code-de-l-examen" className="mt-1 font-mono text-4xl font-bold tracking-wide text-slate-50">
                {examen.code}
              </p>
            </div>
            <p className="text-sm text-slate-300" data-ouverture={suivi.ouverture}>
              <span className="pastille-etat rounded-full px-2.5 py-1">{etatDeLOuverture}</span>
            </p>
          </div>
          <p className="break-all font-mono text-sm text-slate-300" data-lien-de-l-examen="">
            {lien}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <BoutonCopierLeLien lien={lien} variante="secondaire" />
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Dans Moodle, Canvas, Blackboard ou Brightspace : ajoutez une activité Business Arena et choisissez cet
            examen. Les étudiants y arrivent depuis le cours, sans code. Sans plateforme, ils entrent le code sur{" "}
            <span className="font-mono">/examen</span>, avec leur nom et leur numéro d&apos;étudiant, sans adresse
            électronique.
          </p>
        </section>

        <Rubrique note={`${compter(suivi.copies.length, "candidat")} · ${compter(enCours, "copie en cours", "copies en cours")} · ${compter(remises, "copie remise", "copies remises")}`}>
          Suivi en direct
        </Rubrique>
        <p className="text-xs text-slate-400" data-actualise="">
          Lu à {new Date().toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          {enCours > 0 ? ", relu de lui-même tant que des copies sont en cours." : "."}
        </p>
        {suivi.copies.length === 0 ? (
          <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">
            Personne n&apos;a encore commencé.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10" data-tableau-des-candidats="">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Candidat</th>
                  <th scope="col" className="px-3 py-2 font-semibold">État</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Durée</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Note</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Rang</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Compétences atteintes</th>
                  <th scope="col" className="px-3 py-2 font-semibold"><span className="sr-only">Décisions</span></th>
                </tr>
              </thead>
              <tbody>
                {suivi.copies.map((c) => {
                  const comp = c.notation?.etat === "notee" ? c.notation.competences : [];
                  const atteintes = comp.filter((x) => x.niveau === "acquis" || x.niveau === "maitrise").length;
                  return (
                    <tr key={c.id} data-candidat={c.numeroEtudiant ?? c.nom} data-etat={c.etat} className="border-t border-white/10">
                      <td className="px-3 py-2">
                        <span className="font-semibold text-slate-100">{c.nom}</span>
                        <span className="block text-xs text-slate-400">
                          {c.numeroEtudiant ? `n° ${c.numeroEtudiant} · ` : ""}
                          {IDENTIFICATIONS[c.identification]}
                          {c.tentative > 1 ? ` · tentative ${c.tentative}` : ""}
                          {!c.retenue && c.etat !== "en-cours" ? " · non retenue" : ""}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-200">
                        {etatDeLaLigne(c)}
                        {c.notation?.etat === "sans-note" ? (
                          <span className="block text-xs text-slate-400">{c.notation.message}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{c.dureeMinutes} min</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-100">
                        {c.note !== null ? c.note.toLocaleString("fr-FR") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{c.rang ?? "—"}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-200">{comp.length ? `${atteintes} sur ${comp.length}` : "—"}</td>
                      <td className="px-3 py-2">
                        <Link href={`/teacher/examens/${examen.id}/candidats/${c.id}`} className={LIEN_A_L_ENCRE}>
                          Décisions
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <section aria-labelledby="actions-titre" className="grid gap-3">
          <h2 id="actions-titre" className="sr-only">
            Publier, clore, exporter
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {!publie ? (
              <GuardedForm action={publierExamenAction.bind(null, examen.id)} label="publication des résultats">
                <SubmitButton pendingLabel="Publication…" className={bouton()} disabled={suivi.notees.length === 0}>
                  Publier les résultats
                </SubmitButton>
              </GuardedForm>
            ) : (
              <GuardedForm action={retirerPublicationAction.bind(null, examen.id)} label="retrait de la publication">
                <SubmitButton pendingLabel="Retrait…" className={bouton({ variante: "secondaire" })}>
                  Retirer la publication
                </SubmitButton>
              </GuardedForm>
            )}
            {!examen.closLe ? (
              <GuardedForm action={cloreExamenAction.bind(null, examen.id)} label="clôture de l'examen" timeoutMs={120_000}>
                <SubmitButton pendingLabel="Clôture…" className={bouton({ variante: "secondaire" })}>
                  Clore l&apos;examen
                </SubmitButton>
              </GuardedForm>
            ) : null}
            <a href={`/teacher/examens/${examen.id}/export`} className={bouton({ variante: "secondaire" })} data-export-csv="">
              Exporter (tableur)
            </a>
            <Link href={`/teacher/examens/${examen.id}/accreditation`} className={bouton({ variante: "secondaire" })}>
              Rapport d&apos;accréditation
            </Link>
          </div>
          <p className="text-xs text-slate-400">
            {publie
              ? `Publié le ${heure(examen.publieLe!)} : chaque candidat voit sa note et son relevé.`
              : "Tant que les résultats ne sont pas publiés, chaque candidat ne voit que son reçu."}
          </p>
        </section>

        {retour ? <RetourDesNotes etat={retour} renvoyer={renvoyerLesNotesAction.bind(null, examen.id)} /> : null}

        <Rubrique note={suivi.notees.length ? compter(suivi.notees.length, "copie notée", "copies notées") : undefined}>
          Résultats
        </Rubrique>
        {suivi.notees.length === 0 ? (
          <p className="text-sm text-slate-400">Les résultats paraissent ici dès la première copie remise et notée.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <section aria-labelledby="distribution-titre" className="carte grid gap-3 p-4 sm:p-6">
              <h3 id="distribution-titre" className="titre-carte text-slate-100">
                Distribution des notes
              </h3>
              <p className="text-sm text-slate-300">
                Moyenne <strong className="tabular-nums text-slate-100">{suivi.moyenne?.toLocaleString("fr-FR")}</strong> · médiane{" "}
                <strong className="tabular-nums text-slate-100">{suivi.mediane?.toLocaleString("fr-FR")}</strong> sur 100
              </p>
              <HistogrammeDesNotes histogramme={suivi.histogramme} />
            </section>
            <section aria-labelledby="competences-titre" className="carte grid gap-3 p-4 sm:p-6">
              <h3 id="competences-titre" className="titre-carte text-slate-100">
                La promotion, par compétence
              </h3>
              <p className="text-sm text-slate-400">
                Seuil d&apos;atteinte : « {nomDuNiveau(NIVEAU_D_ATTEINTE)} », {pourcentDuSeuil(grille.seuils.fixes.acquis)} des points rattachés
                (le trait sur chaque barre).
                {seuilRelatif ? ` ${seuilRelatif} Sur ces barres, le trait marque la moyenne des seuils des copies.` : null}
              </p>
              <CompetencesDeLaPromotion competences={suivi.competences} />
            </section>
          </div>
        )}
        <p className="rounded-lg encadre-neutre px-3 py-2.5 text-sm text-slate-300 sm:px-4" data-comparaison-nationale={comparaison.disponible ? "disponible" : "retenue"}>
          {comparaison.disponible
            ? `Comparaison nationale (${comparaison.etablissements} établissements, ${comparaison.candidats} candidats, même entreprise, même niveau, même grille) : ${comparaison.percentiles
                .map((p) => `${p.p}e percentile ${p.note.toLocaleString("fr-FR")}`)
                .join(" · ")}.`
            : comparaison.message}
        </p>

        <Rubrique note={`${grille.nom}, version ${grille.version}`}>La grille de notation</Rubrique>
        <section aria-label="La grille de notation" className="grid gap-3 text-sm">
          <p className="text-slate-300" data-etalon-de-la-grille={grille.reference.code}>
            <span className="font-semibold text-slate-100">Étalon : {grille.reference.nom}.</span> {grille.reference.definition}
          </p>
          <ul className="grid gap-2">
            {grille.lignes.map((l) => (
              <li key={l.code} className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-white/10 pt-2">
                <span className="min-w-0 flex-1 basis-64">
                  <span className="font-semibold text-slate-100">{l.libelle}</span>
                  {l.siQuestions && !examen.questions ? <span className="text-slate-400"> (questions éteintes : hors calcul)</span> : null}
                  <span className="block text-xs text-slate-400">{methodeDe(l, GRAINES_DU_BILAN.length)}</span>
                </span>
                <span className="tabular-nums text-slate-200">{l.points} points</span>
              </li>
            ))}
          </ul>
          <ul className="grid gap-1 text-xs text-slate-400">
            {justificationDe(grille).map((j) => (
              <li key={j}>{j}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-400">
            Le marché :{" "}
            {examen.modeGraine === "commune"
              ? "le même pour tous les candidats (une seule graine)."
              : `un lot de ${examen.graines.length} marchés d'égale difficulté, attribués à tour de rôle dans l'ordre d'entrée${
                  lot?.rang ? ` : la gestion neutre du secteur y finit ${lot.rang === 1 ? "1re" : `${lot.rang}e`}` : ""
                }. Dans les deux cas, la note se mesure sur les mêmes marchés rejoués pour tous.`}
          </p>
        </section>
      </div>
    </main>
  );
}
