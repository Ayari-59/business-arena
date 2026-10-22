import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { classeDeLEnseignant } from "@/services/cours.service";
import { CHAPITRES, chapitreParCode } from "@/config/cours/registre";
import { vueDeLaClasse, type LigneDEleve } from "@/pedagogy/cours/suivi";
import { SITE_URL } from "@/config/site";
import { compter } from "@/lib/format";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton } from "@/components/bouton";
import { SubmitButton } from "@/components/submit-button";
import { ENTREPRISES } from "@/app/cours/entreprises";
import { cloreClasseAction } from "../actions";

export const metadata: Metadata = {
  title: "Une classe du cours",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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
  if (!session) redirect("/teacher/login");
  const chapitre = chapitreParCode(demande ?? "") ?? CHAPITRES[0]!;
  const [lu, staff] = await Promise.all([
    /^[0-9a-f-]{36}$/.test(id) ? classeDeLEnseignant(session.userId, id, chapitre.code) : null,
    getStaffContext(session.userId),
  ]);
  if (!lu) notFound();
  const { classe, progressions } = lu;
  const vue = vueDeLaClasse(chapitre, progressions);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const lien = `${SITE_URL}/cours/rejoindre?code=${classe.code}`;
  const imposee = classe.entreprise ? ENTREPRISES.find((e) => e.code === classe.entreprise) : undefined;
  const nomDe = (code: string) => ENTREPRISES.find((e) => e.code === code)?.nom ?? "pas encore choisie";
  const close = classe.closeLe !== null;

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
            {creee ? "La classe est créée. Donnez son code à vos élèves." : fait === "close" ? "La classe est close : plus de nouvel élève." : "La classe est rouverte."}
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
          <form action={cloreClasseAction.bind(null, classe.id, !close)}>
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              {close ? "Rouvrir la classe" : "Clore la classe (plus de nouvel élève)"}
            </SubmitButton>
          </form>
        </section>

        {CHAPITRES.length > 1 ? (
          <nav aria-label="Chapitres" className="flex flex-wrap gap-2 text-sm">
            {CHAPITRES.map((c) => (
              <Link
                key={c.code}
                href={`/teacher/cours/${classe.id}?chapitre=${c.code}`}
                aria-current={c.code === chapitre.code ? "page" : undefined}
                className={`rounded-full border px-3 py-1 ${c.code === chapitre.code ? "border-white/40 font-semibold" : "border-white/10"}`}
              >
                {c.titre}
              </Link>
            ))}
          </nav>
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
        <ol className="grid gap-2" data-etapes-du-cours="">
          {vue.etapes
            .filter((e) => e.notee)
            .map((e) => (
              <li key={e.id} className="carte grid gap-1.5 px-3 py-3 sm:px-4" data-etape={e.id}>
                <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="font-semibold text-slate-100">{e.titre}</span>
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
