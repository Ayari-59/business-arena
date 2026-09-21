import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { SCENARIOS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { DIFFICULTY_PRESETS, QUIZ_MODES } from "@/config/difficulty";
import { MISSED_POLICY_LABELS, MISSED_POLICY_HELP } from "@/config/missed-situation";
import { BPI_V2_DIMENSIONS, V2_DIMENSION_LABELS, scoringWeightsV2 } from "@/scoring/bpi";
import { champsOuverts } from "@/config/duree-du-tour";
import { manuel, type Bloc, type FaitsDuManuel } from "@/config/manuel";
import { SITE_URL } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manuel de l'enseignant",
  robots: { index: false, follow: false },
};

/**
 * LE MANUEL, IMPRIMABLE.
 *
 * La fiche d'une page dit quoi faire pendant la séance ; ce manuel dit
 * pourquoi l'appli est faite ainsi, ce que font les réglages, et quoi faire
 * quand ça se passe mal. On le lit une fois avant de se lancer, ou on le
 * dépose dans un classeur d'établissement.
 *
 * TOUT CE QUI SE COMPTE SE LIT DES REGISTRES : la liste des secteurs, celle
 * des niveaux et le nombre de champs qu'ils ouvrent, les dimensions de l'IPG
 * et leurs poids, les modes de questions, le barème des indices. Un scénario
 * ajouté demain entre dans le manuel sans qu'on y touche, et aucun chiffre
 * recopié ne peut diverger de l'application.
 */

const styles = `
  .manuel { max-width: 180mm; margin: 0 auto; padding: 12mm 10mm 20mm; }
  .manuel h1 { font-size: 24pt; line-height: 1.1; margin: 4px 0 0; }
  .manuel .kicker { font-size: 8.5pt; letter-spacing: .2em; text-transform: uppercase; margin: 0; }
  .manuel .chapeau-doc { font-size: 10.5pt; line-height: 1.55; margin: 8px 0 0; }
  .manuel .sommaire { margin-top: 8mm; font-size: 10pt; line-height: 1.7; }
  .manuel section { margin-top: 9mm; break-inside: auto; }
  .manuel h2 { font-size: 14pt; margin: 0; break-after: avoid; }
  .manuel .chapeau { font-size: 9.5pt; line-height: 1.5; margin: 2mm 0 0; break-after: avoid; }
  .manuel p.bloc { font-size: 10pt; line-height: 1.55; margin: 3.5mm 0 0; }
  .manuel .bloc-titre { font-size: 9pt; letter-spacing: .1em; text-transform: uppercase; margin: 5mm 0 1.5mm; }
  .manuel ul { margin: 2mm 0 0; padding-left: 5mm; font-size: 10pt; line-height: 1.5; }
  .manuel li { margin-top: 1.8mm; break-inside: avoid; }
  .manuel table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 1mm; }
  .manuel th { text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .06em; padding: 1.5mm 2mm 1.5mm 0; }
  .manuel td { padding: 1.6mm 2mm 1.6mm 0; vertical-align: top; line-height: 1.4; }
  .manuel .encadre { margin-top: 4mm; padding: 3mm 4mm; font-size: 9.5pt; line-height: 1.5; break-inside: avoid; }
  .manuel .encadre-titre { font-weight: 600; }
  @media print {
    @page { size: A4 portrait; margin: 14mm 16mm; }
    .no-print { display: none !important; }
    body { background: #fff; }
    .manuel { padding: 0; max-width: none; }
    .manuel section { break-inside: avoid-page; }
  }
`;

function BlocRendu({ bloc }: { bloc: Bloc }) {
  if (bloc.type === "texte") {
    return <p className="bloc text-slate-700">{bloc.texte}</p>;
  }
  if (bloc.type === "encadre") {
    return (
      <div className="encadre rounded-lg border border-slate-300 bg-slate-50 text-slate-700">
        <span className="encadre-titre text-slate-900">{bloc.titre}</span> {bloc.texte}
      </div>
    );
  }
  if (bloc.type === "liste") {
    return (
      <>
        {bloc.titre ? <p className="bloc-titre text-slate-500">{bloc.titre}</p> : null}
        <ul className="text-slate-700">
          {(bloc.items ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <>
      <p className="bloc-titre text-slate-500">{bloc.titre}</p>
      <table>
        <thead>
          <tr className="border-b border-slate-300 text-slate-500">
            {(bloc.colonnes ?? []).map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-700">
          {(bloc.lignes ?? []).map((ligne) => (
            <tr key={ligne.join("|")} className="border-b border-slate-200">
              {ligne.map((cellule, i) => (
                <td key={i} className={i === 0 ? "font-medium text-slate-900" : undefined}>
                  {cellule}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default async function ManuelPage() {
  const session = await getSession();
  if (!session) redirect("/teacher/login");

  // Le scénario dont on donne les poids en exemple : le premier du registre,
  // nommé dans le texte pour qu'on ne les prenne pas pour une règle générale.
  const reference = SCENARIOS[0]!;
  const poids = scoringWeightsV2(reference.scenario.scoring);

  // Le barème des indices se lit sur une situation réelle : ses coûts
  // s'additionnent, et ce qui reste du score est ce que l'élève voit annoncé
  // sur le bouton avant de cliquer.
  const hints = reference.situations[0]?.hints ?? [];
  const scoreRestantParIndice = hints.map((_, i) =>
    Math.max(0.2, 1 - hints.slice(0, i + 1).reduce((t, h) => t + h.costRatio, 0)),
  );

  const faits: FaitsDuManuel = {
    scenarios: SCENARIOS.map((s) => ({
      nom: s.shortName ?? s.title,
      secteur: SECTOR_LABELS[s.sector],
      accroche: s.tagline,
    })),
    niveaux: DIFFICULTY_PRESETS.map((p) => ({
      rang: p.level,
      nom: p.name,
      accroche: p.tagline,
      champs: champsOuverts(p.decisions),
    })),
    dimensions: BPI_V2_DIMENSIONS.map((d) => ({
      nom: V2_DIMENSION_LABELS[d],
      poids: poids[d],
    })),
    scenarioDesPoids: reference.shortName ?? reference.title,
    modesDeQuestions: QUIZ_MODES.map((m) => ({ nom: m.name, aide: m.help })),
    situationsManquees: (Object.keys(MISSED_POLICY_LABELS) as (keyof typeof MISSED_POLICY_LABELS)[])
      .map((k) => ({ nom: MISSED_POLICY_LABELS[k], aide: MISSED_POLICY_HELP[k] })),
    scoreRestantParIndice,
    adresse: `${SITE_URL.replace(/^https?:\/\//, "")}/join`,
  };

  const chapitres = manuel(faits);

  return (
    <main id="main" data-theme="clair" className="min-h-screen bg-white text-slate-900">
      <style>{styles}</style>

      <header className="no-print mx-auto flex max-w-[180mm] flex-wrap items-center gap-3 px-4 pt-5 text-sm">
        <Link
          href="/teacher"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 transition hover:text-slate-900"
        >
          ← Espace enseignant
        </Link>
        <Link
          href="/guide"
          className="rounded-lg border border-slate-300 px-3 py-2 text-slate-600 transition hover:text-slate-900"
        >
          Guide en ligne
        </Link>
        <p className="ml-auto text-xs text-slate-500">
          Imprimez (Ctrl+P) ou enregistrez en PDF.
        </p>
      </header>

      <article className="manuel">
        <p className="kicker text-amber-700">Business Arena</p>
        <h1>Manuel de l&apos;enseignant</h1>
        <p className="chapeau-doc text-slate-600">
          Tout ce qu&apos;il faut savoir avant la première séance, et le recours quand
          quelque chose se passe mal. Les listes, les niveaux, les poids de l&apos;indice et
          les barèmes de ce manuel sont lus de l&apos;application au moment où vous
          l&apos;imprimez : ils ne peuvent pas diverger de ce que vous verrez à l&apos;écran.
        </p>

        <nav className="sommaire" aria-label="Sommaire">
          <ol className="text-slate-700">
            {chapitres.map((c, i) => (
              <li key={c.id}>
                {i + 1}. {c.titre}
              </li>
            ))}
          </ol>
        </nav>

        {chapitres.map((c, i) => (
          <section key={c.id}>
            <h2 className="text-slate-900">
              {i + 1}. {c.titre}
            </h2>
            <p className="chapeau text-slate-500">{c.chapeau}</p>
            {c.blocs.map((bloc, j) => (
              <BlocRendu key={j} bloc={bloc} />
            ))}
          </section>
        ))}

        <p className="mt-8 text-xs text-slate-400">
          {faits.adresse.replace("/join", "")} · Manuel généré le{" "}
          {new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}
        </p>
      </article>
    </main>
  );
}
