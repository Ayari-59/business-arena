import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { classeDeLEnseignant } from "@/services/cours.service";
import { casDeLEntreprise } from "@/config/cours/cas";
import { CHAPITRES, chapitreParCode } from "@/config/cours/registre";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { vueDeLaClasse, type LigneDEleve } from "@/pedagogy/cours/suivi";
import { SITE_URL } from "@/config/site";
import { compter } from "@/lib/format";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { Icone } from "@/components/icone";
import { chapitreOuvertALaClasse, classeSansOffre, offreDuCoursDeLEnseignant } from "@/services/chapitres-de-la-classe";
import { SubmitButton } from "@/components/submit-button";
import { ENTREPRISES } from "@/app/cours/entreprises";
import { PARCOURS } from "@/config/cours/registre";
import { lienDuDevis, LIBELLE_DU_DEVIS, OFFRES } from "@/config/tarifs";
import { calculatriceAction, cloreClasseAction, parcoursAction } from "../actions";

export const metadata: Metadata = {
  title: "Une classe du cours",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Ce que dit la page après un geste de l'enseignant (`?fait=`). */
const MESSAGES_DU_GESTE: Record<string, string> = {
  close: "La classe est close : plus de nouvel élève.",
  rouverte: "La classe est rouverte.",
  calculatrice: "La calculatrice est rendue à vos élèves.",
  "sans-calculatrice": "La calculatrice est retirée à vos élèves.",
  parcours: "Le parcours de la classe est enregistré.",
};

/** Une case de la frise d'un élève : l'état d'une étape, en couleur et en mots. */
const CASES: Record<LigneDEleve["cases"][number], { classe: string; libelle: string }> = {
  "premier-coup": { classe: "bg-emerald-500", libelle: "réussie du premier coup" },
  reussie: { classe: "bg-emerald-300", libelle: "réussie après une erreur" },
  aidee: { classe: "bg-slate-400", libelle: "réussie avec la correction" },
  "en-cours": { classe: "border-2 border-slate-300", libelle: "en cours" },
  "a-venir": { classe: "bg-white/10", libelle: "pas encore atteinte" },
};

/**
 * UNE CLASSE DU COURS, VUE PAR SON ENSEIGNANT.
 *
 * Le code à projeter et le lien d'invitation ; puis, pour le chapitre choisi, où en est
 * chaque élève (une case par étape) et, étape par étape, combien l'ont réussie du premier
 * coup et les remarques du correcteur qui reviennent le plus : ce qu'il faut reprendre
 * au tableau. Rien ne se calcule ici : `pedagogy/cours/suivi.ts` agrège.
 */
export default async function ClasseDuCoursPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chapitre?: string; creee?: string; fait?: string }>;
}) {
  const [{ id }, { chapitre: demande, creee, fait }] = await Promise.all([params, searchParams]);
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const choisi = chapitreParCode(demande ?? "") ?? CHAPITRES[0]!;
  const [lu, staff, offre] = await Promise.all([
    /^[0-9a-f-]{36}$/.test(id) ? classeDeLEnseignant(session.userId, id, choisi.code) : null,
    getStaffContext(session.userId),
    offreDuCoursDeLEnseignant(session.userId),
  ]);
  if (!lu) notFound();
  const { classe, progressions } = lu;
  // Une classe qui joue une seule entreprise voit le chapitre tel qu'il s'y joue : ses
  // étapes dans l'ordre et le nombre de cette entreprise (celle du chapitre, s'il ne vaut
  // pas pour l'entreprise imposée).
  const deLaClasse = classe.entreprise
    ? choisi.entreprises && !choisi.entreprises.codes.includes(classe.entreprise)
      ? choisi.entreprises.codes[0]!
      : classe.entreprise
    : null;
  const chapitre = deLaClasse ? chapitreDuCas(choisi, casDeLEntreprise(deLaClasse)) : choisi;
  const vue = vueDeLaClasse(chapitre, progressions);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const lien = `${SITE_URL}/cours/rejoindre?code=${classe.code}`;
  const imposee = classe.entreprise ? ENTREPRISES.find((e) => e.code === classe.entreprise) : undefined;
  const nomDe = (code: string) => ENTREPRISES.find((e) => e.code === code)?.nom ?? "pas encore choisie";
  const close = classe.closeLe !== null;
  // CE QUE LA CLASSE OUVRE À SES ÉLÈVES (audit UX du 29 octobre 2026, P1-1) : un cadenas sur
  // chaque chapitre qui leur restera fermé, la règle de l'élève (services/chapitres-de-la-classe.ts).
  const ouvert = (c: (typeof CHAPITRES)[number]) => chapitreOuvertALaClasse(offre, classe, c);
  const ouverts = CHAPITRES.filter(ouvert).length;
  const libre = CHAPITRES.find((c) => c.libre);

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage surtitre="Mes classes du cours" titre={classe.nom}>
        <NavigationEnseignant
          className="mt-6"
          actif="cours"
          liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {creee || fait ? (
          <p role="status" className="rounded-lg encadre-gain px-4 py-2.5 text-sm">
            {creee
              ? "La classe est créée. Donnez son code à vos élèves."
              : (MESSAGES_DU_GESTE[fait ?? ""] ?? "La classe est rouverte.")}
          </p>
        ) : null}

        {!offre && libre ? (
          <p data-classe-du-cours-sans-offre="" className="rounded-lg encadre-neutre px-4 py-2.5 text-sm text-slate-300">
            <Icone nom="verrou" className="mr-1.5 h-3.5 w-3.5" />
            {classeSansOffre(libre.titre)}{" "}
            <Link href={lienDuDevis("classe")} prefetch={false} className={LIEN_A_L_ENCRE}>
              {LIBELLE_DU_DEVIS}
            </Link>
          </p>
        ) : null}

        {/* UNE CLASSE D'AVANT LE PARCOURS (migration 0052) : elle garde l'accès d'avant, et la
            page demande à l'enseignant de lui choisir son parcours. */}
        {classe.heritee && !classe.parcours ? (
          <p role="status" className="rounded-lg encadre-distinction px-4 py-2.5 text-sm" data-bandeau-parcours="">
            Choisissez le parcours du cours de cette classe, plus bas. Jusque-là, elle garde l&apos;accès qu&apos;elle avait ; ensuite,
            avec l&apos;offre {OFFRES.classe.nom} ou {OFFRES.programme.nom}, elle ouvrira les chapitres de ce parcours.
          </p>
        ) : null}

        <section className="carte grid gap-3 p-4 sm:p-6" aria-label="Inviter les élèves">
          <p className="text-sm text-slate-400">Code de la classe, à projeter ou à écrire au tableau</p>
          <p className="font-mono text-4xl font-bold tracking-wider text-slate-50" data-code-de-classe="">
            {classe.code}
          </p>
          <p className="text-sm text-slate-300">
            Les élèves le tapent sur <span className="font-semibold">{SITE_URL.replace("https://", "")}/cours/rejoindre</span>, ou
            ouvrent le lien : <span className="select-all break-all font-mono text-slate-200">{lien}</span>
          </p>
          <p className="text-sm text-slate-400">
            {imposee ? `Entreprise du cas, pour toute la classe : ${imposee.nom}.` : "Chaque élève choisit l'entreprise du cas."}
          </p>
          {/* LE PARCOURS DE LA CLASSE (migration 0052) : il ouvre ses chapitres sous l'offre Classe ou
              Programme ; choisi une fois, il ne change plus (services/cours.service.ts). */}
          {classe.parcours ? (
            <p className="text-sm text-slate-400" data-parcours-de-la-classe={classe.parcours}>
              Parcours du cours : {PARCOURS.find((p) => p.code === classe.parcours)?.titre ?? classe.parcours}.
            </p>
          ) : (
            <form action={parcoursAction.bind(null, classe.id)} className="grid gap-2" data-parcours-de-la-classe="">
              <label className="grid gap-1">
                <span className="text-sm font-semibold text-slate-200">Parcours du cours</span>
                <select name="parcours" required defaultValue="" className="champ w-full px-3 py-2 text-base">
                  <option value="" disabled>
                    Choisir un parcours
                  </option>
                  {PARCOURS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.titre}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-slate-400">
                  Avec l&apos;offre {OFFRES.classe.nom} ou {OFFRES.programme.nom}, la classe ouvre les chapitres de ce parcours ; choisi
                  une fois, il ne change plus. Avec l&apos;offre {OFFRES.campus.nom}, tous les chapitres sont ouverts.
                </span>
              </label>
              <div>
                <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
                  Enregistrer le parcours
                </SubmitButton>
              </div>
            </form>
          )}
          <form action={cloreClasseAction.bind(null, classe.id, !close)}>
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              {close ? "Rouvrir la classe" : "Clore la classe (plus de nouvel élève)"}
            </SubmitButton>
          </form>
          {/* LA CALCULATRICE DU COURS, permise par défaut ; retirée, les élèves de la classe ne la voient plus. */}
          <p className="text-sm text-slate-400" data-calculatrice-de-la-classe={classe.sansCalculatrice ? "retiree" : "permise"}>
            {classe.sansCalculatrice
              ? "La calculatrice est retirée : vos élèves calculent sans elle."
              : "La calculatrice est permise : vos élèves l'ouvrent dans les chapitres et les cas pratiques."}
          </p>
          <form action={calculatriceAction.bind(null, classe.id, classe.sansCalculatrice)}>
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              {classe.sansCalculatrice ? "Rendre la calculatrice" : "Retirer la calculatrice (calcul mental)"}
            </SubmitButton>
          </form>
        </section>

        {/* LES CHAPITRES, REPLIÉS (audit UX, P1-9) : une cinquantaine de titres repoussaient le
            tableau des élèves tout en bas, sur téléphone surtout. Le chapitre suivi se lit dans
            le titre du tableau ; la liste s'ouvre pour en changer, un cadenas sur les fermés. */}
        {CHAPITRES.length > 1 ? (
          <details className="group" data-chapitres-de-la-classe="">
            <summary className="cursor-pointer text-sm text-slate-300 underline-offset-4 hover:underline">
              Changer de chapitre ({compter(ouverts, "chapitre ouvert", "chapitres ouverts")} à vos élèves sur {CHAPITRES.length})
            </summary>
            <nav aria-label="Chapitres" className="mt-3 flex flex-wrap gap-2 text-sm">
              {CHAPITRES.map((c) => (
                <Link
                  key={c.code}
                  href={`/teacher/cours/${classe.id}?chapitre=${c.code}`}
                  aria-current={c.code === chapitre.code ? "page" : undefined}
                  data-chapitre-ferme={ouvert(c) ? undefined : ""}
                  className={`rounded-full border px-3 py-1 ${c.code === chapitre.code ? "border-white/40 font-semibold" : "border-white/10"} ${ouvert(c) ? "" : "text-slate-400"}`}
                >
                  {ouvert(c) ? null : (
                    <>
                      <Icone nom="verrou" className="mr-1 h-3 w-3" />
                      <span className="sr-only">Fermé à vos élèves : </span>
                    </>
                  )}
                  {c.titre}
                </Link>
              ))}
            </nav>
          </details>
        ) : null}

        <Rubrique note={`${compter(progressions.length, "élève")} · ${compter(vue.finis, "chapitre fini", "chapitres finis")}`}>
          {chapitre.titre} · où en est chaque élève
        </Rubrique>
        {progressions.length === 0 ? (
          <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">
            Aucun élève n&apos;a encore rejoint la classe.
          </p>
        ) : (
          <div className="grid gap-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400" aria-label="Légende">
              {Object.values(CASES).map((c) => (
                <li key={c.libelle} className="flex items-center gap-1.5">
                  <span aria-hidden className={`inline-block h-3 w-3 ${c.classe}`} />
                  {c.libelle}
                </li>
              ))}
            </ul>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm" data-eleves-du-cours="">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-etiquette text-slate-400">
                    <th className="py-2 pr-3 font-semibold">Élève</th>
                    <th className="py-2 pr-3 font-semibold">Entreprise</th>
                    <th className="py-2 pr-3 font-semibold">Étape</th>
                    <th className="py-2 pr-3 text-right font-semibold">Du premier coup</th>
                    <th className="py-2 pr-3 text-right font-semibold">Avec la correction</th>
                    <th className="py-2 font-semibold">Étapes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {vue.eleves.map((e) => (
                    <tr key={e.eleve} data-eleve={e.eleve}>
                      <td className="py-2 pr-3 font-semibold text-slate-100">{e.eleve}</td>
                      <td className="py-2 pr-3 text-slate-300">{nomDe(e.entreprise)}</td>
                      <td className="py-2 pr-3 tabular-nums text-slate-300">
                        {e.fini ? "Fini" : `${Math.min(e.etape + 1, chapitre.etapes.length)} sur ${chapitre.etapes.length}`}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{e.premierCoup}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{e.aidees}</td>
                      <td className="py-2">
                        <span className="flex gap-0.5">
                          {e.cases.map((k, i) => (
                            <span
                              key={i}
                              title={`${chapitre.etapes[i]!.titre} : ${CASES[k].libelle}`}
                              className={`inline-block h-3 w-2.5 ${CASES[k].classe}`}
                            />
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Rubrique>Ce qui bloque, étape par étape</Rubrique>
        <p className="-mt-4 text-sm text-slate-400">
          Au vidéoprojecteur, une étape et les réponses de la classe, en direct et sans nom d&apos;élève :{" "}
          <Link href={`/teacher/cours/${classe.id}/projection?chapitre=${chapitre.code}`} className="text-slate-200 underline underline-offset-2">
            projeter le chapitre
          </Link>
          .
        </p>
        <ol className="grid gap-2" data-etapes-du-cours="">
          {vue.etapes
            .filter((e) => e.notee)
            .map((e) => (
              <li key={e.id} className="carte grid gap-1.5 px-3 py-3 sm:px-4" data-etape={e.id}>
                <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold text-slate-100">{e.titre}</span>
                    <Link
                      href={`/teacher/cours/${classe.id}/projection?chapitre=${chapitre.code}&etape=${e.id}`}
                      className="text-sm text-slate-400 underline underline-offset-2 hover:text-slate-200"
                      aria-label={`Projeter l'étape « ${e.titre} »`}
                    >
                      Projeter
                    </Link>
                  </span>
                  <span className="text-sm tabular-nums text-slate-400">
                    {e.premierCoup} du premier coup · {e.aidees} avec la correction · {e.atteinte} l&apos;ont atteinte
                  </span>
                </p>
                {e.remarques.length > 0 ? (
                  <ul className="grid gap-1 text-sm text-slate-300">
                    {e.remarques.map((r) => (
                      <li key={r.texte} className="flex gap-2">
                        <span className="shrink-0 tabular-nums text-slate-400">{compter(r.eleves, "élève")}</span>
                        <span>{r.texte}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
        </ol>
      </div>
    </main>
  );
}
