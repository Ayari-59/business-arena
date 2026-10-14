import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Signe } from "@/components/signe";
import { NotionsMobilisees } from "@/components/notions-mobilisees";
import { PrintButton } from "@/components/print-button";
import { atelierByCode } from "@/config/ateliers";
import {
  dossierDuResponsable,
  LIGNES_DE_SYNTHESE,
  type DossierDuResponsable,
} from "@/config/ateliers/dossiers-des-responsables";
import { roleByCode, ROLES, type CodeDeRole } from "@/config/ateliers/roles";
import { PERIODICITY_LABELS } from "@/config/scenarios/periodicity";

/**
 * LE DOSSIER D'UN RESPONSABLE.
 *
 * Le dossier de l'équipe dit à tous ce que l'entreprise est. Celui-ci dit à
 * UN élève ce qu'il porte : sa mission, les décisions qu'il tient et ce
 * qu'elles changent, les chiffres de son domaine, ce qu'il lit à la clôture,
 * ce qu'il prépare pour chaque séance, ce qu'il demande aux autres avant de
 * valider, et sa feuille à remplir au stylo. Cinq dossiers par atelier : la
 * direction générale, qui ne tient aucune case du formulaire mais la note et
 * la validation, et les quatre responsables.
 *
 * Même règle que le dossier de l'équipe : c'est un document d'élève, rien de
 * l'enseignant n'y passe, et il se pose sur la table en noir sur blanc.
 */
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const { ATELIERS } = await import("@/config/ateliers");
  return ATELIERS.flatMap((a) => ROLES.map((r) => ({ code: a.code, role: r.code })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string; role: string }>;
}): Promise<Metadata> {
  const { code, role } = await params;
  const atelier = atelierByCode.get(code);
  const poste = roleByCode.get(role as CodeDeRole);
  if (!atelier || !poste) return {};
  return {
    title: `${poste.titreDuDossier} · ${atelier.titre}`,
    description: `Ce que ${poste.code === "direction" ? "la direction générale" : "ce responsable"} décide, lit et prépare à chaque tour de l'atelier ${atelier.titre}.`,
  };
}

/* Les classes qu'on répète : l'encre des titres et du texte, en noir à l'impression. */
const H2 = "text-xl font-bold text-slate-100 print:text-black";
const SURTITRE = "text-xs font-semibold uppercase tracking-surtitre text-slate-400 print:text-black";
const TEXTE = "text-sm leading-relaxed text-slate-300 print:text-black";
const NOTE = "text-sm leading-relaxed text-slate-400 print:text-black";
const CELLULE = "border border-white/15 px-2 py-1.5 text-slate-300 print:border-black/40 print:text-black";
const BANDEAU =
  "border border-white/15 bg-white/5 px-2 py-1 text-xs font-semibold uppercase tracking-surtitre text-amber-300 print:border-black/40 print:bg-transparent print:text-black";

export default async function DossierDuResponsablePage({
  params,
}: {
  params: Promise<{ code: string; role: string }>;
}) {
  const { code, role } = await params;
  const atelier = atelierByCode.get(code);
  const poste = roleByCode.get(role as CodeDeRole);
  if (!atelier || !poste) notFound();
  const dossier = dossierDuResponsable(atelier, poste.code);
  const periodicite = PERIODICITY_LABELS[atelier.reglages.periodicite].singular.toLowerCase();

  return (
    <main
      id="main"
      data-dossier-du-responsable={poste.code}
      className="mx-auto max-w-3xl px-6 py-12 print:max-w-none print:px-0 print:py-0 print:text-black"
    >
      <p className="text-xs uppercase tracking-annonce text-slate-400 print:hidden">
        <Link href={`/animations/${atelier.code}`} className="hover:text-slate-300">
          {atelier.titre}
        </Link>{" "}
        /{" "}
        <Link href={`/animations/${atelier.code}/dossier`} className="hover:text-slate-300">
          Dossier élève
        </Link>{" "}
        / {poste.titre}
      </p>

      <header className="mt-4 border-b border-white/10 pb-6 print:border-black/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 print:text-black">
          {poste.titreDuDossier} · {dossier.entete.diplome} · {dossier.entete.annee}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50 print:text-black">
          {poste.titre}
        </h1>
        <p className="mt-2 text-base text-slate-300 print:text-black">
          {dossier.entete.atelier} · {dossier.entete.entreprise}
        </p>
        <p className="mt-1 text-sm italic text-slate-400 print:text-black">{dossier.entete.promesse}</p>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <PrintButton label="Imprimer ce dossier" />
          <Link
            href={`/animations/${atelier.code}/dossier`}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/30"
          >
            Dossier de l&apos;équipe
          </Link>
        </div>
        {/* Les autres dossiers : chacun sait où sont ceux de ses collègues. */}
        <p className="mt-3 text-xs text-slate-400 print:hidden">
          Les autres dossiers :{" "}
          {ROLES.filter((r) => r.code !== poste.code).map((r, i) => (
            <span key={r.code}>
              {i > 0 ? " · " : ""}
              <Link
                href={`/animations/${atelier.code}/dossier/${r.code}`}
                className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
              >
                {r.titre}
              </Link>
            </span>
          ))}
        </p>
      </header>

      {/* 1. La mission. */}
      <section className="mt-8 break-inside-avoid rounded-xl border-l-2 border-amber-400 bg-amber-950/10 px-5 py-4 print:border-black/40 print:bg-transparent">
        <h2 className="text-xs font-semibold uppercase tracking-surtitre text-amber-300 print:text-black">
          Votre mission
        </h2>
        <p className={`mt-2 ${TEXTE}`}>{dossier.mission}</p>
        <p className={`mt-3 ${NOTE}`}>
          Vous dirigez {dossier.entete.entreprise} pendant {dossier.feuille.tours.length} tours, un{" "}
          {periodicite} par tour, avec {poste.code === "direction" ? "les quatre responsables" : "les autres responsables et la direction générale"}.
        </p>
      </section>

      {dossier.direction ? (
        <DirectionGenerale dossier={dossier} />
      ) : (
        <Responsable dossier={dossier} />
      )}

      {/* 5 (responsable) / 5 (direction). Ce qu'il prépare pour chaque séance. */}
      <section className="mt-10" data-seances="">
        <h2 className={H2}>Ce que vous préparez pour chaque séance</h2>
        <p className={`mt-2 ${NOTE}`}>
          {dossier.direction
            ? "Pour chaque séance : l'objectif que l'équipe vise, le livrable qu'elle rend et que vous tenez, et la trace à verser. Vous ne rendez rien à la place des autres : vous vous assurez que c'est rendu."
            : "Pour chaque séance qui joue un tour : les décisions de votre poste que le tour demande, et les notions de la séance qui relèvent de vous. Les notions sans responsable attitré vont à toute l'équipe."}
        </p>
        <div className="mt-4 space-y-4">
          {dossier.seances.map((s) => (
            <article
              key={s.numero}
              className="break-inside-avoid rounded-xl border border-white/10 p-5 print:border-black/20"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 print:text-black">
                Séance {s.numero}
                {s.essai
                  ? " · tour d'essai, qui ne compte pas"
                  : s.tourJoue !== null
                    ? ` · tour ${s.tourJoue}`
                    : " · aucun tour joué"}
                {s.derniere ? " · dernière séance" : ""}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-50 print:text-black">{s.titre}</h3>
              {s.objectif ? <p className={`mt-2 ${TEXTE}`}>{s.objectif}</p> : null}
              {s.decisions.length > 0 ? (
                <>
                  <p className={`mt-3 ${SURTITRE}`}>Vos décisions ce tour</p>
                  <p className={`mt-1 ${TEXTE}`}>{s.decisions.join(" · ")}</p>
                </>
              ) : null}
              {s.livrable ? (
                <>
                  <p className={`mt-3 ${SURTITRE}`}>
                    {s.derniere ? "Le rapport final, que vous tenez" : "Le livrable d'équipe, que vous tenez"}
                  </p>
                  <p className={`mt-1 ${TEXTE}`}>{s.livrable}</p>
                </>
              ) : null}
              {s.notions.length > 0 ? (
                <p className={`mt-3 ${NOTE}`}>
                  Notions à préparer : <NotionsMobilisees notions={s.notions} />
                </p>
              ) : null}
              {s.trace ? (
                <p className="mt-2 border-t border-white/10 pt-2 text-sm italic leading-relaxed text-slate-400 print:border-black/20 print:text-black">
                  La trace à verser : « {s.trace} »
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* 6. Avant de valider : les questions aux autres, et celles à se poser. */}
      <section className="mt-10 break-inside-avoid" data-avant-de-valider="">
        <h2 className={H2}>Avant de valider le tour</h2>
        <p className={`mt-3 ${SURTITRE}`}>Ce que vous demandez aux autres</p>
        <ul className={`mt-1 space-y-1.5 ${TEXTE}`}>
          {dossier.aDemander.map((q) => (
            <li key={q}>· {q}</li>
          ))}
        </ul>
        {dossier.aVerifier.length > 0 ? (
          <>
            <p className={`mt-4 ${SURTITRE}`}>Ce que vous vérifiez vous-même</p>
            <ul className={`mt-1 space-y-1.5 ${TEXTE}`}>
              {dossier.aVerifier.map((q) => (
                <li key={q}>· {q}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {/* 7. La feuille, tours en colonnes. */}
      <section className="mt-10 break-before-page break-inside-avoid" data-feuille-de-decision="">
        <h2 className={H2}>{dossier.direction ? "Votre feuille de synthèse" : "Votre feuille de décision"}</h2>
        <p className={`mt-2 ${NOTE}`}>
          {dossier.direction
            ? "À remplir tour après tour, en une ligne par case : la décision clé, ce qu'on en attendait, ce qui s'est passé, ce qu'on change. C'est la relecture des quatre lignes qui fait la synthèse de fin d'atelier."
            : "À remplir tour après tour : ce que vous décidez avant la clôture, ce que vous lisez après. Les deux se relisent ensemble en fin d'atelier."}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-white/15 px-2 py-1.5 text-left font-semibold text-slate-300 print:border-black/40 print:text-black">
                  Équipe :
                </th>
                {dossier.feuille.tours.map((t) => (
                  <th
                    key={t}
                    className="w-24 border border-white/15 px-2 py-1.5 font-semibold text-slate-300 print:border-black/40 print:text-black"
                  >
                    Tour {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dossier.direction ? (
                <>
                  <tr>
                    <td colSpan={dossier.feuille.tours.length + 1} className={BANDEAU}>
                      Le tour, en quatre lignes
                    </td>
                  </tr>
                  {LIGNES_DE_SYNTHESE.filter((l) => l !== "Place au classement").map((ligne) => (
                    <tr key={ligne}>
                      <td className={CELLULE}>{ligne}</td>
                      {dossier.feuille.tours.map((t) => (
                        <td key={t} className="h-12 border border-white/15 print:border-black/40" />
                      ))}
                    </tr>
                  ))}
                </>
              ) : (
                <>
                  <tr>
                    <td colSpan={dossier.feuille.tours.length + 1} className={BANDEAU}>
                      Ce que je décide
                    </td>
                  </tr>
                  {dossier.feuille.decisions.length > 0 ? (
                    dossier.feuille.decisions.map((ligne) => (
                      <tr key={ligne}>
                        <td className={CELLULE}>{ligne}</td>
                        {dossier.feuille.tours.map((t) => (
                          <td key={t} className="h-7 border border-white/15 print:border-black/40" />
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className={`${CELLULE} italic`} colSpan={dossier.feuille.tours.length + 1}>
                        Aucune case du formulaire à ce niveau : vous surveillez, vous conseillez, vous ne saisissez pas.
                      </td>
                    </tr>
                  )}
                </>
              )}
              <tr>
                <td colSpan={dossier.feuille.tours.length + 1} className={BANDEAU}>
                  {dossier.direction ? "Ce que je relève à la clôture" : "Ce que je lis à la clôture"}
                </td>
              </tr>
              {dossier.feuille.indicateurs.map((ligne) => (
                <tr key={ligne}>
                  <td className={CELLULE}>{ligne}</td>
                  {dossier.feuille.tours.map((t) => (
                    <td key={t} className="h-7 border border-white/15 print:border-black/40" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. La répartition selon l'effectif. */}
      <section
        className="mt-10 break-inside-avoid border-t border-white/10 pt-6 print:border-black/20"
        data-repartition=""
      >
        <h2 className={H2}>Qui tient quel dossier, selon la taille de l&apos;équipe</h2>
        <p className={`mt-2 ${NOTE}`}>
          Cinq dossiers, un par poste. La fiche de l&apos;atelier conseille{" "}
          {atelier.reglages.effectifParEquipe} par équipe ; voici comment les dossiers se partagent à cet
          effectif.
        </p>
        <ul className={`mt-2 space-y-1.5 ${TEXTE}`}>
          {dossier.repartition.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------------------
 * Les sections 2 à 4 d'un responsable : ses décisions, ses chiffres, ses
 * indicateurs.
 * ------------------------------------------------------------------------- */
function Responsable({ dossier }: { dossier: DossierDuResponsable }) {
  return (
    <>
      <section className="mt-10" data-decisions="">
        <h2 className={H2}>Les décisions que vous portez</h2>
        {dossier.decisions.length > 0 ? (
          <>
            <p className={`mt-2 ${NOTE}`}>
              Les cases de l&apos;écran de décision qui sont les vôtres, ce que chacune change dans le jeu, et
              le tour à partir duquel elle agit. Une décision payée ce tour qui n&apos;agit qu&apos;au suivant se
              décide un tour à l&apos;avance.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-left uppercase tracking-wide text-slate-400 print:text-black">
                    <th className="border-b border-white/10 py-1.5 pr-3 font-medium print:border-black/30">
                      La case
                    </th>
                    <th className="border-b border-white/10 py-1.5 pr-3 font-medium print:border-black/30">
                      Ce qu&apos;elle change
                    </th>
                    <th className="border-b border-white/10 py-1.5 font-medium print:border-black/30">
                      Elle agit
                    </th>
                  </tr>
                </thead>
                <tbody className="text-slate-300 print:text-black">
                  {dossier.decisions.map((d) => (
                    <tr key={d.champ} className="border-b border-white/5 align-top print:border-black/20">
                      <td className="py-2 pr-3 font-medium text-slate-100 print:text-black">{d.nom}</td>
                      <td className="py-2 pr-3 leading-relaxed">{d.effet}</td>
                      <td className="whitespace-nowrap py-2">{d.agit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className={`mt-2 ${TEXTE}`}>
            À ce niveau, aucune case de l&apos;écran de décision n&apos;est la vôtre : vous surveillez votre
            domaine, vous conseillez les autres responsables, et le volume doit se plier à ce que vous
            constatez.
          </p>
        )}
        {dossier.ouverture ? (
          <p className={`mt-3 ${NOTE}`} data-ouverture="">
            Au niveau {dossier.ouverture.niveau} ({dossier.ouverture.niveauNom}), vos leviers s&apos;ouvrent
            {dossier.decisions.length > 0 ? " plus largement" : ""} : {dossier.ouverture.leviers.join(", ")}.
          </p>
        ) : null}
      </section>

      {dossier.chiffres ? (
        <section className="mt-10 break-inside-avoid" data-chiffres="">
          <h2 className={H2}>Les chiffres de votre domaine</h2>
          <p className={`mt-2 ${NOTE}`}>Tels que le jeu les applique, à l&apos;ouverture de la partie.</p>
          <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {dossier.chiffres.lignes.map((l) => (
              <div
                key={l.libelle}
                className="flex justify-between gap-3 border-b border-white/5 py-1 print:border-black/10"
              >
                <dt className="text-slate-400 print:text-black">{l.libelle}</dt>
                <dd className="text-right tabular-nums text-slate-100 print:text-black">{l.valeur}</dd>
              </div>
            ))}
          </dl>
          {dossier.chiffres.tableau ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-left uppercase tracking-wide text-slate-400 print:text-black">
                    {dossier.chiffres.tableau.entetes.map((e) => (
                      <th
                        key={e}
                        className="border-b border-white/10 py-1.5 pr-3 font-medium print:border-black/30"
                      >
                        {e}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-300 print:text-black">
                  {dossier.chiffres.tableau.lignes.map((ligne, i) => (
                    <tr key={i} className="border-b border-white/5 print:border-black/20">
                      {ligne.map((c, j) => (
                        <td
                          key={j}
                          className={`py-1.5 pr-3 ${j > 0 ? "tabular-nums" : "text-slate-100 print:text-black"}`}
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <Indicateurs dossier={dossier} />
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Les sections 1 à 4 de la direction : le mandat, ce qu'elle porte, la liste
 * de contrôle, les indicateurs.
 * ------------------------------------------------------------------------- */
function DirectionGenerale({ dossier }: { dossier: DossierDuResponsable }) {
  const d = dossier.direction!;
  const { mandat } = d;
  const periodicite = PERIODICITY_LABELS[mandat.periodicite].plural;
  return (
    <>
      <section className="mt-10" data-mandat="">
        <h2 className={H2}>Le mandat et la règle du jeu</h2>
        <p className={`mt-2 ${TEXTE}`}>{mandat.objectif}</p>
        <p className={`mt-2 ${NOTE}`}>
          {mandat.tours} tours, un tour par {PERIODICITY_LABELS[mandat.periodicite].singular.toLowerCase()} (
          {mandat.tours} {periodicite} en tout)
          {mandat.tourDEssai !== null
            ? `, précédés ${mandat.tourDEssai === 1 ? "d'un tour d'essai" : `de ${mandat.tourDEssai} tours d'essai`} qui ne comptent pas`
            : ""}
          .
        </p>

        <p className={`mt-4 ${SURTITRE}`}>Ce qui fait le classement</p>
        <p className={`mt-1 ${TEXTE}`}>
          Le classement suit l&apos;{mandat.indice.sigle}, l&apos;{mandat.indice.nom.toLowerCase()}, qui pèse six
          dimensions :
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full max-w-md border-collapse text-xs">
            <tbody className="text-slate-300 print:text-black">
              {mandat.dimensions.map((dim) => (
                <tr key={dim.label} className="border-b border-white/5 print:border-black/20">
                  <td className="py-1 pr-3 text-slate-100 print:text-black">{dim.label}</td>
                  <td className="py-1 text-right tabular-nums">{Math.round(dim.poids * 100)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className={`mt-2 space-y-1 ${NOTE}`}>
          {mandat.regles.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>

        <p className={`mt-4 ${SURTITRE}`}>Le premier arbitrage</p>
        <p className={`mt-1 ${TEXTE}`}>{mandat.premierArbitrage.question}</p>
        <ul className="mt-2 space-y-2">
          {mandat.premierArbitrage.routes.map((route) => (
            <li key={route.label} className="rounded-lg border border-white/10 px-4 py-3 text-sm print:border-black/20">
              <p className="font-medium text-slate-100 print:text-black">{route.label}</p>
              <p className="mt-1 text-slate-400 print:text-black">
                <Signe sens="gain" /> {route.gain}
              </p>
              <p className="text-slate-400 print:text-black">
                <Signe sens="cout" /> {route.risque}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 break-inside-avoid" data-porte="">
        <h2 className={H2}>Ce que vous portez</h2>
        <p className={`mt-2 ${NOTE}`}>
          Aucune case de décision : chacune appartient à un responsable. Quatre choses sont à vous.
        </p>
        <ul className={`mt-2 space-y-1.5 ${TEXTE}`}>
          {d.porte.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 break-inside-avoid" data-liste-de-controle="">
        <h2 className={H2}>L&apos;arbitrage avant validation</h2>
        <p className={`mt-2 ${NOTE}`}>
          La liste de contrôle à passer avec les responsables concernés avant de valider : chaque ligne ne
          cite que des décisions que l&apos;écran propose à ce niveau.
        </p>
        <ol className="mt-3 space-y-2">
          {d.controle.map((p, i) => (
            <li key={p.question} className="rounded-lg border border-white/10 px-4 py-3 text-sm print:border-black/20">
              <p className="text-slate-100 print:text-black">
                <span className="font-semibold">{i + 1}.</span> {p.question}
              </p>
              <p className="mt-1 text-xs text-slate-400 print:text-black">
                À régler avec : {p.entre.map((c) => roleByCode.get(c)!.titre.toLowerCase()).join(", ")}.
              </p>
            </li>
          ))}
        </ol>
      </section>

      <Indicateurs dossier={dossier} />
    </>
  );
}

function Indicateurs({ dossier }: { dossier: DossierDuResponsable }) {
  return (
    <section className="mt-10 break-inside-avoid" data-indicateurs="">
      <h2 className={H2}>Ce que vous lisez à chaque clôture</h2>
      <p className={`mt-2 ${NOTE}`}>
        {dossier.direction
          ? "Les chiffres de direction, dans l'ordre où on les lit : le résultat, la caisse, le marché, le rang, puis les dimensions de l'indice."
          : "Les résultats communs qui vous concernent, puis les indicateurs du métier qui sont les vôtres."}
      </p>
      <ul className={`mt-2 space-y-1 ${TEXTE}`}>
        {dossier.indicateurs.map((i) => (
          <li key={i}>· {i}</li>
        ))}
      </ul>
    </section>
  );
}
