import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import { ParagrapheSurMesure } from "@/components/encart-sur-mesure";
import { PARCOURS } from "@/config/parcours";
import {
  AU_DELA_DES_SEANCES,
  blocsDuChapitre,
  coursDeLaFormation,
  formationsAvecUnePage,
  tableauDeCouverture,
} from "@/config/couverture";
import { scenariosServant } from "@/config/scenarios/formations-servies";
import { PASTILLE_D_ADEQUATION } from "@/components/adequation";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { PiedDePage } from "@/components/pied-de-page";

/**
 * LA PAGE D'UN DIPLÔME : SON RÉFÉRENTIEL ENTIER, ET CE QUI LE TRAVAILLE.
 *
 * La page des parcours répond en un coup d'œil, diplôme par diplôme, dans des
 * tiroirs. Elle ne liste que ce que l'arène travaille : un bloc que rien ne
 * travaille n'y paraît pas, et son absence ne se voit pas. Un enseignant qui
 * prépare une inspection, ou qui défend un achat devant son établissement, a
 * besoin de l'inverse : son texte en entier, dans son ordre, et pour chaque
 * entrée la preuve, séance d'atelier ou chapitre du cours, ou l'aveu que rien
 * ne la travaille.
 *
 * Tout se lit dans les données (config/couverture.ts) : les séances nomment
 * leurs blocs, les chapitres les leurs, et le registre des référentiels donne
 * le texte. Ajoutez une séance ou un chapitre, le tableau suit.
 */

export function generateStaticParams(): { formation: string }[] {
  return formationsAvecUnePage().map((f) => ({ formation: f.code }));
}

/** La formation demandée, si elle a sa page. */
function formationDeLaPage(code: string) {
  return formationsAvecUnePage().find((f) => f.code === code);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formation: string }>;
}): Promise<Metadata> {
  const formation = formationDeLaPage((await params).formation);
  if (!formation) return {};
  return {
    alternates: { canonical: `/parcours/${formation.code}` },
    title: `${formation.sigle} : tableau de couverture`,
    description: `Le référentiel du ${formation.nom}, entrée par entrée : les séances d'atelier et les chapitres du cours qui le travaillent, et ce que rien ne travaille.`,
  };
}

/** « séance 3 » ou « séances 2, 4 et 5 ». */
function seancesEnClair(numeros: readonly number[]): string {
  if (numeros.length === 1) return `séance ${numeros[0]}`;
  return `séances ${numeros.slice(0, -1).join(", ")} et ${numeros[numeros.length - 1]}`;
}

export default async function PageDuDiplome({
  params,
}: {
  params: Promise<{ formation: string }>;
}) {
  const formation = formationDeLaPage((await params).formation);
  if (!formation) notFound();
  const code = formation.code;
  const { referentiel, lignes } = tableauDeCouverture(code);
  const ateliers = ATELIERS.filter((a) => a.formations.includes(code));
  const parcours = PARCOURS.find((p) => p.formation === code);
  const cours = coursDeLaFormation(code);
  const entreprises = scenariosServant(code).map((s) => s.playerTeamName);
  const travailles = lignes.filter((l) => l.couverture).length;
  // Les épisodes qui servent ce diplôme, une fois chacun, avec les entrées
  // qu'ils travaillent : la liste que l'enseignant distribue.
  const situations = [
    ...new Map(
      lignes.flatMap((l) =>
        (l.couverture?.situations ?? []).map((s) => [s.code, s] as const),
      ),
    ).values(),
  ].map((s) => ({
    ...s,
    entrees: lignes
      .filter((l) => l.couverture?.situations.some((x) => x.code === s.code))
      .map((l) => l.bloc),
  }));
  // Les chapitres qui servent le diplôme sans citer aucun de ses blocs : leur
  // programme n'a pas été confronté au texte, et la page le dit sous le tableau.
  const sansBloc = cours
    .flatMap((g) => g.chapitres)
    .filter((c) => blocsDuChapitre(c, code).length === 0);

  return (
    <>
      <main id="main" className="min-h-screen bg-slate-950 text-slate-100">
        <EnTeteDePage
          surtitre={
            <>
              <Link
                href="/parcours"
                className="underline-offset-4 hover:text-amber-300 hover:underline"
              >
                Parcours par diplôme
              </Link>{" "}
              · {formation.sigle}
            </>
          }
          titre={formation.nom}
          chapeau={
            referentiel ? (
              <>
                {travailles} sur {lignes.length}{" "}
                {referentiel.label.toLowerCase()} {referentiel.accord} par
                l&apos;arène, en séance d&apos;atelier, dans un chapitre du
                cours ou dans un épisode joué en situation. Le tableau suit le texte, entrée par entrée, et dit aussi
                ce que rien ne travaille.
              </>
            ) : (
              <>
                Le référentiel de ce diplôme n&apos;a pas encore été confronté à
                son texte : le tableau reprend les blocs que les ateliers
                citent, tels qu&apos;ils les citent, et ne peut pas dire ce qui
                manque.
              </>
            )
          }
        />

        <div className={`${COLONNE_DE_PAGE} grid gap-10 pb-16`}>
          <section aria-labelledby="tableau" className="grid gap-4">
            <h2 id="tableau" className="text-2xl font-bold text-slate-50">
              Le tableau de couverture
            </h2>
            {referentiel ? (
              <p className="text-sm leading-relaxed text-slate-400">
                Source : {referentiel.source}
              </p>
            ) : null}
            {/*
              UN SEUL TABLEAU, QUI S'EMPILE SUR TÉLÉPHONE. Quatre colonnes ne
              tiennent pas à 390 px ; les doubler d'une liste de cartes ferait
              lire deux fois la même chose à qui cherche un mot. Sous 768 px,
              chaque ligne devient une carte et chaque cellule dit son nom.
            */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table
                data-tableau-de-couverture=""
                className="block w-full text-sm md:table"
              >
                <caption className="sr-only">
                  Couverture du référentiel du {formation.nom}, entrée par
                  entrée.
                </caption>
                <thead className="hidden md:table-header-group">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th scope="col" className="px-4 py-2 font-medium">
                      {referentiel?.label ?? "Blocs cités"}
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Dans les ateliers
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Dans le cours
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      En situation
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Adéquation
                    </th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group">
                  {lignes.map((l, i) => {
                    const c = l.couverture;
                    const nouvellePartie =
                      l.partie && l.partie !== lignes[i - 1]?.partie;
                    return (
                      <Fragment key={l.bloc}>
                        {nouvellePartie ? (
                          <tr className="grid border-t border-white/10 bg-slate-900/60 md:table-row">
                            <th
                              scope="colgroup"
                              colSpan={5}
                              className="block px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-amber-400 md:table-cell"
                            >
                              {l.partie}
                            </th>
                          </tr>
                        ) : null}
                        <tr
                          data-bloc={l.bloc}
                          data-couvert={c ? "oui" : "non"}
                          className="grid gap-2 border-t border-white/5 px-4 py-4 align-top md:table-row md:p-0"
                        >
                          <th
                            scope="row"
                            className="min-w-0 text-left font-medium text-slate-200 md:px-4 md:py-3 md:align-top"
                          >
                            {l.bloc}
                            {c?.commentaire ? (
                              <span className="mt-1 block text-sm font-normal leading-relaxed text-slate-400">
                                {c.commentaire}
                              </span>
                            ) : null}
                          </th>
                          <td className="min-w-0 text-slate-300 md:px-4 md:py-3 md:align-top">
                            <span className="text-xs uppercase tracking-wide text-slate-400 md:hidden">
                              Dans les ateliers :{" "}
                            </span>
                            {c && c.presences.length > 0 ? (
                              <ul className="grid gap-1">
                                {c.presences.map((p) => (
                                  <li key={p.code}>
                                    <Link
                                      href={`/animations/${p.code}`}
                                      className="underline-offset-4 hover:text-amber-300 hover:underline"
                                    >
                                      {p.titre}
                                    </Link>{" "}
                                    <span className="text-slate-400">
                                      · {seancesEnClair(p.seances)} sur{" "}
                                      {p.seancesEnTout}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400">
                                Aucune séance
                              </span>
                            )}
                          </td>
                          <td className="min-w-0 text-slate-300 md:px-4 md:py-3 md:align-top">
                            <span className="text-xs uppercase tracking-wide text-slate-400 md:hidden">
                              Dans le cours :{" "}
                            </span>
                            {c && c.chapitres.length > 0 ? (
                              <ul className="grid gap-1">
                                {c.chapitres.map((ch) => (
                                  <li key={ch.code}>
                                    <Link
                                      href={`/cours/${ch.code}`}
                                      className="underline-offset-4 hover:text-amber-300 hover:underline"
                                    >
                                      {ch.titre}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400">
                                Aucun chapitre
                              </span>
                            )}
                          </td>
                          <td className="min-w-0 text-slate-300 md:px-4 md:py-3 md:align-top">
                            <span className="text-xs uppercase tracking-wide text-slate-400 md:hidden">
                              En situation :{" "}
                            </span>
                            {c && c.situations.length > 0 ? (
                              <ul className="grid gap-1">
                                {c.situations.map((s) => (
                                  <li key={s.code} data-situation={s.code}>
                                    <Link
                                      href={`/entreprises/episode/${s.code}`}
                                      className="underline-offset-4 hover:text-amber-300 hover:underline"
                                    >
                                      {s.titre}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400">
                                Aucun épisode
                              </span>
                            )}
                          </td>
                          <td className="md:px-4 md:py-3 md:align-top">
                            {c ? (
                              <span
                                className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${PASTILLE_D_ADEQUATION[c.adequation].className}`}
                              >
                                {PASTILLE_D_ADEQUATION[c.adequation].label}
                              </span>
                            ) : (
                              <span className="inline-block whitespace-nowrap rounded-full border border-dashed border-slate-500/50 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-400">
                                non travaillé
                              </span>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {ateliers
              .flatMap((a) => AU_DELA_DES_SEANCES[a.code] ?? [])
              .map((note) => (
                <p
                  key={note.referentiel}
                  className="rounded-lg border border-white/5 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-400"
                >
                  <span className="font-medium text-slate-300">
                    {note.referentiel}
                  </span>
                  , hors séance : {note.quoi}
                </p>
              ))}

            {sansBloc.length > 0 ? (
              <p
                data-chapitres-sans-bloc=""
                className="rounded-lg border border-white/5 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-400"
              >
                {sansBloc.length > 1
                  ? `${sansBloc.length} chapitres du cours servent ce diplôme sans figurer au tableau : le programme qu'ils suivent n'est pas encore au registre des référentiels, faute d'avoir été confronté à son texte. Plutôt que de leur prêter un thème de mémoire, le tableau attend cette lecture.`
                  : "Un chapitre du cours sert ce diplôme sans figurer au tableau : le programme qu'il suit n'est pas encore au registre des référentiels, faute d'avoir été confronté à son texte. Plutôt que de lui prêter un thème de mémoire, le tableau attend cette lecture."}
              </p>
            ) : null}
          </section>

          {cours.length > 0 ? (
            <section aria-labelledby="cours" className="grid gap-4">
              <h2 id="cours" className="text-2xl font-bold text-slate-50">
                Le cours pour ce diplôme
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                Des chapitres guidés, sur les chiffres d&apos;une entreprise de
                l&apos;arène. Le premier chapitre du cours est libre ; les
                autres s&apos;ouvrent aux établissements sous licence.
              </p>
              {cours.map((g) => (
                <div key={g.parcours.code} className="carte grid gap-2 p-4">
                  <h3 className="font-semibold text-slate-100">
                    {g.parcours.titre}
                  </h3>
                  <ul className="grid gap-1 text-sm">
                    {g.chapitres.map((ch) => (
                      <li
                        key={ch.code}
                        className="flex flex-wrap items-baseline gap-x-2"
                      >
                        <span className="text-xs text-slate-400">
                          Palier {ch.palier}
                        </span>
                        <Link
                          href={`/cours/${ch.code}`}
                          className="text-slate-200 underline underline-offset-4 hover:text-amber-300"
                        >
                          {ch.titre}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          {situations.length > 0 ? (
            <section aria-labelledby="situations" className="grid gap-4">
              <h2 id="situations" className="text-2xl font-bold text-slate-50">
                Les épisodes à jouer en situation
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                Un trimestre en six décisions, à la place d&apos;un responsable,
                seul ou en binôme, puis un bilan. Ils travaillent des entrées que
                les séances et les chapitres ne touchent pas, ou peu. Chacun
                n&apos;est cité que si deux de ses décisions au moins exercent ce
                que l&apos;entrée demande.
              </p>
              <ul className="grid gap-2">
                {situations.map((s) => (
                  <li
                    key={s.code}
                    data-situation-du-diplome={s.code}
                    className="text-sm leading-relaxed text-slate-400"
                  >
                    <Link
                      href={`/entreprises/episode/${s.code}`}
                      className="font-medium text-slate-200 underline-offset-4 hover:text-amber-300 hover:underline"
                    >
                      {s.titre}
                    </Link>{" "}
                    · {s.entrees.join(" ; ")}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="ateliers" className="grid gap-4">
            <h2 id="ateliers" className="text-2xl font-bold text-slate-50">
              Les ateliers
            </h2>
            {parcours ? (
              <div className="rounded-xl border border-amber-400/20 bg-slate-900 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Réglages conseillés à la création
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Niveau {parcours.recommended.level} ·{" "}
                  {parcours.recommended.levelName} ·{" "}
                  {parcours.recommended.periodicityLabel} · TVA{" "}
                  {parcours.recommended.vat ? "activée (20 %)" : "désactivée"}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  {parcours.recommended.notes}
                </p>
              </div>
            ) : null}
            {ateliers.length === 0 ? (
              <p
                data-sans-atelier=""
                className="rounded-lg border border-white/5 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-400"
              >
                Aucun atelier de l&apos;arène n&apos;est encore écrit pour ce
                diplôme : ce qui le travaille aujourd&apos;hui, ce sont les
                chapitres du cours, et le tableau dit lesquels. Un atelier se
                construit sur mesure, sur les blocs de ce référentiel.
              </p>
            ) : null}
            {ateliers.length === 0 ? (
              <ParagrapheSurMesure className="text-sm leading-relaxed text-slate-400" />
            ) : null}
            <ul className="grid gap-2">
              {ateliers.map((a) => (
                <li
                  key={a.code}
                  className="text-sm leading-relaxed text-slate-400"
                >
                  <Link
                    href={`/animations/${a.code}`}
                    className="font-medium text-slate-200 underline-offset-4 hover:text-amber-300 hover:underline"
                  >
                    {a.titre}
                  </Link>{" "}
                  · {a.annee} · {a.seances.length} séances,{" "}
                  {Math.round(dureeTotaleHeures(a))} heures
                </li>
              ))}
            </ul>
            {entreprises.length > 0 ? (
              <p className="text-sm leading-relaxed text-slate-400">
                <span className="font-medium text-slate-300">
                  Les entreprises qui servent ce diplôme :
                </span>{" "}
                {entreprises.join(", ")}.
              </p>
            ) : null}
            {parcours?.limite ? (
              <p className="rounded-lg border border-white/5 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-400">
                Limite assumée : {parcours.limite}
              </p>
            ) : null}
          </section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
