"use client";

import { useEffect, useRef, useState } from "react";
import type { NomDIcone } from "@/components/icone";
import { Tiroir } from "@/components/tiroir";
import { sansMolette } from "@/components/sans-molette";
import { idDuChamp } from "@/config/refus-de-decision";
import type { DecisionDeModule } from "@/config/modules-saisis";
import { modulesDeLEtape, type EtapeDuFormulaire } from "@/config/etapes-des-modules";
import type { RoundDecisions } from "@/engine/types";
import { formatEuro, formatUnits } from "@/lib/format";
import {
  choixDuModule,
  saisieDuChoix,
  type ElementDeModule,
  type ModuleOffert,
  type OffreDesModules,
} from "@/services/modules-offer";

/**
 * LES MODULES DU SCÉNARIO, SUR LA FEUILLE DE DÉCISION.
 *
 * Une case par élément proposé ce tour, au gabarit des études : le nom et ce
 * que le choix coûte ce tour, puis les effets que le moteur applique, puis la
 * durée et les coûts qui suivront. Un élément qui se décide par un nombre
 * (l'effectif à former, le montant à tirer) porte un champ à la place de la
 * case : vide, rien n'est engagé. Ce qui tourne déjà se lit au-dessus, dans
 * « Déjà engagé », avec une case « Arrêter » quand le module le permet.
 *
 * LE PLAFOND SE VOIT AVANT L'ENVOI : une fois les places du tour prises, les
 * autres choix du module se grisent ; un arrêt coché libère sa place. La
 * feuille rejuge aussi l'ensemble avant l'envoi, du même calcul que le serveur
 * (`refusDesModules`).
 *
 * Rien n'est coché d'office : un module se DÉMARRE, et ce qui a démarré au
 * tour précédent vit maintenant dans l'état de l'entreprise. Seul un envoi
 * déjà enregistré ce tour revient coché.
 *
 * CHAQUE MODULE VIT DANS L'ÉTAPE DE SON THÈME (`config/etapes-des-modules`),
 * et s'y présente REPLIÉ : son titre, ce qui est engagé ou déjà en cours, et
 * ce que cela coûte ce tour. Une étape en porte jusqu'à quatre ; dépliés, ils
 * repoussaient le prix et les budgets hors de l'écran. Un module se déplie de
 * lui-même quand il porte un refus, ou un choix (envoi enregistré, brouillon
 * restauré) : un repli ne cache jamais ce qui est engagé ni ce qui est faux.
 * Son aide, une phrase, se lit en tête du module déplié.
 */

const ICONES: Record<DecisionDeModule, NomDIcone> = {
  qualityActions: "etoile",
  hsActions: "equipes",
  trainingEnrollments: "formation",
  activeHRPolicyIds: "personne",
  maintenanceDecisions: "outil",
  activeContractIds: "camion",
  activeCapacityOptionIds: "usine",
  enteredMarketIds: "monde",
  startedInnovationIds: "idee",
  startedRdActionIds: "loupe",
  activeRseActionIds: "feuille",
  activePricingStrategyIds: "etiquette",
  activeCommercialActionIds: "cible",
  activeCrisisPlanIds: "alerte",
  activatePartnershipIds: "accord",
  startDigitalProjectIds: "ecran",
  activeBrandActionIds: "communication",
  financingDraws: "banque",
};

/** Un nombre saisi à la française ; NaN si vide ou illisible. */
const nombre = (v: string) =>
  v.trim() === "" ? Number.NaN : Number(v.replace(/[\s  ]/g, "").replace(",", "."));

/** Ce que la feuille lit d'un module : les choix pris (et leur quantité), les places libérées. */
function lire(racine: HTMLElement | null, module: ModuleOffert) {
  const pris = new Map<string, number>();
  let liberees = 0;
  let arrets = 0;
  if (!racine) return { pris, liberees, arrets };
  for (const el of racine.querySelectorAll<HTMLInputElement>(`input[data-module="${module.decision}"]`)) {
    if (el.type === "checkbox") {
      if (el.checked) pris.set(el.name, 1);
    } else {
      const n = nombre(el.value);
      if (Number.isFinite(n) && n > 0) pris.set(el.name, n);
    }
  }
  for (const el of racine.querySelectorAll<HTMLInputElement>(`input[data-arret="${module.decision}"]:checked`)) {
    arrets++;
    if (el.dataset.occupe === "oui") liberees++;
  }
  return { pris, liberees, arrets };
}

const accorder = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

function coutDuChoix(el: ElementDeModule, quantite: number): number {
  return el.saisie ? quantite * el.saisie.coutUnitaire : el.coutDuTour;
}

function UnModule({
  module,
  choisis,
  erreurs,
  refusDuModule,
}: {
  module: ModuleOffert;
  choisis: Partial<RoundDecisions> | null;
  erreurs: ReadonlyMap<string, string>;
  /** Les refus qui visent ce module sans viser un de ses champs (un arrêt, un plafond). */
  refusDuModule: readonly string[];
}) {
  const racine = useRef<HTMLDivElement>(null);
  const dejaChoisis = choisis ? choixDuModule(choisis, module.decision) : [];
  const dejaArretes = new Set(
    (choisis?.stoppedModuleItems ?? []).filter((a) => a.module === module.decision).map((a) => a.id),
  );
  const [etat, setEtat] = useState(() => {
    const pris = new Map<string, number>();
    for (const el of module.elements) {
      if (!dejaChoisis.includes(el.id)) continue;
      pris.set(el.champ, el.saisie ? (saisieDuChoix(choisis ?? {}, module.decision, el.id) ?? 0) : 1);
    }
    const liberees = module.enCours.filter((x) => x.arret?.occupe && x.id && dejaArretes.has(x.id)).length;
    const arrets = module.enCours.filter((x) => x.arret && x.id && dejaArretes.has(x.id)).length;
    return { pris, liberees, arrets };
  });
  // DÉPLIÉ D'OFFICE quand il porte déjà un choix : un envoi enregistré ce tour,
  // ou un brouillon restauré (relu juste après le montage, plus bas). Ensuite,
  // c'est le joueur qui plie et déplie.
  const [deplie, setDeplie] = useState(() => etat.pris.size > 0 || etat.arrets > 0);
  const relire = () => setEtat(lire(racine.current, module));
  // Le brouillon du navigateur restaure les champs APRÈS le montage, sans
  // événement : on relit une fois la feuille restaurée.
  useEffect(() => {
    const t = setTimeout(() => {
      const lu = lire(racine.current, module);
      setEtat(lu);
      if (lu.pris.size > 0 || lu.arrets > 0) setDeplie(true);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // UN REFUS DÉPLIE SON MODULE, et il le reste : le message se lit sous le
  // champ fautif, pas derrière un repli. Ajusté au rendu, sans effet.
  const enErreur =
    refusDuModule.length > 0 ||
    module.elements.some((el) => erreurs.has(el.champ)) ||
    module.enCours.some((x) => x.arret && erreurs.has(x.arret.champ));
  if (enErreur && !deplie) setDeplie(true);
  const coutEngage = module.elements
    .filter((el) => etat.pris.has(el.champ))
    .reduce((t, el) => t + coutDuChoix(el, etat.pris.get(el.champ) ?? 0), 0);
  const plafond = module.plafond === null ? null : module.plafond + etat.liberees;
  const plein = plafond !== null && etat.pris.size >= plafond;

  // Ce que le repli annonce : ce qui est engagé ce tour, ce qui tourne déjà, ce
  // qui s'arrête ; à défaut, combien de choix attendent derrière.
  const quoi =
    [
      etat.pris.size > 0 ? accorder(etat.pris.size, "engagé") : null,
      module.enCours.length > 0 ? `${module.enCours.length} en cours` : null,
      etat.arrets > 0 ? accorder(etat.arrets, "arrêt") : null,
    ]
      .filter(Boolean)
      .join(" · ") ||
    (module.elements.length > 0 ? `${module.elements.length} choix` : "rien à engager");

  return (
    <div
      ref={racine}
      id={`module-${module.decision}`}
      data-module-de-decision={module.decision}
      className="scroll-mt-32"
      onChange={relire}
      onInput={relire}
    >
      <Tiroir
        titre={module.titre}
        icone={ICONES[module.decision]}
        quoi={quoi}
        valeur={
          coutEngage > 0 ? (
            <span data-cout-du-module="" className="tabular-nums text-slate-50">
              {formatEuro(coutEngage)}
            </span>
          ) : undefined
        }
        // Replié même dans le parcours du téléphone, où les tiroirs s'ouvrent
        // d'office : une étape y porte jusqu'à quatre modules.
        ouvert={deplie}
        ferme={!deplie}
      >
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-slate-400">
            {module.aide}
            {module.plafondTexte ? ` ${module.plafondTexte.charAt(0).toUpperCase()}${module.plafondTexte.slice(1)}.` : ""}
          </p>
          {refusDuModule.map((message) => (
            <p key={message} data-refus-du-module="" className="text-xs text-red-300">
              {message}
            </p>
          ))}
          {module.enCours.length > 0 ? (
            <div data-modules-en-cours="" className="text-xs text-slate-400">
              <p>Déjà engagé :</p>
              <ul className="mt-1 space-y-1">
                {module.enCours.map((x, i) => (
                  <li
                    key={`${x.libelle}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-white/5 bg-slate-950 px-2.5 py-1.5"
                  >
                    <span className="min-w-0">
                      <span className="text-slate-300">{x.libelle}</span> ({x.etat})
                    </span>
                    {x.arret && x.id ? (
                      <label className="inline-flex shrink-0 items-center gap-1.5 text-slate-300 pointer-coarse:min-h-11">
                        <input
                          type="checkbox"
                          id={idDuChamp(x.arret.champ)}
                          name={x.arret.champ}
                          value="1"
                          data-arret={module.decision}
                          data-occupe={x.arret.occupe ? "oui" : "non"}
                          defaultChecked={dejaArretes.has(x.id)}
                          className="h-4 w-4 accent-red-400"
                        />
                        Arrêter
                      </label>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {module.elements.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {module.elements.map((el) => {
                const erreur = erreurs.get(el.champ);
                const pris = etat.pris.has(el.champ);
                const libre = !plein || pris;
                const valeurDeja = el.saisie ? saisieDuChoix(choisis ?? {}, module.decision, el.id) : null;
                const enEuros = el.saisie?.unite === "€";
                const texte = (
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-slate-200">
                      {el.libelle}
                      {el.saisie
                        ? el.saisie.coutUnitaire > 0
                          ? ` · ${formatEuro(el.saisie.coutUnitaire)} par salarié et par tour`
                          : ""
                        : el.coutDuTour > 0
                          ? ` · ${formatEuro(el.coutDuTour)} ce tour`
                          : " · sans coût"}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-300">{el.effets.join(" · ")}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      {[
                        el.duree,
                        ...el.couts.filter((c) => c.montant > 0).map((c) => `${c.libelle} ${formatEuro(c.montant)}`),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                );
                return (
                  <div key={el.champ}>
                    {el.saisie ? (
                      <div
                        data-saisie-de-module=""
                        data-saisi={pris ? "oui" : undefined}
                        className={`space-y-2 rounded-xl border bg-slate-900 px-3 py-2.5 transition ${
                          erreur ? "border-red-400/70" : pris ? "border-slate-300/50" : "border-white/10"
                        } ${libre ? "" : "opacity-60"}`}
                      >
                        {texte}
                        <label className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span>
                            {enEuros ? "Montant à tirer" : "Salariés à former"} (jusqu&apos;à{" "}
                            {enEuros ? formatEuro(el.saisie.max) : formatUnits(el.saisie.max)})
                          </span>
                          <span className="flex w-40 items-center gap-2 champ px-2 py-1.5">
                          <input
                            type="number"
                            onWheel={sansMolette}
                            inputMode="numeric"
                            id={idDuChamp(el.champ)}
                            name={el.champ}
                            data-module={module.decision}
                            min={el.saisie.min}
                            max={el.saisie.max}
                            step={el.saisie.pas}
                            defaultValue={valeurDeja ?? ""}
                            placeholder="0"
                            disabled={!libre}
                            aria-describedby={erreur ? `${idDuChamp(el.champ)}-refus` : undefined}
                            className="min-w-0 flex-1 bg-transparent text-sm tabular-nums text-slate-100 outline-none pointer-coarse:min-h-10"
                          />
                            <span className="shrink-0 text-xs text-slate-400">{enEuros ? "€" : "salariés"}</span>
                          </span>
                        </label>
                      </div>
                    ) : (
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
                          disabled={!libre}
                          onChange={(e) => {
                            // Le plafond se juge sur le document, cochée comprise.
                            if (e.target.checked && module.plafond !== null) {
                              const lu = lire(racine.current, module);
                              if (lu.pris.size > module.plafond + lu.liberees) e.target.checked = false;
                            }
                          }}
                          aria-describedby={erreur ? `${idDuChamp(el.champ)}-refus` : undefined}
                          className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                        />
                        {texte}
                      </label>
                    )}
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
              {plafond === 0 ? "Plus aucune place ce tour." : "Toutes les places du tour sont prises."}
            </p>
          ) : null}
          {coutEngage > 0 ? (
            <p role="status" className="text-xs text-slate-300">
              Engagé ce tour : <strong className="font-semibold text-slate-50">{formatEuro(coutEngage)}</strong>
            </p>
          ) : null}
        </div>
      </Tiroir>
    </div>
  );
}

/**
 * Les modules d'UNE étape du formulaire, chacun replié. Rien quand l'étape n'en
 * porte aucun : le formulaire n'affiche pas d'intertitre sur un bloc vide.
 */
export function ModulesDeDecision({
  offre,
  etape,
  choisis,
  erreurs,
  refusSansChamp,
}: {
  offre: OffreDesModules;
  /** L'étape dont on montre les modules (`config/etapes-des-modules`). */
  etape: EtapeDuFormulaire;
  /** Les choix déjà ENREGISTRÉS ce tour (classe : envoi modifiable), sinon `null`. */
  choisis: Partial<RoundDecisions> | null;
  /** Les refus en cours, par nom de champ. */
  erreurs: ReadonlyMap<string, string>;
  /** Les refus qui visent un module sans viser un de ses champs, par module. */
  refusSansChamp?: ReadonlyMap<DecisionDeModule, readonly string[]>;
}) {
  const modules = modulesDeLEtape(offre, etape);
  if (modules.length === 0) return null;
  return (
    <div data-modules-de-decision={etape} className="space-y-2">
      {modules.map((m) => (
        <UnModule
          key={m.decision}
          module={m}
          choisis={choisis}
          erreurs={erreurs}
          refusDuModule={refusSansChamp?.get(m.decision) ?? AUCUN}
        />
      ))}
    </div>
  );
}

const AUCUN: readonly string[] = [];
