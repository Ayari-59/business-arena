import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { grilleDeLExamen, suiviDeLExamen } from "@/services/examen.service";
import { SCENARIO_CHOICES } from "@/config/scenarios/registry";
import { methodeDe } from "@/config/examen/grille";
import {
  NIVEAUX_DE_COMPETENCE,
  NIVEAU_D_ATTEINTE,
  competencesEvaluees,
  niveauxDits,
  niveauxRelatifsDits,
  nomDuNiveau,
  seuilDAtteinteDit,
} from "@/config/examen/competences";
import { GRAINES_DU_BILAN } from "@/engine/episodes/commun";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = {
  title: "Rapport d'accréditation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LE RAPPORT D'ACCRÉDITATION D'UN EXAMEN, SUR UNE PAGE.
 *
 * Ce qu'une démarche d'assurance des apprentissages (AoL) demande de joindre à un dossier
 * AACSB ou EQUIS : les objectifs, la méthode de mesure, la grille, les résultats agrégés
 * par compétence, la part des étudiants qui atteignent le seuil, la date et l'effectif.
 * Sobre, sans nom d'étudiant, prêt à imprimer ou à enregistrer en PDF (A4 portrait).
 *
 * Il est CONÇU POUR NOURRIR un dossier d'accréditation ; il ne dit nulle part qu'un
 * organisme le reconnaît.
 *
 * Page de papier : thème clair, encre dans le bas de l'échelle, papier dans le haut
 * (tests/architecture/pages-de-papier.test.ts).
 */

const styles = `
  .rapport { max-width: 190mm; margin: 0 auto; padding: 10mm 8mm; font-size: 8.8pt; line-height: 1.38; }
  .rapport h1 { font-size: 15pt; line-height: 1.2; margin: 0; }
  .rapport h2 { font-size: 10pt; margin: 3mm 0 1mm; }
  .rapport .kicker { font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; margin: 0 0 3px; }
  .rapport table { width: 100%; border-collapse: collapse; }
  .rapport th, .rapport td { padding: 0.8mm 1.4mm; border-bottom: 0.25mm solid currentColor; vertical-align: top; text-align: left; }
  .rapport td.methode { font-size: 8pt; }
  .rapport td.n, .rapport th.n { text-align: right; font-variant-numeric: tabular-nums; }
  .rapport ul { margin: 0; padding-left: 4mm; }
  .rapport .pied { margin-top: 2.5mm; font-size: 7.5pt; }
  @media print {
    @page { size: A4 portrait; margin: 0; }
    .no-print { display: none !important; }
    body { background: #fff; }
    .rapport { padding: 7mm 12mm; }
  }
`;

const pourcent = (x: number) => `${Math.round(x * 100)} %`;
const date = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

export default async function RapportDAccreditationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const suivi = await suiviDeLExamen(session.userId, id);
  if (!suivi) notFound();
  const { examen, notees } = suivi;
  const grille = grilleDeLExamen(examen);
  // La méthode dit les seuils de la grille de l'examen : ceux qui ont compté ses étudiants.
  const niveauxRelatifs = niveauxRelatifsDits(grille.seuils, grille.reference.nom);
  const def = SCENARIO_CHOICES.find((d) => d.code === examen.scenarioCode);
  const evaluees = competencesEvaluees(examen.questions);
  const remises = suivi.copies.filter((c) => c.remisLe).map((c) => c.remisLe!.getTime());
  const debut = suivi.copies.length ? new Date(Math.min(...suivi.copies.map((c) => c.commenceLe.getTime()))) : null;
  const fin = remises.length ? new Date(Math.max(...remises)) : null;
  const candidats = new Set(suivi.copies.map((c) => `${c.nom}:${c.numeroEtudiant ?? ""}`)).size;
  const marches = GRAINES_DU_BILAN.length;
  const parNiveau = (code: string) =>
    NIVEAUX_DE_COMPETENCE.map((n) => ({
      niveau: n.code,
      n: notees.filter((c) => c.notation?.etat === "notee" && c.notation.competences.find((x) => x.code === code)?.niveau === n.code).length,
    }));

  return (
    <main id="main" data-theme="clair" className="min-h-screen bg-slate-950 text-slate-100">
      <style>{styles}</style>
      <header className="no-print mx-auto flex max-w-[190mm] flex-wrap items-center gap-3 px-4 pt-5 text-sm">
        <Link href={`/teacher/examens/${examen.id}`} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-500 transition hover:text-slate-100">
          Retour à l&apos;examen
        </Link>
        <PrintButton label="Imprimer le rapport" />
        <p className="ml-auto text-xs text-slate-600">Imprimez ou enregistrez en PDF. Une page, sans nom d&apos;étudiant.</p>
      </header>

      <article className="rapport" data-rapport-d-accreditation="">
        <p className="kicker text-slate-500">
          {suivi.etablissement} · Évaluation des acquis d&apos;apprentissage
        </p>
        <h1 className="text-slate-100">Examen individuel : {examen.nom}</h1>
        <p className="mt-1 text-slate-500">
          {def?.title ?? examen.scenarioCode}, niveau {examen.niveau}, {examen.tours} tours ·{" "}
          {debut ? `passé ${fin && date(fin) !== date(debut) ? `du ${date(debut)} au ${date(fin)}` : `le ${date(debut)}`}` : "pas encore passé"} ·
          effectif : {notees.length} {notees.length > 1 ? "copies notées" : "copie notée"} pour {candidats}{" "}
          {candidats > 1 ? "candidats" : "candidat"} · rapport établi le {date(new Date())}
        </p>

        <h2 className="text-slate-100">1. Objectifs d&apos;apprentissage</h2>
        <ul className="text-slate-300">
          {evaluees.map((c) => (
            <li key={c.code}>
              <strong className="text-slate-100">{c.nom}.</strong> {c.objectif}
            </li>
          ))}
        </ul>

        <h2 className="text-slate-100">2. Méthode</h2>
        <p className="text-slate-300">
          Mesure directe et individuelle : chaque étudiant dirige seul une entreprise simulée face à des concurrents
          pilotés par l&apos;ordinateur, sur le même scénario et le même niveau que tous les autres candidats
          {examen.modeGraine === "lot" ? ", sur un marché tiré dans un lot de marchés d'égale difficulté" : ", sur le même marché"}.
          Pour neutraliser la chance, ses décisions sont rejouées telles quelles sur {marches} marchés possibles, les
          mêmes pour tous, à côté de {grille.reference.nom} : la note juge les décisions, pas le tirage.{" "}
          {grille.reference.definition} La grille
          « {grille.nom} » (version {grille.version}, publiée le {date(new Date(`${grille.publiee}T12:00:00Z`))}) est fixée avant l&apos;épreuve.
          Chaque ligne nourrit une ou deux compétences ; le niveau d&apos;une compétence est la part des points
          rattachés : {niveauxDits(grille.seuils.fixes)}.{niveauxRelatifs ? ` ${niveauxRelatifs}` : null}{" "}
          Seuil d&apos;atteinte de l&apos;objectif : « {nomDuNiveau(NIVEAU_D_ATTEINTE)} » ({seuilDAtteinteDit(grille.seuils)}).
        </p>

        <h2 className="text-slate-100">3. Grille de notation</h2>
        <table className="text-slate-300">
          <thead>
            <tr className="text-slate-100">
              <th>Ligne</th>
              <th>Mesure</th>
              <th className="n">Points</th>
            </tr>
          </thead>
          <tbody>
            {grille.lignes
              .filter((l) => !l.siQuestions || examen.questions)
              .map((l) => (
                <tr key={l.code}>
                  <td className="text-slate-100">{l.libelle}</td>
                  <td className="methode">{methodeDe(l, marches)}</td>
                  <td className="n">{l.points}</td>
                </tr>
              ))}
          </tbody>
        </table>
        {!examen.questions ? (
          <p className="mt-1 text-slate-500">Questions de diagnostic non posées : leurs points sont répartis sur les autres lignes en proportion.</p>
        ) : null}

        <h2 className="text-slate-100">4. Résultats par compétence</h2>
        {notees.length === 0 ? (
          <p className="text-slate-300">Aucune copie notée pour l&apos;instant.</p>
        ) : (
          <table className="text-slate-300" data-resultats-par-competence="">
            <thead>
              <tr className="text-slate-100">
                <th>Compétence</th>
                <th className="n">Moyenne</th>
                {NIVEAUX_DE_COMPETENCE.map((n) => (
                  <th key={n.code} className="n">
                    {n.nom}
                  </th>
                ))}
                <th className="n">Au seuil</th>
              </tr>
            </thead>
            <tbody>
              {suivi.competences.map((c) => (
                <tr key={c.code}>
                  <td className="text-slate-100">{c.nom}</td>
                  <td className="n">{pourcent(c.moyenne)}</td>
                  {parNiveau(c.code).map((x) => (
                    <td key={x.niveau} className="n">
                      {x.n}
                    </td>
                  ))}
                  <td className="n">
                    <strong className="text-slate-100">{pourcent(c.atteinte)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="text-slate-100">5. Synthèse</h2>
        <p className="text-slate-300">
          {notees.length === 0
            ? "Les résultats paraîtront à la première copie notée."
            : `Note moyenne ${suivi.moyenne?.toLocaleString("fr-FR")} sur 100, médiane ${suivi.mediane === null ? "" : (Math.round(suivi.mediane * 10) / 10).toLocaleString("fr-FR")}. ${pourcent(
                suivi.atteinteGlobale ?? 0,
              )} des étudiants notés atteignent le seuil sur l'ensemble des compétences évaluées.`}
        </p>

        <p className="pied text-slate-500">
          Rapport produit par Business Arena, conçu pour nourrir un dossier d&apos;accréditation (démarche
          d&apos;assurance des apprentissages). Il ne vaut pas reconnaissance par un organisme d&apos;accréditation.
          Données agrégées, sans information nominative.
        </p>
      </article>
    </main>
  );
}
