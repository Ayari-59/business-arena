"use client";

import { useEffect, useRef, useState } from "react";
import { Icone, type NomDIcone } from "@/components/icone";
import { Tiroir } from "@/components/tiroir";
import { idDuChamp } from "@/config/refus-de-decision";
import type { DecisionDeModule } from "@/config/modules-saisis";
import type { RoundDecisions } from "@/engine/types";
import { formatEuro } from "@/lib/format";
import { choixDuModule, type ModuleOffert, type OffreDesModules } from "@/services/modules-offer";

/**
 * LES MODULES DU SCÉNARIO, SUR LA FEUILLE DE DÉCISION.
 *
 * Une case par élément proposé ce tour, au gabarit des études : le nom et ce
 * que le choix coûte ce tour, puis les effets que le moteur applique, puis la
 * durée et les coûts qui suivront. Ce qui tourne déjà se lit au-dessus, sans
 * case : on ne relance pas un projet en cours.
 *
 * LE PLAFOND SE VOIT AVANT L'ENVOI : une fois les places du tour prises, les
 * autres cases du module se grisent. La feuille rejuge aussi l'ensemble avant
 * l'envoi, du même calcul que le serveur (`refusDesModules`).
 *
 * Rien n'est coché d'office : un module se DÉMARRE, et ce qui a démarré au
 * tour précédent vit maintenant dans l'état de l'entreprise (« Déjà
 * engagé »). Seul un envoi déjà enregistré ce tour revient coché.
 */

const ICONES: Record<DecisionDeModule, NomDIcone> = {
  qualityActions: "etoile",
  hsActions: "equipes",
  activeCapacityOptionIds: "usine",
  enteredMarketIds: "monde",
  startedInnovationIds: "idee",
  activeRseActionIds: "feuille",
  activePricingStrategyIds: "etiquette",
  activeCrisisPlanIds: "alerte",
  activatePartnershipIds: "accord",
  startDigitalProjectIds: "ecran",
  activeBrandActionIds: "communication",
};

/** Les cases cochées d'un module, lues sur le document (le brouillon les coche sans événement). */
function compterLesCases(racine: HTMLElement | null, decision: DecisionDeModule): number {
  if (!racine) return 0;
  return racine.querySelectorAll(`input[data-module="${decision}"]:checked`).length;
}

function UnModule({
  module,
  dejaChoisis,
  erreurs,
}: {
  module: ModuleOffert;
  dejaChoisis: string[];
  erreurs: ReadonlyMap<string, string>;
}) {
  const racine = useRef<HTMLDivElement>(null);
  // Les cases cochées, relues sur le document à chaque changement.
  const [cochees, setCochees] = useState<ReadonlySet<string>>(
    () => new Set(module.elements.filter((el) => dejaChoisis.includes(el.id)).map((el) => el.champ)),
  );
  const relire = () => {
    const r = racine.current;
    if (!r) return;
    setCochees(
      new Set(
        [...r.querySelectorAll<HTMLInputElement>(`input[data-module="${module.decision}"]:checked`)].map(
          (el) => el.name,
        ),
      ),
    );
  };
  // Le brouillon du navigateur recoche les cases APRÈS le montage, sans
  // événement : on relit une fois la feuille restaurée.
  useEffect(() => {
    const t = setTimeout(relire, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const coutCoche = module.elements
    .filter((el) => cochees.has(el.champ))
    .reduce((t, el) => t + el.coutDuTour, 0);
  const plein = module.plafond !== null && cochees.size >= module.plafond;

  return (
    <div ref={racine} data-module-de-decision={module.decision} className="space-y-2" onChange={relire}>
      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm font-semibold text-slate-200">
        <Icone nom={ICONES[module.decision]} className="h-4 w-4 text-[color:var(--metier,var(--color-slate-300))]" />
        {module.titre}
        {module.plafondTexte ? (
          <span className="text-xs font-normal text-slate-400">· {module.plafondTexte}</span>
        ) : null}
      </p>
      {module.enCours.length > 0 ? (
        <p data-modules-en-cours="" className="text-xs text-slate-400">
          Déjà engagé :{" "}
          {module.enCours.map((x, i) => (
            <span key={`${x.libelle}-${i}`}>
              {i > 0 ? " ; " : ""}
              <span className="text-slate-300">{x.libelle}</span> ({x.etat})
            </span>
          ))}
          .
        </p>
      ) : null}
      {module.elements.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {module.elements.map((el) => {
            const erreur = erreurs.get(el.champ);
            return (
              <div key={el.champ}>
                <label
                  className={`flex items-start gap-3 bg-slate-900 rounded-xl border px-3 py-2.5 transition has-[:checked]:border-amber-400/70 has-[:checked]:bg-amber-400/10 active:scale-[0.99] pointer-coarse:min-h-12 has-[:disabled]:opacity-60 ${
                    erreur ? "border-red-400/70" : "border-white/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={idDuChamp(el.champ)}
                    name={el.champ}
                    value={el.valeur}
                    data-module={module.decision}
                    defaultChecked={dejaChoisis.includes(el.id)}
                    // Au plafond, les cases encore libres se grisent ; une case
                    // cochée reste décochable.
                    disabled={plein && !cochees.has(el.champ)}
                    onChange={(e) => {
                      // Le plafond se juge sur le document, cochée comprise.
                      if (e.target.checked && module.plafond !== null) {
                        const n = compterLesCases(racine.current, module.decision);
                        if (n > module.plafond) e.target.checked = false;
                      }
                    }}
                    aria-describedby={erreur ? `${idDuChamp(el.champ)}-refus` : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                  />
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-slate-200">
                      {el.libelle}
                      {el.coutDuTour > 0 ? ` · ${formatEuro(el.coutDuTour)} ce tour` : " · sans coût"}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-300">{el.effets.join(" · ")}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {[
                        el.duree,
                        ...el.couts
                          .filter((c) => c.montant > 0)
                          .map((c) => `${c.libelle} ${formatEuro(c.montant)}`),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </label>
                {erreur ? (
                  <p id={`${idDuChamp(el.champ)}-refus`} className="mt-1 text-xs text-red-300">
                    {erreur}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Rien de plus à engager ce tour.</p>
      )}
      {plein && module.elements.length > 0 ? (
        <p className="text-xs text-slate-400">
          {module.plafond === 0 ? "Plus aucune place ce tour." : "Toutes les places du tour sont prises."}
        </p>
      ) : null}
      {coutCoche > 0 ? (
        <p role="status" className="text-xs text-slate-300">
          Engagé ce tour : <strong className="font-semibold text-slate-50">{formatEuro(coutCoche)}</strong>
        </p>
      ) : null}
    </div>
  );
}

export function ModulesDeDecision({
  offre,
  choisis,
  erreurs,
  telephone = false,
}: {
  offre: OffreDesModules;
  /** Les choix déjà ENREGISTRÉS ce tour (classe : envoi modifiable), sinon `null`. */
  choisis: Partial<RoundDecisions> | null;
  /** Les refus en cours, par nom de champ. */
  erreurs: ReadonlyMap<string, string>;
  telephone?: boolean;
}) {
  return (
    <div data-modules-de-decision="" className="space-y-5">
      {offre.map((m) => (
        <div key={m.decision} className="space-y-2">
          <UnModule module={m} dejaChoisis={choisis ? choixDuModule(choisis, m.decision) : []} erreurs={erreurs} />
          <Tiroir titre="Comment ça marche" ferme={!telephone} surface="papier">
            <p className="text-sm leading-relaxed text-slate-400">{m.aide}</p>
          </Tiroir>
        </div>
      ))}
    </div>
  );
}
