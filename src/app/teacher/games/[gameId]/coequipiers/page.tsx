import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { compter, formatDecimal } from "@/lib/format";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { Rubrique } from "@/components/en-tete-enseignant";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import {
  BAREMES,
  CRITERES_LIBRES_MAX,
  CRITERES_PAR_DEFAUT,
  ECHELLE_DES_PAIRS,
  IDENTIFICATIONS_DES_MEMBRES,
  LIBELLE_CRITERE_MAX,
  MOMENTS_DES_PAIRS,
  NOMS_DES_MOMENTS,
  NOTE_MAX,
  codeDuCritereLibre,
} from "@/config/pairs/criteres";
import { METHODE_DES_PAIRS, PHRASES_DES_REGLES, phraseDuSignal } from "@/config/pairs/calcul";
import { tableauDeLEnseignant, type MomentDuTableau, type ReglagesDesPairs } from "@/services/pairs.service";
import { notesDEquipeAction, publierMomentAction, reglerLEvaluationAction } from "./actions";

export const metadata: Metadata = {
  title: "Évaluation entre coéquipiers",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * L'ÉVALUATION ENTRE COÉQUIPIERS, CÔTÉ ENSEIGNANT (la page de SA partie de classe).
 *
 * Il l'active et la règle ; puis, pour chaque moment (mi-parcours, fin), il lit le taux de
 * réponse par équipe et qui manque, un tableau par étudiant (moyenne par critère, facteur,
 * signaux), les commentaires avec leur auteur (lui seul les lit) ; il saisit, s'il le veut,
 * une note d'équipe, d'où la note individuelle ; il publie (le seul bouton plein de
 * l'écran) et exporte le tableur. Aucun canal ne joint un étudiant hors de la partie :
 * pas de relance, la carte l'attend dans son arène.
 */

const FAITS: Record<string, string> = {
  regle: "Les réglages sont enregistrés.",
  figes:
    "Les réglages sont enregistrés, sauf les critères et l'auto-évaluation : des réponses sont déjà données, ils ne changent plus.",
  publie: "C'est publié : les réponses sont closes et chaque étudiant voit ses moyennes.",
  retire: "La publication est retirée : les réponses sont rouvertes, les étudiants ne voient plus leurs moyennes.",
  notes: "Les notes d'équipe sont enregistrées.",
};
const REFUS: Record<string, string> = {
  saisie: "Rien n'a été enregistré : une valeur n'est pas valable (au moins un moment, une note d'équipe dans le barème).",
  ferme: "Ce moment n'est pas encore atteint : il ne se publie pas.",
  introuvable: "Cette évaluation n'existe pas, ou n'est pas activée pour ce moment.",
};

const heure = (d: Date) =>
  d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const decimal = (v: number) => v.toLocaleString("fr-FR");

function etatDuMoment(m: MomentDuTableau): string {
  if (m.etat === "publie") return `Publiée le ${heure(m.publieLe!)}`;
  if (m.etat === "ouvert") return "Ouverte aux réponses";
  return m.ouvreApresLeTour ? `S'ouvrira à la clôture du tour ${m.ouvreApresLeTour}` : "S'ouvrira à la fin de la partie";
}

function Reglages({
  gameId,
  reglages,
  figes,
}: {
  gameId: string;
  reglages: ReglagesDesPairs | null;
  figes: boolean;
}) {
  const r = reglages;
  const moments = r?.moments ?? ["fin"];
  const coches = new Set((r?.criteres ?? CRITERES_PAR_DEFAUT).map((c) => c.code));
  const libres = (r?.criteres ?? []).filter((c) => !CRITERES_PAR_DEFAUT.some((d) => d.code === c.code));
  const bornes = r?.bornes ?? METHODE_DES_PAIRS.bornes;
  const choix = "flex items-start gap-3 rounded-lg border border-white/10 px-3 py-2.5";
  return (
    <GuardedForm action={reglerLEvaluationAction.bind(null, gameId)} label="réglages de l'évaluation" className="grid gap-5">
      {r ? (
        <label className={choix}>
          <input type="checkbox" name="active" defaultChecked={r.active} className="mt-0.5 h-4 w-4 accent-amber-400" />
          <span>
            <span className="text-sm font-semibold text-slate-100">Évaluation activée</span>
            <span className="block text-sm text-slate-400">
              Décochée, les étudiants ne voient plus rien ; les réponses déjà données sont gardées.
            </span>
          </span>
        </label>
      ) : (
        <input type="hidden" name="active" value="on" />
      )}

      <fieldset className="grid gap-2">
        <legend className="libelle mb-1 text-sm text-slate-300">Quand</legend>
        {MOMENTS_DES_PAIRS.map((m) => (
          <label key={m} className={choix}>
            <input type="checkbox" name="moments" value={m} defaultChecked={moments.includes(m)} className="mt-0.5 h-4 w-4 accent-amber-400" />
            <span className="text-sm text-slate-100">{NOMS_DES_MOMENTS[m]}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="libelle mb-1 text-sm text-slate-300">
          Critères, notés de {ECHELLE_DES_PAIRS[0].note} ({ECHELLE_DES_PAIRS[0].libelle.toLowerCase()}) à {NOTE_MAX} (
          {ECHELLE_DES_PAIRS[ECHELLE_DES_PAIRS.length - 1]!.libelle.toLowerCase()})
        </legend>
        {figes && r ? (
          <>
            <p className="text-sm text-slate-400">Des réponses sont données : les critères ne changent plus.</p>
            <ul className="grid gap-1 text-sm text-slate-100">
              {r.criteres.map((c) => (
                <li key={c.code}>{c.libelle}</li>
              ))}
            </ul>
            {r.criteres
              .filter((c) => coches.has(c.code) && CRITERES_PAR_DEFAUT.some((d) => d.code === c.code))
              .map((c) => (
                <input key={c.code} type="hidden" name="criteres" value={c.code} />
              ))}
            {Array.from({ length: CRITERES_LIBRES_MAX }, (_, i) => (
              <input key={i} type="hidden" name={`critereLibre${i + 1}`} value={libres.find((l) => l.code === codeDuCritereLibre(i + 1))?.libelle ?? ""} />
            ))}
          </>
        ) : (
          <>
            {CRITERES_PAR_DEFAUT.map((c) => (
              <label key={c.code} className={choix}>
                <input type="checkbox" name="criteres" value={c.code} defaultChecked={coches.has(c.code)} className="mt-0.5 h-4 w-4 accent-amber-400" />
                <span>
                  <span className="text-sm font-semibold text-slate-100">{c.libelle}</span>
                  <span className="block text-sm text-slate-400">{c.aide}</span>
                </span>
              </label>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm text-slate-300">Un critère à vous (facultatif)</span>
                <input
                  name="critereLibre1"
                  maxLength={LIBELLE_CRITERE_MAX}
                  defaultValue={libres[0]?.libelle ?? ""}
                  placeholder="Par exemple : ponctualité"
                  className="champ w-full px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm text-slate-300">Un autre (facultatif)</span>
                <input
                  name="critereLibre2"
                  maxLength={LIBELLE_CRITERE_MAX}
                  defaultValue={libres[1]?.libelle ?? ""}
                  className="champ w-full px-3 py-2 text-sm text-slate-100"
                />
              </label>
            </div>
          </>
        )}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="libelle mb-1 text-sm text-slate-300">Ce que l&apos;étudiant remplit en plus</legend>
        {figes && r ? (
          <>
            <p className="text-sm text-slate-100">Auto-évaluation : {r.autoEvaluation ? "oui" : "non"}</p>
            {r.autoEvaluation ? <input type="hidden" name="autoEvaluation" value="on" /> : null}
          </>
        ) : (
          <label className={choix}>
            <input type="checkbox" name="autoEvaluation" defaultChecked={r?.autoEvaluation ?? false} className="mt-0.5 h-4 w-4 accent-amber-400" />
            <span>
              <span className="text-sm font-semibold text-slate-100">Auto-évaluation</span>
              <span className="block text-sm text-slate-400">
                Il se note aussi. Vous la lisez à côté de celle de ses pairs ; elle n&apos;entre pas dans le facteur.
              </span>
            </span>
          </label>
        )}
        <label className={choix}>
          <input type="checkbox" name="commentaire" defaultChecked={r?.commentaire ?? true} className="mt-0.5 h-4 w-4 accent-amber-400" />
          <span>
            <span className="text-sm font-semibold text-slate-100">Un commentaire libre, facultatif</span>
            <span className="block text-sm text-slate-400">Vous seul le lisez, avec le nom de son auteur.</span>
          </span>
        </label>
      </fieldset>

      <fieldset className="grid gap-3 sm:grid-cols-3">
        <legend className="libelle mb-1 text-sm text-slate-300">Le facteur et la note</legend>
        <label className="grid gap-1">
          <span className="text-sm text-slate-300">Facteur au plus bas</span>
          <select name="borneBasse" defaultValue={String(bornes.basse)} className="champ w-full px-3 py-2 text-sm text-slate-100">
            {METHODE_DES_PAIRS.bornesPossibles.basses.map((b) => (
              <option key={b} value={b}>
                {decimal(b)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-300">Facteur au plus haut</span>
          <select name="borneHaute" defaultValue={String(bornes.haute)} className="champ w-full px-3 py-2 text-sm text-slate-100">
            {METHODE_DES_PAIRS.bornesPossibles.hautes.map((b) => (
              <option key={b} value={b}>
                {decimal(b)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-300">Note d&apos;équipe sur</span>
          <select name="bareme" defaultValue={String(r?.bareme ?? BAREMES[0])} className="champ w-full px-3 py-2 text-sm text-slate-100">
            {BAREMES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <p className="text-sm text-slate-400">
        L&apos;anonymat entre étudiants est toujours tenu : aucun ne voit qui l&apos;a noté, ni ce que les autres ont reçu.
      </p>
      <div>
        <SubmitButton
          pendingLabel="Enregistrement…"
          className={r ? bouton({ variante: "secondaire" }) : bouton()}
        >
          {r ? "Enregistrer les réglages" : "Activer l'évaluation"}
        </SubmitButton>
      </div>
    </GuardedForm>
  );
}

function SectionDuMoment({
  gameId,
  m,
  reglages,
  principal,
}: {
  gameId: string;
  m: MomentDuTableau;
  reglages: ReglagesDesPairs;
  /** Le moment dont la publication est le geste principal de l'écran. */
  principal: boolean;
}) {
  const etudiants = m.equipes.reduce((s, e) => s + e.membres, 0);
  const repondants = m.equipes.reduce((s, e) => s + e.repondants, 0);
  return (
    <section id={`moment-${m.moment}`} aria-labelledby={`titre-${m.moment}`} className="grid scroll-mt-24 gap-4" data-moment={m.moment} data-etat={m.etat}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h2 id={`titre-${m.moment}`} className="text-xl font-semibold text-slate-50">
          {NOMS_DES_MOMENTS[m.moment]}
        </h2>
        <span className="pastille-etat rounded-full px-2.5 py-1 text-sm text-slate-200">{etatDuMoment(m)}</span>
      </div>
      {m.etat === "a-venir" ? (
        <p className="text-sm text-slate-400">Les étudiants verront la carte « Évaluez vos coéquipiers » à ce moment-là.</p>
      ) : (
        <>
          <p className="text-sm text-slate-300" data-taux-de-reponse="">
            {repondants} sur {compter(etudiants, "étudiant")} ont rendu une évaluation complète.
          </p>
          {m.equipes.map((e) => (
            <div key={e.teamId} className="carte grid gap-3 p-4 sm:p-5" data-equipe={e.nom}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="titre-carte text-slate-50">{e.nom}</h3>
                <span className="text-sm tabular-nums text-slate-300" data-reponses-equipe={`${e.repondants}/${e.membres}`}>
                  {e.membres === 0 ? "aucun étudiant" : `${e.repondants} sur ${e.membres} ont répondu`}
                </span>
              </div>
              {e.enAttente.length > 0 && m.etat === "ouvert" ? (
                <p className="text-sm text-slate-300">En attente : {e.enAttente.join(", ")}</p>
              ) : null}
              {e.desaccord ? (
                <p className="rounded-lg encadre-distinction px-3 py-2 text-sm text-slate-100">
                  Désaccord fort dans cette équipe : des évaluateurs voient très différemment un même coéquipier.
                </p>
              ) : null}
              {e.lignes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[44rem] text-left text-sm" data-tableau-pairs="">
                    <thead className="text-xs text-slate-400">
                      <tr>
                        <th scope="col" className="py-2 pr-3 font-semibold">Étudiant</th>
                        {reglages.criteres.map((c) => (
                          <th key={c.code} scope="col" className="px-2 py-2 text-right font-semibold" title={c.libelle}>
                            {c.libelle}
                          </th>
                        ))}
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Moyenne</th>
                        {reglages.autoEvaluation ? <th scope="col" className="px-2 py-2 text-right font-semibold">Auto</th> : null}
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Facteur</th>
                        <th scope="col" className="px-2 py-2 text-right font-semibold">Note</th>
                        <th scope="col" className="py-2 pl-2 font-semibold">À regarder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.lignes.map((l) => {
                        const r = l.resultat;
                        const remarques = [PHRASES_DES_REGLES[r.regle], ...r.signaux.map(phraseDuSignal)].filter(Boolean) as string[];
                        return (
                          <tr key={l.userId} className="border-t border-white/10 align-top" data-etudiant={l.nom} data-facteur={r.facteur}>
                            <td className="py-2 pr-3">
                              <span className="font-semibold text-slate-100">{l.nom}</span>
                              <span className="block text-xs text-slate-400">
                                {IDENTIFICATIONS_DES_MEMBRES[l.identification]} · {r.aRepondu ? "a répondu" : "n'a pas répondu"}
                              </span>
                            </td>
                            {reglages.criteres.map((c) => (
                              <td key={c.code} className="px-2 py-2 text-right tabular-nums text-slate-200">
                                {r.moyennes[c.code] == null ? "—" : formatDecimal(r.moyennes[c.code]!, 1)}
                              </td>
                            ))}
                            <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-100">
                              {r.moyenne === null ? "—" : formatDecimal(r.moyenne, 1)}
                            </td>
                            {reglages.autoEvaluation ? (
                              <td className="px-2 py-2 text-right tabular-nums text-slate-200">
                                {r.autoMoyenne === null ? "—" : formatDecimal(r.autoMoyenne, 1)}
                              </td>
                            ) : null}
                            <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-50">{formatDecimal(r.facteur, 2)}</td>
                            <td className="px-2 py-2 text-right tabular-nums text-slate-100">
                              {l.noteIndividuelle === null ? "—" : formatDecimal(l.noteIndividuelle, 1)}
                            </td>
                            <td className="py-2 pl-2 text-slate-300">
                              {remarques.length ? (
                                <ul className="grid gap-1">
                                  {remarques.map((x) => (
                                    <li key={x}>{x}</li>
                                  ))}
                                </ul>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ))}

          <GuardedForm
            action={notesDEquipeAction.bind(null, gameId)}
            label="notes d'équipe"
            className="carte grid gap-3 p-4 sm:p-5"
          >
            <input type="hidden" name="moment" value={m.moment} />
            <h3 className="titre-carte text-slate-50">Notes d&apos;équipe (facultatives)</h3>
            <p className="text-sm text-slate-400">
              Sur {reglages.bareme}. La note individuelle de chacun vaut la note de son équipe multipliée par son facteur,
              sans dépasser {reglages.bareme} ; elle paraît dans le tableau et l&apos;export.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {m.equipes.map((e) => (
                <label key={e.teamId} className="grid gap-1">
                  <span className="text-sm text-slate-300">{e.nom}</span>
                  <input
                    name={`note:${e.teamId}`}
                    inputMode="decimal"
                    autoComplete="off"
                    defaultValue={e.noteDEquipe === null ? "" : decimal(e.noteDEquipe)}
                    className="champ w-full px-3 py-2 text-sm tabular-nums text-slate-100"
                  />
                </label>
              ))}
            </div>
            <div>
              <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire" })}>
                Enregistrer les notes d&apos;équipe
              </SubmitButton>
            </div>
          </GuardedForm>

          {m.commentaires.length > 0 ? (
            <section aria-labelledby={`commentaires-${m.moment}`} className="carte grid gap-3 p-4 sm:p-5" data-commentaires="">
              <h3 id={`commentaires-${m.moment}`} className="titre-carte text-slate-50">
                Commentaires
              </h3>
              <p className="text-sm text-slate-400">Vous seul les lisez : les étudiants ne voient ni les commentaires, ni leurs auteurs.</p>
              <ul className="grid gap-3">
                {m.commentaires.map((c, i) => (
                  <li key={i} className="border-t border-white/10 pt-2 text-sm">
                    <span className="text-slate-400">
                      {c.equipe} · {c.auteur} sur {c.cible}
                    </span>
                    <span className="mt-0.5 block text-slate-100">« {c.texte} »</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {m.etat === "ouvert" ? (
              <GuardedForm action={publierMomentAction.bind(null, gameId, m.moment, true)} label="publication de l'évaluation">
                <SubmitButton pendingLabel="Publication…" className={principal ? bouton() : bouton({ variante: "secondaire" })}>
                  Publier
                </SubmitButton>
              </GuardedForm>
            ) : (
              <GuardedForm action={publierMomentAction.bind(null, gameId, m.moment, false)} label="retrait de la publication">
                <SubmitButton pendingLabel="Retrait…" className={bouton({ variante: "secondaire" })}>
                  Retirer la publication
                </SubmitButton>
              </GuardedForm>
            )}
            <p className="text-sm text-slate-400">
              {m.etat === "ouvert"
                ? "Publier clôt les réponses ; chaque étudiant voit alors ses moyennes, sans les auteurs."
                : "Chaque étudiant voit ses moyennes. Retirer la publication rouvre les réponses."}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

export default async function CoequipiersEnseignantPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fait?: string; refus?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const { gameId } = await params;
  const { fait, refus } = await searchParams;
  const t = await tableauDeLEnseignant(session.userId, gameId);
  if (!t) notFound();
  const r = t.reglages;
  const actifs = r && r.active ? t.moments : [];
  // Le geste principal : publier le premier moment ouvert. Les autres boutons sont des filets.
  const principal = actifs.find((m) => m.etat === "ouvert")?.moment ?? null;
  const { seuils } = METHODE_DES_PAIRS;

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre={`Pilotage de partie · ${t.partie}`}
        titre="Évaluation entre coéquipiers"
        chapeau="Chaque étudiant note la contribution de ses coéquipiers. Vous lisez les réponses et leurs auteurs ; vous publiez, et chacun voit ses moyennes sans savoir qui l'a noté. Un facteur individuel module la note d'équipe."
      >
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={`/teacher/games/${gameId}`} className={LIEN_A_L_ENCRE}>
            ← Retour au pilotage
          </Link>
          {r ? (
            <a href={`/teacher/games/${gameId}/coequipiers/export`} className={LIEN_A_L_ENCRE} data-export-csv="">
              Exporter (tableur)
            </a>
          ) : null}
        </p>
      </EnTeteDePage>

      <div className={`${COLONNE_DE_PAGE} grid gap-8`}>
        {fait && FAITS[fait] ? (
          <p role="status" className="rounded-xl encadre-gain px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3">
            {FAITS[fait]}
          </p>
        ) : null}
        {refus && REFUS[refus] ? (
          <p role="alert" className="rounded-xl encadre-perte px-3 py-2.5 text-sm text-slate-100 sm:px-4 sm:py-3">
            {REFUS[refus]}
          </p>
        ) : null}
        {r && !r.active ? (
          <p className="rounded-xl encadre-neutre px-3 py-2.5 text-sm text-slate-200 sm:px-4">
            L&apos;évaluation est désactivée : les étudiants ne voient rien. Cochez « Évaluation activée » pour la reprendre.
          </p>
        ) : null}

        {actifs.map((m) => (
          <SectionDuMoment key={m.moment} gameId={gameId} m={m} reglages={r!} principal={m.moment === principal} />
        ))}

        <Rubrique note={r ? "à toucher une fois" : undefined}>{r ? "Réglages" : "Activer l'évaluation"}</Rubrique>
        <section aria-label="Réglages de l'évaluation" className="carte p-4 sm:p-6">
          <Reglages gameId={gameId} reglages={r} figes={t.figes} />
        </section>

        <Rubrique note={`méthode type WebPA, version ${t.methodeVersion}`}>Le calcul</Rubrique>
        <section aria-label="Le calcul du facteur" className="grid gap-2 text-sm leading-relaxed text-slate-300">
          <p>
            Chaque répondant partage ses points entre ses coéquipiers : ce qu&apos;il donne à l&apos;un, rapporté à ce
            qu&apos;il donne à tous, est la part qu&apos;il lui attribue. Le facteur d&apos;un étudiant est la part qu&apos;il
            reçoit rapportée à celle qu&apos;il recevrait si chacun notait tout le monde à égalité. Il est ramené entre{" "}
            {decimal(r?.bornes.basse ?? METHODE_DES_PAIRS.bornes.basse)} et {decimal(r?.bornes.haute ?? METHODE_DES_PAIRS.bornes.haute)}, puis arrondi au centième.
            Un évaluateur sévère avec tous ne déplace donc rien : seul compte l&apos;écart entre ses coéquipiers.
          </p>
          <ul className="grid gap-1 text-slate-400">
            <li>Un étudiant qui n&apos;a pas répondu : ses notes données ne comptent pas, il reçoit celles des autres.</li>
            <li>{PHRASES_DES_REGLES["personne-n-a-repondu"]}</li>
            <li>{PHRASES_DES_REGLES["equipe-de-deux"]}</li>
            <li>L&apos;auto-évaluation est montrée à part et n&apos;entre pas dans le facteur.</li>
            <li>
              Signalés : un écart d&apos;au moins {decimal(seuils.ecartAuto)} point entre l&apos;auto-évaluation et les pairs ;
              des notes de {decimal(seuils.tresBas)} ou moins de la part de chaque évaluateur ; {decimal(seuils.desaccord)} points
              d&apos;écart ou plus entre deux évaluateurs d&apos;un même étudiant.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
