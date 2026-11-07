import { Rubrique } from "@/components/en-tete-enseignant";
import { compter } from "@/lib/format";
import type { LigneDActivite, NatureDActivite, VueDUneActivite } from "@/pedagogy/cours/suivi-des-activites";

/**
 * LES ACTIVITÉS DE LA CLASSE, VUES PAR SON ENSEIGNANT (migration 0057 ; services/activites.service.ts).
 *
 * Une activité par tiroir : le bureau, l'enquête ou le scénario, et combien de ses élèves l'ont réussie,
 * l'ont en cours, ne l'ont pas commencée. Ouvert, le tiroir dit ce qui revient le plus dans les erreurs,
 * puis, élève par élève, son état, ses essais, ses étapes et les remarques du correcteur sur ses essais
 * manqués. Le tableau défile de côté sur téléphone, comme celui des chapitres. Rien ne se calcule ici :
 * pedagogy/cours/suivi-des-activites.ts agrège.
 */

const NATURES: Record<NatureDActivite, string> = { bureau: "Bureau", enquete: "Enquête", scenario: "Scénario" };

const ETATS: Record<LigneDActivite["etat"], { libelle: string; classe: string }> = {
  "non-commence": { libelle: "Non commencé", classe: "text-slate-400" },
  "en-cours": { libelle: "En cours", classe: "text-slate-200" },
  reussi: { libelle: "Réussi", classe: "text-emerald-300 font-semibold" },
  termine: { libelle: "Terminé avec la correction", classe: "text-slate-200" },
  fini: { libelle: "Fini", classe: "text-emerald-300 font-semibold" },
};

/** Le titre nomme-t-il déjà le format de l'activité ? */
const aSonFormat = (a: VueDUneActivite) => /^(au bureau|enquête|scénario)\b/i.test(a.titre);

/** Les activités qu'un élève a commencées d'abord, dans l'ordre du cours ; puis les autres. */
const commenceesDAbord = (activites: VueDUneActivite[]) =>
  [...activites].sort((x, y) => Number(x.compte["non-commence"] === x.eleves.length) - Number(y.compte["non-commence"] === y.eleves.length));

/** Combien de remarques l'enseignant lit par étape et par élève, les dernières. */
const REMARQUES_LUES = 3;

function Compte({ a }: { a: VueDUneActivite }) {
  const c = a.compte;
  const parts =
    a.nature === "scenario"
      ? [compter(c.fini, "fini", "finis"), compter(c["en-cours"], "en cours", "en cours"), compter(c["non-commence"], "non commencé", "non commencés")]
      : [
          compter(c.reussi, "réussi", "réussis"),
          ...(c.termine > 0 ? [compter(c.termine, "terminé avec la correction", "terminés avec la correction")] : []),
          compter(c["en-cours"], "en cours", "en cours"),
          compter(c["non-commence"], "non commencé", "non commencés"),
        ];
  return <span className="text-sm tabular-nums text-slate-400">{parts.join(" · ")}</span>;
}

function Etat({ a, l }: { a: VueDUneActivite; l: LigneDActivite }) {
  const e = ETATS[l.etat];
  return (
    <span className={e.classe} data-etat={l.etat}>
      {e.libelle}
      {a.nature === "scenario" && l.fin ? (
        <span className="block text-xs font-normal text-slate-300" data-fin="">
          {l.fin} · {l.meilleure ? "la meilleure suite" : "pas la meilleure suite"}
        </span>
      ) : null}
    </span>
  );
}

function Etapes({ a, l }: { a: VueDUneActivite; l: LigneDActivite }) {
  if (l.etat === "non-commence") return <>0 sur {a.etapes.length}</>;
  if (a.nature === "scenario") {
    if (l.reussies === 0) return <>Questions pas encore réussies</>;
    return <>{l.aidees > 0 ? "Questions avec la correction" : "Questions réussies"}</>;
  }
  return (
    <>
      {l.reussies} sur {a.etapes.length}
      {l.aidees > 0 ? <span className="block text-xs text-slate-400">{compter(l.aidees, "avec la correction", "avec la correction")}</span> : null}
    </>
  );
}

function Erreurs({ l }: { l: LigneDActivite }) {
  if (l.erreurs.length === 0) return <span className="text-slate-400">Aucune</span>;
  return (
    <ul className="grid gap-1.5" data-erreurs-de-l-eleve="">
      {l.erreurs.map((e) => {
        const lues = e.remarques.slice(-REMARQUES_LUES);
        const autres = e.remarques.length - lues.length;
        return (
          <li key={e.etape}>
            <span className="text-xs font-semibold text-slate-400">{e.etape}</span>
            <ul className="grid gap-0.5">
              {lues.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            {autres > 0 ? <span className="text-xs text-slate-400">{compter(autres, "remarque plus ancienne", "remarques plus anciennes")}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function ActivitesDeLaClasse({ activites, eleves }: { activites: VueDUneActivite[]; eleves: number }) {
  return (
    <section id="activites" className="scroll-mt-24 grid gap-3" aria-label="Activités" data-activites-de-la-classe="">
      <Rubrique note={compter(activites.length, "activité")}>Activités · bureaux, enquêtes et scénarios</Rubrique>
      <p className="-mt-1 text-sm text-slate-400">
        Les activités du parcours de la classe, et toute autre qu&apos;un élève a commencée ; celles qu&apos;un élève a commencées viennent d&apos;abord. Les essais comptent les réponses corrigées ; pour un
        scénario, les parties commencées. Les erreurs sont les remarques du correcteur sur les essais manqués.
      </p>
      {activites.length === 0 ? (
        <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">
          Le parcours de la classe n&apos;a pas encore d&apos;activité.
        </p>
      ) : eleves === 0 ? (
        <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">Aucun élève n&apos;a encore rejoint la classe.</p>
      ) : (
        <ul className="grid gap-2">
          {commenceesDAbord(activites).map((a) => (
            <li key={`${a.nature}:${a.code}`} className="carte" data-activite={`${a.nature}:${a.code}`}>
              <details className="group">
                <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-3 sm:px-4">
                  {/* Le titre dit déjà le format (« Au bureau : », « Enquête : », « Scénario : ») ; sinon, on le précise. */}
                  <span className="font-semibold text-slate-100">
                    {aSonFormat(a) ? null : <span className="sr-only">{NATURES[a.nature]} : </span>}
                    {a.titre}
                  </span>
                  <Compte a={a} />
                </summary>
                <div className="grid gap-3 px-3 pb-4 sm:px-4">
                  {a.frequentes.length > 0 ? (
                    <div className="grid gap-1">
                      <p className="text-sm font-semibold text-slate-200">Ce qui revient</p>
                      <ul className="grid gap-1 text-sm text-slate-300" data-erreurs-frequentes="">
                        {a.frequentes.map((r) => (
                          <li key={r.texte} className="flex gap-2">
                            <span className="shrink-0 tabular-nums text-slate-400">{compter(r.eleves, "élève")}</span>
                            <span>{r.texte}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[44rem] text-sm" data-eleves-de-l-activite="">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-etiquette text-slate-400">
                          <th className="py-2 pr-3 font-semibold">Élève</th>
                          <th className="py-2 pr-3 font-semibold">État</th>
                          <th className="py-2 pr-3 text-right font-semibold">Essais</th>
                          <th className="py-2 pr-3 font-semibold">{a.nature === "scenario" ? "Questions" : "Étapes réussies"}</th>
                          <th className="py-2 font-semibold">Erreurs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {a.eleves.map((l) => (
                          <tr key={l.eleve} data-eleve-de-l-activite={l.eleve} className="align-top">
                            <td className="py-2 pr-3 font-semibold text-slate-100">{l.eleve}</td>
                            <td className="py-2 pr-3">
                              <Etat a={a} l={l} />
                            </td>
                            <td className="py-2 pr-3 text-right tabular-nums text-slate-300" data-essais={l.essais}>
                              {a.nature === "scenario" ? compter(l.essais, "partie") : l.essais}
                              {a.nature !== "scenario" && l.manques > 0 ? (
                                <span className="block text-xs text-slate-400">{compter(l.manques, "manqué", "manqués")}</span>
                              ) : null}
                            </td>
                            <td className="py-2 pr-3 tabular-nums text-slate-300">
                              <Etapes a={a} l={l} />
                            </td>
                            <td className="py-2 text-slate-300">
                              <Erreurs l={l} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
